"use client";

import AppShell from "@/components/layout/AppShell";
import {
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
import type { Difficulty } from "@/components/domain";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Database,
    Flame,
    FolderCode,
    Gauge,
    Layers3,
    ListChecks,
    Search,
    Sparkles,
    Star,
    Target,
    Trophy,
    UsersRound,
    Zap
} from "lucide-react";

type SetCategory = "전체" | "입문" | "자료구조" | "그래프" | "DP" | "문자열" | "수학" | "실전";
type DifficultyFilter = "전체" | Difficulty;
type SetStatus = "not-started" | "in-progress" | "completed";
type StatusFilter = "전체" | "진행 전" | "진행 중" | "완료" | "추천";
type SortOption = "recommended" | "progress-desc" | "count-desc" | "difficulty" | "updated-desc";

type ProblemSet = {
    id: string;
    title: string;
    description: string;
    category: Exclude<SetCategory, "전체">;
    level: Difficulty;
    tags: string[];
    problemCount: number;
    solvedCount: number;
    status: SetStatus;
    estimatedTime: string;
    participants: number;
    recommended: boolean;
    featured: boolean;
    updatedAt: string;
    updatedAtText: string;
    href: string;
};

const problemSets: ProblemSet[] = [
    {
        id: "beginner-implementation-30",
        title: "입문자를 위한 구현 30제",
        description: "입출력, 조건문, 반복문, 문자열 처리 중심의 기본기 세트입니다. 코딩 테스트를 처음 시작할 때 가장 먼저 풀기 좋습니다.",
        category: "입문",
        level: "Easy",
        tags: ["구현", "입출력", "반복문", "문자열"],
        problemCount: 30,
        solvedCount: 18,
        status: "in-progress",
        estimatedTime: "5일",
        participants: 512,
        recommended: true,
        featured: true,
        updatedAt: "2026-05-03",
        updatedAtText: "2026.05.03",
        href: "/sets/beginner-implementation-30"
    },
    {
        id: "stack-queue-basic",
        title: "스택 / 큐 기본 유형",
        description: "스택, 큐, 덱, 우선순위 큐의 기본 명령 처리와 대표 유형을 모아둔 세트입니다.",
        category: "자료구조",
        level: "Medium",
        tags: ["스택", "큐", "덱", "자료구조"],
        problemCount: 24,
        solvedCount: 16,
        status: "in-progress",
        estimatedTime: "4일",
        participants: 328,
        recommended: true,
        featured: false,
        updatedAt: "2026-04-29",
        updatedAtText: "2026.04.29",
        href: "/sets/stack-queue-basic"
    },
    {
        id: "bfs-dfs-graph",
        title: "BFS / DFS 그래프 탐색",
        description: "그래프 순회, 격자 탐색, 연결 요소, 최단 거리 문제를 단계별로 연습합니다.",
        category: "그래프",
        level: "Medium",
        tags: ["BFS", "DFS", "그래프", "격자"],
        problemCount: 28,
        solvedCount: 9,
        status: "in-progress",
        estimatedTime: "7일",
        participants: 421,
        recommended: true,
        featured: true,
        updatedAt: "2026-05-01",
        updatedAtText: "2026.05.01",
        href: "/sets/bfs-dfs-graph"
    },
    {
        id: "dynamic-programming-core",
        title: "동적 계획법 핵심 유형",
        description: "점화식 설계, 메모이제이션, 1차원/2차원 DP, LIS, 배낭 문제를 연습합니다.",
        category: "DP",
        level: "Hard",
        tags: ["DP", "점화식", "LIS", "배낭"],
        problemCount: 32,
        solvedCount: 6,
        status: "in-progress",
        estimatedTime: "10일",
        participants: 284,
        recommended: true,
        featured: true,
        updatedAt: "2026-04-25",
        updatedAtText: "2026.04.25",
        href: "/sets/dynamic-programming-core"
    },
    {
        id: "string-pattern-basic",
        title: "문자열 처리 기본기",
        description: "문자열 반복, 파싱, 정렬, 카운팅, 해시 기반 문자열 문제를 연습합니다.",
        category: "문자열",
        level: "Easy",
        tags: ["문자열", "파싱", "정렬", "해시"],
        problemCount: 22,
        solvedCount: 22,
        status: "completed",
        estimatedTime: "3일",
        participants: 376,
        recommended: false,
        featured: false,
        updatedAt: "2026-04-20",
        updatedAtText: "2026.04.20",
        href: "/sets/string-pattern-basic"
    },
    {
        id: "math-number-theory",
        title: "수학 / 정수론 입문",
        description: "최대공약수, 최소공배수, 소수 판정, 조합, 모듈러 연산을 정리합니다.",
        category: "수학",
        level: "Medium",
        tags: ["수학", "정수론", "소수", "조합"],
        problemCount: 26,
        solvedCount: 0,
        status: "not-started",
        estimatedTime: "6일",
        participants: 193,
        recommended: false,
        featured: false,
        updatedAt: "2026-04-12",
        updatedAtText: "2026.04.12",
        href: "/sets/math-number-theory"
    },
    {
        id: "coding-test-practice-1",
        title: "실전 코딩테스트 1회차",
        description: "구현, 자료구조, 탐색, DP를 섞어 제한 시간 안에 푸는 실전형 문제 세트입니다.",
        category: "실전",
        level: "Hard",
        tags: ["실전", "모의고사", "시간제한", "종합"],
        problemCount: 5,
        solvedCount: 0,
        status: "not-started",
        estimatedTime: "120분",
        participants: 128,
        recommended: true,
        featured: true,
        updatedAt: "2026-05-02",
        updatedAtText: "2026.05.02",
        href: "/sets/coding-test-practice-1"
    },
    {
        id: "greedy-sorting-core",
        title: "그리디 / 정렬 핵심",
        description: "정렬 기준 설계, 탐욕 선택, 회의실 배정, 우선순위 기반 그리디 문제를 연습합니다.",
        category: "자료구조",
        level: "Medium",
        tags: ["그리디", "정렬", "우선순위 큐"],
        problemCount: 20,
        solvedCount: 4,
        status: "in-progress",
        estimatedTime: "4일",
        participants: 246,
        recommended: false,
        featured: false,
        updatedAt: "2026-04-18",
        updatedAtText: "2026.04.18",
        href: "/sets/greedy-sorting-core"
    }
];

