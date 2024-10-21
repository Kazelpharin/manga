'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddChapterProps {
    mangaId: string;
}

export function AddChapter({ mangaId }: AddChapterProps) {
    const [chapterNumber, setChapterNumber] = useState('');
    const [title, setTitle] = useState('');
    const [pages, setPages] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('mangaId', mangaId);
        formData.append('number', chapterNumber);
        formData.append('title', title);
        pages.forEach((page, index) => {
            formData.append(`page${index}`, page);
        });

        try {
            const response = await fetch('/api/manga/add-chapter', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to add chapter');
            }

            router.push(`/manga/${mangaId}`);
        } catch (err) {
            setError('Error adding chapter. Please try again.');
            console.error('Error adding chapter:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="chapterNumber" className="block text-sm font-medium text-gray-300">
                    Chapter Number
                </label>
                <input
                    type="number"
                    id="chapterNumber"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                    Chapter Title
                </label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>
            <div>
                <label htmlFor="pages" className="block text-sm font-medium text-gray-300">
                    Chapter Pages
                </label>
                <input
                    type="file"
                    id="pages"
                    multiple
                    accept="image/*"
                    onChange={(e) => setPages(Array.from(e.target.files || []))}
                    required
                    className="mt-1 block w-full text-sm text-gray-300
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-600 file:text-white
                        hover:file:bg-indigo-700"
                />
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
                {isLoading ? 'Adding Chapter...' : 'Add Chapter'}
            </button>
        </form>
    );
}