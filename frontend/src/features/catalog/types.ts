export type BookCopyStatus = 'AVAILABLE' | 'LOANED' | 'DAMAGED' | 'LOST';

export interface BookCopyDto {
    id: number;
    bookId: number;
    barcode: string;
    status: BookCopyStatus;
    version: number;
    createdAt: string;
    updatedAt?: string;
}

export interface BookDto {
    id: number;
    isbn: string;
    title: string;
    author: string;
    category?: string;
    totalCopies: number;
    availableCopies: number;
    replacementCost: number;
    version: number;
    createdAt: string;
    updatedAt?: string;
    copies?: BookCopyDto[];
}

export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface CreateBookRequest {
    isbn: string;
    title: string;
    author: string;
    category?: string;
    replacementCost: number;
}

export interface AddCopyRequest {
    barcode: string;
}
