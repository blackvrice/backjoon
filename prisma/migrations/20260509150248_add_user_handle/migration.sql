/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Problem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[handle]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Problem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `handle` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "authorEmail" TEXT NOT NULL DEFAULT 'admin@codetest.local',
ADD COLUMN     "category" TEXT NOT NULL DEFAULT '구현',
ADD COLUMN     "note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "reviewMessage" TEXT,
ADD COLUMN     "reviewerEmail" TEXT,
ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'Baekjoon',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "difficulty" SET DEFAULT 'Easy',
ALTER COLUMN "isPublic" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "ip" TEXT NOT NULL DEFAULT '127.0.0.1',
ADD COLUMN     "queueJobId" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testPassed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workerId" TEXT;

-- AlterTable
ALTER TABLE "TestCase" ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "failedRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "favoritesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "handle" TEXT NOT NULL,
ADD COLUMN     "ip" TEXT NOT NULL DEFAULT '127.0.0.1',
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "memo" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "notesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rank" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "repeatedCodeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "risk" TEXT NOT NULL DEFAULT 'low',
ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "solvedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "testsTaken" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verification" TEXT NOT NULL DEFAULT 'unverified';

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "source" TEXT NOT NULL DEFAULT 'system',
    "status" TEXT NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "stack" TEXT,
    "requestId" TEXT,
    "path" TEXT,
    "method" TEXT,
    "worker" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedHref" TEXT NOT NULL DEFAULT '/admin',
    "actionHref" TEXT,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminLog_level_idx" ON "AdminLog"("level");

-- CreateIndex
CREATE INDEX "AdminLog_source_idx" ON "AdminLog"("source");

-- CreateIndex
CREATE INDEX "AdminLog_status_idx" ON "AdminLog"("status");

-- CreateIndex
CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_slug_key" ON "Problem"("slug");

-- CreateIndex
CREATE INDEX "Problem_status_idx" ON "Problem"("status");

-- CreateIndex
CREATE INDEX "Problem_difficulty_idx" ON "Problem"("difficulty");

-- CreateIndex
CREATE INDEX "Problem_source_idx" ON "Problem"("source");

-- CreateIndex
CREATE INDEX "Problem_category_idx" ON "Problem"("category");

-- CreateIndex
CREATE INDEX "Submission_language_idx" ON "Submission"("language");

-- CreateIndex
CREATE INDEX "TestCase_isSample_idx" ON "TestCase"("isSample");

-- CreateIndex
CREATE INDEX "TestCase_isVerified_idx" ON "TestCase"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_risk_idx" ON "User"("risk");

-- AddForeignKey
ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
