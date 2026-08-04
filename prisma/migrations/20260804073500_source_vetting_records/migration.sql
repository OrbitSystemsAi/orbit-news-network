ALTER TABLE "FeedSource"
  ADD COLUMN "officialFeedConfirmed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "termsReviewed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "attributionNotes" TEXT,
  ADD COLUMN "editorialNotes" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedByIdentifier" TEXT,
  ADD COLUMN "policyReviewDueAt" TIMESTAMP(3);

CREATE INDEX "FeedSource_status_policyReviewDueAt_idx"
  ON "FeedSource"("status", "policyReviewDueAt");
