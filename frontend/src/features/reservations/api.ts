import { apiClient } from '@/lib/axios';
import { ReservationDto, ReservationRequest } from './types';

export const reservationsApi = {
    joinWaitlist: async (data: ReservationRequest): Promise<ReservationDto> => {
        const response = await apiClient.post<ReservationDto>('/api/reservations', data);
        return response.data;
    },

    cancelReservation: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/reservations/${id}`);
    },

    getMemberReservations: async (memberId: number): Promise<ReservationDto[]> => {
        const response = await apiClient.get<ReservationDto[]>(`/api/reservations/member/${memberId}`);
        return response.data;
    },

    getBookWaitlist: async (bookId: number): Promise<ReservationDto[]> => {
        const response = await apiClient.get<ReservationDto[]>(`/api/reservations/book/${bookId}`);
        return response.data;
    }
};
