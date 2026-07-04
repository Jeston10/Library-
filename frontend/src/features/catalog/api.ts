import { apiClient } from '@/lib/axios';
import { BookDto, BookCopyDto, Page, CreateBookRequest, AddCopyRequest, BookCopyStatus } from './types';

export const catalogApi = {
    getBooks: async (params?: { search?: string; page?: number; size?: number; sortBy?: string; direction?: string }) => {
        const response = await apiClient.get<Page<BookDto>>('/api/books', { params });
        return response.data;
    },

    getBook: async (id: number) => {
        const response = await apiClient.get<BookDto>(`/api/books/${id}`);
        return response.data;
    },

    createBook: async (data: CreateBookRequest) => {
        const response = await apiClient.post<BookDto>('/api/books', data);
        return response.data;
    },

    updateBook: async (id: number, data: CreateBookRequest) => {
        const response = await apiClient.put<BookDto>(`/api/books/${id}`, data);
        return response.data;
    },

    addCopy: async (bookId: number, data: AddCopyRequest) => {
        const response = await apiClient.post<BookCopyDto>(`/api/books/${bookId}/copies`, data);
        return response.data;
    },

    updateCopyStatus: async (copyId: number, status: BookCopyStatus) => {
        const response = await apiClient.patch<BookCopyDto>(`/api/books/copies/${copyId}/status`, null, {
            params: { status },
        });
        return response.data;
    },
};
