// app/manga/[mangaId]/chapter/[chapterNumber]/page.tsx
import { ChapterViewer } from '@/components/layout/chapter-viewer';
import { Metadata } from 'next';

type Props = {
    params: { mangaId: string; chapterNumber: string }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // You can fetch manga and chapter details here if needed for more specific metadata
    return {
        title: `Chapter ${params.chapterNumber}`,
    };
}

export default function ChapterPage({ params }: Props) {
    return (
        <div className="container mx-auto px-4 py-8">
            <ChapterViewer 
                mangaId={params.mangaId} 
                chapterNumber={parseInt(params.chapterNumber, 10)} 
            />
        </div>
    );
}