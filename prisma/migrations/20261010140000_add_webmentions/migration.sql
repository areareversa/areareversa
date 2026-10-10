-- CreateTable
CREATE TABLE IF NOT EXISTS "webmentions" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "postSlug" TEXT,
    "type" TEXT NOT NULL DEFAULT 'mention',
    "title" TEXT,
    "authorName" TEXT,
    "authorUrl" TEXT,
    "authorPhoto" TEXT,
    "content" TEXT,
    "published" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminReply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webmentions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "webmentions_source_target_key" ON "webmentions"("source", "target");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "webmentions_postSlug_idx" ON "webmentions"("postSlug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "webmentions_status_idx" ON "webmentions"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "webmentions_createdAt_idx" ON "webmentions"("createdAt");