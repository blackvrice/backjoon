import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Difficulty = "Easy" | "Medium" | "Hard";
type ProblemStatus = "todo" | "solved" | "wrong" | "review";
type SubmissionStatus = "pending" | "judging" | "accepted" | "wrong" | "compile" | "runtime" | "timeout" | "memory";

type PrismaAny = typeof prisma & Record<string, any>;

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date = new Date()) {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
}

function startOfWeek(date = new Date()) {
    const value = startOfDay(date);
    const day = value.getDay();
    const diff = day === 0 ? 6 : day - 1;
    value.setDate(value.getDate() - diff);
    return value;
}

function startOfMonth(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatTime(date?: Date | string | null) {
    if (!date) return "-";
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return "-";
    return value.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

function formatDateTime(date?: Date | string | null) {
    if (!date) return "-";
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return "-";
    return value.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

function normalizeDifficulty(value?: string | null): Difficulty {
    const text = String(value ?? "").trim().toLowerCase();

    if (["easy", "bronze", "silver", "초급"].includes(text)) return "Easy";
    if (["hard", "gold", "platinum", "diamond", "ruby", "고급"].includes(text)) return "Hard";
    return "Medium";
}

function normalizeProblemStatus(value?: string | null): ProblemStatus {
    const text = String(value ?? "").trim().toLowerCase();

    if (["solved", "accepted", "ac", "완료"].includes(text)) return "solved";
    if (["wrong", "wa", "틀림", "오답"].includes(text)) return "wrong";
    if (["review", "복습"].includes(text)) return "review";
    return "todo";
}

function normalizeSubmissionStatus(value?: string | null): SubmissionStatus {
    const text = String(value ?? "").trim().toLowerCase();

    if (["accepted", "accept", "ac", "success"].includes(text)) return "accepted";
    if (["wrong", "wrong_answer", "wa"].includes(text)) return "wrong";
    if (["compile", "compile_error", "ce"].includes(text)) return "compile";
    if (["runtime", "runtime_error", "re"].includes(text)) return "runtime";
    if (["timeout", "time_limit", "tle"].includes(text)) return "timeout";
    if (["memory", "memory_limit", "mle"].includes(text)) return "memory";
    if (["judging", "running"].includes(text)) return "judging";
    return "pending";
}

function normalizeLanguage(language?: string | null) {
    const text = String(language ?? "").trim().toLowerCase();

    if (["cpp", "c++", "c++17", "cpp17"].includes(text)) return "C++17";
    if (["python", "python3", "py"].includes(text)) return "Python 3.12";
    if (["java", "java17"].includes(text)) return "Java 17";
    if (["javascript", "js", "node"].includes(text)) return "JavaScript";
    if (["csharp", "cs", "c#"].includes(text)) return "C#";
    if (["dart"].includes(text)) return "Dart";

    return language || "Unknown";
}

function getProblemNumber(problem: any, fallback: number) {
    return Number(problem?.number ?? problem?.bojNumber ?? problem?.id ?? fallback);
}

function getProblemTitle(problem: any) {
    return String(problem?.title ?? problem?.name ?? "제목 없음");
}

function getProblemTags(problem: any) {
    const rawTags = problem?.tags ?? problem?.tagNames ?? problem?.tagList;

    if (Array.isArray(rawTags)) {
        return rawTags
            .map((tag) => typeof tag === "string" ? tag : tag?.name ?? tag?.slug)
            .filter(Boolean)
            .slice(0, 4);
    }

    if (typeof rawTags === "string") {
        return rawTags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 4);
    }

    return [];
}

async function safeCount(model: any, args?: any) {
    if (!model?.count) return 0;

    try {
        return await model.count(args);
    } catch {
        return 0;
    }
}

async function safeFindMany(model: any, args?: any) {
    if (!model?.findMany) return [];

    try {
        return await model.findMany(args);
    } catch {
        return [];
    }
}

async function countSolvedDistinct(db: PrismaAny, from?: Date) {
    if (!db.submission?.findMany) return 0;

    try {
        const rows = await db.submission.findMany({
            where: {
                status: "accepted",
                ...(from ? { createdAt: { gte: from } } : {})
            },
            distinct: ["problemId"],
            select: {
                problemId: true
            }
        });

        return rows.length;
    } catch {
        return safeCount(db.submission, {
            where: {
                status: "accepted",
                ...(from ? { createdAt: { gte: from } } : {})
            }
        });
    }
}

async function getRecentSubmissions(db: PrismaAny) {
    let rows = await safeFindMany(db.submission, {
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { problem: true }
    });

    if (rows.length === 0) {
        rows = await safeFindMany(db.submission, {
            take: 6,
            orderBy: { createdAt: "desc" }
        });
    }

    return rows.map((submission: any) => {
        const problemNumber = getProblemNumber(submission.problem, submission.problemId ?? 0);

        return {
            id: Number(submission.id),
            problemId: problemNumber,
            problemTitle: getProblemTitle(submission.problem),
            status: normalizeSubmissionStatus(submission.status),
            language: normalizeLanguage(submission.language),
            submittedAt: formatTime(submission.createdAt),
            time: typeof submission.executionTimeMs === "number" ? `${submission.executionTimeMs}ms` : "-",
            memory: typeof submission.memoryKb === "number" ? `${submission.memoryKb}KB` : "-"
        };
    });
}

async function getRecommendedProblems(db: PrismaAny) {
    const acceptedRows = await safeFindMany(db.submission, {
        where: { status: "accepted" },
        distinct: ["problemId"],
        select: { problemId: true }
    });

    const solvedIds = acceptedRows.map((row: any) => row.problemId).filter(Boolean);

    let problems = await safeFindMany(db.problem, {
        where: solvedIds.length > 0 ? { id: { notIn: solvedIds } } : undefined,
        take: 3,
        orderBy: [
            { updatedAt: "desc" },
            { id: "asc" }
        ]
    });

    if (problems.length === 0) {
        problems = await safeFindMany(db.problem, {
            take: 3,
            orderBy: { id: "asc" }
        });
    }

    return Promise.all(problems.map(async (problem: any) => {
        const problemId = Number(problem.id);
        const problemNumber = getProblemNumber(problem, problemId);
        const total = await safeCount(db.submission, { where: { problemId } });
        const accepted = await safeCount(db.submission, { where: { problemId, status: "accepted" } });
        const solvedRate = total > 0 ? Math.round((accepted / total) * 1000) / 10 : Number(problem.solvedRate ?? 0);
        const tags = getProblemTags(problem);

        return {
            id: problemNumber,
            title: getProblemTitle(problem),
            difficulty: normalizeDifficulty(problem.difficulty ?? problem.level),
            status: normalizeProblemStatus(problem.status),
            tags: tags.length > 0 ? tags : [String(problem.difficulty ?? "추천")],
            reason: tags.length > 0
                ? `${tags[0]} 유형을 연습하기 좋은 문제입니다.`
                : "아직 해결하지 않은 문제입니다.",
            score: Number(problem.score ?? problem.points ?? 100),
            solvedRate
        };
    }));
}

async function getWeakTags(db: PrismaAny) {
    if (!db.tag?.findMany) return [];

    const tags = await safeFindMany(db.tag, {
        take: 3,
        orderBy: [
            { wrongCount: "desc" },
            { name: "asc" }
        ]
    });

    return tags.map((tag: any) => {
        const accuracy = Number(tag.accuracy ?? tag.acceptanceRate ?? 0);
        const wrongCount = Number(tag.wrongCount ?? 0);
        const reviewCount = Number(tag.reviewCount ?? 0);
        const name = String(tag.name ?? tag.slug ?? "태그");

        return {
            slug: String(tag.slug ?? name.toLowerCase()),
            name,
            accuracy: Math.round(accuracy * 10) / 10,
            wrongCount,
            reviewCount,
            description: String(tag.description ?? `${name} 태그의 오답 기록을 복습하세요.`)
        };
    });
}

async function getUpcomingTests(db: PrismaAny) {
    const model = db.mockTest ?? db.test ?? db.codingTest;
    const tests = await safeFindMany(model, {
        take: 3,
        orderBy: [
            { endAt: "asc" },
            { createdAt: "desc" }
        ]
    });

    return tests.map((test: any) => {
        const rawStatus = String(test.status ?? "scheduled").toLowerCase();
        const status = rawStatus === "review" || rawStatus === "finished"
            ? "review"
            : rawStatus === "open" || rawStatus === "active"
                ? "open"
                : "scheduled";

        return {
            id: String(test.slug ?? test.id),
            title: String(test.title ?? test.name ?? "모의 테스트"),
            status,
            difficulty: normalizeDifficulty(test.difficulty ?? test.level),
            durationMinutes: Number(test.durationMinutes ?? test.duration ?? 120),
            endAtText: formatDateTime(test.endAt ?? test.endsAt ?? test.createdAt),
            progress: Math.max(0, Math.min(100, Number(test.progress ?? 0)))
        };
    });
}

function buildWeeklyActivity(submissions: any[]) {
    const today = startOfDay();
    const days = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date(today.getTime() - (6 - index) * DAY_MS);
        return {
            date,
            key: date.toISOString().slice(0, 10),
            day: ["일", "월", "화", "수", "목", "금", "토"][date.getDay()],
            solvedSet: new Set<number>(),
            submissions: 0,
            minutes: 0
        };
    });

    for (const submission of submissions) {
        const createdAt = new Date(submission.createdAt);
        const key = createdAt.toISOString().slice(0, 10);
        const day = days.find((item) => item.key === key);

        if (!day) continue;

        day.submissions += 1;
        day.minutes += 5;

        if (submission.status === "accepted" && submission.problemId) {
            day.solvedSet.add(Number(submission.problemId));
        }
    }

    return days.map((day) => ({
        day: day.day,
        solved: day.solvedSet.size,
        submissions: day.submissions,
        minutes: day.minutes
    }));
}

