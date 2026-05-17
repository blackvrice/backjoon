import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryKb, formatMemoryLimit, formatTimeLimit, toDifficulty } from "@/lib/api-format";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const tests = await prisma.studyTest.findMany({ include: { items: true, attempts: true }, orderBy: { updatedAt: "desc" } });
    return NextResponse.json({
        tests: tests.map((test) => ({
            id: test.slug,
            dbId: test.id,
            title: test.title,
            description: test.description,
            type: test.type,
            status: test.status,
            durationMin: test.durationMin,
            difficulty: test.difficulty,
            problemCount: test.items.length,
            attemptCount: test.attempts.length,
            tags: test.tags,
            updatedAtText: formatDate(test.updatedAt),
            href: `/tests/${test.slug}`,
            solveHref: `/tests/${test.slug}/solve`,
        })),
    });
}
