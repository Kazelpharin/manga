/*
  Warnings:

  - You are about to drop the column `content` on the `MangaChapter` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Manga" ADD COLUMN     "categories" TEXT[],
ADD COLUMN     "mangacover" TEXT;

-- AlterTable
ALTER TABLE "MangaChapter" DROP COLUMN "content",
ADD COLUMN     "chapterCover" TEXT,
ADD COLUMN     "pages" TEXT[];
