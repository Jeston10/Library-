package com.library.fine;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class FineDto {
    private Long id;
    private Long loanId;
    private String bookTitle;
    private Long memberId;
    private String memberName;
    private BigDecimal amount;
    private String status;
    private LocalDateTime createdAt;
}
