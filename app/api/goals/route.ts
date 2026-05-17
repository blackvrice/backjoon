import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/api-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const goals = await prisma.goal.findMany({
        include: { user: true },
        orderBy: [{ status: "asc" }, { deadlineAt: "asc" }],
        take: 200,
    });

    return NextResponse.json({
        goals: goals.map((goal) => ({
            id: String(goal.id),
            title: goal.title,
            description: goal.description || "DB에 저장된 학습 목표입니다.",
            type: goal.type,
            status: goal.status,
            period: goal.period,
            priority: goal.priority,
            current: goal.current,
            target: goal.target,
            unit: goal.unit,

            startAt: goal.startedAt.toISOString(),
            startAtText: formatDate(goal.startedAt),

            dueAt: goal.deadlineAt ? goal.deadlineAt.toISOString() : null,
            dueAtText: goal.deadlineAt ? formatDate(goal.deadlineAt) : "미정",

            createdAt: goal.createdAt.toISOString(),
            createdAtText: formatDate(goal.createdAt),
            updatedAt: goal.updatedAt.toISOString(),
            updatedAtText: formatDate(goal.updatedAt),

            href: "/goals",
            tags: goal.tags,
            memo: "",
        })),
    });
}