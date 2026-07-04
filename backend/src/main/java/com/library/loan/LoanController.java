package com.library.loan;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    @Autowired
    private LoanService loanService;

    @Autowired
    private LoanMapper loanMapper;

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<LoanDto>> getActiveLoans(@PathVariable Long memberId) {
        List<LoanDto> dtos = loanService.getActiveLoansForMember(memberId).stream()
                .map(loanMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('LIBRARIAN') or (hasRole('MEMBER') and #request.memberId == principal.id)")
    public ResponseEntity<LoanDto> checkout(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CheckoutRequest request) {

        Loan loan = loanService.checkout(request.getMemberId(), request.getBookCopyId(), idempotencyKey);
        return ResponseEntity.status(HttpStatus.CREATED).body(loanMapper.toDto(loan));
    }

    @PostMapping("/{loanId}/return")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<LoanDto> returnBook(@PathVariable Long loanId) {
        Loan loan = loanService.returnBook(loanId);
        return ResponseEntity.ok(loanMapper.toDto(loan));
    }

    @PostMapping("/{loanId}/renew")
    @PreAuthorize("hasRole('LIBRARIAN') or (hasRole('MEMBER') and @loanService.isLoanOwner(#loanId, principal.id))")
    public ResponseEntity<LoanDto> renewBook(@PathVariable Long loanId) {
        Loan loan = loanService.renewBook(loanId);
        return ResponseEntity.ok(loanMapper.toDto(loan));
    }
}
