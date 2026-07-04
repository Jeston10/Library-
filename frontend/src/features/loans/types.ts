export type LoanStatus = 'ACTIVE' | 'RETURNED';

export interface LoanDto {
    id: number;
    memberId: number;
    memberName: string;
    bookId: number;
    bookTitle: string;
    bookCopyId: number;
    bookCopyBarcode: string;
    checkoutDate: string;
    dueDate: string;
    returnDate?: string;
    status: LoanStatus;
    version: number;
    createdAt: string;
    updatedAt?: string;
}
