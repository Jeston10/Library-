import { apiClient } from '@/lib/axios';
import { Fine } from './types';

export const finesApi = {
    getMemberFines: async (memberId: number) => {
        const response = await apiClient.get<Fine[]>(`/api/fines/member/${memberId}`);
        return response.data;
    },

    payFine: async (fineId: number, idempotencyKey?: string) => {
        const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined;
        const response = await apiClient.post<Fine>(`/api/fines/${fineId}/pay`, null, { headers });
        return response.data;
    },

    waiveFine: async (fineId: number, idempotencyKey?: string) => {
        const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined;
        const response = await apiClient.post<Fine>(`/api/fines/${fineId}/waive`, null, { headers });
        return response.data;
    },
};
