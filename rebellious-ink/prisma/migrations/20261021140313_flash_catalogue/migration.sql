/*
  Warnings:

  - You are about to drop the `ArtworkRights` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FlashDesign` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DesignCollection" AS ENUM ('CATALOGUE', 'GUMBALL', 'TAROT', 'CLAW', 'DROP', 'ADVENT', 'NEEDLE_TOWN');

-- CreateEnum
CREATE TYPE "DesignStatus" AS ENUM ('AVAILABLE', 'HELD', 'BOOKED', 'RETIRED');

-- CreateEnum
CREATE TYPE "ColourMode" AS ENUM ('BLACK', 'COLOUR');

-- DropForeignKey
ALTER TABLE "ArtworkRights" DROP CONSTRAINT "ArtworkRights_flashId_fkey";

-- DropForeignKey
ALTER TABLE "FlashDesign" DROP CONSTRAINT "FlashDesign_artistId_fkey";

-- AlterTable
ALTER TABLE "BookingRequest" ADD COLUMN     "designId" TEXT,
ADD COLUMN     "designSize" TEXT,
ADD COLUMN     "designTier" TEXT;

-- DropTable
DROP TABLE "ArtworkRights";

-- DropTable
DROP TABLE "FlashDesign";

-- CreateTable
CREATE TABLE "FlashSheet" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlashSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "sheetId" TEXT,
    "hotspotX" DOUBLE PRECISION,
    "hotspotY" DOUBLE PRECISION,
    "hotspotW" DOUBLE PRECISION,
    "hotspotH" DOUBLE PRECISION,
    "theme" TEXT,
    "colourMode" "ColourMode" NOT NULL DEFAULT 'BLACK',
    "collection" "DesignCollection" NOT NULL DEFAULT 'CATALOGUE',
    "priceSmallPence" INTEGER,
    "pricePalmPence" INTEGER,
    "apprenticeAvailable" BOOLEAN NOT NULL DEFAULT false,
    "apprenticeSmallPence" INTEGER,
    "apprenticePalmPence" INTEGER,
    "repeatable" BOOLEAN NOT NULL DEFAULT true,
    "status" "DesignStatus" NOT NULL DEFAULT 'AVAILABLE',
    "heldUntil" TIMESTAMPTZ(3),
    "heldRequestId" TEXT,
    "bookedRequestId" TEXT,
    "editionSize" INTEGER,
    "funLine" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "retiredAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Design_collection_status_idx" ON "Design"("collection", "status");

-- CreateIndex
CREATE INDEX "Design_artistId_status_idx" ON "Design"("artistId", "status");

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashSheet" ADD CONSTRAINT "FlashSheet_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "FlashSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
