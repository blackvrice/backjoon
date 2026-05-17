import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatDate(value?: Date | null) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(value).replace(/\. /g, ".");
}

export async function GET() {
    const users = await prisma.user.findMany({
        include: {
            submissions: {
                select: {
                    status: true,
                    createdAt: true,
                },
            },
        },
        orderBy: {
            updatedAt: "desc",
        },
    });

    return NextResponse.json({
        users: users.map((user) => {
            const submissions = user.submissions.length;
            const accepted = user.submissions.filter((item) => item.status === "accepted").length;
            const wrong = user.submissions.filter((item) => item.status !== "accepted").length;
            const failedRate = submissions > 0 ? Math.round((wrong / submissions) * 100) : user.failedRate;
            const lastSubmissionAt = user.submissions.map((item) => item.createdAt).sort((a, b) => b.getTime() - a.getTime())[0];
            const lastActiveAt = user.lastActiveAt ?? lastSubmissionAt ?? user.updatedAt;

            return {
                id: `usr_${String(user.id).padStart(3, "0")}`,
                dbId: user.id,
                handle: user.handle,
                name: user.name ?? user.handle,
                email: user.email,
                role: user.role,
                status: user.status,
                verification: user.verification,
                risk: user.risk,
                joinedAt: user.createdAt.toISOString(),
                joinedAtText: formatDate(user.createdAt),
                lastActiveAt: lastActiveAt.toISOString(),
                lastActiveAtText: formatDate(lastActiveAt),
                submissions,
                accepted,
                solved: user.solvedCount,
                wrong,
                notes: user.notesCount,
                favorites: user.favoritesCount,
                testsTaken: user.testsTaken,
                score: user.score,
                rank: user.rank,
                repeatedCodeCount: user.repeatedCodeCount,
                failedRate,
                ip: user.ip,
                memo: user.memo,
                tags: user.tags,
            };
        }),
    });
}
