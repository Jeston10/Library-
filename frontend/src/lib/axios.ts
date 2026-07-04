import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach JWT Token & Idempotency Key
apiClient.interceptors.request.use(
    (config) => {
        // 1. Attach JWT
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // 2. Attach Idempotency Key for mutating requests if not already set
        if (['post', 'put', 'delete', 'patch'].includes(config.method || '')) {
            if (!config.headers['Idempotency-Key']) {
                config.headers['Idempotency-Key'] = crypto.randomUUID();
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export interface ApiError {
    type?: string;
    title: string;
    status: number;
    detail: string;
    instance?: string;
    errors?: Record<string, string>; // validation errors
}

// Response Interceptor: Unwrap RFC 7807 problem details
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        let apiError: ApiError = {
            title: 'Network Error',
            status: 500,
            detail: 'Something went wrong while connecting to the server.',
        };

        if (error.response) {
            const data = error.response.data;
            apiError = {
                type: data.type || 'about:blank',
                title: data.title || 'Error',
                status: error.response.status || data.status || 500,
                detail: data.detail || 'An unexpected error occurred.',
                instance: data.instance,
                errors: data.errors, // validation errors
            };
        } else if (error.request) {
            apiError.detail = 'No response received from the server. Please check if the backend is running.';
        }

        return Promise.reject(apiError);
    }
);
