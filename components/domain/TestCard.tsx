import Link from "next/link";
import { Play } from "lucide-react";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";

export type TestLevel = "초급" | "중급" | "고급";
export type TestStatus = "진행 가능" | "마감 임박" | "준비중";

export type TestCardData = {
    id?: number | string;
    title: string;
    category?: string | null;
    level?: string | null;
    duration?: string | number | null;
    problemCount?: number | null;
    participants?: string | number | null;
    status?: string | null;
    href?: string | null;
};

const levelVariant: Record<TestLevel, BadgeVariant> = {
    초급: "green",
    중급: "orange",
    고급: "red"
};

const statusVariant: Record<TestStatus, BadgeVariant> = {
    "진행 가능": "green",
    "마감 임박": "orange",
    준비중: "default"
};

function normalizeLevel(level?: string | null): TestLevel {
    if (!level) return "중급";

    const value = level.trim().toLowerCase();

    if (value === "초급" || value === "easy" || value === "beginner" || value === "bronze") {
        return "초급";
    }

    if (value === "고급" || value === "hard" || value === "advanced" || value === "gold" || value === "platinum") {
        return "고급";
    }

    return "중급";
}

function normalizeStatus(status?: string | null): TestStatus {
    if (!status) return "준비중";

    const value = status.trim().toLowerCase();

    if (
        status === "진행 가능" ||
        value === "available" ||
        value === "open" ||
        value === "active" ||
        value === "ready"
    ) {
        return "진행 가능";
    }

    if (
        status === "마감 임박" ||
        value === "closing" ||
        value === "deadline" ||
        value === "soon"
    ) {
        return "마감 임박";
    }

    return "준비중";
}

function formatDuration(duration?: string | number | null) {
    if (duration === null || duration === undefined || duration === "") {
        return "시간 미정";
    }

    if (typeof duration === "number") {
        return `${duration}분`;
    }

    return duration;
}

function formatParticipants(participants?: string | number | null) {
    if (participants === null || participants === undefined || participants === "") {
        return null;
    }

    if (typeof participants === "number") {
        return `${participants.toLocaleString()}명`;
    }

    return participants;
}

function getTestHref(item: TestCardData) {
    if (item.href) return item.href;
    if (item.id !== undefined && item.id !== null) return `/tests/${item.id}`;
    return "/tests";
}

export default function TestCard({ item }: { item: TestCardData }) {
    const level = normalizeLevel(item.level);
    const status = normalizeStatus(item.status);
    const category = item.category?.trim() || "모의 테스트";
    const duration = formatDuration(item.duration);
    const participants = formatParticipants(item.participants);
    const problemCount = item.problemCount ?? 0;
    const href = getTestHref(item);

    return (
        <Link
            href={href}
            className="group block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap gap-2">
                        <Badge variant="blue">{category}</Badge>
                        <Badge variant={statusVariant[status]}>{status}</Badge>
                        <Badge variant={levelVariant[level]}>{level}</Badge>
                    </div>

                    <h4 className="line-clamp-1 text-lg font-black text-slate-950">
                        {item.title}
                    </h4>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-500 md:grid-cols-3">
                        <span className="rounded-2xl bg-slate-50 px-3 py-2 font-bold">
                            {duration}
                        </span>

                        <span className="rounded-2xl bg-slate-50 px-3 py-2 font-bold">
                            {problemCount.toLocaleString()}문제
                        </span>

                        {participants && (
                            <span className="rounded-2xl bg-slate-50 px-3 py-2 font-bold">
                                {participants}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white transition group-hover:bg-blue-700">
                    <Play className="h-5 w-5 fill-current" />
                </div>
            </div>
        </Link>
    );
}