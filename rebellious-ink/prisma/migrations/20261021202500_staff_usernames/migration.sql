-- Staff sign-in without email: username + scrypt password hash, forced change on first sign-in, lockout counters.
ALTER TABLE "User" ADD COLUMN "username" TEXT,
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "failedLogins" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMPTZ(3);
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
