import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from './api';
import { CreateBookRequest, AddCopyRequest, BookCopyStatus } from './types';

export function useBooks(params?: { search?: string; page?: number; size?: number; sortBy?: string; direction?: string }) {
    return useQuery({
        queryKey: ['books', params],
        queryFn: () => catalogApi.getBooks(params),
    });
}

export function useBook(id: number) {
    return useQuery({
        queryKey: ['book', id],
        queryFn: () => catalogApi.getBook(id),
        enabled: !!id,
    });
}

export function useCreateBook() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateBookRequest) => catalogApi.createBook(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
}

export function useUpdateBook(id: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateBookRequest) => catalogApi.updateBook(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            queryClient.invalidateQueries({ queryKey: ['book', id] });
        },
    });
}

export function useAddCopy(bookId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: AddCopyRequest) => catalogApi.addCopy(bookId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['book', bookId] });
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
}

export function useUpdateCopyStatus(bookId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ copyId, status }: { copyId: number; status: BookCopyStatus }) =>
            catalogApi.updateCopyStatus(copyId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['book', bookId] });
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
    });
}
