package com.library.reservation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationScheduler {

    private final ReservationService reservationService;

    // Runs once every hour by default to clean up expired ready-for-pickup
    // checkouts
    @Scheduled(cron = "${app.cron.reservation-expiry:0 0 * * * *}")
    public void cleanupExpiredReservations() {
        log.info("Starting scheduled cleanup of ready-for-pickup reservations expired collection windows...");
        try {
            reservationService.expireReservations();
            log.info("Expired reservations cleanup successfully completed.");
        } catch (Exception e) {
            log.error("Failed to execute expired reservations clean-up", e);
        }
    }
}
