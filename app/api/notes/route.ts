import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDate, toDifficulty } from "@/lib/api-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const notes = await prisma.note.findMany({
        include: { user: true, problem: true, submission: true },
        orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
        take: 200,
    });

    return NextResponse.json({
        notes: notes.map((note) => ({
            id: String(note.id),
            title: note.title,
            summary: note.summary || "DB에 저장된 오답노트입니다.",
            type: note.type,
            status: note.status,
            reviewLevel: note.reviewLevel,
            problemId: note.problem?.number,
            problemTitle: note.problem?.title,
            problemDifficulty: note.problem ? toDifficulty(note.problem.difficulty) : undefined,
            problemStatus: note.problem ? "todo" : undefined,
            submissionId: note.submission?.id,
            relatedHref: note.problem ? `/problems/${note.problem.number}` : "/notes",
            solveHref: note.problem ? `/problems/${note.problem.number}/solve` : undefined,
            tags: note.tags,
            cause: note.cause || "",
            fix: note.fix || "",
            learned: note.learned || "",
            codeSnippet: note.codeSnippet || undefined,
            createdAt: note.createdAt.toISOString(),
            createdAtText: formatDate(note.createdAt),
            updatedAt: note.updatedAt.toISOString(),
            updatedAtText: formatDate(note.updatedAt),
            nextReviewAt: note.nextReviewAt.toISOString(),
            nextReviewAtText: formatDate(note.nextReviewAt),
            reviewCount: note.reviewCount,
            pinned: note.pinned,
        })),
    });
}
