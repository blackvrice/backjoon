"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import AppShell from "@/components/layout/AppShell";
import {
    AppButton,
    AppLinkButton,
    Badge,
    Card,
    EmptyState,
    MiniStat,
    Notice,
    PageHero,
    ProgressBar,
    SidePanel,
    StatCard
} from "@/components/ui";
import {
    FilterPanel,
    FilterSelect,
    SearchInput
} from "@/components/forms";
import {
    ListHeader,
    ViewModeToggle,
    type ViewMode
} from "@/components/common";
import {
    DifficultyBadge,
    ProblemStatusBadge,
    type Difficulty,
    type ProblemStatus
} from "@/components/domain";
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    Bookmark,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Flame,
    FolderHeart,
    Gauge,
    Hash,
    Heart,
    History,
    Layers3,
    NotebookPen,
    Play,
    RotateCcw,
    Search,
    Terminal,
    Trash2,
    Zap
} from "lucide-react";

type FavoriteType = "problem" | "test" | "set" | "tag" | "note";
type FavoriteTypeFilter = "전체" | "문제" | "테스트" | "세트" | "태그" | "노트";
type FavoriteStatus = "active" | "review" | "done" | "paused";
type FavoriteStatusFilter = "전체" | "학습 중" | "복습" | "완료" | "보류";
type SortOption = "recent" | "priority" | "title" | "difficulty" | "progress" | "created";
type Priority = "low" | "medium" | "high";
type DifficultyFilter = "전체" | Difficulty;

type FavoriteItem = {
    id: string;
    type: FavoriteType;
    title: string;
    description: string;
    href: string;
    solveHref?: string;
    status: FavoriteStatus;
    priority: Priority;
    difficulty?: Difficulty;
    problemStatus?: ProblemStatus;
    progress: number;
    score?: number;
    addedAt: string;
    addedAtText: string;
    updatedAt: string;
    updatedAtText: string;
    tags: string[];
    memo: string;
};

const TYPE_OPTIONS: readonly FavoriteTypeFilter[] = ["전체", "문제", "테스트", "세트", "태그", "노트"];
const STATUS_OPTIONS: readonly FavoriteStatusFilter[] = ["전체", "학습 중", "복습", "완료", "보류"];
const DIFFICULTY_OPTIONS: readonly DifficultyFilter[] = ["전체", "Easy", "Medium", "Hard"];
const SORT_OPTIONS: readonly SortOption[] = ["recent", "priority", "title", "difficulty", "progress", "created"];

const typeLabelToValue: Record<Exclude<FavoriteTypeFilter, "전체">, FavoriteType> = {
    문제: "problem",
    테스트: "test",
    세트: "set",
    태그: "tag",
    노트: "note"
};

const statusLabelToValue: Record<Exclude<FavoriteStatusFilter, "전체">, FavoriteStatus> = {
    "학습 중": "active",
    복습: "review",
    완료: "done",
    보류: "paused"
};

const sortLabels: Record<SortOption, string> = {
    recent: "최근 업데이트순",
    priority: "우선순위순",
    title: "이름순",
    difficulty: "난이도순",
    progress: "진행률 높은순",
    created: "추가한 순"
};

const typeMeta: Record<FavoriteType, { label: string; variant: "default" | "blue" | "green" | "orange" | "purple"; icon: ComponentType<{ className?: string }> }> = {
    problem: { label: "문제", variant: "blue", icon: BookOpen },
    test: { label: "테스트", variant: "orange", icon: Terminal },
    set: { label: "세트", variant: "green", icon: Layers3 },
    tag: { label: "태그", variant: "purple", icon: Hash },
    note: { label: "노트", variant: "default", icon: NotebookPen }
};

const statusMeta: Record<FavoriteStatus, { label: string; variant: "default" | "blue" | "green" | "orange"; icon: ComponentType<{ className?: string }> }> = {
    active: { label: "학습 중", variant: "blue", icon: Play },
    review: { label: "복습", variant: "orange", icon: RotateCcw },
    done: { label: "완료", variant: "green", icon: CheckCircle2 },
    paused: { label: "보류", variant: "default", icon: Clock3 }
};

const priorityMeta: Record<Priority, { label: string; variant: "default" | "orange" | "red"; order: number }> = {
    high: { label: "중요", variant: "red", order: 1 },
    medium: { label: "보통", variant: "orange", order: 2 },
    low: { label: "낮음", variant: "default", order: 3 }
};

const difficultyOrder: Record<Difficulty, number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3
};

