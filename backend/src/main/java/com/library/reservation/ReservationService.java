package com.library.reservation;

import com.library.catalog.*;
import com.library.exception.BusinessException;
import com.library.loan.LoanRepository;
import com.library.member.Member;
import com.library.member.MemberRepository;
import com.library.member.MemberStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;

class MemberNotActiveException extends BusinessException {
    public MemberNotActiveException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

class BookCopyAvailableException extends BusinessException {
    public BookCopyAvailableException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

class DuplicateReservationException extends BusinessException {
    public DuplicateReservationException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

class ReservationNotFoundException extends BusinessException {
    public ReservationNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}

class InvalidReservationStateException extends BusinessException {
    public InvalidReservationStateException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

class EntityNotFoundException extends BusinessException {
    public EntityNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final MemberRepository memberRepository;
    private final BookRepository bookRepository;
    private final BookCopyRepository bookCopyRepository;
    private final LoanRepository loanRepository;
    private final ReservationMapper reservationMapper;

    @Transactional
    public ReservationDto joinQueue(ReservationRequest request) {
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new EntityNotFoundException("Member not found with ID: " + request.getMemberId()));

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new EntityNotFoundException("Book not found with ID: " + request.getBookId()));

        // Rule: Only active members can place reservations
        if (member.getStatus() != MemberStatus.ACTIVE) {
            throw new MemberNotActiveException("Suspended or inactive member accounts cannot reserve books.");
        }

        // Rule: Cannot place a reservation if there are available physical copies
        if (book.getAvailableCopies() > 0) {
            throw new BookCopyAvailableException(
                    "Physical copies are currently available. Check out the book directly instead of reserving.");
        }

        // Rule: Prevent self-checkout queue joining (member currently has active loan
        // of this book)
        long activeLoanCount = loanRepository.countActiveLoansByMemberIdAndBookId(member.getId(), book.getId());
        if (activeLoanCount > 0) {
            throw new DuplicateReservationException(
                    "You currently have an active loan of this book. Duplicate catalog checkouts or reservations are not allowed.");
        }

        // Rule: Single active reservation per book constraint
        List<Reservation> activeReservations = reservationRepository.findActiveByMemberAndBook(member.getId(),
                book.getId());
        if (!activeReservations.isEmpty()) {
            throw new DuplicateReservationException(
                    "You already have an active pending or pick-up reservation for this book copy.");
        }

        Reservation reservation = Reservation.builder()
                .member(member)
                .book(book)
                .requestDate(LocalDateTime.now())
                .status(ReservationStatus.PENDING)
                .build();

        Reservation saved = reservationRepository.save(reservation);
        return reservationMapper.toDto(saved);
    }

    @Transactional
    public void cancelReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found with ID: " + reservationId));

        if (reservation.getStatus() == ReservationStatus.FULFILLED ||
                reservation.getStatus() == ReservationStatus.CANCELLED ||
                reservation.getStatus() == ReservationStatus.EXPIRED) {
            throw new InvalidReservationStateException(
                    "Only PENDING or READY_FOR_PICKUP reservations can be cancelled.");
        }

        ReservationStatus oldStatus = reservation.getStatus();
        reservation.setStatus(ReservationStatus.CANCELLED);

        // If the cancelled reservation is READY_FOR_PICKUP, it holds a copy. We must
        // pass it to the next reservation or release it.
        if (oldStatus == ReservationStatus.READY_FOR_PICKUP && reservation.getBookCopy() != null) {
            BookCopy copy = reservation.getBookCopy();
            reservation.setBookCopy(null);
            promoteNextPendingReservation(reservation.getBook().getId(), copy);
        }

        reservationRepository.save(reservation);
    }

    @Transactional
    public void expireReservations() {
        LocalDateTime now = LocalDateTime.now();
        List<Reservation> expired = reservationRepository.findByStatusAndCollectionExpiryDateBefore(
                ReservationStatus.READY_FOR_PICKUP, now);

        for (Reservation res : expired) {
            res.setStatus(ReservationStatus.EXPIRED);
            BookCopy copy = res.getBookCopy();
            res.setBookCopy(null);
            reservationRepository.save(res);

            if (copy != null) {
                promoteNextPendingReservation(res.getBook().getId(), copy);
            }
        }
    }

    @Transactional
    public void promoteNextPendingReservation(Long bookId, BookCopy copy) {
        List<Reservation> queue = reservationRepository.findPendingQueueForBook(bookId);
        if (!queue.isEmpty()) {
            // Promote first in queue (FIFO)
            Reservation next = queue.get(0);
            next.setStatus(ReservationStatus.READY_FOR_PICKUP);
            next.setBookCopy(copy);
            next.setCollectionExpiryDate(LocalDateTime.now().plusDays(3)); // 3-day pickup window
            reservationRepository.save(next);

            // Since it is assigned to a reservation, its copy status remains
            // RESERVED/LOANED (cannot check out directly)
            copy.setStatus(BookCopyStatus.LOANED); // Keep it LOANED to represent reserved occupancy in backend
            bookCopyRepository.save(copy);
        } else {
            // No one is waiting. Set copy available and increment book available count
            copy.setStatus(BookCopyStatus.AVAILABLE);
            bookCopyRepository.save(copy);

            Book book = copy.getBook();
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepository.save(book);
        }
    }

    @Transactional(readOnly = true)
    public boolean isReservationOwner(Long reservationId, String email) {
        return reservationRepository.findById(reservationId)
                .map(r -> r.getMember().getEmail().equalsIgnoreCase(email))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public List<ReservationDto> getActiveReservations(Long memberId) {
        // Return active reservations for a member
        return reservationRepository.findAll().stream()
                .filter(r -> r.getMember().getId().equals(memberId) &&
                        (r.getStatus() == ReservationStatus.PENDING
                                || r.getStatus() == ReservationStatus.READY_FOR_PICKUP))
                .map(reservationMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationDto> getBookWaitlist(Long bookId) {
        return reservationRepository.findPendingQueueForBook(bookId).stream()
                .map(reservationMapper::toDto)
                .collect(Collectors.toList());
    }
}
