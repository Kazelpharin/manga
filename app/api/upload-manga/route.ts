import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { prisma } from '@/lib/db';
import { getCurentUser } from '@/lib/session';
import { NextRequest } from 'next/server';
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Adjust the size limit as needed
    },
  },
};

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.PROJECT_ID,
  credentials: {
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY?.split(String.raw`\n`).join('\n'),
  },
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME as string);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getCurentUser();
  console.log(user)
  
  if(!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    
    // Extract manga data
    const title = formData.get('title') as string | null;
    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    const description = formData.get('description') as string | null;
    const categories = JSON.parse(formData.get('categories') as string);
    const chapterTitle = formData.get('chapterTitle') as string | null;
    const authorId = user.id as string;
    const author = user.username as string;

    // Handle cover image upload
    const coverImage = formData.get('coverImage');
    if (!coverImage) {
      return NextResponse.json({ success: false, error: 'Cover image is required' }, { status: 400 });
    }
    const coverImagePath = `manga/${title}/cover.${(coverImage as Blob).type.split('/')[1]}`;
    await uploadFile(coverImage as Blob, coverImagePath);
    
    // Create manga entry
    const manga = await prisma.manga.create({
      data: {
        title,
        description,
        authorId,
        categories,
        mangacover: `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_BUCKET_NAME}/${coverImagePath}`,
        status: 'PENDING',
        author,
      },
    });
    
    // Get the latest chapter number for this manga
    const latestChapter = await prisma.mangaChapter.findFirst({
      where: { mangaId: manga.id },
      orderBy: { number: 'desc' },
    });
    
    const chapterNumber = latestChapter ? latestChapter.number + 1 : 1;
    
    // Handle chapter pages upload
    const chapterPages = formData.getAll('chapterPages') as Blob[];
    const chapterPagePaths = await Promise.all(
      chapterPages.map(async (page: Blob, index: number) => {
        const pagePath = `manga/${manga.id}/chapter${chapterNumber}/page${index + 1}.${page.type.split('/')[1]}`;
        await uploadFile(page, pagePath);
        return `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_BUCKET_NAME}/${pagePath}`;
      })
    );
    
    // Create chapter entry
    const chapter = await prisma.mangaChapter.create({
      data: { 
        number: chapterNumber,
        title: chapterTitle || '',
        pages: chapterPagePaths,
        mangaId: manga.id,
      },
    });
    
    return NextResponse.json({ success: true, manga, chapter });
  } catch (error:any) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function uploadFile(file: Blob, destination: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const blob = bucket.file(destination);
  const blobStream = blob.createWriteStream();
  
  return new Promise<void>((resolve, reject) => {
    blobStream.on('error', (err) => reject(err));
    blobStream.on('finish', () => resolve());
    blobStream.end(buffer);
  });
}