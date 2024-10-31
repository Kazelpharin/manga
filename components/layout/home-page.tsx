'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';

interface Manga {
    id: string;
    title: string;
    mangacover: string;
    authorId: string;
    categories: string[];
    status: string;
}

interface MangaResponse {
    manga: Manga[];
    nextCursor: string | null;
}

export function MangaGrid() {
    const [mangas, setMangas] = useState<Manga[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [ref, inView] = useInView();

    const loadMoreMangas = useCallback(async () => {
        if (isLoading || cursor === null) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/manga?cursor=${cursor}`);
            if (!res.ok) throw new Error('Failed to fetch manga');
            const data: MangaResponse = await res.json();
            console.log('Loaded manga data:', data); // Debugging log
            setMangas(prev => [...prev, ...data.manga]);
            setCursor(data.nextCursor);
        } catch (error) {
            console.error('Error loading more manga:', error);
        } finally {
            setIsLoading(false);
        }
    }, [cursor, isLoading]);

    useEffect(() => {
        const loadInitialMangas = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/manga');
                if (!res.ok) throw new Error('Failed to fetch manga');
                const data: MangaResponse = await res.json();
                console.log('Initial manga data:', data); // Debugging log
                setMangas(data.manga);
                setCursor(data.nextCursor);
            } catch (error) {
                console.error('Error loading initial manga:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialMangas();
    }, []);

    useEffect(() => {
        if (inView) {
            loadMoreMangas();
        }
    }, [inView, loadMoreMangas]);

    return (
        <div className="container mx-auto px-4 py-8">
    <div className="h-64 mb-8 bg-gray-700 rounded-lg overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
            <img 
                src="t.ly/wGYhs" 
                className="w-full h-full object-cover"
                alt="A windmill in the middle of a grassy landscape at night"
            />
        </div>
    </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mangas.map((manga) => (
                    <Link href={`/manga-chapters/${manga.id}`} key={manga.id} className="block">
                        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden h-full transition-transform duration-300 hover:scale-105">
                            <div className="relative w-full pt-[150%]"> {/* This creates a 2:3 aspect ratio container */}
                                <Image
                                    src={manga.mangacover}
                                    alt={manga.title}
                                    fill
                                    sizes="(max-width: 3640px) 50vw, (max-width: 3768px) 33vw, (max-width: 31024px) 25vw, 20vw"
                                    style={{ objectFit: 'cover' }}
                                    className="rounded-t-lg"
                                    onError={(e) => {
                                        console.error(`Failed to load image for ${manga.title}:`, manga.mangacover);
                                        e.currentTarget.src ="t.ly/JOt-V"; // Replace with your fallback image path
                                    }}
                                />
                            </div>
                            <div className="p-2">
                                <h2 className="text-sm font-semibold text-white truncate">{manga.title}</h2>
                                <p className="text-xs text-gray-400 mt-1 truncate">{manga.categories.join(', ')}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            {cursor !== null && (
                <div ref={ref} className="flex justify-center p-4 mt-8">
                    {isLoading ? (
                        <span className="text-white">Loading more...</span>
                    ) : (
                        <button 
                            onClick={loadMoreMangas} 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                        >
                            Load more
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}