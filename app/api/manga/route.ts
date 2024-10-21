// app/api/manga/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllManga } from '@/lib/get-manga'; // Adjust the import path as necessary

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    
    const result = await getAllManga(cursor ?? undefined);
    
    if (!result) {
        return NextResponse.json({ error: 'Failed to fetch manga' }, { status: 500 });
    }
    
    return NextResponse.json(result);
}