function calculateStreak(acceptedRows: any[]) {
    const solvedDates = new Set(
        acceptedRows
            .map((row) => new Date(row.createdAt))
            .filter((date) => !Number.isNaN(date.getTime()))
            .map((date) => date.toISOString().slice(0, 10))
    );

    let streak = 0;
    let cursor = startOfDay();

    while (solvedDates.has(cursor.toISOString().slice(0, 10))) {
        streak += 1;
        cursor = new Date(cursor.getTime() - DAY_MS);
    }

    return streak;
}

function buildTodoItems(args: {
    recentSubmissions: Awaited<ReturnType<typeof getRecentSubmissions>>;
    recommendedProblems: Awaited<ReturnType<typeof getRecommendedProblems>>;
    weakTags: Awaited<ReturnType<typeof getWeakTags>>;
}) {
    const items: any[] = [];
    const wrongSubmission = args.recentSubmissions.find((submission) => submission.status === "wrong" || submission.status === "compile" || submission.status === "runtime");

    if (wrongSubmission) {
        items.push({
            id: `retry-${wrongSubmission.id}`,
            title: `${wrongSubmission.problemTitle} 다시 풀기`,
            description: "최근 오답/실패 제출을 다시 확인하세요.",
            href: `/problems/${wrongSubmission.problemId}/solve`,
            status: "doing",
            priority: "high",
            icon: "rotate"
        });
    }

    if (args.weakTags[0]) {
        items.push({
            id: `weak-${args.weakTags[0].slug}`,
            title: `${args.weakTags[0].name} 태그 복습`,
            description: args.weakTags[0].description,
            href: `/tags/${args.weakTags[0].slug}`,
            status: "todo",
            priority: "medium",
            icon: "hash"
        });
    }

    if (args.recommendedProblems[0]) {
        items.push({
            id: `recommend-${args.recommendedProblems[0].id}`,
            title: `${args.recommendedProblems[0].title} 풀기`,
            description: args.recommendedProblems[0].reason,
            href: `/problems/${args.recommendedProblems[0].id}/solve`,
            status: "todo",
            priority: "medium",
            icon: "book"
        });
    }

    return items.slice(0, 4);
}

