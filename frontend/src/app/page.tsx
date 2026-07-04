'use client';

import React, { useState } from 'react';
import { BookOpen, ClipboardList, GraduationCap, Users } from 'lucide-react';
import AuthDisplay from '@/components/AuthDisplay';
import BookCatalog from '@/features/catalog/components/BookCatalog';
import BookDetailView from '@/features/catalog/components/BookDetailView';
import FinesList from '@/features/fines/components/FinesList';
import ActiveLoansList from '@/features/loans/components/ActiveLoansList';
import { useCheckout } from '@/features/loans/hooks';
import MemberList from '@/features/members/components/MemberList';
import ActiveReservationsList from '@/features/reservations/components/ActiveReservationsList';
import { useJoinWaitlist } from '@/features/reservations/hooks';
import { useNotification } from '@/providers/NotificationProvider';
import { useAuthStore } from '@/store/authStore';

type TabType = 'catalog' | 'loans' | 'members';

export default function HomePage() {
  const { user } = useAuthStore();
  const { error: notifyError, success: notifySuccess, info: notifyInfo } = useNotification();
  const [activeTab, setActiveTab] = useState<TabType>('catalog');
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [targetMemberIdInput, setTargetMemberIdInput] = useState('');
  const [activeLoansMemberId, setActiveLoansMemberId] = useState<number | null>(null);

  const checkoutMut = useCheckout();
  const joinWaitlistMut = useJoinWaitlist();

  const handleCheckout = async (copyId: number) => {
    if (!user) {
      notifyInfo('Authentication Required', 'Please log in first to borrow books.');
      return;
    }

    const memberIdToUse = user.role === 'ROLE_LIBRARIAN' ? activeLoansMemberId : user.userId;
    if (!memberIdToUse) {
      notifyError('Missing Information', 'Please specify which Member ID is checking out this book copy.');
      return;
    }

    try {
      await checkoutMut.mutateAsync({
        memberId: memberIdToUse,
        bookCopyId: copyId,
      });
      notifySuccess('Checkout Successful', 'Book copy checked out successfully.');
    } catch (err: any) {
      notifyError('Checkout Failed', err?.detail || 'Failed to borrow book.');
      throw err;
    }
  };

  const handleReserve = async (bookId: number) => {
    if (!user) {
      notifyInfo('Authentication Required', 'Please log in first to join the waiting list.');
      return;
    }

    const memberIdToUse = user.role === 'ROLE_LIBRARIAN' ? activeLoansMemberId : user.userId;
    if (!memberIdToUse) {
      notifyError('Missing Information', 'Please specify a Member ID first to join the waitlist on their behalf.');
      return;
    }

    await joinWaitlistMut.mutateAsync({
      bookId,
      memberId: memberIdToUse,
    });
  };

  const handleSetTargetMemberId = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedId = Number(targetMemberIdInput);

    if (Number.isInteger(parsedId) && parsedId > 0) {
      setActiveLoansMemberId(parsedId);
      notifySuccess('Member ID Set', `Now managing loans for member ${parsedId}`);
      return;
    }

    notifyError('Invalid Input', 'Please enter a valid numeric Member ID.');
  };

  const currentBorrowerId = user?.role === 'ROLE_LIBRARIAN' ? activeLoansMemberId : user?.userId;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-sans text-neutral-100 selection:bg-amber-500 selection:text-neutral-950">
      <header className="sticky top-0 z-40 border-b border-neutral-900 bg-neutral-950/60 backdrop-blur-md" role="banner">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-500">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <span className="bg-linear-to-r from-neutral-50 via-neutral-100 to-amber-500 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
                Schedit Library
              </span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Lending System</p>
            </div>
          </div>

          <AuthDisplay />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {!user ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20">
            <div className="max-w-lg space-y-6 rounded-2xl border border-neutral-850 bg-neutral-900/60 p-10 text-center shadow-2xl backdrop-blur-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                <BookOpen className="h-8 w-8" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-neutral-50">Welcome to Schedit Library</h2>
                <p className="text-sm leading-relaxed text-neutral-400">
                  Select your role from the authentication selector in the top right corner. You can browse the catalog as a guest, but will need to log in to borrow books.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {user.role === 'ROLE_LIBRARIAN' && (
              <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 p-4 backdrop-blur-sm" role="region" aria-label="Librarian mode controls">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-300">
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  Librarian Mode Active
                </p>
                <p className="mb-3 text-xs text-neutral-300">
                  You can create books, add copies, register and suspend users, and perform returns. Enter a member ID below to manage loans on behalf of members.
                </p>
                <form onSubmit={handleSetTargetMemberId} className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Enter member ID to manage loans..."
                    value={targetMemberIdInput}
                    onChange={(e) => setTargetMemberIdInput(e.target.value)}
                    className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                    aria-label="Member ID input for librarian loan management"
                  />
                  <button
                    type="submit"
                    className="rounded bg-amber-600/70 px-4 py-2 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-600"
                    aria-label="Set member ID"
                  >
                    Set Member
                  </button>
                  {activeLoansMemberId && (
                    <div className="flex items-center gap-2 rounded bg-neutral-800 px-3 py-2 font-mono text-sm text-neutral-300">
                      ID: {activeLoansMemberId}
                    </div>
                  )}
                </form>
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto border-b border-neutral-800" role="tablist" aria-label="Main navigation">
              {[
                { id: 'catalog', label: 'Catalog', icon: BookOpen },
                { id: 'loans', label: 'Loans', icon: ClipboardList },
                ...(user.role === 'ROLE_LIBRARIAN' ? [{ id: 'members', label: 'Members', icon: Users }] : []),
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id as TabType)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === id ? 'border-amber-500 text-amber-300' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  role="tab"
                  aria-selected={activeTab === id}
                  aria-controls={`${id}-panel`}
                  tabIndex={activeTab === id ? 0 : -1}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'catalog' && (
              <div id="catalog-panel" role="tabpanel" aria-labelledby="catalog">
                {!selectedBookId ? (
                  <BookCatalog onSelectBook={setSelectedBookId} />
                ) : (
                  <BookDetailView
                    bookId={selectedBookId}
                    onBack={() => setSelectedBookId(null)}
                    onCheckout={handleCheckout}
                    onReserve={handleReserve}
                  />
                )}
              </div>
            )}

            {activeTab === 'loans' && (
              <div id="loans-panel" role="tabpanel" aria-labelledby="loans">
                {currentBorrowerId ? (
                  <div className="space-y-6">
                    <ActiveLoansList memberId={currentBorrowerId} />
                    <ActiveReservationsList memberId={currentBorrowerId} />
                    <FinesList memberId={currentBorrowerId} />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-10 text-center text-sm text-neutral-500">
                    Enter a Member ID above to view active loans, reservations, and fees.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && user.role === 'ROLE_LIBRARIAN' && (
              <div id="members-panel" role="tabpanel" aria-labelledby="members">
                <MemberList />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
