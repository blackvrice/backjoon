import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryKb, toDifficulty } from "@/lib/api-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> | { id: string } };

function toProblemStatus(status: string | undefined) {
    if (status === "accepted") return "solved";
    if (status === "wrong") return "wrong";
    if (status === "review") return "review";
    return "todo";
}

function toSubmissionStatus(status: string) {
    if (status === "accepted") return "accepted";
    if (status === "wrong") return "wrong";
    if (status === "compile") return "compile";
    if (status === "runtime") return "runtime";
    if (status === "timeLimit") return "timeLimit";
    if (status === "memoryLimit") return "memoryLimit";
    if (status === "pending") return "pending";
    if (status === "judging") return "judging";
    return "pending";
}

function gradeFromRate(rate: number) {
    if (rate >= 95) return "S";
    if (rate >= 85) return "A";
    if (rate >= 70) return "B";
    if (rate >= 50) return "C";
    return "D";
}

export async function GET(request: NextRequest, context: Context) {
    const { id } = await Promise.resolve(context.params);
    const attemptId = Number(request.nextUrl.searchParams.get("attempt") ?? "0");
    const numeric = Number(id);
    const test = await prisma.studyTest.findFirst({
        where: Number.isFinite(numeric) ? { OR: [{ id: numeric }, { slug: id }] } : { slug: id },
        include: {
            items: {
                include: {
                    problem: {
                        include: {
                            submissions: { orderBy: { createdAt: "desc" }, take: 20 },
                        },
                    },
                },
                orderBy: { order: "asc" },
            },
            attempts: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 50 },
        },
    });

    if (!test) {
        return NextResponse.json({ message: "테스트를 찾을 수 없습니다." }, { status: 404 });
    }

    const attempt = attemptId > 0
        ? await prisma.testAttempt.findUnique({ where: { id: attemptId }, include: { user: true } })
        : test.attempts[0] ?? null;
    const totalScore = test.items.reduce((sum, item) => sum + item.score, 0);

    const problems = test.items.map((item) => {
        const latestSubmission = item.problem.submissions[0];
        const accepted = item.problem.submissions.filter((submission) => submission.status === "accepted").length;
        const submissions = item.problem.submissions.length;
        const status = toProblemStatus(latestSubmission?.status);
        const earned = status === "solved" ? item.score : 0;

        return {
            id: item.problem.number,
            order: item.order,
            title: item.problem.title,
            difficulty: toDifficulty(item.problem.difficulty),
            status,
            points: item.score,
            earned,
            attempts: submissions,
            solvedRate: acceptedRate(submissions, accepted) || item.problem.solvedRate,
            timeSpentMinutes: 0,
            tags: item.problem.tags,
            note: item.problem.note || item.problem.memo || "",
            lastSubmissionId: latestSubmission?.id,
            href: `/problems/${item.problem.number}`,
        };
    });

    const myScore = attempt?.score ?? problems.reduce((sum, problem) => sum + problem.earned, 0);
    const scoreRate = Math.round((myScore / Math.max(totalScore, 1)) * 100);
    const allSubmissions = test.items.flatMap((item) =>
        item.problem.submissions.map((submission) => ({
            id: submission.id,
            problemId: item.problem.number,
            problemTitle: item.problem.title,
            status: toSubmissionStatus(submission.status),
            language: submission.language,
            time: submission.executionTimeMs == null ? "-" : `${submission.executionTimeMs}ms`,
            memory: formatMemoryKb(submission.memoryKb),
            submittedAt: formatDate(submission.createdAt),
            codeLength: `${submission.code.length.toLocaleString()}자`,
        })),
    );
    const weakTags = problems
        .filter((problem) => problem.status !== "solved")
        .flatMap((problem) => problem.tags.map((tag) => ({ tag, problem })))
        .slice(0, 5)
        .map(({ tag, problem }) => ({
            tag,
            accuracy: Math.round(problem.solvedRate),
            wrongCount: problem.status === "wrong" ? 1 : 0,
            reviewCount: problem.status === "review" ? 1 : 0,
            description: `${problem.title} 복습이 필요합니다.`,
            href: `/tags/${encodeURIComponent(tag)}`,
        }));

    return NextResponse.json({
        test: { id: test.slug, title: test.title, totalScore },
        attempt: attempt ? {
            id: attempt.id,
            user: attempt.user?.handle ?? "guest",
            status: attempt.status,
            score: attempt.score,
            totalScore: attempt.totalScore,
            solved: attempt.solved,
            total: attempt.total,
            durationMin: attempt.durationMin,
            summary: attempt.summary,
            createdAtText: formatDate(attempt.createdAt),
        } : null,
        result: {
            id: test.slug,
            title: test.title,
            description: test.description,
            totalScore,
            myScore,
            averageScore: test.attempts.length
                ? Math.round(test.attempts.reduce((sum, row) => sum + row.score, 0) / test.attempts.length)
                : myScore,
            topScore: test.attempts.length ? Math.max(...test.attempts.map((row) => row.score)) : myScore,
            rank: 1,
            participants: test.attempts.length,
            grade: gradeFromRate(scoreRate),
            durationMinutes: test.durationMin,
            timeSpentMinutes: attempt?.durationMin ?? 0,
            startedAtText: formatDate(test.createdAt),
            submittedAtText: attempt ? formatDate(attempt.createdAt) : "-",
            tags: test.tags,
            problems,
            submissions: allSubmissions,
            weakTags,
            recommendations: [
                {
                    title: "오답 문제 복습",
                    description: "DB 제출 결과 기준으로 틀린 문제를 다시 풀어보세요.",
                    href: problems.find((problem) => problem.status !== "solved")
                        ? `/problems/${problems.find((problem) => problem.status !== "solved")?.id}/solve`
                        : `/tests/${test.slug}/solve`,
                    icon: "RotateCcw",
                },
            ],
        },
        problems,
    });
}
