import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { prisma } from '@/lib/db'; // Ensure this path is correct for your project structure
import  { getCurentUser } from '@/lib/session'; // Ensure this path is correct for your project structure
// Initialize Google Cloud Storage
const storage = new Storage({
    projectId: process.env.PROJECT_ID,
    credentials: {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY?.split(String.raw`\n`).join('\n'),
    },
  });

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME as string);

export async function POST(request: { formData: () => any; }) {
    const user = await getCurentUser();
    console.log(user)
    
    if(!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const formData = await request.formData();

    // Extract manga data
    const title = formData.get('title');
    const description = formData.get('description');
    const categories = JSON.parse(formData.get('categories'));
    const chapterTitle = formData.get('chapterTitle');
    const authorId = user.id as string;
    const author = user.name 
    // Handle cover image upload
    const coverImage = formData.get('coverImage');
    const coverImagePath = `manga/${title}/cover.${coverImage.type.split('/')[1]}`;
    await uploadFile(coverImage, coverImagePath);

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
    const chapterPages = formData.getAll('chapterPages');
    const chapterPagePaths = await Promise.all(
      chapterPages.map(async (page: { type: string; }, index: number) => {
        const pagePath = `manga/${manga.id}/chapter${chapterNumber}/page${index + 1}.${page.type.split('/')[1]}`;
        await uploadFile(page, pagePath);
        return `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_BUCKET_NAME}/${pagePath}`;
      })
    );

    // Create chapter entry
    const chapter = await prisma.mangaChapter.create({
      data: {
        number: chapterNumber,
        title: chapterTitle,
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

async function uploadFile(file:any, destination:any) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const blob = bucket.file(destination);
  const blobStream = blob.createWriteStream();

  return new Promise<void>((resolve, reject) => {
    blobStream.on('error', (err) => reject(err));
    blobStream.on('finish', () => resolve());
    blobStream.end(buffer);
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};