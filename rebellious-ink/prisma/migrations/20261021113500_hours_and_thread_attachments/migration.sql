-- AlterTable
ALTER TABLE "AvailabilityRule" ADD COLUMN     "acceptsBookings" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsWalkIns" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "label" TEXT;

-- AlterTable
ALTER TABLE "ImageAsset" ADD COLUMN     "messageId" TEXT;

-- AddForeignKey
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
