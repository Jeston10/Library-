'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/axios';
import { LogOut, LogIn, BookOpen, Shield, Users, GraduationCap } from 'lucide-react';
import { useNotification } from '@/providers/NotificationProvider';

type UserRole = 'librarian' | 'member' | 'guest';

interface MockIdentity {
  id: number;
  name: string;
  email: string;
}

const LIBRARIANS: MockIdentity[] = [
  { id: 99, name: 'Sarah Johnson', email: 'sarah.lib@library.com' },
  { id: 100, name: 'Mark Smith', email: 'mark.lib@library.com' },
];

const MEMBERS: MockIdentity[] = [
  { id: 1, name: 'John (Regular)', email: 'john.reg@library.com' },
  { id: 2, name: 'Alice (Supporting)', email: 'alice.sup@library.com' },
  { id: 3, name: 'Bob (Regular)', email: 'bob.reg@library.com' },
  { id: 4, name: 'Diana (Supporting)', email: 'diana.sup@library.com' },
];

export default function AuthDisplay() {
  const { user, setAuth, clearAuth } = useAuthStore();
  const { success, error } = useNotification();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedIdentity, setSelectedIdentity] = useState<number | null>(null);
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const getIdentitiesForRole = (role: UserRole) => {
    if (role === 'librarian') return LIBRARIANS;
    if (role === 'member') return MEMBERS;
    return [];
  };

  const handleLogin = async () => {
    if (!selectedRole || (!selectedIdentity && selectedRole !== 'guest')) return;

    setLoading(true);
    try {
      if (selectedRole === 'guest') {
        clearAuth();
        success('Logout', 'Logged out successfully');
        setSelectedRole(null);
        setSelectedIdentity(null);
        setPassword('');
        return;
      }

      const identities = getIdentitiesForRole(selectedRole);
      const selected = identities.find((id) => id.id === selectedIdentity);
      if (!selected) return;

      // Use real login endpoint
      const response = await apiClient.post('/api/auth/login', {
        email: selected.email,
        password: password,
      });

      const { token, email, role, userId } = response.data;
      setAuth(token, email, role, userId);
      success('Login Successful', `Logged in as ${selected.name}`);
      setSelectedRole(null);
      setSelectedIdentity(null);
      setPassword('');
      window.location.reload();
    } catch (err) {
      error('Login Failed', 'Unable to authenticate. Please try again.');
      console.error('Authentication error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div
        className="flex items-center gap-3 bg-neutral-900/80 border border-neutral-800/50 backdrop-blur-sm p-3 rounded-lg text-sm text-neutral-200 shadow-lg hover:border-neutral-700/50 transition-colors"
        role="region"
        aria-label="User account information"
      >
        <div className="flex items-center gap-2">
          {user.role === 'ROLE_LIBRARIAN' ? (
            <Shield className="h-4 w-4 text-amber-500" aria-hidden="true" />
          ) : (
            <Users className="h-4 w-4 text-blue-500" aria-hidden="true" />
          )}
          <div className="flex flex-col">
            <span className="font-medium text-neutral-100">{user.email}</span>
            <span className="text-xs text-neutral-400">
              {user.role === 'ROLE_LIBRARIAN' ? 'Librarian' : 'Member'} (ID: {user.userId})
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            clearAuth();
            success('Logout', 'Logged out successfully');
            window.location.reload();
          }}
          className="ml-2 p-1.5 hover:bg-neutral-800 rounded transition-colors"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="h-4 w-4 text-red-400" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-neutral-900/80 border border-neutral-800/50 backdrop-blur-sm p-2.5 rounded-lg text-sm text-neutral-200 shadow-lg">
      {!selectedRole ? (
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedRole('librarian')}
            className="flex items-center gap-2 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 rounded transition-all duration-200 text-amber-300 hover:text-amber-200 font-medium text-xs"
            aria-label="Login as librarian"
          >
            <Shield className="h-4 w-4" aria-hidden="true" />
            Librarian
          </button>
          <button
            onClick={() => setSelectedRole('member')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 rounded transition-all duration-200 text-blue-300 hover:text-blue-200 font-medium text-xs"
            aria-label="Login as member"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Member
          </button>
          <button
            onClick={() => handleLogin()}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-700/50 hover:bg-neutral-700/70 rounded transition-all duration-200 text-neutral-300 hover:text-neutral-100 font-medium text-xs"
            aria-label="Continue as guest"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Guest
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="flex items-center gap-2 min-w-0"
        >
          <label htmlFor="identity-select" className="text-xs text-neutral-400 whitespace-nowrap font-medium">
            {selectedRole === 'librarian' ? 'Librarian:' : 'Member:'}
          </label>
          <select
            id="identity-select"
            value={selectedIdentity || ''}
            onChange={(e) => setSelectedIdentity(e.target.value ? parseInt(e.target.value) : null)}
            disabled={loading}
            className="bg-neutral-800 text-neutral-100 border border-neutral-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 disabled:opacity-50 font-medium text-xs flex-1 min-w-0"
            aria-label={`Select ${selectedRole} to login as`}
          >
            <option value="">Select {selectedRole}...</option>
            {getIdentitiesForRole(selectedRole).map((identity) => (
              <option key={identity.id} value={identity.id}>
                {identity.name}
              </option>
            ))}
          </select>
          {/* Password input */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="ml-2 px-2.5 py-1.5 bg-neutral-800 text-neutral-100 border border-neutral-700 rounded focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 disabled:opacity-50 font-medium text-xs"
            aria-label="Password"
          />
          <button
            type="submit"
            disabled={loading || !selectedIdentity}
            className="px-3 py-1.5 bg-green-600/70 hover:bg-green-600 disabled:bg-green-600/40 disabled:cursor-not-allowed rounded transition-all duration-200 text-green-100 font-medium text-xs whitespace-nowrap"
            aria-label={`Login as selected ${selectedRole}`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole(null);
              setSelectedIdentity(null);
            }}
            disabled={loading}
            className="px-2.5 py-1.5 bg-neutral-700/50 hover:bg-neutral-700 disabled:opacity-50 rounded transition-colors text-neutral-300 text-xs"
            aria-label="Cancel login"
          >
            Back
          </button>
        </form>
      )}
    </div>
  );
}
