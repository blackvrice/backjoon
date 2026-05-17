import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CountRow = { count: number | bigint | string };
type ExistsRow = { exists: boolean };

type RawTestRow = {
    id: number | string;
    title: string | null;
    category: string | null;
    level: string | null;
    durationMinutes: number | string | null;
    problemCount: number | string | null;
    participants: number | string | null;
    status: string | null;
};

type RawProblemSetRow = {
    id: number | string;
    title: string | null;
    description: string | null;
    level: string | null;
    tags: unknown;
    problemCount: number | string | null;
};

type RawActivityRow = {
    id: number | string;
    status: string | null;
    resultMessage: string | null;
    language: string | null;
    problemTitle: string | null;
    createdAt: Date | string | null;
};

type RawRankingRow = {
    rank?: number | string;
    id: number | string | null;
    handle: string | null;
    name: string | null;
    acceptedCount: number | string;
    score: number | string;
};

const TABLE_NAME_PATTERN = /^[A-Za-z0-9_]+$/;
const COLUMN_NAME_PATTERN = /^[A-Za-z0-9_]+$/;

function assertSafeTableName(tableName: string) {
    if (!TABLE_NAME_PATTERN.test(tableName)) {
        throw new Error(`Unsafe table name: ${tableName}`);
    }
}

function assertSafeColumnName(columnName: string) {
    if (!COLUMN_NAME_PATTERN.test(columnName)) {
        throw new Error(`Unsafe column name: ${columnName}`);
    }
}

async function tableExists(tableName: string) {
    assertSafeTableName(tableName);

    const rows = await prisma.$queryRaw<ExistsRow[]>`
        SELECT to_regclass(${`public."${tableName}"`}) IS NOT NULL AS "exists"
    `;

    return Boolean(rows[0]?.exists);
}

async function columnExists(tableName: string, columnName: string) {
    assertSafeTableName(tableName);
    assertSafeColumnName(columnName);

    const rows = await prisma.$queryRaw<ExistsRow[]>`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = ${tableName}
              AND column_name = ${columnName}
        ) AS "exists"
    `;

    return Boolean(rows[0]?.exists);
}

async function countTable(tableName: string, whereSql = "") {
    assertSafeTableName(tableName);

    const sql = `SELECT COUNT(*)::int AS count FROM "${tableName}" ${whereSql}`;
    const rows = await prisma.$queryRawUnsafe<CountRow[]>(sql);

    return Number(rows[0]?.count ?? 0);
}

async function countIfExists(tableName: string, whereSql = "") {
    if (!(await tableExists(tableName))) return 0;

    return countTable(tableName, whereSql);
}

function formatNumber(value: number) {
    return value.toLocaleString("ko-KR");
}

function normalizeTestLevel(value: string | null): "초급" | "중급" | "고급" {
    const lower = (value ?? "").toLowerCase();

    if (["advanced", "hard", "고급"].includes(lower)) return "고급";
    if (["beginner", "easy", "초급"].includes(lower)) return "초급";

    return "중급";
}

function normalizeSetLevel(value: string | null): "Easy" | "Medium" | "Hard" {
    const lower = (value ?? "").toLowerCase();

    if (["hard", "advanced", "고급"].includes(lower)) return "Hard";
    if (["easy", "beginner", "초급"].includes(lower)) return "Easy";

    return "Medium";
}

function normalizeTestStatus(value: string | null): "진행 가능" | "마감 임박" | "종료" {
    const lower = (value ?? "").toLowerCase();

    if (["closed", "ended", "done", "종료"].includes(lower)) return "종료";
    if (["closing", "soon", "마감 임박"].includes(lower)) return "마감 임박";

    return "진행 가능";
}

function formatRelativeTime(value: Date | string | null) {
    if (!value) return "방금 전";

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "방금 전";
    }

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

    if (diffMinutes < 1) return "방금 전";
    if (diffMinutes < 60) return `${diffMinutes}분 전`;

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) return `${diffHours}시간 전`;

    const diffDays = Math.floor(diffHours / 24);

    return `${diffDays}일 전`;
}

function normalizeTags(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map((item) => String(item)).filter(Boolean);
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value) as unknown;

            if (Array.isArray(parsed)) {
                return parsed.map((item) => String(item)).filter(Boolean);
            }
        } catch {
            return value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }
    }

    return [];
}

