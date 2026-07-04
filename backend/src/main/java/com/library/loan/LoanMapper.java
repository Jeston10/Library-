package com.library.loan;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface LoanMapper {

    @Mapping(target = "memberId", source = "member.id")
    @Mapping(target = "memberName", source = "member.name")
    @Mapping(target = "bookId", source = "bookCopy.book.id")
    @Mapping(target = "bookTitle", source = "bookCopy.book.title")
    @Mapping(target = "bookCopyId", source = "bookCopy.id")
    @Mapping(target = "bookCopyBarcode", source = "bookCopy.barcode")
    LoanDto toDto(Loan loan);
}
