import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type DataCategory = "문제" | "제출" | "테스트" | "태그" | "노트" | "백업" | "설정";
type DataStatus = "healthy" | "warning" | "syncing" | "archived";
type DataFormat = "JSON" | "CSV" | "SQLite" | "PostgreSQL" | "ZIP" | "Markdown";

type DataSource = {
    id: string;
    name: string;
    description: string;
    category: DataCategory;
    status: DataStatus;
    format: DataFormat;
    itemCount: number;
    sizeMb: number;
    updatedAt: string;
    updatedAtText: string;
    path: string;
    autoBackup: boolean;
    encrypted: boolean;
    tags: string[];
};

type BackupItem = {
    id: string;
    name: string;
    sizeMb: number;
    createdAtText: string;
    status: "success" | "failed" | "running";
    includes: string[];
};

type ImportJob = {
    id: string;
    title: string;
    source: string;
    status: "ready" | "running" | "done" | "failed";
    progress: number;
    message: string;
};

type TableConfig = {
    id: string;
    table: string;
    name: string;
    description: string;
    category: DataCategory;
    statusWhenEmpty?: DataStatus;
    autoBackup: boolean;
    encrypted: boolean;
    tags: string[];
};

type TableStatsRow = {
    count: number | string | bigint;
    bytes: number | string | bigint;
    updatedAt: Date | string | null;
};

type BackupRow = {
    id: string;
    name: string;
    sizeMb: number | string;
    createdAt: Date | string | null;
    status: string;
    includes: unknown;
};

type ImportJobRow = {
    id: string;
    title: string;
    source: string;
    status: string;
    progress: number | string;
    message: string;
};

const TABLES: TableConfig[] = [
    {
        id: "problems-db",
        table: "Problem",
        name: "문제 데이터베이스",
        description: "문제 본문, 입력/출력 설명, 제한 시간, 메모리, 태그 정보를 저장합니다.",
        category: "문제",
        statusWhenEmpty: "warning",
        autoBackup: true,
        encrypted: false,
        tags: ["problems", "postgresql", "metadata"]
    },
    {
        id: "test-cases-db",
        table: "TestCase",
        name: "테스트 케이스",
        description: "문제별 입력/출력 예제와 hidden test case 데이터를 저장합니다.",
        category: "테스트",
        statusWhenEmpty: "warning",
        autoBackup: true,
        encrypted: false,
        tags: ["testcase", "judge", "io"]
    },
    {
        id: "submissions-db",
        table: "Submission",
        name: "제출 기록",
        description: "사용자 제출, 채점 결과, 실행 시간, 메모리, 코드, 결과 메시지를 저장합니다.",
        category: "제출",
        statusWhenEmpty: "healthy",
        autoBackup: true,
        encrypted: true,
        tags: ["submissions", "judge", "queue"]
    },
    {
        id: "users-db",
        table: "User",
        name: "사용자 데이터",
        description: "사용자 계정, 권한, 상태, 제출 관계 정보를 저장합니다.",
        category: "설정",
        statusWhenEmpty: "warning",
        autoBackup: true,
        encrypted: true,
        tags: ["users", "auth", "profile"]
    },
    {
        id: "tags-db",
        table: "Tag",
        name: "태그 인덱스",
        description: "알고리즘 태그와 태그별 통계 정보를 저장합니다.",
        category: "태그",
        statusWhenEmpty: "warning",
        autoBackup: true,
        encrypted: false,
        tags: ["tags", "index", "recommendation"]
    },
    {
        id: "notes-db",
        table: "Note",
        name: "오답노트",
        description: "오답 원인, 복습 메모, 코드 스니펫, 다시 풀 문제 정보를 저장합니다.",
        category: "노트",
        statusWhenEmpty: "healthy",
        autoBackup: true,
        encrypted: false,
        tags: ["notes", "review", "wrong-answer"]
    },
    {
        id: "favorites-db",
        table: "Favorite",
        name: "즐겨찾기",
        description: "사용자가 북마크한 문제와 복습 대상을 저장합니다.",
        category: "문제",
        statusWhenEmpty: "healthy",
        autoBackup: true,
        encrypted: false,
        tags: ["favorites", "bookmarks"]
    },
    {
        id: "goals-db",
        table: "Goal",
        name: "목표 데이터",
        description: "학습 목표, 진행률, 마감일, 달성 기록을 저장합니다.",
        category: "설정",
        statusWhenEmpty: "healthy",
        autoBackup: true,
        encrypted: false,
        tags: ["goals", "progress"]
    },
    {
        id: "admin-logs-db",
        table: "AdminLog",
        name: "시스템 로그",
        description: "API, 채점, 인증, 데이터 동기화, 관리자 작업 로그를 저장합니다.",
        category: "설정",
        statusWhenEmpty: "healthy",
        autoBackup: true,
        encrypted: true,
        tags: ["logs", "admin", "audit"]
    },
    {
        id: "backups-db",
        table: "DataBackup",
        name: "백업 기록",
        description: "백업 파일명, 크기, 생성 시간, 포함 데이터 범위를 저장합니다.",
        category: "백업",
        statusWhenEmpty: "healthy",
        autoBackup: false,
        encrypted: true,
        tags: ["backup", "archive", "zip"]
    },
    {
        id: "import-jobs-db",
        table: "DataImportJob",
        name: "가져오기 작업",
        description: "문제/제출/태그 가져오기 작업 상태와 진행률을 저장합니다.",
        category: "설정",
        statusWhenEmpty: "healthy",
        autoBackup: true,
        encrypted: false,
        tags: ["import", "sync", "job"]
    }
];

