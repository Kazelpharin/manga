import { AddChapter } from '@/components/app/add-chapter';
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

export default function AddChapterPage({ params }: { params: { mangaId: string } }) {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4 text-white">Add New Chapter</h1>
            <AddChapter mangaId={params.mangaId} />
        </div>
    );
}