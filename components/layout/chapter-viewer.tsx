'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ChapterData {
    id: string;
    number: number;
    title: string;
    pages: string[];
}

interface ChapterViewerProps {
    mangaId: string;
    chapterNumber: number;
}

export function ChapterViewer({ mangaId, chapterNumber }: ChapterViewerProps) {
    const [chapter, setChapter] = useState<ChapterData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchChapter = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/manga/${mangaId}/chapters/${chapterNumber}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch chapter');
                }
                const data: ChapterData = await response.json();
                setChapter(data);
            } catch (err) {
                setError('Error loading chapter. Please try again.');
                console.error('Error fetching chapter:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChapter();
    }, [mangaId, chapterNumber]);

    if (isLoading) return <div className="text-white">Loading chapter...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!chapter) return <div className="text-white">Chapter not found.</div>;

    return (
        <div className="max-w-full mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-white text-center">
                Chapter {chapter.number}: {chapter.title}
            </h1>
            <div className="space-y-4">
                {chapter.pages.map((page, index) => (
                    <div key={index} className="w-full relative">
                        <Image
                            src={page}
                            alt={`Page ${index + 1}`}
                            width={0}
                            height={0}
                            sizes="100vw"
                            style={{
                                width: '100%',
                                height: 'auto',
                            }}
                            priority={index === 0}
                            quality={75}
                            unoptimized={false}
                            loading={index === 0 ? 'eager' : 'lazy'}
                        />
                    </div>
                ))}
            </div>
            <div className="mt-8 flex justify-between px-4">
                <Link 
                    href={`/manga-chapters/${mangaId}/chapters/${chapterNumber - 1}`}
                    className="text-blue-400 hover:underline"
                >
                    Previous Chapter
                </Link>
                <Link 
                    href={`/manga-chapters/${mangaId}/chapters/${chapterNumber + 1}`}
                    className="text-blue-400 hover:underline"
                >
                    Next Chapter
                </Link>
            </div>
        </div>
    );
}