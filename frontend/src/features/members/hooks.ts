import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi, RegisterMemberRequest, MemberStatus, MemberTier } from './api';

export function useMembers() {
    return useQuery({
        queryKey: ['members'],
        queryFn: membersApi.getAllMembers,
    });
}

export function useMember(id: number) {
    return useQuery({
        queryKey: ['member', id],
        queryFn: () => membersApi.getMember(id),
        enabled: !!id,
    });
}

export function useRegisterMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: RegisterMemberRequest) => membersApi.registerMember(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
        },
    });
}

export function useUpdateMemberStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: MemberStatus }) =>
            membersApi.updateStatus(id, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
        },
    });
}

export function useUpdateMemberTier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, tier }: { id: number; tier: MemberTier }) =>
            membersApi.updateTier(id, tier),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
        },
    });
}
