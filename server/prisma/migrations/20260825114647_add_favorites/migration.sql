-- AlterTable
ALTER TABLE "File" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "File_ownerId_isFavorite_idx" ON "File"("ownerId", "isFavorite");

-- CreateIndex
CREATE INDEX "Folder_ownerId_isFavorite_idx" ON "Folder"("ownerId", "isFavorite");
