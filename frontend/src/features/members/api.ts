import { apiClient } from '@/lib/axios';

export type MemberTier = 'REGULAR' | 'SUPPORTING';
export type MemberStatus = 'ACTIVE' | 'SUSPENDED';

export interface MemberDto {
    id: number;
    name: string;
    email: string;
    tier: MemberTier;
    status: MemberStatus;
    version: number;
    createdAt: string;
    updatedAt?: string;
}

export interface RegisterMemberRequest {
    name: string;
    email: string;
    tier: MemberTier;
}

export const membersApi = {
    getAllMembers: async () => {
        const response = await apiClient.get<MemberDto[]>('/api/members');
        return response.data;
    },

    getMember: async (id: number) => {
        const response = await apiClient.get<MemberDto>(`/api/members/${id}`);
        return response.data;
    },

    registerMember: async (data: RegisterMemberRequest) => {
        const response = await apiClient.post<MemberDto>('/api/members', data);
        return response.data;
    },

    updateStatus: async (id: number, status: MemberStatus) => {
        const response = await apiClient.patch<MemberDto>(`/api/members/${id}/status`, null, {
            params: { status },
        });
        return response.data;
    },

    updateTier: async (id: number, tier: MemberTier) => {
        const response = await apiClient.patch<MemberDto>(`/api/members/${id}/tier`, { tier });
        return response.data;
    },
};