const DEFAULT_problemSets = problemSets;

const CATEGORY_OPTIONS: readonly SetCategory[] = ["전체", "입문", "자료구조", "그래프", "DP", "문자열", "수학", "실전"];
const DIFFICULTY_OPTIONS: readonly DifficultyFilter[] = ["전체", "Easy", "Medium", "Hard"];
const STATUS_OPTIONS: readonly StatusFilter[] = ["전체", "진행 전", "진행 중", "완료", "추천"];
const SORT_OPTIONS: readonly SortOption[] = ["recommended", "progress-desc", "count-desc", "difficulty", "updated-desc"];

const statusLabelToValue: Record<Exclude<StatusFilter, "전체" | "추천">, SetStatus> = {
    "진행 전": "not-started",
    "진행 중": "in-progress",
    완료: "completed"
};

const sortLabels: Record<SortOption, string> = {
    recommended: "추천순",
    "progress-desc": "진행률 높은순",
    "count-desc": "문제 수 많은순",
    difficulty: "난이도순",
    "updated-desc": "최근 업데이트순"
};

const difficultyOrder: Record<Difficulty, number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3
};

const difficultyVariant = {
    Easy: "green",
    Medium: "orange",
    Hard: "red"
} as const;

const statusMeta: Record<SetStatus, { label: string; variant: "default" | "blue" | "green" | "orange"; icon: ComponentType<{ className?: string }> }> = {
    "not-started": { label: "진행 전", variant: "default", icon: Clock3 },
    "in-progress": { label: "진행 중", variant: "blue", icon: Target },
    completed: { label: "완료", variant: "green", icon: CheckCircle2 }
};

function getProgress(set: ProblemSet) {
    return Math.round((set.solvedCount / Math.max(set.problemCount, 1)) * 100);
}

