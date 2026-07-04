package com.library.catalog;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookServiceTest {

    @Mock
    private BookRepository bookRepository;

    @Mock
    private BookCopyRepository bookCopyRepository;

    @InjectMocks
    private BookService bookService;

    private Book sampleBook;

    @BeforeEach
    public void setup() {
        sampleBook = Book.builder()
                .id(1L)
                .title("Clean Architecture")
                .author("Robert C. Martin")
                .isbn("978-0134494166")
                .category("Software Practice")
                .replacementCost(new BigDecimal("35.00"))
                .totalCopies(0)
                .availableCopies(0)
                .copies(new ArrayList<>())
                .build();
    }

    @Test
    public void testCreateBook_Success() {
        when(bookRepository.findByIsbn(sampleBook.getIsbn())).thenReturn(Optional.empty());
        when(bookRepository.save(any(Book.class))).thenReturn(sampleBook);

        Book created = bookService.createBook(sampleBook);
        assertNotNull(created);
        assertEquals("Clean Architecture", created.getTitle());
        verify(bookRepository, times(1)).save(any(Book.class));
    }

    @Test
    public void testCreateBook_AlreadyExists() {
        when(bookRepository.findByIsbn(sampleBook.getIsbn())).thenReturn(Optional.of(sampleBook));

        assertThrows(BookAlreadyExistsException.class, () -> {
            bookService.createBook(sampleBook);
        });
        verify(bookRepository, never()).save(any(Book.class));
    }

    @Test
    public void testAddCopy_Success() {
        when(bookRepository.findById(1L)).thenReturn(Optional.of(sampleBook));
        when(bookCopyRepository.findByBarcode("C0001")).thenReturn(Optional.empty());
        when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookCopy copy = bookService.addCopy(1L, "C0001");
        assertNotNull(copy);
        assertEquals("C0001", copy.getBarcode());
        assertEquals(BookCopyStatus.AVAILABLE, copy.getStatus());
        assertEquals(1, sampleBook.getTotalCopies());
        assertEquals(1, sampleBook.getAvailableCopies());
    }

    @Test
    public void testAddCopy_BarcodeExists() {
        when(bookRepository.findById(1L)).thenReturn(Optional.of(sampleBook));
        when(bookCopyRepository.findByBarcode("C0001")).thenReturn(Optional.of(new BookCopy()));

        assertThrows(BarcodeAlreadyExistsException.class, () -> {
            bookService.addCopy(1L, "C0001");
        });
    }

    @Test
    public void testUpdateCopyStatus_AvailableToDamaged() {
        BookCopy copy = BookCopy.builder()
                .id(10L)
                .book(sampleBook)
                .barcode("C0001")
                .status(BookCopyStatus.AVAILABLE)
                .build();
        sampleBook.addCopy(copy); // total=1, available=1

        when(bookCopyRepository.findById(10L)).thenReturn(Optional.of(copy));
        when(bookRepository.save(any(Book.class))).thenReturn(sampleBook);
        when(bookCopyRepository.save(any(BookCopy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookCopy updated = bookService.updateCopyStatus(10L, BookCopyStatus.DAMAGED);
        assertNotNull(updated);
        assertEquals(BookCopyStatus.DAMAGED, updated.getStatus());
        assertEquals(1, sampleBook.getTotalCopies());
        assertEquals(0, sampleBook.getAvailableCopies());
    }
}
