export interface Fine {
    id: number;
    loanId: number;
    bookTitle: string;
    memberId: number;
    memberName: string;
    amount: number;
    status: 'OWED' | 'PAID' | 'WAIVED';
    createdAt: string;
}
