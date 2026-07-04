package com.library.catalog;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookCopyDto {
    private Long id;
    private Long bookId;
    private String barcode;
    private BookCopyStatus status;
    private Long version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
