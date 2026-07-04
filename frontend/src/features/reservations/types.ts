export interface ReservationDto {
    id: number;
    memberId: number;
    memberName: string;
    bookId: number;
    bookTitle: string;
    bookCopyId?: number;
    bookCopyBarcode?: string;
    requestDate: string;
    status: 'PENDING' | 'READY_FOR_PICKUP' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED';
    collectionExpiryDate?: string;
}

export interface ReservationRequest {
    bookId: number;
    memberId: number;
}
