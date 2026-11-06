-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "evidenceType" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "stage" INTEGER NOT NULL DEFAULT 1;
