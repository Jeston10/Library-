import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMember, useRegisterMember } from './hooks';
import * as membersApi from './api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

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

describe('useMember', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch member by id', async () => {
    const mockMember = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      tier: 'REGULAR',
      status: 'ACTIVE',
    };

    vi.spyOn(membersApi, 'getMember' as any).mockResolvedValueOnce(mockMember);

    const { result } = renderHook(() => useMember(1), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockMember);
    });
  });

  it('should not fetch if id is falsy', () => {
    const mockApi = vi.spyOn(membersApi, 'getMember' as any);

    renderHook(() => useMember(0), { wrapper: createWrapper() });

    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe('useRegisterMember', () => {
  it('should call register member API', async () => {
    const mockCreate = vi.spyOn(membersApi, 'registerMember' as any).mockResolvedValueOnce({
      id: 1,
      name: 'Jane Doe',
      email: 'jane@example.com',
      tier: 'REGULAR',
      status: 'ACTIVE',
    });

    const { result } = renderHook(() => useRegisterMember(), { wrapper: createWrapper() });

    await waitFor(() => {
      result.current.mutate({
        name: 'Jane Doe',
        email: 'jane@example.com',
        tier: 'REGULAR',
      });
    });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
  });
});
