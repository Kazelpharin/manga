// app/api/manga/[mangaId]/chapters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { mangaId: string } }
) {
    const { mangaId } = params;
    console.log('Fetching chapters for manga:', mangaId);

    try {
        const chapters = await prisma.mangaChapter.findMany({
            where: { mangaId },
            select: {
                id: true,
                number: true,
                title: true,
                createdAt: true,
            },
            orderBy: { number: 'asc' },
        });

        return NextResponse.json({ chapters });
    } catch (error) {
        console.error('Failed to fetch chapters:', error);
        return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
    }
}