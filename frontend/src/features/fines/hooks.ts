import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { finesApi } from './api';
import { toast } from 'sonner';

export const useMemberFines = (memberId?: number) => {
    return useQuery({
        queryKey: ['fines', 'member', memberId],
        queryFn: () => finesApi.getMemberFines(memberId!),
        enabled: !!memberId,
    });
};

export const usePayFine = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ fineId, idempotencyKey }: { fineId: number; idempotencyKey?: string }) =>
            finesApi.payFine(fineId, idempotencyKey),
        onSuccess: (data) => {
            toast.success(`Fine of $${data.amount.toFixed(2)} paid successfully.`);
            queryClient.invalidateQueries({ queryKey: ['fines'] });
            queryClient.invalidateQueries({ queryKey: ['loans'] });
            queryClient.invalidateQueries({ queryKey: ['members'] });
        },
        onError: (error: any) => {
            const message = error.response?.data?.detail || 'Failed to pay fine.';
            toast.error(message);
        },
    });
};

export const useWaiveFine = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ fineId, idempotencyKey }: { fineId: number; idempotencyKey?: string }) =>
            finesApi.waiveFine(fineId, idempotencyKey),
        onSuccess: (data) => {
            toast.success(`Fine of $${data.amount.toFixed(2)} waived successfully.`);
            queryClient.invalidateQueries({ queryKey: ['fines'] });
            queryClient.invalidateQueries({ queryKey: ['loans'] });
            queryClient.invalidateQueries({ queryKey: ['members'] });
        },
        onError: (error: any) => {
            const message = error.response?.data?.detail || 'Failed to waive fine.';
            toast.error(message);
        },
    });
};
