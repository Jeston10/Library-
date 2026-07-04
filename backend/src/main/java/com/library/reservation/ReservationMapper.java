package com.library.reservation;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReservationMapper {

    @Mapping(source = "member.id", target = "memberId")
    @Mapping(source = "member.name", target = "memberName")
    @Mapping(source = "book.id", target = "bookId")
    @Mapping(source = "book.title", target = "bookTitle")
    @Mapping(source = "bookCopy.id", target = "bookCopyId")
    @Mapping(source = "bookCopy.barcode", target = "bookCopyBarcode")
    ReservationDto toDto(Reservation reservation);
}
