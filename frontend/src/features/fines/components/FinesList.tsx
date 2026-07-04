'use client';

import React from 'react';
import { useMemberFines, usePayFine, useWaiveFine } from '../hooks';
import { useAuthStore } from '@/store/authStore';

interface FinesListProps {
    memberId: number;
}

export default function FinesList({ memberId }: FinesListProps) {
    const { user } = useAuthStore();
    const { data: fines, isLoading, error } = useMemberFines(memberId);
    const payFineMut = usePayFine();
    const waiveFineMut = useWaiveFine();

    const isLibrarian = user?.role === 'ROLE_LIBRARIAN';

    const handlePay = async (fineId: number) => {
        if (!confirm('Confirm fine payment?')) return;
        const idempotencyKey = `pay-${fineId}-${crypto.randomUUID()}`;
        try {
            await payFineMut.mutateAsync({ fineId, idempotencyKey });
        } catch (err) {
            // toast shown by hook
        }
    };

    const handleWaive = async (fineId: number) => {
        if (!confirm('Confirm waiving fine? This action is irreversible.')) return;
        const idempotencyKey = `waive-${fineId}-${crypto.randomUUID()}`;
        try {
            await waiveFineMut.mutateAsync({ fineId, idempotencyKey });
        } catch (err) {
            // toast shown by hook
        }
    };

    if (isLoading) {
        return <div className="animate-pulse bg-neutral-900 border border-neutral-800 rounded-xl h-48"></div>;
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl text-center">
                <p className="font-semibold">Failed to fetch fines</p>
            </div>
        );
    }

    if (!fines || fines.length === 0) {
        return (
            <div className="bg-neutral-900 border border-neutral-800 text-neutral-400 p-6 rounded-xl text-center">
                <p className="text-sm font-medium">No fines recorded on this member account.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-neutral-900/40 p-4 rounded-xl border border-neutral-900">
                <div>
                    <h3 className="text-md font-bold text-neutral-200">Late Return Fees & Fines</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">List of fines and settlement history for this member account.</p>
                </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow">
                <table className="w-full text-left text-sm text-neutral-300">
                    <thead className="bg-neutral-950 text-neutral-450 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                        <tr>
                            <th className="p-4 font-semibold">Fine ID</th>
                            <th className="p-4 font-semibold">Book Title</th>
                            <th className="p-4 font-semibold">Amount</th>
                            <th className="p-4 font-semibold">Settlement Status</th>
                            <th className="p-4 font-semibold">Issued Date</th>
                            {isLibrarian && <th className="p-4 font-semibold text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/80">
                        {fines.map((fine) => (
                            <tr key={fine.id} className="hover:bg-neutral-850/50 transition-colors">
                                <td className="p-4 font-mono text-neutral-400">#{fine.id}</td>
                                <td className="p-4 font-semibold text-neutral-200">{fine.bookTitle}</td>
                                <td className="p-4 font-semibold text-amber-500">${fine.amount.toFixed(2)}</td>
                                <td className="p-4">
                                    <span
                                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold select-none ${fine.status === 'PAID'
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            : fine.status === 'WAIVED'
                                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                            }`}
                                    >
                                        {fine.status}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-neutral-500">
                                    {new Date(fine.createdAt).toLocaleDateString()} {new Date(fine.createdAt).toLocaleTimeString()}
                                </td>
                                {isLibrarian && (
                                    <td className="p-4 text-right">
                                        {fine.status === 'OWED' ? (
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handlePay(fine.id)}
                                                    disabled={payFineMut.isPending || waiveFineMut.isPending}
                                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-3 py-1.5 rounded transition-all cursor-pointer disabled:opacity-50"
                                                >
                                                    Pay
                                                </button>
                                                <button
                                                    onClick={() => handleWaive(fine.id)}
                                                    disabled={payFineMut.isPending || waiveFineMut.isPending}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded transition-all cursor-pointer disabled:opacity-50"
                                                >
                                                    Waive
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-neutral-500 font-medium">Settled</span>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
