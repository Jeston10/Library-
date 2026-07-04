package com.library.catalog;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BookDto {
    private Long id;
    private String isbn;
    private String title;
    private String author;
    private String category;
    private int totalCopies;
    private int availableCopies;
    private BigDecimal replacementCost;
    private Long version;
    private List<BookCopyDto> copies;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
