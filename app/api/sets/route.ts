import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryKb, formatMemoryLimit, formatTimeLimit, toDifficulty } from "@/lib/api-format";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const sets = await prisma.problemSet.findMany({ include: { items: true }, orderBy: { updatedAt: "desc" } });
    return NextResponse.json({
        sets: sets.map((set) => ({
            id: set.slug,
            dbId: set.id,
            title: set.title,
            description: set.description,
            category: set.category,
            difficulty: set.difficulty,
            status: set.status,
            progress: set.progress,
            problemCount: set.items.length,
            tags: set.tags,
            updatedAtText: formatDate(set.updatedAt),
            href: `/sets/${set.slug}`,
        })),
    });
}
