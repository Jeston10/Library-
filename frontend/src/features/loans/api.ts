import { apiClient } from '@/lib/axios';
import { LoanDto } from './types';

export interface CheckoutRequest {
    memberId: number;
    bookCopyId: number;
}

export const loansApi = {
    getActiveLoans: async (memberId: number) => {
        const response = await apiClient.get<LoanDto[]>(`/api/loans/member/${memberId}`);
        return response.data;
    },

    checkout: async (data: CheckoutRequest) => {
        // We generate a client-side UUID for idempotency key to prevent double checkout triggers
        const idempotencyKey = crypto.randomUUID();
        const response = await apiClient.post<LoanDto>('/api/loans/checkout', data, {
            headers: {
                'Idempotency-Key': idempotencyKey,
            },
        });
        return response.data;
    },

    returnBook: async (loanId: number) => {
        const response = await apiClient.post<LoanDto>(`/api/loans/${loanId}/return`);
        return response.data;
    },

    renewBook: async (loanId: number) => {
        const response = await apiClient.post<LoanDto>(`/api/loans/${loanId}/renew`);
        return response.data;
    },
};
