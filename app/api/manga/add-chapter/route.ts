// app/api/manga/add-chapter/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
const storage = new Storage({
    projectId: process.env.PROJECT_ID,
    credentials: {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY?.split(String.raw`\n`).join('\n'),
    },
  });
const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME || '');

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const mangaId = formData.get('mangaId') as string;
        const number = parseInt(formData.get('number') as string, 10);
        const title = formData.get('title') as string;

        // Upload pages to Google Cloud Storage
        const pageUrls: string[] = [];
        for (let i = 0; formData.get(`page${i}`); i++) {
            const file = formData.get(`page${i}`) as File;
            const fileName = `manga/${mangaId}/chapter${number}/page${i + 1}.${file.type.split('/')[1]}`;
            const fileBuffer = await file.arrayBuffer();
            
            await bucket.file(fileName).save(Buffer.from(fileBuffer));
            
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            pageUrls.push(publicUrl);
        }

        // Create chapter in database
        const chapter = await prisma.mangaChapter.create({
            data: {
                number,
                title,
                pages: pageUrls,
                mangaId,
            },
        });

        return NextResponse.json(chapter);
    } catch (error) {
        console.error('Failed to add chapter:', error);
        return NextResponse.json({ error: 'Failed to add chapter' }, { status: 500 });
    }
}