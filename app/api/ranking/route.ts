import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate } from "@/lib/api-format";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toTier(score: number) {
    if (score >= 8000) return "Diamond";
    if (score >= 5000) return "Platinum";
    if (score >= 1500) return "Gold";
    if (score >= 500) return "Silver";
    return "Bronze";
}

export async function GET() {
    const currentUser = await getCurrentUser();
    const users = await prisma.user.findMany({
        include: { submissions: true },
        orderBy: [{ score: "desc" }, { solvedCount: "desc" }],
        take: 200,
    });

    return NextResponse.json({
        rankings: users.map((user, index) => {
            const accepted = user.submissions.filter((submission) => submission.status === "accepted").length;
            const submissions = user.submissions.length;
            const solved = Math.max(user.solvedCount, accepted);

            return {
                rank: index + 1,
                handle: user.handle,
                name: user.name ?? user.handle,
                bio: user.memo || `${user.handle}님의 DB 기반 학습 기록입니다.`,
                role: user.role,
                tier: toTier(user.score),
                score: user.score,
                solved,
                submissions,
                accuracy: acceptedRate(submissions, accepted),
                acceptedRate: acceptedRate(submissions, accepted),
                streakDays: 0,
                mainLanguage: user.submissions[0]?.language ?? "C++17",
                favoriteTags: user.tags,
                country: "KR",
                joinedAt: formatDate(user.createdAt),
                weeklySolved: 0,
                monthlySolved: 0,
                lastActiveAt: formatDate(user.lastActiveAt ?? user.updatedAt),
                lastActiveAtText: formatDate(user.lastActiveAt ?? user.updatedAt),
                tags: user.tags,
                href: `/profile/${user.handle}`,
                isCurrentUser: currentUser?.id === user.id,
            };
        }),
    });
}