function assertSafeTableName(tableName: string) {
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(tableName)) {
        throw new Error(`Unsafe table name: ${tableName}`);
    }
}

function toNumber(value: number | string | bigint | null | undefined) {
    if (typeof value === "bigint") return Number(value);
    if (typeof value === "string") return Number(value);
    if (typeof value === "number") return value;
    return 0;
}

function toDate(value: Date | string | null | undefined) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateText(value: Date | string | null | undefined) {
    const date = toDate(value);
    if (!date) return "-";

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");

    return `${y}.${m}.${d} ${hh}:${mm}`;
}

function normalizeStatus(status: string): BackupItem["status"] {
    if (status === "failed" || status === "running" || status === "success") return status;
    return "success";
}

function normalizeImportStatus(status: string): ImportJob["status"] {
    if (status === "ready" || status === "running" || status === "done" || status === "failed") return status;
    return "ready";
}

function normalizeIncludes(value: unknown) {
    if (Array.isArray(value)) {
        return value.map(String);
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value) as unknown;
            return Array.isArray(parsed) ? parsed.map(String) : [value];
        } catch {
            return value.split(",").map((item) => item.trim()).filter(Boolean);
        }
    }

    return [];
}

async function readTableStats(tableName: string) {
    assertSafeTableName(tableName);

    try {
        const rows = await prisma.$queryRawUnsafe<TableStatsRow[]>(`
            SELECT
                COUNT(*)::int AS "count",
                pg_total_relation_size('"${tableName}"')::bigint AS "bytes",
                MAX("updatedAt") AS "updatedAt"
            FROM "${tableName}"
        `);

        return rows[0] ?? null;
    } catch {
        return null;
    }
}

async function buildDataSources() {
    const sources: DataSource[] = [];

    for (const config of TABLES) {
        const stats = await readTableStats(config.table);
        if (!stats) continue;

        const itemCount = toNumber(stats.count);
        const bytes = toNumber(stats.bytes);
        const updatedAtDate = toDate(stats.updatedAt);
        const updatedAt = updatedAtDate?.toISOString() ?? new Date(0).toISOString();

        sources.push({
            id: config.id,
            name: config.name,
            description: config.description,
            category: config.category,
            status: itemCount === 0 ? config.statusWhenEmpty ?? "warning" : "healthy",
            format: "PostgreSQL",
            itemCount,
            sizeMb: Math.round((bytes / 1024 / 1024) * 10) / 10,
            updatedAt,
            updatedAtText: formatDateText(updatedAtDate),
            path: `postgres.public."${config.table}"`,
            autoBackup: config.autoBackup,
            encrypted: config.encrypted,
            tags: config.tags
        });
    }

    return sources.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function readBackups(): Promise<BackupItem[]> {
    try {
        const rows = await prisma.$queryRawUnsafe<BackupRow[]>(`
            SELECT
                "id"::text AS "id",
                "name" AS "name",
                "sizeMb"::float8 AS "sizeMb",
                "createdAt" AS "createdAt",
                "status" AS "status",
                "includes" AS "includes"
            FROM "DataBackup"
            ORDER BY "createdAt" DESC
            LIMIT 5
        `);

        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            sizeMb: toNumber(row.sizeMb),
            createdAtText: formatDateText(row.createdAt),
            status: normalizeStatus(row.status),
            includes: normalizeIncludes(row.includes)
        }));
    } catch {
        return [];
    }
}

async function readImportJobs(): Promise<ImportJob[]> {
    try {
        const rows = await prisma.$queryRawUnsafe<ImportJobRow[]>(`
            SELECT
                "id"::text AS "id",
                "title" AS "title",
                "source" AS "source",
                "status" AS "status",
                "progress"::int AS "progress",
                "message" AS "message"
            FROM "DataImportJob"
            ORDER BY "updatedAt" DESC
            LIMIT 5
        `);

        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            source: row.source,
            status: normalizeImportStatus(row.status),
            progress: Math.max(0, Math.min(100, toNumber(row.progress))),
            message: row.message
        }));
    } catch {
        return [];
    }
}

export async function GET() {
    try {
        const [sources, backups, importJobs] = await Promise.all([
            buildDataSources(),
            readBackups(),
            readImportJobs()
        ]);

        return NextResponse.json({
            sources,
            backups,
            importJobs
        });
    } catch (error) {
        console.error("Failed to load data sources", error);
        return NextResponse.json(
            {
                sources: [],
                backups: [],
                importJobs: [],
                error: "데이터 소스 정보를 불러오지 못했습니다."
            },
            { status: 500 }
        );
    }
}
