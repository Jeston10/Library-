'use client';

import React from 'react';
import { useMemberReservations, useCancelReservation } from '../hooks';
import { AlertCircle, Calendar, Trash2 } from 'lucide-react';

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

export default function ActiveReservationsList({ memberId }: { memberId: number }) {
    const { data: reservations, isLoading, error } = useMemberReservations(memberId);
    const cancelMutation = useCancelReservation();

    const handleCancel = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this reservation waitlist request?')) return;
        try {
            await cancelMutation.mutateAsync(id);
        } catch (err) {
            // Error notification is handled in hook onError
        }
    };

    if (isLoading) {
        return <div className="text-zinc-400 py-6 animate-pulse">Loading waitlist reservations...</div>;
    }

    if (error) {
        return <div className="text-red-500 py-4">Failed to load reservations queue.</div>;
    }

    if (!reservations || reservations.length === 0) {
        return (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center text-zinc-500">
                You have no active pending or pick-up reservations.
            </div>
        );
    }

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50">
                <h3 className="font-semibold text-neutral-200">Waiting Lists / Reservations ({reservations.length})</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-neutral-800 text-xs font-semibold text-neutral-400 bg-neutral-950/20">
                            <th className="px-6 py-3">Book Title</th>
                            <th className="px-6 py-3">Reserved On</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Pickup copy Details</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-sm text-neutral-300">
                        {reservations.map((res) => {
                            const isReady = res.status === 'READY_FOR_PICKUP';
                            return (
                                <tr key={res.id} className="hover:bg-neutral-850 transition duration-150">
                                    <td className="px-6 py-4 font-medium text-neutral-100">{res.bookTitle}</td>
                                    <td className="px-6 py-4 text-zinc-400">
                                        {formatDate(res.requestDate)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isReady ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                                                Ready for Collection
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                In Queue
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isReady && res.collectionExpiryDate ? (
                                            <div className="flex flex-col gap-0.5 text-xs text-emerald-400">
                                                <span className="font-mono bg-neutral-850 px-1.5 py-0.5 rounded border border-neutral-800 w-max">
                                                    Barcode: {res.bookCopyBarcode || 'N/A'}
                                                </span>
                                                <span className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Expires: {formatDateShort(res.collectionExpiryDate)}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-600 text-xs">Waiting for returned copy...</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleCancel(res.id)}
                                            disabled={cancelMutation.isPending}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700/60 bg-neutral-800/40 text-xs font-semibold text-neutral-400 hover:text-red-400 hover:bg-neutral-800 hover:border-red-900/30 transition cursor-pointer"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Cancel
                                        </button>
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
