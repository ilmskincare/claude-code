-- CreateEnum
CREATE TYPE "SkillStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'COMPETENT', 'RENEWAL_DUE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LedgerAccount" ADD VALUE 'ARTIST_RECEIVABLE';
ALTER TYPE "LedgerAccount" ADD VALUE 'STOCK_SALES';
ALTER TYPE "LedgerAccount" ADD VALUE 'INVENTORY';

-- AlterEnum
ALTER TYPE "PractitionerKind" ADD VALUE 'JUNIOR_ARTIST';

-- AlterTable
ALTER TABLE "CompensationModel" ADD COLUMN     "suppliesIncluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suppliesNote" TEXT;

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "artistId" TEXT,
ADD COLUMN     "ledgerGroupId" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "unitPricePence" INTEGER;

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isCore" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillProgress" (
    "id" TEXT NOT NULL,
    "apprenticeId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "status" "SkillStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "apprenticeNote" TEXT,
    "mentorNote" TEXT,
    "signedOffById" TEXT,
    "signedOffAt" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SkillProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeLog" (
    "id" TEXT NOT NULL,
    "apprenticeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "minutes" INTEGER NOT NULL,
    "activity" TEXT NOT NULL,
    "notes" TEXT,
    "supervisorId" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMPTZ(3),
    "rejectedNote" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprenticeEvidence" (
    "id" TEXT NOT NULL,
    "apprenticeId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "skillId" TEXT,
    "caption" TEXT,
    "stage" TEXT,
    "mentorComment" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprenticeEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JuniorArtistSignoff" (
    "id" TEXT NOT NULL,
    "apprenticeId" TEXT NOT NULL,
    "signedOffById" TEXT NOT NULL,
    "verifiedMinutes" INTEGER NOT NULL,
    "skillsSnapshot" JSONB NOT NULL,
    "conditions" TEXT,
    "statement" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JuniorArtistSignoff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skill_key_key" ON "Skill"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SkillProgress_apprenticeId_skillId_key" ON "SkillProgress"("apprenticeId", "skillId");

-- CreateIndex
CREATE INDEX "PracticeLog_apprenticeId_date_idx" ON "PracticeLog"("apprenticeId", "date");

-- CreateIndex
CREATE INDEX "ApprenticeEvidence_apprenticeId_createdAt_idx" ON "ApprenticeEvidence"("apprenticeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JuniorArtistSignoff_apprenticeId_key" ON "JuniorArtistSignoff"("apprenticeId");

-- CreateIndex
CREATE INDEX "StockMovement_artistId_createdAt_idx" ON "StockMovement"("artistId", "createdAt");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "ArtistProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillProgress" ADD CONSTRAINT "SkillProgress_apprenticeId_fkey" FOREIGN KEY ("apprenticeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillProgress" ADD CONSTRAINT "SkillProgress_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillProgress" ADD CONSTRAINT "SkillProgress_signedOffById_fkey" FOREIGN KEY ("signedOffById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeLog" ADD CONSTRAINT "PracticeLog_apprenticeId_fkey" FOREIGN KEY ("apprenticeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeLog" ADD CONSTRAINT "PracticeLog_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "ArtistProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeLog" ADD CONSTRAINT "PracticeLog_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprenticeEvidence" ADD CONSTRAINT "ApprenticeEvidence_apprenticeId_fkey" FOREIGN KEY ("apprenticeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprenticeEvidence" ADD CONSTRAINT "ApprenticeEvidence_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "ImageAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprenticeEvidence" ADD CONSTRAINT "ApprenticeEvidence_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JuniorArtistSignoff" ADD CONSTRAINT "JuniorArtistSignoff_apprenticeId_fkey" FOREIGN KEY ("apprenticeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JuniorArtistSignoff" ADD CONSTRAINT "JuniorArtistSignoff_signedOffById_fkey" FOREIGN KEY ("signedOffById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