export async function GET() {
    const db = prisma as PrismaAny;
    const today = startOfDay();
    const week = startOfWeek();
    const month = startOfMonth();
    const last7Days = new Date(today.getTime() - 6 * DAY_MS);
    const last60Days = new Date(today.getTime() - 60 * DAY_MS);

    try {
        const [
            solvedToday,
            solvedWeek,
            solvedMonth,
            totalSolved,
            submissionsToday,
            acceptedToday,
            totalSubmissions,
            totalAccepted,
            recentSubmissions,
            recommendedProblems,
            weakTags,
            upcomingTests,
            activitySubmissions,
            acceptedRows
        ] = await Promise.all([
            countSolvedDistinct(db, today),
            countSolvedDistinct(db, week),
            countSolvedDistinct(db, month),
            countSolvedDistinct(db),
            safeCount(db.submission, { where: { createdAt: { gte: today } } }),
            safeCount(db.submission, { where: { status: "accepted", createdAt: { gte: today } } }),
            safeCount(db.submission),
            safeCount(db.submission, { where: { status: "accepted" } }),
            getRecentSubmissions(db),
            getRecommendedProblems(db),
            getWeakTags(db),
            getUpcomingTests(db),
            safeFindMany(db.submission, {
                where: { createdAt: { gte: last7Days } },
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    problemId: true,
                    status: true,
                    createdAt: true
                }
            }),
            safeFindMany(db.submission, {
                where: { status: "accepted", createdAt: { gte: last60Days } },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    createdAt: true
                }
            })
        ]);

        const accuracy = totalSubmissions > 0
            ? Math.round((totalAccepted / totalSubmissions) * 1000) / 10
            : 0;

        const score = totalSolved * 10 + solvedWeek * 5;
        const studyMinutesToday = Math.max(submissionsToday * 5, solvedToday * 10);

        const stats = {
            solvedToday,
            solvedWeek,
            solvedMonth,
            totalSolved,
            submissionsToday,
            acceptedToday,
            accuracy,
            streakDays: calculateStreak(acceptedRows),
            rank: totalSolved > 0 ? 1 : 0,
            score,
            targetSolvedWeek: 25,
            targetStudyMinutes: 90,
            studyMinutesToday
        };

        const todoItems = buildTodoItems({
            recentSubmissions,
            recommendedProblems,
            weakTags
        });

        return NextResponse.json({
            stats,
            todoItems,
            recentSubmissions,
            recommendedProblems,
            weakTags,
            weeklyActivity: buildWeeklyActivity(activitySubmissions),
            upcomingTests
        });
    } catch (error) {
        console.error("GET /api/dashboard failed", error);

        return NextResponse.json(
            {
                message: "대시보드 데이터를 조회하지 못했습니다."
            },
            { status: 500 }
        );
    }
}
