package com.library.catalog;

import com.library.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String isbn;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    private String category;

    @Column(name = "total_copies", nullable = false)
    private int totalCopies;

    @Column(name = "available_copies", nullable = false)
    private int availableCopies;

    @Column(name = "replacement_cost", nullable = false)
    private BigDecimal replacementCost;

    @Version
    private Long version;

    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BookCopy> copies = new ArrayList<>();

    public void addCopy(BookCopy copy) {
        copies.add(copy);
        copy.setBook(this);
        totalCopies++;
        if (copy.getStatus() == BookCopyStatus.AVAILABLE) {
            availableCopies++;
        }
    }

    public void removeCopy(BookCopy copy) {
        copies.remove(copy);
        copy.setBook(null);
        totalCopies--;
        if (copy.getStatus() == BookCopyStatus.AVAILABLE) {
            availableCopies--;
        }
    }
}
