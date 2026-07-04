package com.library.fine;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FineMapper {

    @Mapping(source = "loan.id", target = "loanId")
    @Mapping(source = "loan.bookCopy.book.title", target = "bookTitle")
    @Mapping(source = "member.id", target = "memberId")
    @Mapping(source = "member.name", target = "memberName")
    FineDto toDto(Fine fine);
}
