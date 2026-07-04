'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/axios';

const MOCK_IDENTITIES = [
    { id: 99, name: 'Librarian Sarah', email: 'sarah.lib@library.com', role: 'ROLE_LIBRARIAN' },
    { id: 1, name: 'Member John (Regular)', email: 'john.reg@library.com', role: 'ROLE_MEMBER' },
    { id: 2, name: 'Member Alice (Supporting)', email: 'alice.sup@library.com', role: 'ROLE_MEMBER' },
    { id: 3, name: 'Member Bob (Regular)', email: 'bob.reg@library.com', role: 'ROLE_MEMBER' },
];

export default function IdentitySelector() {
    const { user, setAuth, clearAuth } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const handleSelect = async (identityIdStr: string) => {
        if (!identityIdStr) {
            clearAuth();
            return;
        }

        const identityId = parseInt(identityIdStr);
        const selected = MOCK_IDENTITIES.find((id) => id.id === identityId);
        if (!selected) return;

        setLoading(true);
        try {
            const response = await apiClient.post('/api/auth/mock-token', {
                email: selected.email,
                role: selected.role,
                userId: selected.id,
            });

            const { token, email, role, userId } = response.data;
            setAuth(token, email, role, userId);
            // Reload UI state / clear queries
            window.location.reload();
        } catch (err) {
            console.error('Failed to authenticate as mock identity:', err);
        } finally {
            setLoading(false);
        }
    };

    const currentVal = user ? user.userId.toString() : '';

    return (
        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg text-sm text-neutral-200">
            <div className="font-semibold text-neutral-400">Acting As:</div>
            <select
                value={currentVal}
                onChange={(e) => handleSelect(e.target.value)}
                disabled={loading}
                className="bg-neutral-800 text-neutral-100 border border-neutral-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 disabled:opacity-50 font-medium"
            >
                <option value="">Guest (Unauthenticated)</option>
                {MOCK_IDENTITIES.map((identity) => (
                    <option key={identity.id} value={identity.id}>
                        {identity.name} ({identity.role.replace('ROLE_', '')})
                    </option>
                ))}
            </select>
            {user && (
                <span className="text-xs text-neutral-500 font-mono">
                    ID: {user.userId}
                </span>
            )}
        </div>
    );
}