async function getTests() {
    const tableName = (await tableExists("MockTest"))
        ? "MockTest"
        : (await tableExists("Test"))
            ? "Test"
            : "";

    if (!tableName) return [];

    assertSafeTableName(tableName);

    const hasCategory = await columnExists(tableName, "category");
    const hasLevel = await columnExists(tableName, "level");
    const hasDifficulty = await columnExists(tableName, "difficulty");
    const hasDurationMinutes = await columnExists(tableName, "durationMinutes");
    const hasProblemCount = await columnExists(tableName, "problemCount");
    const hasParticipants = await columnExists(tableName, "participants");
    const hasStatus = await columnExists(tableName, "status");
    const hasCreatedAt = await columnExists(tableName, "createdAt");

    const categorySql = hasCategory
        ? `COALESCE("category", '모의고사') AS "category"`
        : `'모의고사' AS "category"`;

    const levelSql = hasLevel
        ? `COALESCE("level", '중급') AS "level"`
        : hasDifficulty
            ? `COALESCE("difficulty", '중급') AS "level"`
            : `'중급' AS "level"`;

    const durationSql = hasDurationMinutes
        ? `COALESCE("durationMinutes", 120)::int AS "durationMinutes"`
        : `120::int AS "durationMinutes"`;

    const problemCountSql = hasProblemCount
        ? `COALESCE("problemCount", 0)::int AS "problemCount"`
        : `0::int AS "problemCount"`;

    const participantsSql = hasParticipants
        ? `COALESCE("participants", 0)::int AS "participants"`
        : `0::int AS "participants"`;

    const statusSql = hasStatus
        ? `COALESCE("status", 'open') AS "status"`
        : `'open' AS "status"`;

    const orderSql = hasCreatedAt ? `"createdAt" DESC` : `"id" DESC`;

    const rows = await prisma.$queryRawUnsafe<RawTestRow[]>(`
        SELECT
            "id",
            "title",
            ${categorySql},
            ${levelSql},
            ${durationSql},
            ${problemCountSql},
            ${participantsSql},
            ${statusSql}
        FROM "${tableName}"
        ORDER BY ${orderSql}
        LIMIT 3
    `);

    return rows.map((row) => ({
        title: row.title ?? "이름 없는 테스트",
        category: row.category ?? "모의고사",
        level: normalizeTestLevel(row.level),
        duration: `${Number(row.durationMinutes ?? 0)}분`,
        problemCount: Number(row.problemCount ?? 0),
        participants: `${formatNumber(Number(row.participants ?? 0))}명`,
        status: normalizeTestStatus(row.status),
        href: "/tests"
    }));
}

async function getProblemSets() {
    if (!(await tableExists("ProblemSet"))) return [];

    const hasDescription = await columnExists("ProblemSet", "description");
    const hasLevel = await columnExists("ProblemSet", "level");
    const hasDifficulty = await columnExists("ProblemSet", "difficulty");
    const hasTags = await columnExists("ProblemSet", "tags");
    const hasProblemCount = await columnExists("ProblemSet", "problemCount");
    const hasCreatedAt = await columnExists("ProblemSet", "createdAt");

    const descriptionSql = hasDescription
        ? `COALESCE("description", '') AS "description"`
        : `'' AS "description"`;

    const levelSql = hasDifficulty
        ? `COALESCE("difficulty", 'Medium') AS "level"`
        : hasLevel
            ? `COALESCE("level", 'Medium') AS "level"`
            : `'Medium' AS "level"`;

    const tagsSql = hasTags
        ? `"tags" AS "tags"`
        : `ARRAY[]::text[] AS "tags"`;

    const problemCountSql = hasProblemCount
        ? `COALESCE("problemCount", 0)::int AS "problemCount"`
        : `0::int AS "problemCount"`;

    const orderSql = hasCreatedAt ? `"createdAt" DESC` : `"id" DESC`;

    const rows = await prisma.$queryRawUnsafe<RawProblemSetRow[]>(`
        SELECT
            "id",
            "title",
            ${descriptionSql},
            ${levelSql},
            ${tagsSql},
            ${problemCountSql}
        FROM "ProblemSet"
        ORDER BY ${orderSql}
        LIMIT 3
    `);

    return rows.map((row) => ({
        title: row.title ?? "이름 없는 문제 세트",
        description: row.description ?? "설명이 없습니다.",
        count: Number(row.problemCount ?? 0),
        level: normalizeSetLevel(row.level),
        tags: normalizeTags(row.tags),
        href: `/sets/${row.id}`
    }));
}

