import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatDate(value?: Date | null) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(value).replace(/\. /g, ".");
}

function toDifficulty(value?: string | null) {
    if (value === "Hard" || value === "Medium" || value === "Easy") return value;
    return "Easy";
}

function codePreview(code: string) {
    return code.split(/\r?\n/).slice(0, 5).join("\n");
}

export async function GET(request: NextRequest) {
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 200), 500);

    const submissions = await prisma.submission.findMany({
        include: {
            problem: true,
            user: true,
        },
        orderBy: {
            createdAt: "desc",
        },
        take: limit,
    });

    return NextResponse.json({
        submissions: submissions.map((submission) => ({
            id: submission.id,
            problemId: submission.problem.number,
            problemTitle: submission.problem.title,
            difficulty: toDifficulty(submission.problem.difficulty),
            user: submission.user?.email ?? "guest@local",
            handle: submission.user?.handle ?? "guest",
            status: submission.status,
            language: submission.language,
            timeMs: submission.executionTimeMs ?? undefined,
            memoryKb: submission.memoryKb ?? undefined,
            codeLength: submission.code.length,
            submittedAt: submission.createdAt.toISOString(),
            submittedAtText: formatDate(submission.createdAt),
            judgedAt: submission.judgedAt?.toISOString(),
            judgedAtText: formatDate(submission.judgedAt),
            worker: submission.workerId ?? undefined,
            queueJobId: submission.queueJobId ?? undefined,
            retryCount: submission.retryCount,
            score: submission.status === "accepted" ? submission.problem.score : 0,
            testPassed: submission.testPassed,
            testTotal: submission.testTotal,
            ip: submission.ip,
            message: submission.resultMessage ?? "결과 메시지가 없습니다.",
            codePreview: codePreview(submission.code),
            tags: submission.problem.tags,
        })),
    });
}
