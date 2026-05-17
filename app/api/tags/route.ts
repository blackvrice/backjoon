import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryKb, formatMemoryLimit, formatTimeLimit, toDifficulty } from "@/lib/api-format";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const problems = await prisma.problem.findMany({ select: { id: true, number: true, title: true, tags: true, difficulty: true, submissions: { select: { status: true } } } });
    const map = new Map<string, { tag: string; count: number; accepted: number; submissions: number; examples: Array<{ id: number; title: string }> }>();
    for (const problem of problems) {
        for (const tag of problem.tags) {
            const current = map.get(tag) ?? { tag, count: 0, accepted: 0, submissions: 0, examples: [] };
            current.count += 1;
            current.accepted += problem.submissions.filter((s) => s.status === "accepted").length;
            current.submissions += problem.submissions.length;
            if (current.examples.length < 3) current.examples.push({ id: problem.number, title: problem.title });
            map.set(tag, current);
        }
    }
    return NextResponse.json({ tags: [...map.values()].sort((a, b) => b.count - a.count) });
}
