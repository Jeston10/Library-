package com.library.catalog;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/books")
public class BookController {

    @Autowired
    private BookService bookService;

    @Autowired
    private BookMapper bookMapper;

    @GetMapping
    public ResponseEntity<Page<BookDto>> getBooks(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Book> books = bookService.searchBooks(search, pageable);
        Page<BookDto> dtoPage = books.map(bookMapper::toDto);
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookDto> getBook(@PathVariable Long id) {
        Book book = bookService.getBookById(id);
        return ResponseEntity.ok(bookMapper.toDto(book));
    }

    @PostMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<BookDto> createBook(@Valid @RequestBody CreateBookRequest request) {
        Book bookEntity = bookMapper.toEntity(request);
        Book savedBook = bookService.createBook(bookEntity);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookMapper.toDto(savedBook));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<BookDto> updateBook(
            @PathVariable Long id,
            @Valid @RequestBody CreateBookRequest request) {
        Book bookEntity = bookMapper.toEntity(request);
        Book updatedBook = bookService.updateBook(id, bookEntity);
        return ResponseEntity.ok(bookMapper.toDto(updatedBook));
    }

    @PostMapping("/{id}/copies")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<BookCopyDto> addCopy(
            @PathVariable Long id,
            @Valid @RequestBody AddCopyRequest request) {
        BookCopy copy = bookService.addCopy(id, request.getBarcode());
        return ResponseEntity.status(HttpStatus.CREATED).body(bookMapper.toDto(copy));
    }

    @PatchMapping("/copies/{copyId}/status")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<BookCopyDto> updateCopyStatus(
            @PathVariable Long copyId,
            @RequestParam BookCopyStatus status) {
        BookCopy copy = bookService.updateCopyStatus(copyId, status);
        return ResponseEntity.ok(bookMapper.toDto(copy));
    }
}
