package com.library.loan;

import com.library.catalog.Book;
import com.library.catalog.BookCopy;
import com.library.catalog.BookCopyRepository;
import com.library.catalog.BookCopyStatus;
import com.library.fine.Fine;
import com.library.fine.FineRepository;
import com.library.member.Member;
import com.library.member.MemberRepository;
import com.library.member.MemberStatus;
import com.library.member.MemberTier;
import com.library.reservation.Reservation;
import com.library.reservation.ReservationRepository;
import com.library.reservation.ReservationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private BookCopyRepository bookCopyRepository;

    @Mock
    private FineRepository fineRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @InjectMocks
    private LoanService loanService;

    private Member member;
    private BookCopy copy;

    @BeforeEach
    public void setup() {
        member = Member.builder()
                .id(1L)
                .name("John Member")
                .email("john@member.com")
                .tier(MemberTier.REGULAR)
                .status(MemberStatus.ACTIVE)
                .build();

        Book book = Book.builder()
                .id(10L)
                .title("Domain-Driven Design")
                .replacementCost(new BigDecimal("50.00"))
                .availableCopies(1)
                .totalCopies(1)
                .build();

        copy = BookCopy.builder()
                .id(100L)
                .book(book)
                .barcode("BC-001")
                .status(BookCopyStatus.AVAILABLE)
                .build();
    }

    @Test
    public void testCheckout_Success() {
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(bookCopyRepository.findById(100L)).thenReturn(Optional.of(copy));
        when(fineRepository.hasOutstandingFines(1L)).thenReturn(false);
        when(loanRepository.countActiveLoansByMemberId(1L)).thenReturn(0L);
        when(reservationRepository.findReadyByCopyId(100L)).thenReturn(Optional.empty());
        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Loan loan = loanService.checkout(1L, 100L, "idemp-001");
        assertNotNull(loan);
        assertEquals(LoanStatus.ACTIVE, loan.getStatus());
        assertEquals(BookCopyStatus.LOANED, copy.getStatus());
        assertEquals(0, copy.getBook().getAvailableCopies());
    }

    @Test
    public void testCheckout_MemberSuspended() {
        member.setStatus(MemberStatus.SUSPENDED);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(bookCopyRepository.findById(100L)).thenReturn(Optional.of(copy));

        assertThrows(MemberSuspendedException.class, () -> {
            loanService.checkout(1L, 100L, "idemp-002");
        });
    }

    @Test
    public void testCheckout_MemberHasFines() {
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(bookCopyRepository.findById(100L)).thenReturn(Optional.of(copy));
        when(fineRepository.hasOutstandingFines(1L)).thenReturn(true);

        assertThrows(MemberHasFinesException.class, () -> {
            loanService.checkout(1L, 100L, "idemp-003");
        });
    }

    @Test
    public void testCheckout_LoanLimitExceeded() {
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(bookCopyRepository.findById(100L)).thenReturn(Optional.of(copy));
        when(fineRepository.hasOutstandingFines(1L)).thenReturn(false);
        when(loanRepository.countActiveLoansByMemberId(1L)).thenReturn(3L);

        assertThrows(LoanLimitExceededException.class, () -> {
            loanService.checkout(1L, 100L, "idemp-004");
        });
    }

    @Test
    public void testCheckout_ReservedForSomeoneElse() {
        Member other = Member.builder().id(2L).name("Other").build();
        Reservation reservation = Reservation.builder()
                .id(5L)
                .member(other)
                .bookCopy(copy)
                .status(ReservationStatus.READY_FOR_PICKUP)
                .build();

        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(bookCopyRepository.findById(100L)).thenReturn(Optional.of(copy));
        when(fineRepository.hasOutstandingFines(1L)).thenReturn(false);
        when(loanRepository.countActiveLoansByMemberId(1L)).thenReturn(0L);
        when(reservationRepository.findReadyByCopyId(100L)).thenReturn(Optional.of(reservation));

        assertThrows(BookCopyNotAvailableException.class, () -> {
            loanService.checkout(1L, 100L, "idemp-005");
        });
    }

    @Test
    public void testCheckout_ReservedForMe_Success() {
        Reservation reservation = Reservation.builder()
                .id(5L)
                .member(member)
                .bookCopy(copy)
                .status(ReservationStatus.READY_FOR_PICKUP)
                .build();

        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(bookCopyRepository.findById(100L)).thenReturn(Optional.of(copy));
        when(fineRepository.hasOutstandingFines(1L)).thenReturn(false);
        when(loanRepository.countActiveLoansByMemberId(1L)).thenReturn(0L);
        when(reservationRepository.findReadyByCopyId(100L)).thenReturn(Optional.of(reservation));
        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Loan loan = loanService.checkout(1L, 100L, "idemp-006");
        assertNotNull(loan);
        assertEquals(ReservationStatus.FULFILLED, reservation.getStatus());
    }

    @Test
    public void testReturnBook_Normal_Success() {
        Loan loan = Loan.builder()
                .id(50L)
                .member(member)
                .bookCopy(copy)
                .checkoutDate(LocalDateTime.now().minusDays(5))
                .dueDate(LocalDateTime.now().plusDays(9))
                .status(LoanStatus.ACTIVE)
                .build();

        when(loanRepository.findById(50L)).thenReturn(Optional.of(loan));
        when(reservationRepository.findPendingQueueForBook(10L)).thenReturn(Collections.emptyList());
        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookCopyRepository.save(any(BookCopy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Loan returned = loanService.returnBook(50L);
        assertEquals(LoanStatus.RETURNED, returned.getStatus());
        assertNotNull(returned.getReturnDate());
        assertEquals(BookCopyStatus.AVAILABLE, copy.getStatus());
        verify(fineRepository, never()).save(any(Fine.class));
    }

    @Test
    public void testReturnBook_Overdue_FinesCreated() {
        // Due 5 days ago (14 days overdue based on 9 days ago checkout limit if we
        // checkout 14 days ago)
        Loan loan = Loan.builder()
                .id(50L)
                .member(member)
                .bookCopy(copy)
                .checkoutDate(LocalDateTime.now().minusDays(20))
                .dueDate(LocalDateTime.now().minusDays(5))
                .status(LoanStatus.ACTIVE)
                .build();

        when(loanRepository.findById(50L)).thenReturn(Optional.of(loan));
        when(reservationRepository.findPendingQueueForBook(10L)).thenReturn(Collections.emptyList());
        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookCopyRepository.save(any(BookCopy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Loan returned = loanService.returnBook(50L);
        assertEquals(LoanStatus.RETURNED, returned.getStatus());
        // Fines computed: 5 days * 0.50 = 2.50
        verify(fineRepository, times(1)).save(any(Fine.class));
    }

    @Test
    public void testRenewBook_Success() {
        Loan loan = Loan.builder()
                .id(50L)
                .member(member)
                .bookCopy(copy)
                .checkoutDate(LocalDateTime.now().minusDays(5))
                .dueDate(LocalDateTime.now().plusDays(9))
                .status(LoanStatus.ACTIVE)
                .build();

        when(loanRepository.findById(50L)).thenReturn(Optional.of(loan));
        when(reservationRepository.findPendingQueueForBook(10L)).thenReturn(Collections.emptyList());
        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Loan renewed = loanService.renewBook(50L);
        assertNotNull(renewed);
        // Due date extended 14 days for REGULAR -> originally plus 9 days, now plus 23
        // days from now
        assertTrue(renewed.getDueDate().isAfter(LocalDateTime.now().plusDays(20)));
    }

    @Test
    public void testRenewBook_Blocked_Reserved() {
        Loan loan = Loan.builder()
                .id(50L)
                .member(member)
                .bookCopy(copy)
                .status(LoanStatus.ACTIVE)
                .build();

        Reservation reservation = new Reservation();
        when(loanRepository.findById(50L)).thenReturn(Optional.of(loan));
        when(reservationRepository.findPendingQueueForBook(10L)).thenReturn(Collections.singletonList(reservation));

        assertThrows(BadRequestException.class, () -> {
            loanService.renewBook(50L);
        });
    }
}
