'use client';

import React, { useState } from 'react';
import { useBook, useAddCopy, useUpdateCopyStatus } from '../hooks';
import { useAuthStore } from '@/store/authStore';
import { BookCopyStatus } from '../types';
import { useBookWaitlist } from '../../reservations/hooks';

interface BookDetailViewProps {
    bookId: number;
    onBack: () => void;
    // Actions that will be wired by features later
    onCheckout?: (copyId: number) => Promise<void>;
    onReserve?: (bookId: number) => Promise<void>;
}

export default function BookDetailView({ bookId, onBack, onCheckout, onReserve }: BookDetailViewProps) {
    const { user } = useAuthStore();
    const { data: book, isLoading, error } = useBook(bookId);
    const { data: waitlist } = useBookWaitlist(bookId);
    const addCopyMut = useAddCopy(bookId);
    const updateStatusMut = useUpdateCopyStatus(bookId);

    const [barcode, setBarcode] = useState('');
    const [copyError, setCopyError] = useState('');
    const [copySuccess, setCopySuccess] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    const isLibrarian = user?.role === 'ROLE_LIBRARIAN';
    const isMember = user?.role === 'ROLE_MEMBER';

    const handleAddCopy = async (e: React.FormEvent) => {
        e.preventDefault();
        setCopyError('');
        setCopySuccess('');
        if (!barcode.trim()) return;

        try {
            await addCopyMut.mutateAsync({ barcode: barcode.trim() });
            setBarcode('');
            setCopySuccess('Copy added successfully.');
        } catch (err: any) {
            setCopyError(err.detail || 'Barcode already exists or is invalid.');
        }
    };

    const handleStatusChange = async (copyId: number, status: BookCopyStatus) => {
        try {
            await updateStatusMut.mutateAsync({ copyId, status });
        } catch (err: any) {
            alert(err.detail || 'Failed to update copy status.');
        }
    };

    const handleCheckoutClick = async (copyId: number) => {
        if (!onCheckout) return;
        setActionError('');
        setActionLoading(true);
        try {
            await onCheckout(copyId);
        } catch (err: any) {
            setActionError(err.detail || 'Failed to check out book.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReserveClick = async () => {
        if (!onReserve) return;
        setActionError('');
        setActionLoading(true);
        try {
            await onReserve(bookId);
        } catch (err: any) {
            setActionError(err.detail || 'Failed to join waitlist.');
        } finally {
            setActionLoading(false);
        }
    };

    if (isLoading) {
        return <div className="animate-pulse bg-neutral-900 border border-neutral-800 rounded-xl h-96"></div>;
    }

    if (error || !book) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl text-center">
                <p className="font-semibold">Book not found or loading failed</p>
                <button onClick={onBack} className="mt-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 px-4 py-2 rounded-lg text-sm">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back button */}
            <div>
                <button
                    onClick={onBack}
                    className="text-neutral-400 hover:text-neutral-200 text-sm flex items-center gap-1.5 cursor-pointer bg-neutral-900/40 border border-neutral-800 py-1.5 px-3 rounded-lg hover:bg-neutral-800/40 transition-colors"
                >
                    &larr; Back to Catalog
                </button>
            </div>

            {actionError && (
                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
                    {actionError}
                </div>
            )}

            {/* Main Details Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 p-6 rounded-xl flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-500 bg-amber-500/5 px-2.5 py-1 rounded border border-amber-500/10">
                                {book.category || 'General'}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-100">{book.title}</h1>
                        <p className="text-base text-neutral-350 italic">Written by {book.author}</p>
                        <div className="grid grid-cols-2 gap-4 border-t border-b border-neutral-800/80 py-4 mt-6 text-sm">
                            <div>
                                <span className="text-neutral-500 block text-xs uppercase tracking-wider">ISBN Number</span>
                                <span className="text-neutral-250 font-mono font-medium">{book.isbn}</span>
                            </div>
                            <div>
                                <span className="text-neutral-500 block text-xs uppercase tracking-wider">Replacement Cost</span>
                                <span className="text-neutral-250 font-medium">${book.replacementCost.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm bg-neutral-950/20 p-4 rounded-lg border border-neutral-800/30">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-neutral-400">
                                Availability: <strong className="text-neutral-250">{book.availableCopies} available</strong> out of {book.totalCopies} physical copies.
                            </span>
                            {waitlist && waitlist.length > 0 && (
                                <span className="text-xs text-amber-500 font-semibold">
                                    ⚠️ {waitlist.length} {waitlist.length === 1 ? 'member' : 'members'} waiting in line (FIFO queue)
                                </span>
                            )}
                        </div>
                        {isMember && book.availableCopies === 0 && onReserve && (
                            <button
                                onClick={handleReserveClick}
                                disabled={actionLoading}
                                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-neutral-950 font-semibold px-4.5 py-2.5 rounded-lg text-sm transition-all active:scale-[0.98] cursor-pointer"
                            >
                                {actionLoading ? 'Processing...' : 'Join Waitlist'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Copies management or Side panel */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-6">
                    <h2 className="text-lg font-bold text-neutral-100">Physical Copies</h2>

                    {isLibrarian && (
                        <form onSubmit={handleAddCopy} className="space-y-3.5">
                            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Register Physical Copy</h3>
                            {copyError && <p className="text-rose-500 text-xs font-medium">{copyError}</p>}
                            {copySuccess && <p className="text-green-500 text-xs font-medium">{copySuccess}</p>}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    required
                                    placeholder="Barcode, e.g. C0001"
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    className="w-full bg-neutral-950 text-neutral-100 placeholder-neutral-600 border border-neutral-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-lg p-2 text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={addCopyMut.isPending}
                                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Copies list */}
                    <div className="space-y-3 overflow-y-auto max-h-[300px]">
                        {book.copies && book.copies.length === 0 ? (
                            <p className="text-sm text-neutral-500 text-center py-4">No physical copies added yet.</p>
                        ) : (
                            book.copies?.map((copy) => (
                                <div
                                    key={copy.id}
                                    className="p-3 bg-neutral-950/45 border border-neutral-800/40 rounded-lg flex items-center justify-between text-sm"
                                >
                                    <div>
                                        <span className="font-mono text-neutral-300 font-semibold">{copy.barcode}</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Status Badge / dropdown */}
                                        {isLibrarian ? (
                                            <select
                                                value={copy.status}
                                                onChange={(e) => handleStatusChange(copy.id, e.target.value as BookCopyStatus)}
                                                className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                                            >
                                                <option value="AVAILABLE">Available</option>
                                                <option value="LOANED">Loaned</option>
                                                <option value="DAMAGED">Damaged</option>
                                                <option value="LOST">Lost</option>
                                            </select>
                                        ) : (
                                            <span
                                                className={`text-xs px-2.5 py-1 rounded-full font-medium ${copy.status === 'AVAILABLE'
                                                    ? 'bg-green-500/5 text-green-500 border border-green-500/10'
                                                    : copy.status === 'LOANED'
                                                        ? 'bg-cyan-500/5 text-cyan-500 border border-cyan-500/10'
                                                        : 'bg-rose-500/5 text-rose-500 border border-rose-500/10'
                                                    }`}
                                            >
                                                {copy.status}
                                            </span>
                                        )}

                                        {/* Member checkout option if available */}
                                        {isMember && copy.status === 'AVAILABLE' && onCheckout && (
                                            <button
                                                onClick={() => handleCheckoutClick(copy.id)}
                                                disabled={actionLoading}
                                                className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold px-3 py-1.5 rounded transition-all active:scale-95 cursor-pointer"
                                            >
                                                Borrow
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
