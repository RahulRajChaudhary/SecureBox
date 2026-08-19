-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "shareSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Folder_shareSlug_key" ON "Folder"("shareSlug");
