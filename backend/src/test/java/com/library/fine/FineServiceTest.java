package com.library.fine;

import com.library.exception.BusinessException;
import com.library.infrastructure.IdempotencyService;
import com.library.loan.Loan;
import com.library.member.Member;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FineServiceTest {

    @Mock
    private FineRepository fineRepository;

    @Mock
    private IdempotencyService idempotencyService;

    @InjectMocks
    private FineService fineService;

    private Member member;
    private Loan loan;
    private Fine fine;

    @BeforeEach
    void setUp() {
        member = new Member();
        member.setId(1L);
        member.setName("Alice");

        loan = new Loan();
        loan.setId(10L);

        fine = Fine.builder()
                .id(100L)
                .member(member)
                .loan(loan)
                .amount(new BigDecimal("5.00"))
                .status(FineStatus.OWED)
                .build();
    }

    @Test
    void testGetFinesByMember() {
        when(fineRepository.findByMemberId(1L)).thenReturn(List.of(fine));

        List<Fine> fines = fineService.getFinesByMember(1L);

        assertEquals(1, fines.size());
        assertEquals(fine, fines.get(0));
        verify(fineRepository).findByMemberId(1L);
    }

    @Test
    void testPayFine_Success() {
        when(fineRepository.findById(100L)).thenReturn(Optional.of(fine));
        when(fineRepository.save(any(Fine.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Fine paid = fineService.payFine(100L, null);

        assertEquals(FineStatus.PAID, paid.getStatus());
        verify(fineRepository).save(fine);
    }

    @Test
    void testPayFine_IdempotencyKeyCached() {
        String key = "test-key-pay";
        when(idempotencyService.has(key)).thenReturn(true);
        when(idempotencyService.get(key)).thenReturn(fine);

        Fine paid = fineService.payFine(100L, key);

        assertEquals(fine, paid);
        verifyNoInteractions(fineRepository);
    }

    @Test
    void testPayFine_AlreadyPaid_Idempotent() {
        fine.setStatus(FineStatus.PAID);
        when(fineRepository.findById(100L)).thenReturn(Optional.of(fine));

        Fine paid = fineService.payFine(100L, "some-key");

        assertEquals(FineStatus.PAID, paid.getStatus());
        verify(fineRepository, never()).save(any());
        verify(idempotencyService).save("some-key", fine);
    }

    @Test
    void testPayFine_AlreadyWaived_ThrowsException() {
        fine.setStatus(FineStatus.WAIVED);
        when(fineRepository.findById(100L)).thenReturn(Optional.of(fine));

        BusinessException ex = assertThrows(BusinessException.class, () -> fineService.payFine(100L, null));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("already waived"));
    }

    @Test
    void testPayFine_NotFound_ThrowsException() {
        when(fineRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(FineNotFoundException.class, () -> fineService.payFine(999L, null));
    }

    @Test
    void testWaiveFine_Success() {
        when(fineRepository.findById(100L)).thenReturn(Optional.of(fine));
        when(fineRepository.save(any(Fine.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Fine waived = fineService.waiveFine(100L, null);

        assertEquals(FineStatus.WAIVED, waived.getStatus());
        verify(fineRepository).save(fine);
    }

    @Test
    void testWaiveFine_IdempotencyKeyCached() {
        String key = "test-key-waive";
        when(idempotencyService.has(key)).thenReturn(true);
        when(idempotencyService.get(key)).thenReturn(fine);

        Fine waived = fineService.waiveFine(100L, key);

        assertEquals(fine, waived);
        verifyNoInteractions(fineRepository);
    }

    @Test
    void testWaiveFine_AlreadyWaived_Idempotent() {
        fine.setStatus(FineStatus.WAIVED);
        when(fineRepository.findById(100L)).thenReturn(Optional.of(fine));

        Fine waived = fineService.waiveFine(100L, "some-key");

        assertEquals(FineStatus.WAIVED, waived.getStatus());
        verify(fineRepository, never()).save(any());
        verify(idempotencyService).save("some-key", fine);
    }

    @Test
    void testWaiveFine_AlreadyPaid_ThrowsException() {
        fine.setStatus(FineStatus.PAID);
        when(fineRepository.findById(100L)).thenReturn(Optional.of(fine));

        BusinessException ex = assertThrows(BusinessException.class, () -> fineService.waiveFine(100L, null));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("already paid"));
    }
}