async function getRecentActivities() {
    if (!(await tableExists("Submission"))) return [];

    const hasProblem = await tableExists("Problem");

    const rows = hasProblem
        ? await prisma.$queryRaw<RawActivityRow[]>`
            SELECT
                s."id",
                s."status",
                s."resultMessage",
                s."language",
                p."title" AS "problemTitle",
                s."createdAt"
            FROM "Submission" s
            LEFT JOIN "Problem" p ON p."id" = s."problemId"
            ORDER BY s."createdAt" DESC
            LIMIT 5
        `
        : await prisma.$queryRaw<RawActivityRow[]>`
            SELECT
                s."id",
                s."status",
                s."resultMessage",
                s."language",
                NULL AS "problemTitle",
                s."createdAt"
            FROM "Submission" s
            ORDER BY s."createdAt" DESC
            LIMIT 5
        `;

    return rows.map((row) => ({
        title: row.problemTitle ? `${row.problemTitle} 제출` : "제출 기록 생성",
        description:
            row.resultMessage ??
            `${row.language ?? "unknown"} 제출 상태: ${row.status ?? "pending"}`,
        time: formatRelativeTime(row.createdAt),
        iconKey: row.status === "accepted" ? "trophy" : "code"
    }));
}

async function getRankings() {
    const hasSubmission = await tableExists("Submission");
    const hasUser = await tableExists("User");

    if (!hasSubmission || !hasUser) return [];

    const rows = await prisma.$queryRaw<RawRankingRow[]>`
        SELECT
            u."id",
            u."handle",
            u."name",
            COUNT(*) FILTER (WHERE s."status" = 'accepted')::int AS "acceptedCount",
            (COUNT(*) FILTER (WHERE s."status" = 'accepted') * 100)::int AS "score"
        FROM "User" u
        JOIN "Submission" s ON s."userId" = u."id"
        GROUP BY u."id", u."handle", u."name"
        HAVING COUNT(*) FILTER (WHERE s."status" = 'accepted') > 0
        ORDER BY "score" DESC, "acceptedCount" DESC
        LIMIT 4
    `;

    return rows.map((row, index) => {
        const name = row.handle ?? row.name ?? `user_${row.id ?? index + 1}`;

        return {
            rank: index + 1,
            name,
            score: formatNumber(Number(row.score ?? 0)),
            href: row.handle ? `/profile/${row.handle}` : "/ranking"
        };
    });
}

async function getLearningStats() {
    const submissionCount = await countIfExists("Submission");
    const solvedCount = await countIfExists(
        "Submission",
        `WHERE "status" = 'accepted'`
    );

    const acceptanceRate =
        submissionCount > 0 ? Math.round((solvedCount / submissionCount) * 100) : 0;

    let goalProgress = Math.min(100, acceptanceRate);

    if ((await tableExists("Goal")) && (await columnExists("Goal", "progress"))) {
        const rows = await prisma.$queryRaw<CountRow[]>`
            SELECT COALESCE(MAX("progress"), 0)::int AS count
            FROM "Goal"
        `;

        goalProgress = Number(rows[0]?.count ?? goalProgress);
    }

    return {
        goalProgress,
        solvedCount,
        submissionCount,
        acceptanceRate
    };
}

export async function GET() {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const [
            problemCount,
            userCount,
            todaySubmissionCount,
            tests,
            problemSets,
            activities,
            rankings,
            learning
        ] = await Promise.all([
            countIfExists("Problem"),
            countIfExists("User"),
            countIfExists(
                "Submission",
                `WHERE "createdAt" >= '${todayStart.toISOString()}'`
            ),
            getTests(),
            getProblemSets(),
            getRecentActivities(),
            getRankings(),
            getLearningStats()
        ]);

        const recommendedTest = tests[0]
            ? {
                title: tests[0].title,
                problemCount: tests[0].problemCount,
                duration: tests[0].duration,
                level: tests[0].level
            }
            : null;

        return NextResponse.json({
            ok: true,
            stats: [
                {
                    label: "등록 문제",
                    value: formatNumber(problemCount),
                    caption: "DB Problem 테이블 기준",
                    iconKey: "book"
                },
                {
                    label: "진행 테스트",
                    value: formatNumber(tests.length),
                    caption: "현재 응시 가능한 테스트",
                    iconKey: "test"
                },
                {
                    label: "오늘 제출",
                    value: formatNumber(todaySubmissionCount),
                    caption: "오늘 00시 이후 기준",
                    iconKey: "submission"
                },
                {
                    label: "참여자",
                    value: formatNumber(userCount),
                    caption: "DB User 테이블 기준",
                    iconKey: "users"
                }
            ],
            tests,
            problemSets,
            activities,
            rankings,
            learning,
            recommendedTest
        });
    } catch (error) {
        console.error("Failed to load home summary", error);

        return NextResponse.json(
            {
                ok: false,
                message: "메인 대시보드 데이터를 불러오지 못했습니다.",
                stats: [],
                tests: [],
                problemSets: [],
                activities: [],
                rankings: [],
                learning: {
                    goalProgress: 0,
                    solvedCount: 0,
                    submissionCount: 0,
                    acceptanceRate: 0
                },
                recommendedTest: null
            },
            {
                status: 500
            }
        );
    }
}