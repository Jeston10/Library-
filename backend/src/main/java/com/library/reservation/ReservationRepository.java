package com.library.reservation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    @Query("SELECT r FROM Reservation r WHERE r.bookCopy.id = :copyId AND r.status = 'READY_FOR_PICKUP'")
    Optional<Reservation> findReadyByCopyId(@Param("copyId") Long copyId);

    @Query("SELECT r FROM Reservation r WHERE r.book.id = :bookId AND r.status = 'PENDING' ORDER BY r.requestDate ASC")
    List<Reservation> findPendingQueueForBook(@Param("bookId") Long bookId);

    @Query("SELECT r FROM Reservation r WHERE r.member.id = :memberId AND r.book.id = :bookId AND (r.status = 'PENDING' OR r.status = 'READY_FOR_PICKUP')")
    List<Reservation> findActiveByMemberAndBook(@Param("memberId") Long memberId, @Param("bookId") Long bookId);

    List<Reservation> findByStatusAndCollectionExpiryDateBefore(ReservationStatus status, LocalDateTime dateTime);
}
