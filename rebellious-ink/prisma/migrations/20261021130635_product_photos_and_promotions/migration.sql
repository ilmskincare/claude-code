-- CreateEnum
CREATE TYPE "PromotionScope" AS ENUM ('STUDIO', 'ARTIST');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "imageKey" TEXT;

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "scope" "PromotionScope" NOT NULL,
    "artistId" TEXT,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "code" TEXT,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showOnPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Promotion_scope_isActive_startsAt_endsAt_idx" ON "Promotion"("scope", "isActive", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
