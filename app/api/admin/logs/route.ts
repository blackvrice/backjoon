import { NextResponse } from "next/server";
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

function normalizeLevel(status: string) {
    if (["compile", "runtime", "timeLimit", "memory", "wrong"].includes(status)) return "error";
    if (["pending", "judging"].includes(status)) return "warning";
    return "info";
}

export async function GET() {
    const logs = await prisma.adminLog.findMany({
        include: {
            user: true,
        },
        orderBy: {
            updatedAt: "desc",
        },
        take: 200,
    });

    if (logs.length > 0) {
        return NextResponse.json({
            logs: logs.map((log) => ({
                id: log.id,
                level: log.level,
                source: log.source,
                status: log.status,
                title: log.title,
                message: log.message,
                detail: log.detail,
                stack: log.stack ?? undefined,
                requestId: log.requestId ?? undefined,
                user: log.user?.email ?? undefined,
                path: log.path ?? undefined,
                method: log.method ?? undefined,
                worker: log.worker ?? undefined,
                count: log.count,
                firstSeen: log.createdAt.toISOString(),
                firstSeenText: formatDate(log.createdAt),
                lastSeen: log.updatedAt.toISOString(),
                lastSeenText: formatDate(log.updatedAt),
                tags: log.tags,
                relatedHref: log.relatedHref,
                actionHref: log.actionHref ?? undefined,
            })),
        });
    }

    const submissions = await prisma.submission.findMany({
        include: {
            problem: true,
            user: true,
        },
        orderBy: {
            updatedAt: "desc",
        },
        take: 50,
    });

    return NextResponse.json({
        logs: submissions.map((submission) => ({
            id: `submission-${submission.id}`,
            level: normalizeLevel(submission.status),
            source: "judge",
            status: submission.status === "accepted" ? "resolved" : submission.status === "pending" || submission.status === "judging" ? "open" : "investigating",
            title: `${submission.problem.number}번 ${submission.problem.title} 제출 ${submission.status}`,
            message: submission.resultMessage ?? "채점 결과가 아직 없습니다.",
            detail: `제출 ID ${submission.id}, 언어 ${submission.language}, 사용자 ${submission.user?.email ?? "guest"}`,
            requestId: submission.queueJobId ?? `submission-${submission.id}`,
            user: submission.user?.email ?? undefined,
            path: `/admin/submissions?keyword=${submission.id}`,
            method: "GET",
            worker: submission.workerId ?? undefined,
            count: 1,
            firstSeen: submission.createdAt.toISOString(),
            firstSeenText: formatDate(submission.createdAt),
            lastSeen: submission.updatedAt.toISOString(),
            lastSeenText: formatDate(submission.updatedAt),
            tags: ["submission", "judge", submission.language, submission.status],
            relatedHref: `/admin/submissions?keyword=${submission.id}`,
            actionHref: "/admin/submissions",
        })),
    });
}
