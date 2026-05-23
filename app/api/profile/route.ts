import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/api-format";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
        include: {
            submissions: { include: { problem: true }, orderBy: { createdAt: "desc" }, take: 10 },
            notes: true,
            goals: true,
            favorites: true,
        },
    });

    if (!user) {
        return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({
        profile: {
            id: user.id,
            handle: user.handle,
            name: user.name ?? user.handle,
            email: user.email,
            role: user.role,
            score: user.score,
            rank: user.rank,
            solved: user.solvedCount,
            tags: user.tags,
            joinedAtText: formatDate(user.createdAt),
            lastActiveAtText: formatDate(user.lastActiveAt ?? user.updatedAt),
        },
        submissions: user.submissions.map((submission) => ({
            id: submission.id,
            problemId: submission.problem.number,
            problemTitle: submission.problem.title,
            status: submission.status,
            language: submission.language,
            submittedAtText: formatDate(submission.createdAt),
            href: `/submissions/${submission.id}`,
        })),
        notes: user.notes.length,
        goals: user.goals.length,
        favorites: user.favorites.length,
    });
}
