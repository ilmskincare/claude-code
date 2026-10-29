-- CreateEnum
CREATE TYPE "PlayStatus" AS ENUM ('RESULT_SHOWN', 'BOOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Play" (
    "id" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "designId" TEXT,
    "result" JSONB,
    "status" "PlayStatus" NOT NULL DEFAULT 'RESULT_SHOWN',
    "requestId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Play_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayAlert" (
    "id" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMPTZ(3),

    CONSTRAINT "PlayAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "game" TEXT,
    "visitorId" TEXT,
    "userId" TEXT,
    "designId" TEXT,
    "playId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Play_game_visitorId_createdAt_idx" ON "Play"("game", "visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "Play_game_userId_createdAt_idx" ON "Play"("game", "userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlayAlert_game_email_key" ON "PlayAlert"("game", "email");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE SET NULL ON UPDATE CASCADE;
