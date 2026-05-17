import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryKb, formatMemoryLimit, formatTimeLimit, toDifficulty } from "@/lib/api-format";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const [problems, users, submissions, accepted, recentProblems, recentSubmissions, topUsers, tests, sets] = await Promise.all([
        prisma.problem.count({ where: { status: "published" } }),
        prisma.user.count({ where: { status: "active" } }),
        prisma.submission.count(),
        prisma.submission.count({ where: { status: "accepted" } }),
        prisma.problem.findMany({ orderBy: { recommendedOrder: "asc" }, take: 4 }),
        prisma.submission.findMany({ include: { problem: true, user: true }, orderBy: { createdAt: "desc" }, take: 5 }),
        prisma.user.findMany({ orderBy: [{ score: "desc" }, { solvedCount: "desc" }], take: 5 }),
        prisma.studyTest.findMany({ orderBy: { updatedAt: "desc" }, take: 3 }),
        prisma.problemSet.findMany({ orderBy: { updatedAt: "desc" }, take: 3 }),
    ]);

    return NextResponse.json({
        stats: [
            { label: "공개 문제", value: problems },
            { label: "활성 사용자", value: users },
            { label: "전체 제출", value: submissions },
            { label: "정답률", value: `${acceptedRate(submissions, accepted)}%` },
        ],
        problems: recentProblems.map((problem) => ({
            id: problem.number,
            title: problem.title,
            difficulty: toDifficulty(problem.difficulty),
            category: problem.category,
            href: `/problems/${problem.number}`,
        })),
        submissions: recentSubmissions.map((submission) => ({
            id: submission.id,
            problemId: submission.problem.number,
            problemTitle: submission.problem.title,
            user: submission.user?.handle ?? "guest",
            status: submission.status,
            language: submission.language,
            submittedAtText: formatDate(submission.createdAt),
            href: `/submissions/${submission.id}`,
        })),
        rankings: topUsers.map((user, index) => ({
            rank: index + 1,
            handle: user.handle,
            name: user.name ?? user.handle,
            score: user.score,
            solved: user.solvedCount,
            href: `/profile/${user.handle}`,
        })),
        tests: tests.map((test) => ({ id: test.slug, title: test.title, difficulty: test.difficulty, href: `/tests/${test.slug}` })),
        sets: sets.map((set) => ({ id: set.slug, title: set.title, progress: set.progress, href: `/sets/${set.slug}` })),
    });
}
