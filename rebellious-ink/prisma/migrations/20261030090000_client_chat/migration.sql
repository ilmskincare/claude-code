-- AlterEnum
ALTER TYPE "ChatChannelKind" ADD VALUE IF NOT EXISTS 'CLIENT';
-- AlterTable
ALTER TABLE "ChatChannel" ADD COLUMN "artistProfileId" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN "attachments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
