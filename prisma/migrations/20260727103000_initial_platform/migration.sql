-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PlatformStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED');

-- CreateEnum
CREATE TYPE "ProjectEnvironment" AS ENUM ('DEVELOPMENT', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED', 'DISABLED');

-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('RSS', 'ATOM', 'AUTO');

-- CreateEnum
CREATE TYPE "FeedSourceStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'HIDDEN', 'REJECTED');

-- CreateEnum
CREATE TYPE "TopicAssignmentSource" AS ENUM ('FEED_MAPPING', 'KEYWORD_RULE', 'MANUAL');

-- CreateEnum
CREATE TYPE "ProcessingTrigger" AS ENUM ('ON_DEMAND', 'MANUAL', 'SOURCE_TEST');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "NewsInteractionType" AS ENUM ('SHOWN', 'OPENED', 'SAVED', 'DISMISSED', 'USEFUL', 'NOT_RELEVANT');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('RECEIVED', 'VALIDATING', 'PLANNED_REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DistributionLevel" AS ENUM ('PRIVATE', 'PROFILE', 'APPLICATION', 'NETWORK', 'PARTNER', 'PUBLIC');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED');

-- CreateEnum
CREATE TYPE "ContributorStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('ARTICLE', 'ANNOUNCEMENT', 'INSIGHT', 'RESEARCH', 'EVENT', 'PRODUCT_UPDATE', 'ALERT', 'PRESS_RELEASE');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentTopicAssignmentSource" AS ENUM ('SUBMITTED', 'PUBLICATION_DEFAULT', 'RULE_BASED', 'MANUAL');

-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('ELIGIBLE', 'DELIVERED', 'SUPPRESSED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ContentInteractionType" AS ENUM ('SHOWN', 'OPENED', 'SAVED', 'DISMISSED', 'USEFUL', 'NOT_RELEVANT', 'SHARED');

-- CreateEnum
CREATE TYPE "ModerationResult" AS ENUM ('APPROVED', 'REJECTED', 'REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "DecisionSource" AS ENUM ('VALIDATION_RULE', 'CONTENT_RULE', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "ChangedByType" AS ENUM ('PROJECT_API', 'ADMINISTRATOR', 'SYSTEM');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "PlatformStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "environment" "ProjectEnvironment" NOT NULL DEFAULT 'DEVELOPMENT',
    "status" "PlatformStatus" NOT NULL DEFAULT 'ACTIVE',
    "maximumItemsPerRequest" INTEGER NOT NULL DEFAULT 4,
    "minimumRefreshIntervalMinutes" INTEGER NOT NULL DEFAULT 30,
    "publicContentAccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectApiKey" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "environment" "ProjectEnvironment" NOT NULL,
    "prefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "scopes" TEXT[],
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "PlatformStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTopic" (
    "projectId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "defaultWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "status" "PlatformStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "ProjectTopic_pkey" PRIMARY KEY ("projectId","topicId")
);

-- CreateTable
CREATE TABLE "FeedSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "feedUrl" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "feedType" "FeedType" NOT NULL DEFAULT 'AUTO',
    "status" "FeedSourceStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "minimumRefreshIntervalMinutes" INTEGER NOT NULL DEFAULT 30,
    "lastRefreshAttemptedAt" TIMESTAMP(3),
    "lastSuccessfulRefreshAt" TIMESTAMP(3),
    "refreshLockAt" TIMESTAMP(3),
    "consecutiveFailureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedSourceTopic" (
    "feedSourceId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "FeedSourceTopic_pkey" PRIMARY KEY ("feedSourceId","topicId")
);

-- CreateTable
CREATE TABLE "ExternalArticle" (
    "id" TEXT NOT NULL,
    "feedSourceId" TEXT NOT NULL,
    "externalIdentifier" TEXT,
    "canonicalUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT,
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentFingerprint" TEXT NOT NULL,
    "sourceMetadata" JSONB,
    "status" "ArticleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalArticleTopic" (
    "externalArticleId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "assignmentSource" "TopicAssignmentSource" NOT NULL,

    CONSTRAINT "ExternalArticleTopic_pkey" PRIMARY KEY ("externalArticleId","topicId","assignmentSource")
);

-- CreateTable
CREATE TABLE "ProcessingRun" (
    "id" TEXT NOT NULL,
    "triggerType" "ProcessingTrigger" NOT NULL,
    "projectId" TEXT,
    "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "sourcesRequested" INTEGER NOT NULL DEFAULT 0,
    "sourcesProcessed" INTEGER NOT NULL DEFAULT 0,
    "articlesDiscovered" INTEGER NOT NULL DEFAULT 0,
    "articlesAdded" INTEGER NOT NULL DEFAULT 0,
    "duplicatesSkipped" INTEGER NOT NULL DEFAULT 0,
    "articlesExpired" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,

    CONSTRAINT "ProcessingRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingRunSource" (
    "processingRunId" TEXT NOT NULL,
    "feedSourceId" TEXT NOT NULL,
    "status" "ProcessingStatus" NOT NULL,
    "itemsReceived" INTEGER NOT NULL DEFAULT 0,
    "itemsAdded" INTEGER NOT NULL DEFAULT 0,
    "duplicatesSkipped" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "ProcessingRunSource_pkey" PRIMARY KEY ("processingRunId","feedSourceId")
);

-- CreateTable
CREATE TABLE "ApiRequestLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "endpoint" TEXT NOT NULL,
    "httpMethod" TEXT NOT NULL,
    "responseStatus" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "requestId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsInteraction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "externalArticleId" TEXT NOT NULL,
    "interactionType" "NewsInteractionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "PublicationStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultDistributionLevel" "DistributionLevel" NOT NULL DEFAULT 'APPLICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalContributor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "externalContributorId" TEXT NOT NULL,
    "displayName" TEXT,
    "byline" TEXT,
    "profileUrl" TEXT,
    "avatarUrl" TEXT,
    "status" "ContributorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalContributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSubmission" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "contributorId" TEXT,
    "externalContentId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "externalMediaUrl" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" "ContentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "distributionLevel" "DistributionLevel" NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentFingerprint" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionRule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "publicationId" TEXT,
    "name" TEXT NOT NULL,
    "status" "RuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "minimumDistributionLevel" "DistributionLevel" NOT NULL,
    "requiredTopicSlugs" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSubmissionTopic" (
    "contentSubmissionId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "assignmentSource" "ContentTopicAssignmentSource" NOT NULL,

    CONSTRAINT "ContentSubmissionTopic_pkey" PRIMARY KEY ("contentSubmissionId","topicId","assignmentSource")
);

-- CreateTable
CREATE TABLE "ContentCitation" (
    "id" TEXT NOT NULL,
    "contentSubmissionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sourceName" TEXT,
    "citationOrder" INTEGER NOT NULL,

    CONSTRAINT "ContentCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionTarget" (
    "distributionRuleId" TEXT NOT NULL,
    "destinationProjectId" TEXT NOT NULL,
    "status" "RuleStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "DistributionTarget_pkey" PRIMARY KEY ("distributionRuleId","destinationProjectId")
);

-- CreateTable
CREATE TABLE "DistributionDelivery" (
    "id" TEXT NOT NULL,
    "contentSubmissionId" TEXT NOT NULL,
    "destinationProjectId" TEXT NOT NULL,
    "distributionRuleId" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'ELIGIBLE',
    "eligibleAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "firstShownAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentInteraction" (
    "id" TEXT NOT NULL,
    "contentSubmissionId" TEXT NOT NULL,
    "destinationProjectId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "interactionType" "ContentInteractionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationDecision" (
    "id" TEXT NOT NULL,
    "contentSubmissionId" TEXT NOT NULL,
    "decision" "ModerationResult" NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "notes" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decisionSource" "DecisionSource" NOT NULL,

    CONSTRAINT "ModerationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentStatusHistory" (
    "id" TEXT NOT NULL,
    "contentSubmissionId" TEXT NOT NULL,
    "previousStatus" "ContentStatus",
    "newStatus" "ContentStatus" NOT NULL,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedByType" "ChangedByType" NOT NULL,
    "changedByIdentifier" TEXT,

    CONSTRAINT "ContentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentIdempotency" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "contentSubmissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentIdempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Project_organizationId_status_idx" ON "Project"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_slug_key" ON "Project"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectApiKey_prefix_key" ON "ProjectApiKey"("prefix");

-- CreateIndex
CREATE INDEX "ProjectApiKey_projectId_status_idx" ON "ProjectApiKey"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "ProjectTopic_topicId_status_idx" ON "ProjectTopic"("topicId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FeedSource_slug_key" ON "FeedSource"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FeedSource_feedUrl_key" ON "FeedSource"("feedUrl");

-- CreateIndex
CREATE INDEX "FeedSource_status_lastSuccessfulRefreshAt_idx" ON "FeedSource"("status", "lastSuccessfulRefreshAt");

-- CreateIndex
CREATE INDEX "FeedSource_refreshLockAt_idx" ON "FeedSource"("refreshLockAt");

-- CreateIndex
CREATE INDEX "FeedSourceTopic_topicId_idx" ON "FeedSourceTopic"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalArticle_canonicalUrl_key" ON "ExternalArticle"("canonicalUrl");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalArticle_contentFingerprint_key" ON "ExternalArticle"("contentFingerprint");

-- CreateIndex
CREATE INDEX "ExternalArticle_feedSourceId_externalIdentifier_idx" ON "ExternalArticle"("feedSourceId", "externalIdentifier");

-- CreateIndex
CREATE INDEX "ExternalArticle_publishedAt_status_idx" ON "ExternalArticle"("publishedAt", "status");

-- CreateIndex
CREATE INDEX "ExternalArticleTopic_topicId_score_idx" ON "ExternalArticleTopic"("topicId", "score");

-- CreateIndex
CREATE INDEX "ProcessingRun_projectId_startedAt_idx" ON "ProcessingRun"("projectId", "startedAt");

-- CreateIndex
CREATE INDEX "ProcessingRun_status_startedAt_idx" ON "ProcessingRun"("status", "startedAt");

-- CreateIndex
CREATE INDEX "ProcessingRunSource_feedSourceId_idx" ON "ProcessingRunSource"("feedSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiRequestLog_requestId_key" ON "ApiRequestLog"("requestId");

-- CreateIndex
CREATE INDEX "ApiRequestLog_projectId_requestedAt_idx" ON "ApiRequestLog"("projectId", "requestedAt");

-- CreateIndex
CREATE INDEX "ApiRequestLog_requestedAt_idx" ON "ApiRequestLog"("requestedAt");

-- CreateIndex
CREATE INDEX "NewsInteraction_projectId_externalUserId_createdAt_idx" ON "NewsInteraction"("projectId", "externalUserId", "createdAt");

-- CreateIndex
CREATE INDEX "NewsInteraction_externalArticleId_interactionType_idx" ON "NewsInteraction"("externalArticleId", "interactionType");

-- CreateIndex
CREATE INDEX "Publication_projectId_idx" ON "Publication"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Publication_projectId_slug_key" ON "Publication"("projectId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalContributor_projectId_externalContributorId_key" ON "ExternalContributor"("projectId", "externalContributorId");

-- CreateIndex
CREATE INDEX "ContentSubmission_projectId_status_createdAt_idx" ON "ContentSubmission"("projectId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ContentSubmission_publicationId_status_idx" ON "ContentSubmission"("publicationId", "status");

-- CreateIndex
CREATE INDEX "ContentSubmission_contentType_distributionLevel_idx" ON "ContentSubmission"("contentType", "distributionLevel");

-- CreateIndex
CREATE INDEX "ContentSubmission_publishedAt_idx" ON "ContentSubmission"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSubmission_projectId_externalContentId_key" ON "ContentSubmission"("projectId", "externalContentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSubmission_projectId_contentFingerprint_key" ON "ContentSubmission"("projectId", "contentFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSubmission_publicationId_slug_key" ON "ContentSubmission"("publicationId", "slug");

-- CreateIndex
CREATE INDEX "DistributionRule_projectId_status_idx" ON "DistributionRule"("projectId", "status");

-- CreateIndex
CREATE INDEX "DistributionRule_publicationId_idx" ON "DistributionRule"("publicationId");

-- CreateIndex
CREATE INDEX "ContentSubmissionTopic_topicId_weight_idx" ON "ContentSubmissionTopic"("topicId", "weight");

-- CreateIndex
CREATE UNIQUE INDEX "ContentCitation_contentSubmissionId_citationOrder_key" ON "ContentCitation"("contentSubmissionId", "citationOrder");

-- CreateIndex
CREATE INDEX "DistributionTarget_destinationProjectId_status_idx" ON "DistributionTarget"("destinationProjectId", "status");

-- CreateIndex
CREATE INDEX "DistributionDelivery_destinationProjectId_status_eligibleAt_idx" ON "DistributionDelivery"("destinationProjectId", "status", "eligibleAt");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionDelivery_contentSubmissionId_destinationProject_key" ON "DistributionDelivery"("contentSubmissionId", "destinationProjectId");

-- CreateIndex
CREATE INDEX "ContentInteraction_destinationProjectId_externalUserId_crea_idx" ON "ContentInteraction"("destinationProjectId", "externalUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentInteraction_contentSubmissionId_interactionType_idx" ON "ContentInteraction"("contentSubmissionId", "interactionType");

-- CreateIndex
CREATE INDEX "ModerationDecision_contentSubmissionId_decidedAt_idx" ON "ModerationDecision"("contentSubmissionId", "decidedAt");

-- CreateIndex
CREATE INDEX "ContentStatusHistory_contentSubmissionId_changedAt_idx" ON "ContentStatusHistory"("contentSubmissionId", "changedAt");

-- CreateIndex
CREATE INDEX "ContentIdempotency_expiresAt_idx" ON "ContentIdempotency"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentIdempotency_projectId_idempotencyKey_key" ON "ContentIdempotency"("projectId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectApiKey" ADD CONSTRAINT "ProjectApiKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTopic" ADD CONSTRAINT "ProjectTopic_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTopic" ADD CONSTRAINT "ProjectTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedSourceTopic" ADD CONSTRAINT "FeedSourceTopic_feedSourceId_fkey" FOREIGN KEY ("feedSourceId") REFERENCES "FeedSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedSourceTopic" ADD CONSTRAINT "FeedSourceTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalArticle" ADD CONSTRAINT "ExternalArticle_feedSourceId_fkey" FOREIGN KEY ("feedSourceId") REFERENCES "FeedSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalArticleTopic" ADD CONSTRAINT "ExternalArticleTopic_externalArticleId_fkey" FOREIGN KEY ("externalArticleId") REFERENCES "ExternalArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalArticleTopic" ADD CONSTRAINT "ExternalArticleTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingRun" ADD CONSTRAINT "ProcessingRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingRunSource" ADD CONSTRAINT "ProcessingRunSource_processingRunId_fkey" FOREIGN KEY ("processingRunId") REFERENCES "ProcessingRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingRunSource" ADD CONSTRAINT "ProcessingRunSource_feedSourceId_fkey" FOREIGN KEY ("feedSourceId") REFERENCES "FeedSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiRequestLog" ADD CONSTRAINT "ApiRequestLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsInteraction" ADD CONSTRAINT "NewsInteraction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsInteraction" ADD CONSTRAINT "NewsInteraction_externalArticleId_fkey" FOREIGN KEY ("externalArticleId") REFERENCES "ExternalArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalContributor" ADD CONSTRAINT "ExternalContributor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSubmission" ADD CONSTRAINT "ContentSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSubmission" ADD CONSTRAINT "ContentSubmission_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSubmission" ADD CONSTRAINT "ContentSubmission_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "ExternalContributor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionRule" ADD CONSTRAINT "DistributionRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionRule" ADD CONSTRAINT "DistributionRule_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSubmissionTopic" ADD CONSTRAINT "ContentSubmissionTopic_contentSubmissionId_fkey" FOREIGN KEY ("contentSubmissionId") REFERENCES "ContentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSubmissionTopic" ADD CONSTRAINT "ContentSubmissionTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCitation" ADD CONSTRAINT "ContentCitation_contentSubmissionId_fkey" FOREIGN KEY ("contentSubmissionId") REFERENCES "ContentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionTarget" ADD CONSTRAINT "DistributionTarget_distributionRuleId_fkey" FOREIGN KEY ("distributionRuleId") REFERENCES "DistributionRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionTarget" ADD CONSTRAINT "DistributionTarget_destinationProjectId_fkey" FOREIGN KEY ("destinationProjectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionDelivery" ADD CONSTRAINT "DistributionDelivery_contentSubmissionId_fkey" FOREIGN KEY ("contentSubmissionId") REFERENCES "ContentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionDelivery" ADD CONSTRAINT "DistributionDelivery_destinationProjectId_fkey" FOREIGN KEY ("destinationProjectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionDelivery" ADD CONSTRAINT "DistributionDelivery_distributionRuleId_fkey" FOREIGN KEY ("distributionRuleId") REFERENCES "DistributionRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentInteraction" ADD CONSTRAINT "ContentInteraction_contentSubmissionId_fkey" FOREIGN KEY ("contentSubmissionId") REFERENCES "ContentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentInteraction" ADD CONSTRAINT "ContentInteraction_destinationProjectId_fkey" FOREIGN KEY ("destinationProjectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationDecision" ADD CONSTRAINT "ModerationDecision_contentSubmissionId_fkey" FOREIGN KEY ("contentSubmissionId") REFERENCES "ContentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentStatusHistory" ADD CONSTRAINT "ContentStatusHistory_contentSubmissionId_fkey" FOREIGN KEY ("contentSubmissionId") REFERENCES "ContentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentIdempotency" ADD CONSTRAINT "ContentIdempotency_contentSubmissionId_fkey" FOREIGN KEY ("contentSubmissionId") REFERENCES "ContentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
