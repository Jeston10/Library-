package com.library.catalog;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BookMapper {

    BookDto toDto(Book book);

    @Mapping(target = "bookId", source = "book.id")
    BookCopyDto toDto(BookCopy copy);

    Book toEntity(CreateBookRequest request);
}
