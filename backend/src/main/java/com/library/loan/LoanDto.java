package com.library.loan;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LoanDto {
    private Long id;
    private Long memberId;
    private String memberName;
    private Long bookId;
    private String bookTitle;
    private Long bookCopyId;
    private String bookCopyBarcode;
    private LocalDateTime checkoutDate;
    private LocalDateTime dueDate;
    private LocalDateTime returnDate;
    private LoanStatus status;
    private Long version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
