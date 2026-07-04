import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCheckout, useReturnBook, useRenewBook, useActiveLoans } from './hooks';
import * as loansApi from './api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API
vi.mock('./api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call checkout API with correct parameters', async () => {
    const mockCheckout = vi.spyOn(loansApi, 'checkout' as any).mockResolvedValueOnce({
      id: 1,
      memberId: 1,
      bookCopyId: 1,
    });

    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    await waitFor(() => {
      result.current.mutate({
        memberId: 1,
        bookCopyId: 1,
      });
    });

    await waitFor(() => {
      expect(mockCheckout).toHaveBeenCalled();
    });
  });

  it('should invalidate related queries on success', async () => {
    vi.spyOn(loansApi, 'checkout' as any).mockResolvedValueOnce({
      id: 1,
      memberId: 1,
      bookCopyId: 1,
    });

    const { result } = renderHook(() => useCheckout(), { wrapper: createWrapper() });

    expect(result.current.isPending).toBe(false);
  });
});

describe('useReturnBook', () => {
  it('should call return API', async () => {
    const mockReturn = vi.spyOn(loansApi, 'returnBook' as any).mockResolvedValueOnce({
      id: 1,
      status: 'RETURNED',
    });

    const { result } = renderHook(() => useReturnBook(1), { wrapper: createWrapper() });

    await waitFor(() => {
      result.current.mutate(1);
    });

    await waitFor(() => {
      expect(mockReturn).toHaveBeenCalled();
    });
  });
});

describe('useActiveLoans', () => {
  it('should fetch active loans for member', async () => {
    const mockLoans = [
      { id: 1, memberId: 1, status: 'ACTIVE' },
      { id: 2, memberId: 1, status: 'ACTIVE' },
    ];

    vi.spyOn(loansApi, 'getActiveLoans' as any).mockResolvedValueOnce(mockLoans);

    const { result } = renderHook(() => useActiveLoans(1), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });

  it('should not fetch if memberId is falsy', () => {
    const mockLoans = vi.spyOn(loansApi, 'getActiveLoans' as any);

    renderHook(() => useActiveLoans(0), { wrapper: createWrapper() });

    expect(mockLoans).not.toHaveBeenCalled();
  });
});
