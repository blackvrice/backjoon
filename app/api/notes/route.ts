import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/api-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toDifficulty(value: string | null | undefined) {
    if (!value) return "초급";

    const normalized = value.toLowerCase();

    if (normalized === "easy" || normalized === "beginner" || value === "초급") {
        return "초급";
    }

    if (normalized === "medium" || normalized === "intermediate" || value === "중급") {
        return "중급";
    }

    if (normalized === "hard" || normalized === "advanced" || value === "고급") {
        return "고급";
    }

    return value;
}

export async function GET() {
    const notes = await prisma.note.findMany({
        include: {
            user: true,
            problem: true,
        },
        orderBy: [
            { priority: "asc" },
            { updatedAt: "desc" },
        ],
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
            problemDifficulty: note.problem
                ? toDifficulty(note.problem.difficulty)
                : toDifficulty(note.difficulty),
            problemStatus: note.problem ? "todo" : undefined,

            submissionId: null,

            relatedHref: note.problem
                ? `/problems/${note.problem.number}`
                : "/notes",
            solveHref: note.problem
                ? `/problems/${note.problem.number}/solve`
                : undefined,

            tags: note.tags,

            cause: "",
            fix: "",
            learned: note.content || "",
            codeSnippet: undefined,

            createdAt: note.createdAt.toISOString(),
            createdAtText: formatDate(note.createdAt),

            updatedAt: note.updatedAt.toISOString(),
            updatedAtText: formatDate(note.updatedAt),

            nextReviewAt: note.nextReviewAt
                ? note.nextReviewAt.toISOString()
                : null,
            nextReviewAtText: note.nextReviewAt
                ? formatDate(note.nextReviewAt)
                : "미정",

            reviewCount: 0,
            pinned: false,
        })),
    });
}