package com.library.reservation;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationDto {
    private Long id;
    private Long memberId;
    private String memberName;
    private Long bookId;
    private String bookTitle;
    private Long bookCopyId;
    private String bookCopyBarcode;
    private LocalDateTime requestDate;
    private String status;
    private LocalDateTime collectionExpiryDate;
}
