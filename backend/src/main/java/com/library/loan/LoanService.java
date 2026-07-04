package com.library.loan;

import com.library.catalog.Book;
import com.library.catalog.BookCopy;
import com.library.catalog.BookCopyRepository;
import com.library.catalog.BookCopyStatus;
import com.library.exception.BusinessException;
import com.library.fine.FineRepository;
import com.library.member.Member;
import com.library.member.MemberRepository;
import com.library.member.MemberStatus;
import com.library.member.MemberTier;
import com.library.reservation.Reservation;
import com.library.reservation.ReservationRepository;
import com.library.reservation.ReservationStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

class BadRequestException extends BusinessException {
    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

class NotFoundException extends BusinessException {
    public NotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}

class MemberSuspendedException extends BusinessException {
    public MemberSuspendedException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

class MemberHasFinesException extends BusinessException {
    public MemberHasFinesException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

class LoanLimitExceededException extends BusinessException {
    public LoanLimitExceededException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

class BookCopyNotAvailableException extends BusinessException {
    public BookCopyNotAvailableException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

class LoanNotFoundException extends BusinessException {
    public LoanNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}

@Service
@Transactional
public class LoanService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private BookCopyRepository bookCopyRepository;

    @Autowired
    private FineRepository fineRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Transactional(readOnly = true)
    public List<Loan> getActiveLoansForMember(Long memberId) {
        return loanRepository.findActiveLoansByMemberId(memberId);
    }

    public Loan checkout(Long memberId, Long copyId, String idempotencyKey) {
        // Enforce idempotency
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            Optional<Loan> existing = loanRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new NotFoundException("Member not found"));

        BookCopy copy = bookCopyRepository.findById(copyId)
                .orElseThrow(() -> new NotFoundException("Book copy not found"));

        // 1. Check if member is suspended
        if (member.getStatus() == MemberStatus.SUSPENDED) {
            throw new MemberSuspendedException("Member is suspended. Cannot check out books.");
        }

        // 2. Check outstanding fines
        if (fineRepository.hasOutstandingFines(memberId)) {
            throw new MemberHasFinesException("Member has unpaid fines. Cannot check out books.");
        }

        // 3. Check active loan count limits
        long currentActiveLoans = loanRepository.countActiveLoansByMemberId(memberId);
        int limit = member.getTier() == MemberTier.SUPPORTING ? 6 : 3;
        if (currentActiveLoans >= limit) {
            throw new LoanLimitExceededException("Active loan limit of " + limit + " exceeded for this tier type.");
        }

        // 4. Reservation check
        // If a reservation on this copy is pending for collection (status =
        // READY_FOR_PICKUP)
        Optional<Reservation> reservationOpt = reservationRepository.findReadyByCopyId(copyId);
        if (reservationOpt.isPresent()) {
            Reservation reservation = reservationOpt.get();
            if (!reservation.getMember().getId().equals(memberId)) {
                throw new BookCopyNotAvailableException("This copy is reserved for another member.");
            }
            // Mark reservation as fulfilled
            reservation.setStatus(ReservationStatus.FULFILLED);
            reservationRepository.save(reservation);
        } else {
            // If copy is not assigned to a ready reservation, check that copy is available
            if (copy.getStatus() != BookCopyStatus.AVAILABLE) {
                throw new BookCopyNotAvailableException(
                        "This copy is currently not available (Status: " + copy.getStatus() + ").");
            }
        }

        // 5. Calculate due date based on user tier
        // Regular get 14 days, Supporting get 28 days
        int loanDays = member.getTier() == MemberTier.SUPPORTING ? 28 : 14;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime due = now.plusDays(loanDays);

        // Update book counters: availability drops
        Book book = copy.getBook();
        if (copy.getStatus() == BookCopyStatus.AVAILABLE) {
            book.setAvailableCopies(Math.max(0, book.getAvailableCopies() - 1));
        }

