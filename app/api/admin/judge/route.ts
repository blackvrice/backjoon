import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMemoryKb } from "@/lib/api-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const [queue, recent, counts] = await Promise.all([
        prisma.submission.findMany({ where: { status: { in: ["pending", "judging"] } }, include: { problem: true, user: true }, orderBy: { createdAt: "asc" }, take: 50 }),
        prisma.submission.findMany({ include: { problem: true, user: true }, orderBy: { updatedAt: "desc" }, take: 30 }),
        prisma.submission.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    return NextResponse.json({
        counts: counts.map((item) => ({ status: item.status, count: item._count._all })),
        queue: queue.map((submission) => ({
            id: submission.queueJobId ?? `submission-${submission.id}`,
            submissionId: submission.id,
            problemId: submission.problem.number,
            problemTitle: submission.problem.title,
            user: submission.user?.handle ?? "guest",
            language: submission.language,
            status: submission.status,
            worker: submission.workerId ?? "-",
            createdAtText: formatDate(submission.createdAt),
            href: `/submissions/${submission.id}`,
        })),
        submissions: recent.map((submission) => ({
            id: submission.id,
            problemId: submission.problem.number,
            problemTitle: submission.problem.title,
            user: submission.user?.handle ?? "guest",
            language: submission.language,
            status: submission.status,
            time: submission.executionTimeMs == null ? "-" : `${submission.executionTimeMs}ms`,
            memory: formatMemoryKb(submission.memoryKb),
            updatedAtText: formatDate(submission.updatedAt),
            href: `/submissions/${submission.id}`,
        })),
    });
}
