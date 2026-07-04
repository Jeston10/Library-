package com.library.reservation;

import com.library.catalog.*;
import com.library.exception.BusinessException;
import com.library.loan.LoanRepository;
import com.library.member.Member;
import com.library.member.MemberRepository;
import com.library.member.MemberStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

        @Mock
        private ReservationRepository reservationRepository;
        @Mock
        private MemberRepository memberRepository;
        @Mock
        private BookRepository bookRepository;
        @Mock
        private BookCopyRepository bookCopyRepository;
        @Mock
        private LoanRepository loanRepository;
        @Mock
        private ReservationMapper reservationMapper;

        @InjectMocks
        private ReservationService reservationService;

        private Member activeMember;
        private Book unavailableBook;
        private Reservation pendingReservation;

        @BeforeEach
        void setUp() {
                activeMember = Member.builder()
                                .id(1L)
                                .name("John Doe")
                                .email("john@library.com")
                                .status(MemberStatus.ACTIVE)
                                .build();

                unavailableBook = Book.builder()
                                .id(10L)
                                .title("Clean Code")
                                .availableCopies(0)
                                .totalCopies(2)
                                .replacementCost(BigDecimal.valueOf(29.99))
                                .build();

                pendingReservation = Reservation.builder()
                                .id(100L)
                                .member(activeMember)
                                .book(unavailableBook)
                                .status(ReservationStatus.PENDING)
                                .requestDate(LocalDateTime.now())
                                .build();
        }

        @Test
        void joinQueue_Success() {
                ReservationRequest request = new ReservationRequest();
                request.setMemberId(1L);
                request.setBookId(10L);

                when(memberRepository.findById(1L)).thenReturn(Optional.of(activeMember));
                when(bookRepository.findById(10L)).thenReturn(Optional.of(unavailableBook));
                when(loanRepository.countActiveLoansByMemberIdAndBookId(1L, 10L)).thenReturn(0L);
                when(reservationRepository.findActiveByMemberAndBook(1L, 10L)).thenReturn(Collections.emptyList());
                when(reservationRepository.save(any(Reservation.class))).thenReturn(pendingReservation);

                ReservationDto mockDto = ReservationDto.builder()
                                .id(100L)
                                .memberId(1L)
                                .bookId(10L)
                                .status("PENDING")
                                .build();
                when(reservationMapper.toDto(pendingReservation)).thenReturn(mockDto);

                ReservationDto result = reservationService.joinQueue(request);

                assertNotNull(result);
                assertEquals(100L, result.getId());
                assertEquals("PENDING", result.getStatus());
                verify(reservationRepository, times(1)).save(any(Reservation.class));
        }

        @Test
        void joinQueue_ThrowsException_WhenMemberSuspended() {
                activeMember.setStatus(MemberStatus.SUSPENDED);
                ReservationRequest request = new ReservationRequest();
                request.setMemberId(1L);
                request.setBookId(10L);

                when(memberRepository.findById(1L)).thenReturn(Optional.of(activeMember));
                when(bookRepository.findById(10L)).thenReturn(Optional.of(unavailableBook));

                BusinessException ex = assertThrows(BusinessException.class,
                                () -> reservationService.joinQueue(request));
                assertTrue(ex.getMessage().contains("Suspended or inactive member"));
        }

        @Test
        void joinQueue_ThrowsException_WhenBookHasAvailableCopies() {
                unavailableBook.setAvailableCopies(1);
                ReservationRequest request = new ReservationRequest();
                request.setMemberId(1L);
                request.setBookId(10L);

                when(memberRepository.findById(1L)).thenReturn(Optional.of(activeMember));
                when(bookRepository.findById(10L)).thenReturn(Optional.of(unavailableBook));

                BusinessException ex = assertThrows(BusinessException.class,
                                () -> reservationService.joinQueue(request));
                assertTrue(ex.getMessage().contains("directly instead of reserving"));
        }

        @Test
        void joinQueue_ThrowsException_WhenMemberHasActiveLoan() {
                ReservationRequest request = new ReservationRequest();
                request.setMemberId(1L);
                request.setBookId(10L);

                when(memberRepository.findById(1L)).thenReturn(Optional.of(activeMember));
                when(bookRepository.findById(10L)).thenReturn(Optional.of(unavailableBook));
                when(loanRepository.countActiveLoansByMemberIdAndBookId(1L, 10L)).thenReturn(1L);

                BusinessException ex = assertThrows(BusinessException.class,
                                () -> reservationService.joinQueue(request));
                assertTrue(ex.getMessage().contains("You currently have an active loan"));
        }

        @Test
        void joinQueue_ThrowsException_WhenMemberAlreadyReserved() {
                ReservationRequest request = new ReservationRequest();
                request.setMemberId(1L);
                request.setBookId(10L);

                when(memberRepository.findById(1L)).thenReturn(Optional.of(activeMember));
                when(bookRepository.findById(10L)).thenReturn(Optional.of(unavailableBook));
                when(loanRepository.countActiveLoansByMemberIdAndBookId(1L, 10L)).thenReturn(0L);
                when(reservationRepository.findActiveByMemberAndBook(1L, 10L)).thenReturn(List.of(pendingReservation));

                BusinessException ex = assertThrows(BusinessException.class,
                                () -> reservationService.joinQueue(request));
                assertTrue(ex.getMessage().contains("already have an active pending"));
        }

    @Test
    void cancelReservation_Pending_Success() {
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(pendingReservation));

        reservationService.cancelReservation(100L);

        assertEquals(ReservationStatus.CANCELLED, pendingReservation.getStatus());
        verify(reservationRepository, times(1)).save(pendingReservation);
    }

        @Test
        void cancelReservation_ReadyForPickup_PromotesNext() {
                BookCopy copy = BookCopy.builder().id(50L).barcode("C0050").book(unavailableBook)
                                .status(BookCopyStatus.LOANED)
                                .build();
                Reservation readyReservation = Reservation.builder()
                                .id(100L)
                                .member(activeMember)
                                .book(unavailableBook)
                                .bookCopy(copy)
                                .status(ReservationStatus.READY_FOR_PICKUP)
                                .build();

                when(reservationRepository.findById(100L)).thenReturn(Optional.of(readyReservation));

                // Let's mock a next pending reservation in queue
                Member member2 = Member.builder().id(2L).name("Jane Smith").status(MemberStatus.ACTIVE).build();
                Reservation nextPending = Reservation.builder()
                                .id(101L)
                                .member(member2)
                                .book(unavailableBook)
                                .status(ReservationStatus.PENDING)
                                .build();
                when(reservationRepository.findPendingQueueForBook(10L)).thenReturn(List.of(nextPending));

                reservationService.cancelReservation(100L);

                assertEquals(ReservationStatus.CANCELLED, readyReservation.getStatus());
                assertNull(readyReservation.getBookCopy());

                // Assert next was promoted
                assertEquals(ReservationStatus.READY_FOR_PICKUP, nextPending.getStatus());
                assertEquals(copy, nextPending.getBookCopy());
                assertNotNull(nextPending.getCollectionExpiryDate());
        }

        @Test
        void expireReservations_PromotesNext() {
                BookCopy copy = BookCopy.builder().id(50L).barcode("C0050").book(unavailableBook)
                                .status(BookCopyStatus.LOANED)
                                .build();
                Reservation expiredRes = Reservation.builder()
                                .id(100L)
                                .member(activeMember)
                                .book(unavailableBook)
                                .bookCopy(copy)
                                .status(ReservationStatus.READY_FOR_PICKUP)
                                .build();

                when(reservationRepository.findByStatusAndCollectionExpiryDateBefore(
                                eq(ReservationStatus.READY_FOR_PICKUP),
                                any(LocalDateTime.class)))
                                .thenReturn(List.of(expiredRes));

                // Next queued member
                Member member2 = Member.builder().id(2L).name("Jane Smith").status(MemberStatus.ACTIVE).build();
                Reservation nextPending = Reservation.builder()
                                .id(101L)
                                .member(member2)
                                .book(unavailableBook)
                                .status(ReservationStatus.PENDING)
                                .build();
                when(reservationRepository.findPendingQueueForBook(10L)).thenReturn(List.of(nextPending));

                reservationService.expireReservations();

                assertEquals(ReservationStatus.EXPIRED, expiredRes.getStatus());
                assertNull(expiredRes.getBookCopy());
                assertEquals(ReservationStatus.READY_FOR_PICKUP, nextPending.getStatus());
                assertEquals(copy, nextPending.getBookCopy());
        }
}
