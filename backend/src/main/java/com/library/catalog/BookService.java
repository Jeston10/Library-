package com.library.catalog;

import com.library.exception.BusinessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

// Business Exceptions
class BookNotFoundException extends BusinessException {
    public BookNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}

class BookAlreadyExistsException extends BusinessException {
    public BookAlreadyExistsException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

class BarcodeAlreadyExistsException extends BusinessException {
    public BarcodeAlreadyExistsException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

class CopyNotFoundException extends BusinessException {
    public CopyNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}

@Service
@Transactional
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BookCopyRepository bookCopyRepository;

    @Transactional(readOnly = true)
    public Page<Book> searchBooks(String search, Pageable pageable) {
        if (search == null || search.trim().isBlank()) {
            return bookRepository.findAll(pageable);
        }

        String cleanSearch = "%" + search.trim().toLowerCase() + "%";
        Specification<Book> spec = (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), cleanSearch),
                cb.like(cb.lower(root.get("author")), cleanSearch),
                cb.like(cb.lower(root.get("isbn")), cleanSearch),
                cb.like(cb.lower(root.get("category")), cleanSearch));
        return bookRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public Book getBookById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new BookNotFoundException("Book not found with ID: " + id));
    }

    public Book createBook(Book book) {
        Optional<Book> existing = bookRepository.findByIsbn(book.getIsbn());
        if (existing.isPresent()) {
            throw new BookAlreadyExistsException("Book with ISBN " + book.getIsbn() + " already exists.");
        }
        book.setTotalCopies(0);
        book.setAvailableCopies(0);
        return bookRepository.save(book);
    }

    public Book updateBook(Long id, Book updatedDetails) {
        Book book = getBookById(id);

        // If ISBN changed, check uniqueness
        if (!book.getIsbn().equals(updatedDetails.getIsbn())) {
            Optional<Book> existing = bookRepository.findByIsbn(updatedDetails.getIsbn());
            if (existing.isPresent()) {
                throw new BookAlreadyExistsException("Book with ISBN " + updatedDetails.getIsbn() + " already exists.");
            }
        }

        book.setTitle(updatedDetails.getTitle());
        book.setAuthor(updatedDetails.getAuthor());
        book.setIsbn(updatedDetails.getIsbn());
        book.setCategory(updatedDetails.getCategory());
        book.setReplacementCost(updatedDetails.getReplacementCost());

        return bookRepository.save(book);
    }

    public BookCopy addCopy(Long bookId, String barcode) {
        Book book = getBookById(bookId);

        Optional<BookCopy> existingCopy = bookCopyRepository.findByBarcode(barcode);
        if (existingCopy.isPresent()) {
            throw new BarcodeAlreadyExistsException("A book copy with barcode " + barcode + " already exists.");
        }

        BookCopy copy = BookCopy.builder()
                .barcode(barcode)
                .status(BookCopyStatus.AVAILABLE)
                .build();

        book.addCopy(copy);
        bookRepository.save(book); // Cascades copy creation
        return copy;
    }

    public BookCopy updateCopyStatus(Long copyId, BookCopyStatus status) {
        BookCopy copy = bookCopyRepository.findById(copyId)
                .orElseThrow(() -> new CopyNotFoundException("Book copy not found with ID: " + copyId));

        BookCopyStatus oldStatus = copy.getStatus();
        if (oldStatus == status) {
            return copy;
        }

        Book book = copy.getBook();

        // Adjust book availability counts
        if (oldStatus == BookCopyStatus.AVAILABLE && status != BookCopyStatus.AVAILABLE) {
            book.setAvailableCopies(Math.max(0, book.getAvailableCopies() - 1));
        } else if (oldStatus != BookCopyStatus.AVAILABLE && status == BookCopyStatus.AVAILABLE) {
            book.setAvailableCopies(book.getAvailableCopies() + 1);
        }

        copy.setStatus(status);
        bookRepository.save(book);
        return bookCopyRepository.save(copy);
    }
}
