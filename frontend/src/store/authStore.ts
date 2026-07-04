import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
    email: string;
    role: string;
    userId: number;
}

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    setAuth: (token: string, email: string, role: string, userId: number) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            setAuth: (token, email, role, userId) =>
                set({ token, user: { email, role, userId } }),
            clearAuth: () => set({ token: null, user: null }),
        }),
        {
            name: 'library-auth-storage',
        }
    )
);
