import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryKb, formatMemoryLimit, formatTimeLimit, toDifficulty } from "@/lib/api-format";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const [problems, users, submissions, accepted, wrong, notes, goals, favorites, tests, sets, logs] = await Promise.all([
        prisma.problem.count(),
        prisma.user.count(),
        prisma.submission.count(),
        prisma.submission.count({ where: { status: "accepted" } }),
        prisma.submission.count({ where: { status: { not: "accepted" } } }),
        prisma.note.count(),
        prisma.goal.count(),
        prisma.favorite.count(),
        prisma.studyTest.count(),
        prisma.problemSet.count(),
        prisma.adminLog.count(),
    ]);
    const languages = await prisma.submission.groupBy({ by: ["language"], _count: { _all: true } });
    const statuses = await prisma.submission.groupBy({ by: ["status"], _count: { _all: true } });
    const difficulties = await prisma.problem.groupBy({ by: ["difficulty"], _count: { _all: true } });
    return NextResponse.json({
        stats: [
            { label: "문제", value: problems },
            { label: "사용자", value: users },
            { label: "제출", value: submissions },
            { label: "정답률", value: `${acceptedRate(submissions, accepted)}%` },
            { label: "오답/오류", value: wrong },
            { label: "노트", value: notes },
            { label: "목표", value: goals },
            { label: "즐겨찾기", value: favorites },
            { label: "테스트", value: tests },
            { label: "세트", value: sets },
            { label: "로그", value: logs },
        ],
        languages: languages.map((item) => ({ name: item.language, count: item._count._all })),
        statuses: statuses.map((item) => ({ name: item.status, count: item._count._all })),
        difficulties: difficulties.map((item) => ({ name: item.difficulty, count: item._count._all })),
    });
}
