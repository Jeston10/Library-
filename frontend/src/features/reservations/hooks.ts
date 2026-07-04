import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsApi } from './api';
import { ReservationRequest } from './types';
import { toast } from 'sonner';

export const useMemberReservations = (memberId?: number) => {
    return useQuery({
        queryKey: ['reservations', 'member', memberId],
        queryFn: () => reservationsApi.getMemberReservations(memberId!),
        enabled: !!memberId,
    });
};

export const useBookWaitlist = (bookId?: number) => {
    return useQuery({
        queryKey: ['reservations', 'book', bookId],
        queryFn: () => reservationsApi.getBookWaitlist(bookId!),
        enabled: !!bookId,
    });
};

export const useJoinWaitlist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ReservationRequest) => reservationsApi.joinWaitlist(data),
        onSuccess: (data) => {
            toast.success('Successfully joined the waiting list queue!');
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['book', data.bookId] });
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
        onError: (error: any) => {
            const message = error.response?.data?.detail || 'Failed to join the waiting list.';
            toast.error(message);
        }
    });
};

export const useCancelReservation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => reservationsApi.cancelReservation(id),
        onSuccess: () => {
            toast.success('Reservation cancelled successfully.');
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
        onError: (error: any) => {
            const message = error.response?.data?.detail || 'Failed to cancel reservation.';
            toast.error(message);
        }
    });
};
