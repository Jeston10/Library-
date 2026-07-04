'use client';

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useActiveLoans, useReturnBook, useRenewBook } from '../hooks';
import { RefreshCw, Undo2, AlertTriangle } from 'lucide-react';

const formatDate = (dateStr: string) => {
    try {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        return dateStr;
    }
};

const formatDateShort = (dateStr: string) => {
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch (e) {
        return dateStr;
    }
};

export default function ActiveLoansList({ memberId }: { memberId: number }) {
    const { user } = useAuthStore();
    const isLibrarian = user?.role === 'ROLE_LIBRARIAN';

    const { data: loans, isLoading, error } = useActiveLoans(memberId);
    const returnMutation = useReturnBook(memberId);
    const renewMutation = useRenewBook(memberId);

    const handleReturn = async (loanId: number) => {
        // if (!confirm('Are you sure you want to process this return?')) return;
        try {
            await returnMutation.mutateAsync(loanId);
            alert('Book copy returned successfully.');
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to return book copy.');
        }
    };

    const handleRenew = async (loanId: number) => {
        try {
            await renewMutation.mutateAsync(loanId);
            alert('Loan renewed successfully.');
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to renew loan.');
        }
    };

    if (isLoading) {
        return <div className="text-zinc-400 py-6 animate-pulse">Loading active loans...</div>;
    }

    if (error) {
        return <div className="text-red-500 py-4">Failed to load active loans.</div>;
    }

    if (!loans || loans.length === 0) {
        return (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center text-zinc-500">
                No active loans found for this member account.
            </div>
        );
    }

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-200">Active Borrowings ({loans.length})</h3>
                <span className="text-xs text-neutral-500 font-mono">Limit: {user?.role === 'ROLE_LIBRARIAN' ? 'None' : '3/6'}</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-neutral-800 text-xs font-semibold text-neutral-400 bg-neutral-950/20">
                            <th className="px-6 py-3">Book Title</th>
                            <th className="px-6 py-3">copy Barcode</th>
                            <th className="px-6 py-3">Borrowed On</th>
                            <th className="px-6 py-3">Due Date</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-sm text-neutral-300">
                        {loans.map((loan) => {
                            const overdue = new Date(loan.dueDate) < new Date();
                            return (
                                <tr key={loan.id} className="hover:bg-neutral-850 transition duration-150">
                                    <td className="px-6 py-4 font-medium text-neutral-100">{loan.bookTitle}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{loan.bookCopyBarcode}</td>
                                    <td className="px-6 py-4 text-zinc-400">
                                        {formatDate(loan.checkoutDate)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <span className={overdue ? 'text-red-400 flex items-center gap-1.5' : 'text-emerald-400'}>
                                                {formatDateShort(loan.dueDate)}
                                                {overdue && (
                                                    <span title="Overdue fine accumulating">
                                                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 animate-bounce" />
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2.5">
                                            <button
                                                onClick={() => handleRenew(loan.id)}
                                                disabled={renewMutation.isPending}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition cursor-pointer"
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                                Renew
                                            </button>

                                            {isLibrarian && (
                                                <button
                                                    onClick={() => handleReturn(loan.id)}
                                                    disabled={returnMutation.isPending}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-neutral-900 transition cursor-pointer"
                                                >
                                                    <Undo2 className="h-3 w-3" />
                                                    Return Copy
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
