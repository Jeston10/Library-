package com.library.fine;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fines")
public class FineController {

    @Autowired
    private FineService fineService;

    @Autowired
    private FineMapper fineMapper;

    @GetMapping("/member/{memberId}")
    @PreAuthorize("hasRole('LIBRARIAN') or (hasRole('MEMBER') and #memberId == principal.id)")
    public ResponseEntity<List<FineDto>> getFinesByMember(@PathVariable Long memberId) {
        List<FineDto> dtos = fineService.getFinesByMember(memberId).stream()
                .map(fineMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{fineId}/pay")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<FineDto> payFine(
            @PathVariable Long fineId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        Fine fine = fineService.payFine(fineId, idempotencyKey);
        return ResponseEntity.ok(fineMapper.toDto(fine));
    }

    @PostMapping("/{fineId}/waive")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<FineDto> waiveFine(
            @PathVariable Long fineId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        Fine fine = fineService.waiveFine(fineId, idempotencyKey);
        return ResponseEntity.ok(fineMapper.toDto(fine));
    }
}
