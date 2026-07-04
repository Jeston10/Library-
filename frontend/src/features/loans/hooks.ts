import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loansApi, CheckoutRequest } from './api';

export function useActiveLoans(memberId: number) {
    return useQuery({
        queryKey: ['active-loans', memberId],
        queryFn: () => loansApi.getActiveLoans(memberId),
        enabled: !!memberId,
    });
}

export function useCheckout() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CheckoutRequest) => loansApi.checkout(data),
        onSuccess: (_, variables) => {
            // Invalidate both catalog details and user loans list
            queryClient.invalidateQueries({ queryKey: ['active-loans', variables.memberId] });
            queryClient.invalidateQueries({ queryKey: ['books'] });
            queryClient.invalidateQueries({ queryKey: ['book'] });
        },
    });
}

export function useReturnBook(memberId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (loanId: number) => loansApi.returnBook(loanId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-loans', memberId] });
            queryClient.invalidateQueries({ queryKey: ['books'] });
            queryClient.invalidateQueries({ queryKey: ['book'] });
            queryClient.invalidateQueries({ queryKey: ['fines'] }); // Fines may be generated
        },
    });
}

export function useRenewBook(memberId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (loanId: number) => loansApi.renewBook(loanId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-loans', memberId] });
        },
    });
}