        copy.setStatus(BookCopyStatus.LOANED);
        bookCopyRepository.save(copy);

        Loan loan = Loan.builder()
                .member(member)
                .bookCopy(copy)
                .checkoutDate(now)
                .dueDate(due)
                .status(LoanStatus.ACTIVE)
                .idempotencyKey(idempotencyKey)
                .build();

        return loanRepository.save(loan);
    }

    public Loan returnBook(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new LoanNotFoundException("Loan not found with ID: " + loanId));

        if (loan.getStatus() != LoanStatus.ACTIVE) {
            throw new BadRequestException("Loan is already returned or inactive");
        }

        LocalDateTime now = LocalDateTime.now();
        loan.setReturnDate(now);
        loan.setStatus(LoanStatus.RETURNED);

        BookCopy copy = loan.getBookCopy();
        Book book = copy.getBook();

        // Check if book overdue -> calculate fines
        if (now.isAfter(loan.getDueDate())) {
            long overdueDays = java.time.temporal.ChronoUnit.DAYS.between(loan.getDueDate().toLocalDate(),
                    now.toLocalDate());
            if (overdueDays > 0) {
                BigDecimal rate = new BigDecimal("0.50");
                BigDecimal computedFine = rate.multiply(new BigDecimal(overdueDays));
                BigDecimal cap = book.getReplacementCost();
                BigDecimal finalAmount = computedFine.compareTo(cap) > 0 ? cap : computedFine;

                if (finalAmount.compareTo(BigDecimal.ZERO) > 0) {
                    com.library.fine.Fine fine = com.library.fine.Fine.builder()
                            .loan(loan)
                            .member(loan.getMember())
                            .amount(finalAmount)
                            .status(com.library.fine.FineStatus.OWED)
                            .build();
                    fineRepository.save(fine);
                }
            }
        }

        // Waitlist queue promotion check
        List<Reservation> queue = reservationRepository.findPendingQueueForBook(book.getId());
        if (!queue.isEmpty()) {
            Reservation firstInLine = queue.get(0);

            // Assign copy to this queue reservation item
            firstInLine.setBookCopy(copy);
            firstInLine.setStatus(ReservationStatus.READY_FOR_PICKUP);
            firstInLine.setCollectionExpiryDate(now.plusDays(3));
            reservationRepository.save(firstInLine);

            // Copy becomes available for pickup: status returns to AVAILABLE, but it is
            // restricted in checkout to reservation owner
            copy.setStatus(BookCopyStatus.AVAILABLE);
            book.setAvailableCopies(book.getAvailableCopies() + 1);
        } else {
            // No waiting list: return copy to available pool
            copy.setStatus(BookCopyStatus.AVAILABLE);
            book.setAvailableCopies(book.getAvailableCopies() + 1);
        }

        bookCopyRepository.save(copy);
        return loanRepository.save(loan);
    }

    public Loan renewBook(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new LoanNotFoundException("Loan not found with ID: " + loanId));

        if (loan.getStatus() != LoanStatus.ACTIVE) {
            throw new BadRequestException("Cannot renew returned or inactive loan");
        }

        // Checks active waitlist reservation presence
        Book book = loan.getBookCopy().getBook();
        List<Reservation> queue = reservationRepository.findPendingQueueForBook(book.getId());
        if (!queue.isEmpty()) {
            throw new BadRequestException("Cannot renew book copy. There are pending reservations for this book.");
        }

        // Extend due date based on user tier
        Member member = loan.getMember();
        int renewDays = member.getTier() == MemberTier.SUPPORTING ? 28 : 14;
        loan.setDueDate(loan.getDueDate().plusDays(renewDays));

        return loanRepository.save(loan);
    }

    @Transactional(readOnly = true)
    public boolean isLoanOwner(Long loanId, Long memberId) {
        return loanRepository.findById(loanId)
                .map(l -> l.getMember().getId().equals(memberId))
                .orElse(false);
    }
}