function isFavoriteType(value: unknown): value is FavoriteType {
    return value === "problem" || value === "test" || value === "set" || value === "tag" || value === "note";
}

function isFavoriteStatus(value: unknown): value is FavoriteStatus {
    return value === "active" || value === "review" || value === "done" || value === "paused";
}

function isPriority(value: unknown): value is Priority {
    return value === "low" || value === "medium" || value === "high";
}

function isDifficulty(value: unknown): value is Difficulty {
    return value === "Easy" || value === "Medium" || value === "Hard";
}

function normalizeTags(tags: unknown): string[] {
    if (Array.isArray(tags)) return tags.map(String).filter(Boolean);
    if (typeof tags === "string") {
        return tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
    }
    return [];
}

function normalizeFavorites(items: unknown[]): FavoriteItem[] {
    return items.map((raw, index) => {
        const item = raw as Partial<FavoriteItem>;
        const id = item.id ? String(item.id) : `favorite-${index}`;
        const type = isFavoriteType(item.type) ? item.type : "problem";
        const status = isFavoriteStatus(item.status) ? item.status : "active";
        const priority = isPriority(item.priority) ? item.priority : "medium";
        const difficulty = isDifficulty(item.difficulty) ? item.difficulty : undefined;
        const progress = Number.isFinite(Number(item.progress)) ? Math.max(0, Math.min(100, Number(item.progress))) : 0;
        const addedAt = item.addedAt ? String(item.addedAt) : new Date().toISOString();
        const updatedAt = item.updatedAt ? String(item.updatedAt) : addedAt;

        return {
            id,
            type,
            title: item.title?.trim() || "제목 없음",
            description: item.description?.trim() || "설명이 없습니다.",
            href: item.href?.trim() || "/favorites",
            solveHref: item.solveHref?.trim() || undefined,
            status,
            priority,
            difficulty,
            problemStatus: item.problemStatus,
            progress,
            score: item.score === undefined || item.score === null ? undefined : Number(item.score),
            addedAt,
            addedAtText: item.addedAtText?.trim() || addedAt.slice(0, 10).replaceAll("-", "."),
            updatedAt,
            updatedAtText: item.updatedAtText?.trim() || updatedAt.slice(0, 16).replace("T", " ").replaceAll("-", "."),
            tags: normalizeTags(item.tags),
            memo: item.memo?.trim() || "메모가 없습니다."
        };
    });
}

function FavoriteTypeBadge({ type }: { type: FavoriteType }) {
    const meta = typeMeta[type];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function FavoriteStatusBadge({ status }: { status: FavoriteStatus }) {
    const meta = statusMeta[status];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function FavoriteCard({ item }: { item: FavoriteItem }) {
    const Icon = typeMeta[item.type].icon;
    const priority = priorityMeta[item.priority];

    return (
        <Card hover className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <FavoriteTypeBadge type={item.type} />
                        <FavoriteStatusBadge status={item.status} />
                        <Badge variant={priority.variant}>{priority.label}</Badge>
                        {item.difficulty && <DifficultyBadge value={item.difficulty} />}
                        {item.problemStatus && <ProblemStatusBadge value={item.problemStatus} />}
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <Link href={item.href} className="text-xl font-black tracking-tight text-slate-950 transition hover:text-blue-600">
                                {item.title}
                            </Link>
                            <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-500">{item.description}</p>
                        </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600">
                        <span className="font-black text-slate-950">메모:</span> {item.memo}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {item.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>)}
                    </div>
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[360px]">
                    <MetricBox label="진행률" value={`${item.progress}%`} />
                    <MetricBox label="점수" value={item.score ? `${item.score}` : "-"} />
                    <MetricBox label="추가" value={item.addedAtText} />
                    <MetricBox label="업데이트" value={item.updatedAtText.split(" ")[0]} />
                </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm font-black">
                    <span className="text-slate-600">학습 진행률</span>
                    <span className="text-blue-600">{item.progress}%</span>
                </div>
                <ProgressBar value={item.progress} barClassName={item.progress >= 80 ? "bg-emerald-600" : item.progress >= 40 ? "bg-blue-600" : "bg-orange-500"} />
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                    즐겨찾기 추가 {item.addedAtText}
                </div>
                <div className="flex flex-wrap gap-2">
                    <AppButton variant="secondary" icon={Trash2}>해제</AppButton>
                    <AppLinkButton href={item.href} variant="secondary" iconRight={ChevronRight}>상세</AppLinkButton>
                    {item.solveHref && <AppLinkButton href={item.solveHref} variant="primary" iconRight={ArrowRight}>이어가기</AppLinkButton>}
                </div>
            </div>
        </Card>
    );
}

function MetricBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400">{label}</p>
            <p className="mt-1 font-black text-slate-950">{value}</p>
        </div>
    );
}

