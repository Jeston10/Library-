package com.library.reservation;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    @PreAuthorize("hasRole('MEMBER') or hasRole('LIBRARIAN')")
    public ResponseEntity<ReservationDto> joinWaitlist(@Valid @RequestBody ReservationRequest request) {
        ReservationDto dto = reservationService.joinQueue(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('LIBRARIAN') or @reservationService.isReservationOwner(#id, principal.username)")
    public ResponseEntity<Void> cancelReservation(@PathVariable Long id) {
        reservationService.cancelReservation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/member/{memberId}")
    @PreAuthorize("hasRole('LIBRARIAN') or #memberId == principal.userId")
    public ResponseEntity<List<ReservationDto>> getActiveMemberReservations(@PathVariable Long memberId) {
        List<ReservationDto> dtos = reservationService.getActiveReservations(memberId);
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/book/{bookId}")
    @PreAuthorize("hasRole('MEMBER') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<ReservationDto>> getBookWaitlistQueue(@PathVariable Long bookId) {
        List<ReservationDto> dtos = reservationService.getBookWaitlist(bookId);
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/expire")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<Void> triggerManualExpiration() {
        reservationService.expireReservations();
        return ResponseEntity.ok().build();
    }
}