function SetStatusBadge({ status }: { status: SetStatus }) {
    const meta = statusMeta[status];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function SetCard({ set }: { set: ProblemSet }) {
    const progress = getProgress(set);

    return (
        <Card hover className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant={difficultyVariant[set.level]}>{set.level}</Badge>
                        <SetStatusBadge status={set.status} />
                        <Badge>{set.category}</Badge>
                        {set.recommended && <Badge variant="blue"><Star className="mr-1 h-3.5 w-3.5" />추천</Badge>}
                        {set.featured && <Badge variant="amber"><Flame className="mr-1 h-3.5 w-3.5" />Featured</Badge>}
                    </div>

                    <Link href={set.href} className="text-xl font-black tracking-tight text-slate-950 transition hover:text-blue-600">
                        {set.title}
                    </Link>
                    <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500">{set.description}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {set.tags.slice(0, 5).map((tag) => <Badge key={tag}>#{tag}</Badge>)}
                    </div>
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[360px]">
                    <MetricBox label="문제" value={`${set.problemCount}개`} />
                    <MetricBox label="해결" value={`${set.solvedCount}개`} />
                    <MetricBox label="예상" value={set.estimatedTime} />
                    <MetricBox label="참여" value={`${set.participants.toLocaleString()}명`} />
                </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm font-black">
                    <span className="text-slate-600">진행률</span>
                    <span className="text-blue-600">{progress}%</span>
                </div>
                <ProgressBar value={progress} barClassName={set.status === "completed" ? "bg-emerald-600" : "bg-blue-600"} />
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-bold text-slate-400">최근 업데이트 {set.updatedAtText}</div>
                <div className="flex flex-wrap gap-2">
                    <AppLinkButton href={set.href} variant="secondary" iconRight={ChevronRight}>상세 보기</AppLinkButton>
                    <AppLinkButton href={set.href} variant="primary" iconRight={ArrowRight}>시작하기</AppLinkButton>
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

function SetsTable({ sets }: { sets: ProblemSet[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">문제 세트</th>
                        <th className="px-5 py-4">분류</th>
                        <th className="px-5 py-4">난이도</th>
                        <th className="px-5 py-4">상태</th>
                        <th className="px-5 py-4 text-right">문제</th>
                        <th className="px-5 py-4 text-right">해결</th>
                        <th className="px-5 py-4 text-right">진행률</th>
                        <th className="px-5 py-4">예상 시간</th>
                        <th className="px-5 py-4">태그</th>
                        <th className="px-5 py-4" />
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {sets.map((set) => {
                        const progress = getProgress(set);

                        return (
                            <tr key={set.id} className="transition hover:bg-slate-50">
                                <td className="px-5 py-4">
                                    <Link href={set.href} className="font-black text-slate-950 transition hover:text-blue-600">
                                        {set.title}
                                    </Link>
                                    <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-400">{set.description}</p>
                                </td>
                                <td className="px-5 py-4"><Badge>{set.category}</Badge></td>
                                <td className="px-5 py-4"><Badge variant={difficultyVariant[set.level]}>{set.level}</Badge></td>
                                <td className="px-5 py-4"><SetStatusBadge status={set.status} /></td>
                                <td className="px-5 py-4 text-right font-bold text-slate-600">{set.problemCount}</td>
                                <td className="px-5 py-4 text-right font-bold text-slate-600">{set.solvedCount}</td>
                                <td className="px-5 py-4 text-right font-black text-blue-600">{progress}%</td>
                                <td className="px-5 py-4 font-bold text-slate-500">{set.estimatedTime}</td>
                                <td className="px-5 py-4">
                                    <div className="flex max-w-[260px] flex-wrap gap-1.5">
                                        {set.tags.slice(0, 3).map((tag) => <Badge key={tag}>#{tag}</Badge>)}
                                        {set.tags.length > 3 && <Badge>+{set.tags.length - 3}</Badge>}
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <AppLinkButton href={set.href} size="sm" iconRight={ChevronRight}>상세</AppLinkButton>
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

function FeaturedSetCard({ set }: { set: ProblemSet }) {
    const progress = getProgress(set);

    return (
        <Link href={set.href} className="block rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                        <Badge variant="amber">Featured</Badge>
                        <Badge variant={difficultyVariant[set.level]}>{set.level}</Badge>
                    </div>
                    <h3 className="text-xl font-black text-slate-950">{set.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-500">{set.description}</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <FolderCode className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
                <MiniStat label="문제" value={`${set.problemCount}`} />
                <MiniStat label="해결" value={`${set.solvedCount}`} />
                <MiniStat label="진행" value={`${progress}%`} />
            </div>
        </Link>
    );
}

function CategoryPanel() {
    const categories = CATEGORY_OPTIONS.filter((category) => category !== "전체") as Exclude<SetCategory, "전체">[];

    return (
        <SidePanel title="분류별 세트" badge={<Layers3 className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {categories.map((category) => {
                    const count = problemSets.filter((set) => set.category === category).length;

                    return (
                        <Link key={category} href={`/sets?category=${category}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
                            {category}
                            <span className="text-slate-400">{count}개</span>
                        </Link>
                    );
                })}
            </div>
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

export default function SetsPage() {
    const [problemSets, setProblemSets] = useState<ProblemSet[]>([]);

    useEffect(() => {
        let ignore = false;

        async function loadDbData() {
            try {
                const response = await fetch("/api/sets", { cache: "no-store" });
                if (!response.ok) return;

                const data = await response.json();
                const items = Array.isArray(data.sets) ? data.sets : [];
                if (ignore) return;

                setProblemSets(items as ProblemSet[]);
            } catch (error) {
                console.error("Failed to load /api/sets", error);
            }
        }

        void loadDbData();

        return () => {
            ignore = true;
        };
    }, []);

    const [keyword, setKeyword] = useState("");
    const [category, setCategory] = useState<SetCategory>("전체");
    const [difficulty, setDifficulty] = useState<DifficultyFilter>("전체");
    const [status, setStatus] = useState<StatusFilter>("전체");
    const [sort, setSort] = useState<SortOption>("recommended");
    const [viewMode, setViewMode] = useState<ViewMode>("card");

    const filteredSets = useMemo(() => {
        const lowerKeyword = keyword.trim().toLowerCase();

        const result = problemSets.filter((set) => {
            const matchesKeyword =
                !lowerKeyword ||
                set.title.toLowerCase().includes(lowerKeyword) ||
                set.description.toLowerCase().includes(lowerKeyword) ||
                set.category.toLowerCase().includes(lowerKeyword) ||
                set.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword));

            const matchesCategory = category === "전체" || set.category === category;
            const matchesDifficulty = difficulty === "전체" || set.level === difficulty;
            const matchesStatus =
                status === "전체" ||
                (status === "추천" ? set.recommended : set.status === statusLabelToValue[status]);

            return matchesKeyword && matchesCategory && matchesDifficulty && matchesStatus;
        });

        return result.sort((a, b) => {
            switch (sort) {
                case "progress-desc":
                    return getProgress(b) - getProgress(a);
                case "count-desc":
                    return b.problemCount - a.problemCount;
                case "difficulty":
                    return difficultyOrder[a.level] - difficultyOrder[b.level];
                case "updated-desc":
                    return b.updatedAt.localeCompare(a.updatedAt);
                case "recommended":
                default:
                    return Number(b.recommended) - Number(a.recommended) || Number(b.featured) - Number(a.featured) || b.updatedAt.localeCompare(a.updatedAt);
            }
        });
    }, [keyword, category, difficulty, status, sort]);

    const totalProblems = problemSets.reduce((sum, set) => sum + set.problemCount, 0);
    const solvedProblems = problemSets.reduce((sum, set) => sum + set.solvedCount, 0);
    const completedCount = problemSets.filter((set) => set.status === "completed").length;
    const inProgressCount = problemSets.filter((set) => set.status === "in-progress").length;
    const featuredSets = problemSets.filter((set) => set.featured).slice(0, 3);
    const totalProgress = Math.round((solvedProblems / Math.max(totalProblems, 1)) * 100);

    const resetFilters = () => {
        setKeyword("");
        setCategory("전체");
        setDifficulty("전체");
        setStatus("전체");
        setSort("recommended");
    };

    return (
        <AppShell title="문제 세트" description="목표와 주제별로 묶인 문제 세트를 선택해 학습합니다.">
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Badge variant="blue">Sets</Badge>
                            <Badge>Curated Practice</Badge>
                            <Badge variant="amber">Featured {featuredSets.length}</Badge>
                        </>
                    }
                    title="문제 세트로 학습 흐름을 잡으세요."
                    description="입문, 자료구조, 그래프, DP, 실전 코딩테스트 등 목적별로 묶인 문제 세트를 선택해 단계적으로 학습할 수 있습니다."
                    icon={Layers3}
                    rightTitle="전체 진행률"
                    rightValue={`${totalProgress}%`}
                    rightCaption={`${solvedProblems} / ${totalProblems} 문제 해결`}
                    metrics={[
                        { label: "세트", value: `${problemSets.length}` },
                        { label: "진행 중", value: `${inProgressCount}` },
                        { label: "완료", value: `${completedCount}` }
                    ]}
                    actions={
                        <>
                            <AppLinkButton href="/sets/beginner-implementation-30" variant="primary" size="lg" iconRight={ArrowRight}>추천 세트 시작</AppLinkButton>
                            <AppLinkButton href="/problems" variant="white" size="lg" icon={BookOpen}>전체 문제 보기</AppLinkButton>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="전체 세트" value={problemSets.length.toLocaleString()} caption="등록된 문제 세트" icon={Layers3} />
                    <StatCard label="전체 문제" value={totalProblems.toLocaleString()} caption="세트에 포함된 문제" icon={Database} tone="blue" />
                    <StatCard label="해결 문제" value={solvedProblems.toLocaleString()} caption={`전체 진행률 ${totalProgress}%`} icon={CheckCircle2} tone="green" />
                    <StatCard label="진행 중" value={inProgressCount.toLocaleString()} caption="현재 학습 중인 세트" icon={Target} tone="orange" />
                </section>

                <section>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-xl font-black text-slate-950">추천 세트</h3>
                            <p className="mt-1 text-sm text-slate-500">현재 학습 흐름에 맞는 대표 문제 세트입니다.</p>
                        </div>
                        <Sparkles className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="grid gap-4 xl:grid-cols-3">
                        {featuredSets.map((set) => <FeaturedSetCard key={set.id} set={set} />)}
                    </div>
                </section>

                <FilterPanel
                    title="문제 세트 검색 / 필터"
                    onReset={resetFilters}
                    gridClassName="grid gap-3 xl:grid-cols-[1.4fr_150px_150px_150px_190px_auto] xl:items-end"
                >
                    <SearchInput
                        value={keyword}
                        onChange={setKeyword}
                        placeholder="세트명, 설명, 분류, 태그 검색"
                    />
                    <FilterSelect label="분류" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
                    <FilterSelect label="난이도" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} />
                    <FilterSelect label="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                    <FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} />
                </FilterPanel>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-4">
                        <ListHeader
                            title="세트 목록"
                            description={`검색 조건에 맞는 세트 ${filteredSets.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`}
                            right={<ViewModeToggle value={viewMode} onChange={setViewMode} />}
                        />

                        {filteredSets.length === 0 ? (
                            <EmptyState
                                title="문제 세트를 찾을 수 없습니다."
                                description="검색어 또는 필터 조건을 변경해보세요."
                                icon={Search}
                                onReset={resetFilters}
                            />
                        ) : viewMode === "card" ? (
                            <div className="space-y-4">
                                {filteredSets.map((set) => <SetCard key={set.id} set={set} />)}
                            </div>
                        ) : (
                            <SetsTable sets={filteredSets} />
                        )}
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="전체 진행률" badge={<Gauge className="h-5 w-5 text-blue-600" />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">세트 기반 학습</p>
                                <p className="mt-1 text-5xl font-black">{totalProgress}%</p>
                                <ProgressBar value={totalProgress} className="mt-5 bg-white/10" />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="해결" value={`${solvedProblems}`} />
                                <MiniStat label="전체" value={`${totalProblems}`} />
                                <MiniStat label="완료" value={`${completedCount}`} />
                            </div>
                        </SidePanel>

                        <CategoryPanel />

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href="/problems" label="전체 문제" icon={BookOpen} />
                                <QuickLink href="/goals" label="학습 목표" icon={Target} />
                                <QuickLink href="/notes" label="오답노트" icon={ListChecks} />
                                <QuickLink href="/ranking" label="랭킹" icon={Trophy} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 화면은 DB API 응답만 사용합니다. 데이터가 없으면 목업 대신 빈 상태가 표시됩니다.</Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}