function FavoritesTable({ items }: { items: FavoriteItem[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">이름</th>
                        <th className="px-5 py-4">유형</th>
                        <th className="px-5 py-4">상태</th>
                        <th className="px-5 py-4">우선순위</th>
                        <th className="px-5 py-4">난이도</th>
                        <th className="px-5 py-4 text-right">진행률</th>
                        <th className="px-5 py-4 text-right">점수</th>
                        <th className="px-5 py-4">태그</th>
                        <th className="px-5 py-4">업데이트</th>
                        <th className="px-5 py-4" />
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {items.map((item) => {
                        const priority = priorityMeta[item.priority];

                        return (
                            <tr key={item.id} className="transition hover:bg-slate-50">
                                <td className="px-5 py-4">
                                    <Link href={item.href} className="font-black text-slate-950 transition hover:text-blue-600">{item.title}</Link>
                                    <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-400">{item.memo}</p>
                                </td>
                                <td className="px-5 py-4"><FavoriteTypeBadge type={item.type} /></td>
                                <td className="px-5 py-4"><FavoriteStatusBadge status={item.status} /></td>
                                <td className="px-5 py-4"><Badge variant={priority.variant}>{priority.label}</Badge></td>
                                <td className="px-5 py-4">{item.difficulty ? <DifficultyBadge value={item.difficulty} /> : <Badge>-</Badge>}</td>
                                <td className="px-5 py-4 text-right font-black text-blue-600">{item.progress}%</td>
                                <td className="px-5 py-4 text-right font-bold text-slate-600">{item.score ?? "-"}</td>
                                <td className="px-5 py-4">
                                    <div className="flex max-w-[260px] flex-wrap gap-1.5">
                                        {item.tags.slice(0, 3).map((tag) => <Badge key={tag}>#{tag}</Badge>)}
                                        {item.tags.length > 3 && <Badge>+{item.tags.length - 3}</Badge>}
                                    </div>
                                </td>
                                <td className="px-5 py-4 font-bold text-slate-500">{item.updatedAtText}</td>
                                <td className="px-5 py-4 text-right">
                                    <AppLinkButton href={item.solveHref ?? item.href} size="sm" iconRight={ChevronRight}>이동</AppLinkButton>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function TypeDistributionPanel({ items }: { items: FavoriteItem[] }) {
    const types: FavoriteType[] = ["problem", "test", "set", "tag", "note"];
    const total = Math.max(items.length, 1);

    return (
        <SidePanel title="유형별 즐겨찾기" badge={<BarChart3 className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-4">
                {types.map((type) => {
                    const meta = typeMeta[type];
                    const Icon = meta.icon;
                    const count = items.filter((item) => item.type === type).length;
                    const percent = Math.round((count / total) * 100);

                    return (
                        <div key={type}>
                            <div className="mb-2 flex items-center justify-between text-sm font-black">
                                <span className="flex items-center gap-2 text-slate-700"><Icon className="h-4 w-4" />{meta.label}</span>
                                <span className="text-slate-500">{count}개</span>
                            </div>
                            <ProgressBar value={percent} />
                        </div>
                    );
                })}
            </div>
        </SidePanel>
    );
}

function PriorityPanel({ items }: { items: FavoriteItem[] }) {
    const highItems = items.filter((item) => item.priority === "high").slice(0, 5);

    return (
        <SidePanel title="우선순위 높은 항목" badge={<Flame className="h-5 w-5 text-rose-600" />}>
            {highItems.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">우선순위 높은 항목이 없습니다.</p>
            ) : (
                <div className="space-y-2">
                    {highItems.map((item) => (
                        <Link key={item.id} href={item.solveHref ?? item.href} className="block rounded-2xl bg-rose-50 px-4 py-3 transition hover:bg-rose-100">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <span className="truncate text-sm font-black text-rose-900">{item.title}</span>
                                <FavoriteTypeBadge type={item.type} />
                            </div>
                            <p className="line-clamp-2 text-xs font-bold leading-5 text-rose-700">{item.memo}</p>
                        </Link>
                    ))}
                </div>
            )}
        </SidePanel>
    );
}

function RecentPanel({ items }: { items: FavoriteItem[] }) {
    const recentItems = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

    return (
        <SidePanel title="최근 업데이트" badge={<History className="h-5 w-5 text-blue-600" />}>
            {recentItems.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">최근 업데이트 항목이 없습니다.</p>
            ) : (
                <div className="space-y-2">
                    {recentItems.map((item) => (
                        <Link key={item.id} href={item.href} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-800">{item.title}</p>
                                <p className="mt-0.5 text-xs font-bold text-slate-400">{item.updatedAtText}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                        </Link>
                    ))}
                </div>
            )}
        </SidePanel>
    );
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: ComponentType<{ className?: string }> }) {
    return (
        <Link href={href} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
            <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
            </span>
            <ChevronRight className="h-4 w-4" />
        </Link>
    );
}

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [keyword, setKeyword] = useState("");
    const [type, setType] = useState<FavoriteTypeFilter>("전체");
    const [status, setStatus] = useState<FavoriteStatusFilter>("전체");
    const [difficulty, setDifficulty] = useState<DifficultyFilter>("전체");
    const [sort, setSort] = useState<SortOption>("recent");
    const [viewMode, setViewMode] = useState<ViewMode>("card");

    useEffect(() => {
        let ignore = false;

        async function loadDbData() {
            try {
                setIsLoading(true);
                setLoadError(null);

                const response = await fetch("/api/favorites", { cache: "no-store" });
                if (!response.ok) {
                    throw new Error(`즐겨찾기 데이터를 불러오지 못했습니다. (${response.status})`);
                }

                const data = await response.json();
                const items = Array.isArray(data.favorites) ? data.favorites : [];

                if (!ignore) {
                    setFavorites(normalizeFavorites(items));
                }
            } catch (error) {
                console.error("Failed to load /api/favorites", error);
                if (!ignore) {
                    setFavorites([]);
                    setLoadError(error instanceof Error ? error.message : "즐겨찾기 데이터를 불러오지 못했습니다.");
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        void loadDbData();

        return () => {
            ignore = true;
        };
    }, []);

    const filteredFavorites = useMemo(() => {
        const lowerKeyword = keyword.trim().toLowerCase();

        const result = favorites.filter((item) => {
            const matchesKeyword =
                !lowerKeyword ||
                item.title.toLowerCase().includes(lowerKeyword) ||
                item.description.toLowerCase().includes(lowerKeyword) ||
                item.memo.toLowerCase().includes(lowerKeyword) ||
                item.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword));

            const matchesType = type === "전체" || item.type === typeLabelToValue[type];
            const matchesStatus = status === "전체" || item.status === statusLabelToValue[status];
            const matchesDifficulty = difficulty === "전체" || item.difficulty === difficulty;

            return matchesKeyword && matchesType && matchesStatus && matchesDifficulty;
        });

        return result.sort((a, b) => {
            switch (sort) {
                case "priority":
                    return priorityMeta[a.priority].order - priorityMeta[b.priority].order;
                case "title":
                    return a.title.localeCompare(b.title);
                case "difficulty":
                    return (difficultyOrder[a.difficulty ?? "Easy"] ?? 0) - (difficultyOrder[b.difficulty ?? "Easy"] ?? 0);
                case "progress":
                    return b.progress - a.progress;
                case "created":
                    return b.addedAt.localeCompare(a.addedAt);
                case "recent":
                default:
                    return b.updatedAt.localeCompare(a.updatedAt);
            }
        });
    }, [favorites, keyword, type, status, difficulty, sort]);

    const problemCount = favorites.filter((item) => item.type === "problem").length;
    const reviewCount = favorites.filter((item) => item.status === "review").length;
    const highPriorityCount = favorites.filter((item) => item.priority === "high").length;
    const averageProgress = Math.round(favorites.reduce((sum, item) => sum + item.progress, 0) / Math.max(favorites.length, 1));

    const resetFilters = () => {
        setKeyword("");
        setType("전체");
        setStatus("전체");
        setDifficulty("전체");
        setSort("recent");
    };

    return (
        <AppShell title="즐겨찾기" description="저장해둔 문제, 테스트, 세트, 태그, 노트를 관리합니다.">
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Badge variant="blue">Favorites</Badge>
                            <Badge>DB</Badge>
                            <Badge variant="red">Priority {highPriorityCount}</Badge>
                        </>
                    }
                    title="중요한 학습 항목을 즐겨찾기로 모아두세요."
                    description="다시 풀 문제, 복습할 테스트, 약점 태그, 문제 세트, 오답노트를 한 곳에서 관리하고 바로 이어서 학습할 수 있습니다."
                    icon={FolderHeart}
                    rightTitle="전체 즐겨찾기"
                    rightValue={isLoading ? "-" : favorites.length.toLocaleString()}
                    rightCaption={isLoading ? "DB 데이터를 불러오는 중" : `평균 진행률 ${averageProgress}% · 복습 ${reviewCount}개`}
                    metrics={[
                        { label: "문제", value: `${problemCount}` },
                        { label: "복습", value: `${reviewCount}` },
                        { label: "중요", value: `${highPriorityCount}` }
                    ]}
                    actions={
                        <>
                            <AppLinkButton href="/problems" variant="primary" size="lg" iconRight={ArrowRight}>문제 찾기</AppLinkButton>
                            <AppLinkButton href="/notes" variant="white" size="lg" icon={NotebookPen}>오답노트</AppLinkButton>
                        </>
                    }
                />

                {loadError && (
                    <Notice title="즐겨찾기 DB 조회 실패" variant="warning">
                        {loadError}
                    </Notice>
                )}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="전체 즐겨찾기" value={isLoading ? "-" : favorites.length.toLocaleString()} caption="저장된 학습 항목" icon={Heart} tone="red" />
                    <StatCard label="즐겨찾기 문제" value={problemCount.toLocaleString()} caption="바로 풀 수 있는 문제" icon={BookOpen} tone="blue" />
                    <StatCard label="복습 필요" value={reviewCount.toLocaleString()} caption="오답/복습 항목" icon={RotateCcw} tone="orange" />
                    <StatCard label="평균 진행률" value={`${averageProgress}%`} caption="즐겨찾기 전체 기준" icon={Gauge} tone="green" />
                </section>

                <FilterPanel
                    title="즐겨찾기 검색 / 필터"
                    onReset={resetFilters}
                    gridClassName="grid gap-3 xl:grid-cols-[1.4fr_150px_150px_150px_190px_auto] xl:items-end"
                >
                    <SearchInput value={keyword} onChange={setKeyword} placeholder="제목, 설명, 메모, 태그 검색" />
                    <FilterSelect label="유형" value={type} onChange={setType} options={TYPE_OPTIONS} />
                    <FilterSelect label="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                    <FilterSelect label="난이도" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} />
                    <FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} />
                </FilterPanel>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-4">
                        <ListHeader
                            title="즐겨찾기 목록"
                            description={isLoading ? "DB에서 즐겨찾기 데이터를 불러오는 중입니다." : `검색 조건에 맞는 항목 ${filteredFavorites.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`}
                            right={<ViewModeToggle value={viewMode} onChange={setViewMode} />}
                        />

                        {isLoading ? (
                            <EmptyState
                                title="즐겨찾기 데이터를 불러오는 중입니다."
                                description="PostgreSQL의 Favorite 테이블에서 데이터를 가져오고 있습니다."
                                icon={Search}
                            />
                        ) : filteredFavorites.length === 0 ? (
                            <EmptyState
                                title="즐겨찾기 항목을 찾을 수 없습니다."
                                description={favorites.length === 0 ? "DB에 저장된 즐겨찾기 항목이 없습니다." : "검색어 또는 필터 조건을 변경해보세요."}
                                icon={Search}
                                onReset={resetFilters}
                            />
                        ) : viewMode === "card" ? (
                            <div className="space-y-4">
                                {filteredFavorites.map((item) => <FavoriteCard key={item.id} item={item} />)}
                            </div>
                        ) : (
                            <FavoritesTable items={filteredFavorites} />
                        )}
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="즐겨찾기 요약" badge={<Bookmark className="h-5 w-5 text-blue-600" />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">평균 진행률</p>
                                <p className="mt-1 text-5xl font-black">{averageProgress}%</p>
                                <ProgressBar value={averageProgress} className="mt-5 bg-white/10" />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="전체" value={`${favorites.length}`} />
                                <MiniStat label="복습" value={`${reviewCount}`} />
                                <MiniStat label="중요" value={`${highPriorityCount}`} />
                            </div>
                        </SidePanel>

                        <TypeDistributionPanel items={favorites} />
                        <PriorityPanel items={favorites} />
                        <RecentPanel items={favorites} />

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href="/problems" label="전체 문제" icon={BookOpen} />
                                <QuickLink href="/tests" label="모의 테스트" icon={Terminal} />
                                <QuickLink href="/sets" label="문제 세트" icon={Layers3} />
                                <QuickLink href="/tags" label="태그" icon={Hash} />
                                <QuickLink href="/notes" label="오답노트" icon={NotebookPen} />
                                <QuickLink href="/dashboard" label="대시보드" icon={Gauge} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 화면은 `/api/favorites` DB API 응답만 사용합니다. 데이터가 없으면 목업 대신 빈 상태가 표시됩니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}
