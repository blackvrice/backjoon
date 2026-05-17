/*
  Warnings:

  - You are about to drop the column `resolvedAt` on the `AdminLog` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the `ImportJob` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[queueJobId]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AdminLog_createdAt_idx";

-- DropIndex
DROP INDEX "AdminLog_level_idx";

-- DropIndex
DROP INDEX "AdminLog_status_idx";

-- DropIndex
DROP INDEX "Problem_source_idx";

-- DropIndex
DROP INDEX "TestCase_isSample_idx";

-- DropIndex
DROP INDEX "TestCase_isVerified_idx";

-- DropIndex
DROP INDEX "User_risk_idx";

-- AlterTable
ALTER TABLE "AdminLog" DROP COLUMN "resolvedAt",
ALTER COLUMN "relatedHref" SET DEFAULT '/admin/logs';

-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "isPublic",
ADD COLUMN     "constraints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "memo" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "recommendedOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "solvedRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "memoryLimitMb" SET DEFAULT 256,
ALTER COLUMN "authorEmail" SET DEFAULT 'admin@local',
ALTER COLUMN "source" SET DEFAULT 'Local',
ALTER COLUMN "status" SET DEFAULT 'published';

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "sourceFile" TEXT NOT NULL DEFAULT 'Main.cpp';

-- AlterTable
ALTER TABLE "TestCase" ADD COLUMN     "explanation" TEXT,
ALTER COLUMN "isHidden" SET DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ALTER COLUMN "verification" SET DEFAULT 'verified';

-- DropTable
DROP TABLE "ImportJob";

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "problemId" INTEGER,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'wrong-answer',
    "status" TEXT NOT NULL DEFAULT 'active',
    "reviewLevel" TEXT NOT NULL DEFAULT 'medium',
    "difficulty" TEXT NOT NULL DEFAULT 'Easy',
    "content" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 2,
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'problems',
    "status" TEXT NOT NULL DEFAULT 'active',
    "period" TEXT NOT NULL DEFAULT 'weekly',
    "priority" INTEGER NOT NULL DEFAULT 2,
    "target" INTEGER NOT NULL DEFAULT 1,
    "current" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT '문제',
    "description" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "problemId" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'problem',
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "difficulty" TEXT NOT NULL DEFAULT 'Easy',
    "priority" INTEGER NOT NULL DEFAULT 2,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "href" TEXT NOT NULL DEFAULT '/',
    "memo" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemSet" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '추천',
    "difficulty" TEXT NOT NULL DEFAULT 'Easy',
    "status" TEXT NOT NULL DEFAULT 'active',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemSetItem" (
    "id" SERIAL NOT NULL,
    "setId" INTEGER NOT NULL,
    "problemId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProblemSetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyTest" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'mock',
    "status" TEXT NOT NULL DEFAULT 'ready',
    "durationMin" INTEGER NOT NULL DEFAULT 120,
    "difficulty" TEXT NOT NULL DEFAULT 'Medium',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyTestProblem" (
    "id" SERIAL NOT NULL,
    "testId" INTEGER NOT NULL,
    "problemId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "StudyTestProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestAttempt" (
    "id" SERIAL NOT NULL,
    "testId" INTEGER NOT NULL,
    "userId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'finished',
    "score" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "solved" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "durationMin" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId");

-- CreateIndex
CREATE INDEX "Note_problemId_idx" ON "Note"("problemId");

-- CreateIndex
CREATE INDEX "Note_status_idx" ON "Note"("status");

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- CreateIndex
CREATE INDEX "Goal_status_idx" ON "Goal"("status");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE INDEX "Favorite_problemId_idx" ON "Favorite"("problemId");

-- CreateIndex
CREATE INDEX "Favorite_type_idx" ON "Favorite"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemSet_slug_key" ON "ProblemSet"("slug");

-- CreateIndex
CREATE INDEX "ProblemSetItem_problemId_idx" ON "ProblemSetItem"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemSetItem_setId_problemId_key" ON "ProblemSetItem"("setId", "problemId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyTest_slug_key" ON "StudyTest"("slug");

-- CreateIndex
CREATE INDEX "StudyTestProblem_problemId_idx" ON "StudyTestProblem"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyTestProblem_testId_problemId_key" ON "StudyTestProblem"("testId", "problemId");

-- CreateIndex
CREATE INDEX "TestAttempt_testId_idx" ON "TestAttempt"("testId");

-- CreateIndex
CREATE INDEX "TestAttempt_userId_idx" ON "TestAttempt"("userId");

-- CreateIndex
CREATE INDEX "AdminLog_level_status_idx" ON "AdminLog"("level", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_queueJobId_key" ON "Submission"("queueJobId");

-- CreateIndex
CREATE INDEX "User_score_idx" ON "User"("score");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemSetItem" ADD CONSTRAINT "ProblemSetItem_setId_fkey" FOREIGN KEY ("setId") REFERENCES "ProblemSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemSetItem" ADD CONSTRAINT "ProblemSetItem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyTestProblem" ADD CONSTRAINT "StudyTestProblem_testId_fkey" FOREIGN KEY ("testId") REFERENCES "StudyTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyTestProblem" ADD CONSTRAINT "StudyTestProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "StudyTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
