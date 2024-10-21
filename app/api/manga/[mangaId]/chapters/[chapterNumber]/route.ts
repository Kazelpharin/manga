// app/api/manga/[mangaId]/chapter/[chapterNumber]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { mangaId: string; chapterNumber: string } }
) {
    const { mangaId, chapterNumber } = params;

    try {
        const chapter = await prisma.mangaChapter.findFirst({
            where: { 
                mangaId,
                number: parseInt(chapterNumber, 10)
            },
            select: {
                id: true,
                number: true,
                title: true,
                pages: true,
            },
        });

        if (!chapter) {
            return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
        }

        return NextResponse.json(chapter);
    } catch (error) {
        console.error('Failed to fetch chapter:', error);
        return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 });
    }
}