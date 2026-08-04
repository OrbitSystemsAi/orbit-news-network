CREATE TYPE "TaxonomyNodeType" AS ENUM ('CATEGORY', 'SUBCATEGORY', 'TOPIC', 'TAG', 'ENTITY');
CREATE TYPE "TaxonomyNodeStatus" AS ENUM ('ACTIVE', 'DEPRECATED', 'DISABLED');

ALTER TABLE "ContentSubmissionTopic" ADD COLUMN "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1;

CREATE TABLE "TaxonomyNode" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "nodeType" "TaxonomyNodeType" NOT NULL,
  "status" "TaxonomyNodeStatus" NOT NULL DEFAULT 'ACTIVE',
  "description" TEXT,
  "parentId" TEXT,
  "topicId" TEXT,
  "replacedById" TEXT,
  "governanceVersion" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TaxonomyNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaxonomyAlias" (
  "id" TEXT NOT NULL,
  "nodeId" TEXT NOT NULL,
  "alias" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaxonomyAlias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectTaxonomyPermission" (
  "projectId" TEXT NOT NULL,
  "taxonomyNodeId" TEXT NOT NULL,
  "defaultWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "inherited" BOOLEAN NOT NULL DEFAULT false,
  "status" "PlatformStatus" NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT "ProjectTaxonomyPermission_pkey" PRIMARY KEY ("projectId", "taxonomyNodeId")
);

CREATE UNIQUE INDEX "TaxonomyNode_slug_key" ON "TaxonomyNode"("slug");
CREATE UNIQUE INDEX "TaxonomyNode_topicId_key" ON "TaxonomyNode"("topicId");
CREATE INDEX "TaxonomyNode_parentId_status_idx" ON "TaxonomyNode"("parentId", "status");
CREATE INDEX "TaxonomyNode_nodeType_status_idx" ON "TaxonomyNode"("nodeType", "status");
CREATE UNIQUE INDEX "TaxonomyAlias_alias_key" ON "TaxonomyAlias"("alias");
CREATE INDEX "TaxonomyAlias_nodeId_idx" ON "TaxonomyAlias"("nodeId");
CREATE INDEX "ProjectTaxonomyPermission_taxonomyNodeId_status_idx" ON "ProjectTaxonomyPermission"("taxonomyNodeId", "status");

ALTER TABLE "TaxonomyNode" ADD CONSTRAINT "TaxonomyNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TaxonomyNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaxonomyNode" ADD CONSTRAINT "TaxonomyNode_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaxonomyNode" ADD CONSTRAINT "TaxonomyNode_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "TaxonomyNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaxonomyAlias" ADD CONSTRAINT "TaxonomyAlias_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "TaxonomyNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTaxonomyPermission" ADD CONSTRAINT "ProjectTaxonomyPermission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTaxonomyPermission" ADD CONSTRAINT "ProjectTaxonomyPermission_taxonomyNodeId_fkey" FOREIGN KEY ("taxonomyNodeId") REFERENCES "TaxonomyNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
