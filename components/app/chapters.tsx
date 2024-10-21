'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';

import Link from 'next/link';

interface Chapter {
    id: string;
    number: number;
    title: string;
    createdAt: string;
}

interface ChaptersResponse {
    chapters: Chapter[];
    nextCursor: string | null;
}

export function MangaChapters({ mangaId }: { mangaId: string }) {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useCurrentUser();

    const role = user?.role 

    console.log(`role: ${role}`);
    useEffect(() => {
        const fetchChapters = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/manga/${mangaId}/chapters`);
                if (!response.ok) {
                    throw new Error('Failed to fetch chapters');
                }
                const data: ChaptersResponse = await response.json();
                setChapters(data.chapters);
            } catch (err) {
                setError('Error loading chapters. Please try again.');
                console.error('Error fetching chapters:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChapters();
    }, [mangaId]);

    if (isLoading) return <div className="text-white">Loading chapters...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-white">Chapters</h2>
            {chapters.length === 0 ? (
                <p className="text-gray-400">No chapters available yet.</p>
            ) : (
                <ul className="space-y-2">

                    {role === 'ADMIN'? <Button><Link href={`/manga-chapters/${mangaId}/add-chapter`}> Add chapters </Link> </Button>: ''}
                    {/* <Button><Link href={`/manga-chapters/${mangaId}/add-chapter`}> Add chapters </Link> </Button> */}
                    {chapters.map((chapter) => (
                        <li key={chapter.id} className="bg-gray-800 p-3 rounded-lg">
                            <Link href={`/manga-chapters/${mangaId}/chapters/${chapter.number}`} className="flex justify-between items-center text-white hover:text-blue-400">
                                <span>Chapter {chapter.number}: {chapter.title}</span>
                                <span className="text-sm text-gray-400">{new Date(chapter.createdAt).toLocaleDateString()}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}