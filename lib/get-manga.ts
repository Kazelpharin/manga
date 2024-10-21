import { prisma } from "@/lib/db";

export const getAllManga = async (cursor?: string, limit: number = 50) => {
    try {
        const manga = await prisma.manga.findMany({
            take: limit,
            ...(cursor
                ? {
                      skip: 1, // Skip the cursor
                      cursor: {
                          id: cursor,
                      },
                  }
                : {}),
            select: {
                id: true,
                title: true,
                authorId: true,
                categories: true,
                mangacover: true,
                status: true,
            },
            orderBy: {
                createdAt: 'desc', // Assuming you want the newest manga first
            },
        });

        let nextCursor = null;
        if (manga.length === limit) {
            nextCursor = manga[manga.length - 1].id;
        }

        return {
            manga,
            nextCursor,
        };
    } catch (error) {
        console.error("Error fetching manga:", error);
        return null;
    }
};