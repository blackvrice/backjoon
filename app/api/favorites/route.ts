import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type DbFavoriteRow = {
    id: string;
    type: string | null;
    title: string | null;
    description: string | null;
    href: string | null;
    solveHref: string | null;
    status: string | null;
    priority: string | null;
    difficulty: string | null;
    problemStatus: string | null;
    progress: number | null;
    score: number | null;
    addedAt: Date | string | null;
    updatedAt: Date | string | null;
    tags: string[] | string | null;
    memo: string | null;
};

const favoriteTypeSet = new Set(["problem", "test", "set", "tag", "note"]);
const favoriteStatusSet = new Set(["active", "review", "done", "paused"]);
const prioritySet = new Set(["low", "medium", "high"]);
const difficultySet = new Set(["Easy", "Medium", "Hard"]);
const problemStatusSet = new Set(["todo", "solved", "wrong", "review"]);

function toIso(value: Date | string | null | undefined) {
    if (!value) return new Date().toISOString();
    if (value instanceof Date) return value.toISOString();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function formatDateText(value: Date | string | null | undefined, withTime = false) {
    const iso = toIso(value);
    const date = new Date(iso);

    const formatted = new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {})
    }).format(date);

    return formatted.replace(/\. /g, ".").replace(/\.$/, "");
}

function normalizeTags(tags: string[] | string | null) {
    if (Array.isArray(tags)) return tags.map(String).filter(Boolean);
    if (typeof tags === "string") {
        return tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
    }
    return [];
}

function normalizeFavorite(row: DbFavoriteRow) {
    const type = row.type && favoriteTypeSet.has(row.type) ? row.type : "problem";
    const status = row.status && favoriteStatusSet.has(row.status) ? row.status : "active";
    const priority = row.priority && prioritySet.has(row.priority) ? row.priority : "medium";
    const difficulty = row.difficulty && difficultySet.has(row.difficulty) ? row.difficulty : undefined;
    const problemStatus = row.problemStatus && problemStatusSet.has(row.problemStatus) ? row.problemStatus : undefined;
    const addedAt = toIso(row.addedAt);
    const updatedAt = toIso(row.updatedAt);

    return {
        id: String(row.id),
        type,
        title: row.title ?? "제목 없음",
        description: row.description ?? "설명이 없습니다.",
        href: row.href ?? "/favorites",
        solveHref: row.solveHref ?? undefined,
        status,
        priority,
        difficulty,
        problemStatus,
        progress: Math.max(0, Math.min(100, Number(row.progress ?? 0))),
        score: row.score ?? undefined,
        addedAt,
        addedAtText: formatDateText(row.addedAt),
        updatedAt,
        updatedAtText: formatDateText(row.updatedAt, true),
        tags: normalizeTags(row.tags),
        memo: row.memo ?? "메모가 없습니다."
    };
}

async function hasFavoriteTable() {
    const result = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'Favorite'
        ) AS exists
    `);

    return Boolean(result[0]?.exists);
}

export async function GET() {
    try {
        const exists = await hasFavoriteTable();

        if (!exists) {
            return NextResponse.json({ favorites: [] });
        }

        const rows = await prisma.$queryRawUnsafe<DbFavoriteRow[]>(`
            SELECT
                "id"::text AS "id",
                "type" AS "type",
                "title" AS "title",
                "description" AS "description",
                "href" AS "href",
                "solveHref" AS "solveHref",
                "status" AS "status",
                "priority" AS "priority",
                "difficulty" AS "difficulty",
                "problemStatus" AS "problemStatus",
                "progress" AS "progress",
                "score" AS "score",
                "addedAt" AS "addedAt",
                "updatedAt" AS "updatedAt",
                "tags" AS "tags",
                "memo" AS "memo"
            FROM "Favorite"
            ORDER BY "updatedAt" DESC
            LIMIT 200
        `);

        return NextResponse.json({
            favorites: rows.map(normalizeFavorite)
        });
    } catch (error) {
        console.error("GET /api/favorites failed", error);

        return NextResponse.json(
            {
                favorites: [],
                error: "즐겨찾기 데이터를 불러오지 못했습니다. Favorite 테이블 구조를 확인하세요."
            },
            { status: 500 }
        );
    }
}
