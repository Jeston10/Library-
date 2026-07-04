'use client';

import React, { useState } from 'react';
import { useBooks, useCreateBook } from '../hooks';
import { useAuthStore } from '@/store/authStore';

interface BookCatalogProps {
    onSelectBook: (id: number) => void;
}

export default function BookCatalog({ onSelectBook }: BookCatalogProps) {
    const { user } = useAuthStore();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [sortOption, setSortOption] = useState('title-asc');
    const [showAddModal, setShowAddModal] = useState(false);

    // Form Fields
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [isbn, setIsbn] = useState('');
    const [category, setCategory] = useState('');
    const [replacementCost, setReplacementCost] = useState('19.99');
    const [formError, setFormError] = useState('');

    const [sortBy, direction] = sortOption.split('-');
    const { data, isLoading, error } = useBooks({ search, page, size: 8, sortBy, direction });
    const createBookMut = useCreateBook();

    const isLibrarian = user?.role === 'ROLE_LIBRARIAN';

    const categories = ['All', 'Software Construction', 'Architecture', 'Design Patterns', 'System Design', 'General'];

    const handleCreateBook = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!title || !author || !isbn || !replacementCost) {
            setFormError('Please fill in all required fields.');
            return;
        }
        const costNum = parseFloat(replacementCost);
        if (isNaN(costNum) || costNum <= 0) {
            setFormError('Replacement cost must be a positive number.');
            return;
        }

        try {
            await createBookMut.mutateAsync({
                title,
                author,
                isbn,
                category: category || undefined,
                replacementCost: costNum,
            });
            // Reset form
            setTitle('');
            setAuthor('');
            setIsbn('');
            setCategory('');
            setReplacementCost('19.99');
            setShowAddModal(false);
        } catch (err: any) {
            setFormError(err.detail || 'Failed to create book.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Catalog Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-2xl">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search by title, author, or ISBN..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                            className="w-full bg-neutral-950 text-neutral-100 placeholder-neutral-500 border border-neutral-800 rounded-lg py-2.5 px-4 pr-10 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 text-sm transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors text-xs font-mono"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <select
                        value={sortOption}
                        onChange={(e) => {
                            setSortOption(e.target.value);
                            setPage(0);
                        }}
                        className="bg-neutral-950 text-neutral-150 border border-neutral-800 rounded-lg py-2.5 px-3 focus:outline-none focus:border-amber-500 text-sm select-none"
                    >
                        <option value="title-asc">Title: A to Z</option>
                        <option value="title-desc">Title: Z to A</option>
                        <option value="author-asc">Author: A to Z</option>
                        <option value="author-desc">Author: Z to A</option>
                        <option value="category-asc">Category: A to Z</option>
                    </select>
                </div>

                {isLibrarian && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold px-5 py-2.5 rounded-lg text-sm transition-all active:scale-[0.98] shadow shadow-amber-500/10 cursor-pointer"
                    >
                        Add New Book
                    </button>
                )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold text-neutral-550 uppercase tracking-widest mr-2">Filters:</span>
                {categories.map((cat) => {
                    const isActive = cat === 'All' ? !search : search.toLowerCase() === cat.toLowerCase();
                    return (
                        <button
                            key={cat}
                            onClick={() => {
                                if (cat === 'All') {
                                    setSearch('');
                                } else {
                                    setSearch(cat);
                                }
                                setPage(0);
                            }}
                            className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all cursor-pointer select-none ${isActive
                                ? 'bg-amber-500 text-neutral-950 border-amber-500 font-semibold'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
                                }`}
                        >
                            {cat}
                        </button>
                    );
                })}
            </div>

            {/* Book Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-neutral-900 border border-neutral-800 rounded-xl h-64"></div>
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl text-center">
                    <p className="font-semibold">Failed to load system catalog</p>
                    <p className="text-sm mt-1">{(error as any).detail || 'Connection refused.'}</p>
                </div>
            ) : data?.content.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 text-neutral-400 p-12 rounded-xl text-center">
                    <p className="text-lg font-medium">No books found matching selection</p>
                    <p className="text-sm mt-1">Try refining your search keyword or add a new title.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {data?.content.map((book) => (
                        <div
                            key={book.id}
                            onClick={() => onSelectBook(book.id)}
                            className="group bg-neutral-900 hover:bg-neutral-855 border border-neutral-800 hover:border-amber-500/30 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col h-full shadow hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5"
                        >
                            {/* Category tag */}
                            <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-500/80 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                                        {book.category || 'General'}
                                    </span>
                                    <h3 className="font-bold text-neutral-100 group-hover:text-amber-400 transition-colors mt-2 text-base line-clamp-2">
                                        {book.title}
                                    </h3>
                                    <p className="text-sm text-neutral-400 mt-1 italic">by {book.author}</p>
                                </div>
                                <div className="border-t border-neutral-800/80 pt-3 mt-4 flex items-center justify-between text-xs text-neutral-500">
                                    <span>ISBN: {book.isbn}</span>
                                    <span className={`${book.availableCopies > 0 ? 'text-green-500 bg-green-500/5 border border-green-500/10' : 'text-rose-500 bg-rose-500/5 border border-rose-500/10'} px-2 py-0.5 rounded font-medium`}>
                                        {book.availableCopies} / {book.totalCopies} Avail
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-6">
                    <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 disabled:opacity-50 text-neutral-300 px-3.5 py-1.5 rounded-lg text-sm cursor-pointer disabled:cursor-not-allowed select-none transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-neutral-400 text-sm px-4">
                        Page {page + 1} of {data.totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                        disabled={page === data.totalPages - 1}
                        className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 disabled:opacity-50 text-neutral-300 px-3.5 py-1.5 rounded-lg text-sm cursor-pointer disabled:cursor-not-allowed select-none transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Add New Book Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="bg-neutral-900 border border-neutral-888 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                        <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/20">
                            <h2 className="font-bold text-neutral-100">Add Book to Catalog</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-neutral-500 hover:text-neutral-200 text-lg transition-colors cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleCreateBook} className="p-5 space-y-4">
                            {formError && (
                                <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-medium">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Book Title *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Clean Architecture"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-neutral-950 text-neutral-100 placeholder-neutral-600 border border-neutral-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-lg p-2.5 text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Author Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Robert C. Martin"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    className="w-full bg-neutral-950 text-neutral-100 placeholder-neutral-600 border border-neutral-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-lg p-2.5 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">ISBN Number *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 978-0134494166"
                                        value={isbn}
                                        onChange={(e) => setIsbn(e.target.value)}
                                        className="w-full bg-neutral-950 text-neutral-100 placeholder-neutral-600 border border-neutral-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-lg p-2.5 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Category</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Software Practice"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-neutral-950 text-neutral-100 placeholder-neutral-600 border border-neutral-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-lg p-2.5 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Replacement Cost ($) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={replacementCost}
                                    onChange={(e) => setReplacementCost(e.target.value)}
                                    className="w-full bg-neutral-950 text-neutral-100 border border-neutral-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-lg p-2.5 text-sm"
                                />
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
                                    disabled={createBookMut.isPending}
                                    className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold px-5.5 py-2 rounded-lg text-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {createBookMut.isPending ? 'Saving...' : 'Add Book'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
