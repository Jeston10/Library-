'use client';

import React, { useState } from 'react';
import { useMembers, useRegisterMember, useUpdateMemberStatus, useUpdateMemberTier } from '../hooks';
import { MemberTier, MemberStatus } from '../api';

export default function MemberList() {
    const { data: members, isLoading, error } = useMembers();
    const registerMut = useRegisterMember();
    const updateStatusMut = useUpdateMemberStatus();
    const updateTierMut = useUpdateMemberTier();

    const [showAddModal, setShowAddModal] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [tier, setTier] = useState<MemberTier>('REGULAR');
    const [formError, setFormError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!name || !email) {
            setFormError('Name and Email are required.');
            return;
        }

        try {
            await registerMut.mutateAsync({ name, email, tier });
            setName('');
            setEmail('');
            setTier('REGULAR');
            setShowAddModal(false);
        } catch (err: any) {
            setFormError(err.detail || 'Email already exists or is invalid.');
        }
    };

    const toggleStatus = async (id: number, currentStatus: MemberStatus) => {
        const nextStatus: MemberStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        try {
            await updateStatusMut.mutateAsync({ id, status: nextStatus });
        } catch (err: any) {
            alert(err.detail || 'Failed to update member status.');
        }
    };

    const handleTierChange = async (id: number, currentTier: MemberTier) => {
        const nextTier: MemberTier = currentTier === 'REGULAR' ? 'SUPPORTING' : 'REGULAR';
        if (nextTier === 'REGULAR') {
            const confirmDowngrade = confirm(
                'Warning: Downgrading this member to REGULAR tier will lower their active loan limit to 3. If they currently have more, they will retain them until return, but cannot check out more. Proceed?'
            );
            if (!confirmDowngrade) return;
        }
        try {
            await updateTierMut.mutateAsync({ id, tier: nextTier });
        } catch (err: any) {
            alert(err.detail || 'Failed to update member tier.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-neutral-100">Registered Members</h2>
                    <p className="text-xs text-neutral-400 mt-1">Manage user levels, suspension states, and limits.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold px-4.5 py-2 rounded-lg text-sm transition-all cursor-pointer"
                >
                    Register Member
                </button>
            </div>

            {isLoading ? (
                <div className="animate-pulse bg-neutral-900 border border-neutral-800 rounded-xl h-64"></div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl text-center">
                    <p className="font-semibold">Failed to fetch members</p>
                </div>
            ) : members?.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 text-neutral-400 p-12 rounded-xl text-center">
                    <p className="text-lg font-medium">No members registered yet</p>
                </div>
            ) : (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow">
                    <table className="w-full text-left text-sm text-neutral-300">
                        <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                            <tr>
                                <th className="p-4 font-semibold">ID</th>
                                <th className="p-4 font-semibold">Name / Email</th>
                                <th className="p-4 font-semibold">Category/Tier</th>
                                <th className="p-4 font-semibold">System Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/80">
                            {members?.map((member) => (
                                <tr key={member.id} className="hover:bg-neutral-850/50 transition-colors">
                                    <td className="p-4 font-mono text-neutral-400">#{member.id}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-neutral-200">{member.name}</div>
                                        <div className="text-xs text-neutral-500">{member.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            onClick={() => handleTierChange(member.id, member.tier)}
                                            className={`text-xs px-2.5 py-1 rounded cursor-pointer select-none font-semibold ${member.tier === 'SUPPORTING'
                                                ? 'bg-amber-500/5 text-amber-500 border border-amber-500/10 hover:bg-amber-500/10'
                                                : 'bg-neutral-950 text-neutral-450 border border-neutral-800 hover:bg-neutral-800'
                                                }`}
                                        >
                                            {member.tier}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            onClick={() => toggleStatus(member.id, member.status)}
                                            className={`text-xs px-2.5 py-1 rounded-full cursor-pointer select-none font-semibold ${member.status === 'ACTIVE'
                                                ? 'bg-green-500/5 text-green-500 border border-green-500/10 hover:bg-green-500/10'
                                                : 'bg-rose-500/5 text-rose-500 border border-rose-500/10 hover:bg-rose-500/10'
                                                }`}
                                        >
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleTierChange(member.id, member.tier)}
                                            className="text-xs text-neutral-450 hover:text-amber-500 transition-colors mr-3 cursor-pointer"
                                        >
                                            Change Tier
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(member.id, member.status)}
                                            className={`text-xs transition-colors cursor-pointer ${member.status === 'ACTIVE' ? 'text-rose-500 hover:text-rose-400' : 'text-green-500 hover:text-green-400'
                                                }`}
                                        >
                                            {member.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Register Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-neutral-888 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/20">
                            <h2 className="font-bold text-neutral-100">Register Library Member</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-neutral-500 hover:text-neutral-200 text-lg transition-colors cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleRegister} className="p-5 space-y-4">
                            {formError && (
                                <div className="p-3 rounded bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs font-medium">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-neutral-950 text-neutral-100 placeholder-neutral-600 border border-neutral-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-lg p-2.5 text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="e.g. john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-neutral-950 text-neutral-100 placeholder-neutral-600 border border-neutral-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-lg p-2.5 text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Membership Tier *</label>
                                <select
                                    value={tier}
                                    onChange={(e) => setTier(e.target.value as MemberTier)}
                                    className="w-full bg-neutral-950 text-neutral-150 border border-neutral-800 focus:border-amber-500 rounded-lg p-2.5 text-sm focus:outline-none"
                                >
                                    <option value="REGULAR">Regular Member (limit 3 loans)</option>
                                    <option value="SUPPORTING">Supporting Member (limit 6 loans)</option>
                                </select>
                            </div>

                            <div className="border-t border-neutral-800 pt-4 mt-6 flex justify-end gap-3.5">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 px-4 py-2 rounded-lg text-sm cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={registerMut.isPending}
                                    className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold px-5.5 py-2 rounded-lg text-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {registerMut.isPending ? 'Registering...' : 'Register'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
