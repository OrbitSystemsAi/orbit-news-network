ALTER TABLE "FeedSource"
  ADD COLUMN "autoPausedAt" TIMESTAMP(3),
  ADD COLUMN "autoPauseReason" TEXT;
