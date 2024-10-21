import { MangaChapters } from '@/components/app/chapters';
import { Metadata } from 'next';

type Props = {
    params: {
        [x: string]: any; id: string 
}
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // You can fetch manga details here if needed
    return {
        title: `Manga ${params.id} - Chapters`,
    };
}

export default function Page({ params }: Props) {
    // console.log('Manga ID:', params.mangaId); // Debugging log
    return (
        <>
            <MangaChapters mangaId={params.mangaId} />
        </>
    );
}