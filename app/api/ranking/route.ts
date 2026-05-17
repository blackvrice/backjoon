import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryKb, formatMemoryLimit, formatTimeLimit, toDifficulty } from "@/lib/api-format";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const users = await prisma.user.findMany({ include: { submissions: true }, orderBy: [{ score: "desc" }, { solvedCount: "desc" }], take: 200 });
    return NextResponse.json({
        rankings: users.map((user, index) => {
            const accepted = user.submissions.filter((s) => s.status === "accepted").length;
            return {
                rank: index + 1,
                handle: user.handle,
                name: user.name ?? user.handle,
                role: user.role,
                score: user.score,
                solved: Math.max(user.solvedCount, accepted),
                submissions: user.submissions.length,
                acceptedRate: acceptedRate(user.submissions.length, accepted),
                lastActiveAtText: formatDate(user.lastActiveAt ?? user.updatedAt),
                tags: user.tags,
                href: `/profile/${user.handle}`,
            };
        }),
    });
}
