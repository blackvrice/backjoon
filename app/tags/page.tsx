"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
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
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Code2,
    Compass,
    Database,
    Flame,
    Gauge,
    Hash,
    Layers3,
    ListChecks,
    NotebookPen,
    Route,
    Search,
    Sparkles,
    Star,
    Target,
    Trophy,
    Zap
} from "lucide-react";

type TagCategory = "전체" | "기초" | "자료구조" | "그래프" | "DP" | "수학" | "문자열" | "탐색" | "실전";
type TagStatus = "not-started" | "learning" | "strong" | "weak";
type TagStatusFilter = "전체" | "학습 전" | "학습 중" | "강점" | "약점" | "추천";
type DifficultyFilter = "전체" | Difficulty;
type SortOption = "recommended" | "solved-desc" | "total-desc" | "accuracy-desc" | "accuracy-asc" | "recent";

type TagItem = {
    slug: string;
    name: string;
    description: string;
    category: Exclude<TagCategory, "전체">;
    difficulty: Difficulty;
    totalProblems: number;
    solvedProblems: number;
    wrongProblems: number;
    reviewProblems: number;
    accuracy: number;
    status: TagStatus;
    recommended: boolean;
    featured: boolean;
    updatedAt: string;
    updatedAtText: string;
    relatedTags: string[];
    representativeProblems: Array<{
        id: number;
        title: string;
        difficulty: Difficulty;
        status: "solved" | "wrong" | "todo" | "review";
    }>;
};

const tags: TagItem[] = [
    {
        slug: "implementation",
        name: "구현",
        description: "문제 조건을 정확히 코드로 옮기는 기본 유형입니다. 입출력, 조건 처리, 반복문, 시뮬레이션의 기반이 됩니다.",
        category: "기초",
        difficulty: "Easy",
        totalProblems: 286,
        solvedProblems: 94,
        wrongProblems: 12,
        reviewProblems: 8,
        accuracy: 81.3,
        status: "strong",
        recommended: true,
        featured: true,
        updatedAt: "2026-05-03",
        updatedAtText: "2026.05.03",
        relatedTags: ["simulation", "array", "string", "math"],
        representativeProblems: [
            { id: 1000, title: "두 수의 합", difficulty: "Easy", status: "solved" },
            { id: 10871, title: "X보다 작은 수", difficulty: "Easy", status: "todo" },
            { id: 2675, title: "문자열 반복", difficulty: "Easy", status: "solved" }
        ]
    },
    {
        slug: "stack",
        name: "스택",
        description: "후입선출 구조를 활용하는 자료구조 유형입니다. 괄호 검사, 명령 처리, 모노톤 스택 문제로 확장됩니다.",
        category: "자료구조",
        difficulty: "Medium",
        totalProblems: 64,
        solvedProblems: 26,
        wrongProblems: 5,
        reviewProblems: 4,
        accuracy: 76.2,
        status: "strong",
        recommended: true,
        featured: false,
        updatedAt: "2026-05-01",
        updatedAtText: "2026.05.01",
        relatedTags: ["data-structure", "string", "deque"],
        representativeProblems: [
            { id: 10828, title: "스택 명령 처리", difficulty: "Medium", status: "solved" },
            { id: 9012, title: "괄호", difficulty: "Medium", status: "review" }
        ]
    },
    {
        slug: "queue",
        name: "큐",
        description: "선입선출 구조를 활용하는 자료구조 유형입니다. BFS와 시뮬레이션 문제에서 자주 등장합니다.",
        category: "자료구조",
        difficulty: "Medium",
        totalProblems: 58,
        solvedProblems: 18,
        wrongProblems: 7,
        reviewProblems: 5,
        accuracy: 68.8,
        status: "learning",
        recommended: true,
        featured: false,
        updatedAt: "2026-04-29",
        updatedAtText: "2026.04.29",
        relatedTags: ["bfs", "deque", "simulation"],
        representativeProblems: [
            { id: 10845, title: "큐", difficulty: "Medium", status: "todo" },
            { id: 7576, title: "토마토", difficulty: "Medium", status: "wrong" }
        ]
    },
    {
        slug: "bfs",
        name: "BFS",
        description: "너비 우선 탐색입니다. 최단 거리, 격자 탐색, 다중 시작점 탐색 문제의 핵심입니다.",
        category: "그래프",
        difficulty: "Medium",
        totalProblems: 132,
        solvedProblems: 37,
        wrongProblems: 14,
        reviewProblems: 11,
        accuracy: 64.5,
        status: "learning",
        recommended: true,
        featured: true,
        updatedAt: "2026-05-02",
        updatedAtText: "2026.05.02",
        relatedTags: ["graph", "queue", "grid", "shortest-path"],
        representativeProblems: [
            { id: 2178, title: "미로 탐색", difficulty: "Medium", status: "todo" },
            { id: 7576, title: "토마토", difficulty: "Medium", status: "wrong" },
            { id: 1260, title: "DFS와 BFS", difficulty: "Medium", status: "todo" }
        ]
    },
    {
        slug: "dfs",
        name: "DFS",
        description: "깊이 우선 탐색입니다. 재귀, 백트래킹, 연결 요소 탐색의 기반이 됩니다.",
        category: "그래프",
        difficulty: "Medium",
        totalProblems: 118,
        solvedProblems: 29,
        wrongProblems: 10,
        reviewProblems: 8,
        accuracy: 67.2,
        status: "learning",
        recommended: false,
        featured: false,
        updatedAt: "2026-04-27",
        updatedAtText: "2026.04.27",
        relatedTags: ["graph", "backtracking", "recursion"],
        representativeProblems: [
            { id: 1260, title: "DFS와 BFS", difficulty: "Medium", status: "todo" }
        ]
    },
    {
        slug: "dp",
        name: "DP",
        description: "동적 계획법입니다. 상태 정의와 점화식 설계가 핵심이며, 중복 부분 문제를 저장해 해결합니다.",
        category: "DP",
        difficulty: "Hard",
        totalProblems: 174,
        solvedProblems: 24,
        wrongProblems: 18,
        reviewProblems: 16,
        accuracy: 52.1,
        status: "weak",
        recommended: true,
        featured: true,
        updatedAt: "2026-05-03",
        updatedAtText: "2026.05.03",
        relatedTags: ["knapsack", "lis", "memoization", "dynamic-programming"],
        representativeProblems: [
            { id: 1463, title: "1로 만들기", difficulty: "Medium", status: "todo" },
            { id: 11053, title: "가장 긴 증가하는 부분 수열", difficulty: "Medium", status: "solved" },
            { id: 12865, title: "평범한 배낭", difficulty: "Hard", status: "wrong" }
        ]
    },
    {
        slug: "binary-search",
        name: "이분 탐색",
        description: "정렬된 범위나 정답 후보 범위를 절반씩 줄이는 탐색 유형입니다. 매개 변수 탐색으로 자주 확장됩니다.",
        category: "탐색",
        difficulty: "Medium",
        totalProblems: 96,
        solvedProblems: 21,
        wrongProblems: 9,
        reviewProblems: 6,
        accuracy: 61.4,
        status: "learning",
        recommended: true,
        featured: false,
        updatedAt: "2026-04-30",
        updatedAtText: "2026.04.30",
        relatedTags: ["parametric-search", "sort", "lis"],
        representativeProblems: [
            { id: 2805, title: "나무 자르기", difficulty: "Medium", status: "todo" },
            { id: 11053, title: "가장 긴 증가하는 부분 수열", difficulty: "Medium", status: "solved" }
        ]
    },
    {
        slug: "math",
        name: "수학",
        description: "최대공약수, 소수, 조합, 모듈러 연산 등 수학적 성질을 활용하는 유형입니다.",
        category: "수학",
        difficulty: "Medium",
        totalProblems: 146,
        solvedProblems: 48,
        wrongProblems: 8,
        reviewProblems: 5,
        accuracy: 78.9,
        status: "strong",
        recommended: false,
        featured: false,
        updatedAt: "2026-04-22",
        updatedAtText: "2026.04.22",
        relatedTags: ["number-theory", "gcd", "prime"],
        representativeProblems: [
            { id: 2609, title: "최대공약수와 최소공배수", difficulty: "Easy", status: "todo" },
            { id: 1000, title: "두 수의 합", difficulty: "Easy", status: "solved" }
        ]
    },
    {
        slug: "string",
        name: "문자열",
        description: "문자열 반복, 파싱, 검색, 정렬, 해시를 다루는 유형입니다.",
        category: "문자열",
        difficulty: "Easy",
        totalProblems: 112,
        solvedProblems: 48,
        wrongProblems: 6,
        reviewProblems: 4,
        accuracy: 82.4,
        status: "strong",
        recommended: false,
        featured: false,
        updatedAt: "2026-04-20",
        updatedAtText: "2026.04.20",
        relatedTags: ["implementation", "hash", "parsing"],
        representativeProblems: [
            { id: 2675, title: "문자열 반복", difficulty: "Easy", status: "solved" },
            { id: 9012, title: "괄호", difficulty: "Medium", status: "review" }
        ]
    },
    {
        slug: "dijkstra",
        name: "다익스트라",
        description: "가중치가 있는 그래프에서 최단 거리를 구하는 유형입니다. 우선순위 큐와 인접 리스트 사용이 핵심입니다.",
        category: "그래프",
        difficulty: "Hard",
        totalProblems: 74,
        solvedProblems: 5,
        wrongProblems: 9,
        reviewProblems: 7,
        accuracy: 38.4,
        status: "weak",
        recommended: true,
        featured: false,
        updatedAt: "2026-04-25",
        updatedAtText: "2026.04.25",
        relatedTags: ["graph", "shortest-path", "priority-queue"],
        representativeProblems: [
            { id: 1753, title: "최단경로", difficulty: "Hard", status: "todo" }
        ]
    }
];

const DEFAULT_tags = tags;

const CATEGORY_OPTIONS: readonly TagCategory[] = ["전체", "기초", "자료구조", "그래프", "DP", "수학", "문자열", "탐색", "실전"];
const DIFFICULTY_OPTIONS: readonly DifficultyFilter[] = ["전체", "Easy", "Medium", "Hard"];
const STATUS_OPTIONS: readonly TagStatusFilter[] = ["전체", "학습 전", "학습 중", "강점", "약점", "추천"];
const SORT_OPTIONS: readonly SortOption[] = ["recommended", "solved-desc", "total-desc", "accuracy-desc", "accuracy-asc", "recent"];

const statusLabelToValue: Record<Exclude<TagStatusFilter, "전체" | "추천">, TagStatus> = {
    "학습 전": "not-started",
    "학습 중": "learning",
    강점: "strong",
    약점: "weak"
};

const sortLabels: Record<SortOption, string> = {
    recommended: "추천순",
    "solved-desc": "해결 많은순",
    "total-desc": "문제 많은순",
    "accuracy-desc": "정답률 높은순",
    "accuracy-asc": "정답률 낮은순",
    recent: "최근 업데이트순"
};

const difficultyVariant = {
    Easy: "green",
    Medium: "orange",
    Hard: "red"
} as const;

const tagStatusMeta: Record<TagStatus, { label: string; variant: "default" | "blue" | "green" | "orange" | "red"; icon: ComponentType<{ className?: string }> }> = {
    "not-started": { label: "학습 전", variant: "default", icon: Compass },
    learning: { label: "학습 중", variant: "blue", icon: Target },
    strong: { label: "강점", variant: "green", icon: CheckCircle2 },
    weak: { label: "약점", variant: "red", icon: Flame }
};

function getProgress(tag: TagItem) {
    return Math.round((tag.solvedProblems / Math.max(tag.totalProblems, 1)) * 100);
}

function TagStatusBadge({ status }: { status: TagStatus }) {
    const meta = tagStatusMeta[status];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function TagCard({ tag }: { tag: TagItem }) {
    const progress = getProgress(tag);

    return (
        <Card hover className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant={difficultyVariant[tag.difficulty]}>{tag.difficulty}</Badge>
                        <TagStatusBadge status={tag.status} />
                        <Badge>{tag.category}</Badge>
                        {tag.recommended && <Badge variant="blue"><Star className="mr-1 h-3.5 w-3.5" />추천</Badge>}
                        {tag.featured && <Badge variant="amber"><Flame className="mr-1 h-3.5 w-3.5" />Featured</Badge>}
                    </div>

                    <Link href={`/tags/${tag.slug}`} className="inline-flex items-center gap-2 text-2xl font-black tracking-tight text-slate-950 transition hover:text-blue-600">
                        <Hash className="h-6 w-6 text-blue-600" />
                        {tag.name}
                    </Link>

                    <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500">{tag.description}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {tag.relatedTags.slice(0, 5).map((related) => <Badge key={related}>#{related}</Badge>)}
                    </div>
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[360px]">
                    <MetricBox label="전체" value={`${tag.totalProblems}개`} />
                    <MetricBox label="해결" value={`${tag.solvedProblems}개`} />
                    <MetricBox label="오답" value={`${tag.wrongProblems}개`} />
                    <MetricBox label="정답률" value={`${tag.accuracy}%`} />
                </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm font-black">
                    <span className="text-slate-600">학습 진행률</span>
                    <span className="text-blue-600">{progress}%</span>
                </div>
                <ProgressBar value={progress} barClassName={tag.status === "strong" ? "bg-emerald-600" : tag.status === "weak" ? "bg-rose-600" : "bg-blue-600"} />
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    대표 문제
                </div>
                <div className="space-y-2">
                    {tag.representativeProblems.slice(0, 3).map((problem) => (
                        <Link key={problem.id} href={`/problems/${problem.id}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold transition hover:bg-blue-50">
                            <span className="min-w-0 truncate text-slate-700">#{problem.id} {problem.title}</span>
                            <Badge variant={difficultyVariant[problem.difficulty]}>{problem.difficulty}</Badge>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-bold text-slate-400">최근 업데이트 {tag.updatedAtText}</div>
                <div className="flex flex-wrap gap-2">
                    <AppLinkButton href={`/problems?tag=${tag.slug}`} variant="secondary" iconRight={ChevronRight}>문제 보기</AppLinkButton>
                    <AppLinkButton href={`/tags/${tag.slug}`} variant="primary" iconRight={ArrowRight}>태그 상세</AppLinkButton>
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

function TagsTable({ items }: { items: TagItem[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">태그</th>
                        <th className="px-5 py-4">분류</th>
                        <th className="px-5 py-4">난이도</th>
                        <th className="px-5 py-4">상태</th>
                        <th className="px-5 py-4 text-right">전체</th>
                        <th className="px-5 py-4 text-right">해결</th>
                        <th className="px-5 py-4 text-right">오답</th>
                        <th className="px-5 py-4 text-right">정답률</th>
                        <th className="px-5 py-4 text-right">진행률</th>
                        <th className="px-5 py-4">관련 태그</th>
                        <th className="px-5 py-4" />
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {items.map((tag) => {
                        const progress = getProgress(tag);

                        return (
                            <tr key={tag.slug} className="transition hover:bg-slate-50">
                                <td className="px-5 py-4">
                                    <Link href={`/tags/${tag.slug}`} className="font-black text-slate-950 transition hover:text-blue-600">
                                        #{tag.name}
                                    </Link>
                                    <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-400">{tag.description}</p>
                                </td>
                                <td className="px-5 py-4"><Badge>{tag.category}</Badge></td>
                                <td className="px-5 py-4"><Badge variant={difficultyVariant[tag.difficulty]}>{tag.difficulty}</Badge></td>
                                <td className="px-5 py-4"><TagStatusBadge status={tag.status} /></td>
                                <td className="px-5 py-4 text-right font-bold text-slate-600">{tag.totalProblems}</td>
                                <td className="px-5 py-4 text-right font-bold text-slate-600">{tag.solvedProblems}</td>
                                <td className="px-5 py-4 text-right font-bold text-slate-600">{tag.wrongProblems}</td>
                                <td className="px-5 py-4 text-right font-bold text-slate-600">{tag.accuracy}%</td>
                                <td className="px-5 py-4 text-right font-black text-blue-600">{progress}%</td>
                                <td className="px-5 py-4">
                                    <div className="flex max-w-[260px] flex-wrap gap-1.5">
                                        {tag.relatedTags.slice(0, 3).map((related) => <Badge key={related}>#{related}</Badge>)}
                                        {tag.relatedTags.length > 3 && <Badge>+{tag.relatedTags.length - 3}</Badge>}
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <AppLinkButton href={`/tags/${tag.slug}`} size="sm" iconRight={ChevronRight}>상세</AppLinkButton>
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

function FeaturedTagCard({ tag }: { tag: TagItem }) {
    const progress = getProgress(tag);

    return (
        <Link href={`/tags/${tag.slug}`} className="block rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                        <Badge variant="amber">Featured</Badge>
                        <Badge variant={difficultyVariant[tag.difficulty]}>{tag.difficulty}</Badge>
                    </div>
                    <h3 className="text-xl font-black text-slate-950">#{tag.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-500">{tag.description}</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Hash className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
                <MiniStat label="전체" value={`${tag.totalProblems}`} />
                <MiniStat label="해결" value={`${tag.solvedProblems}`} />
                <MiniStat label="진행" value={`${progress}%`} />
            </div>
        </Link>
    );
}

function CategoryPanel() {
    const categories = CATEGORY_OPTIONS.filter((category) => category !== "전체") as Exclude<TagCategory, "전체">[];

    return (
        <SidePanel title="분류별 태그" badge={<Layers3 className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {categories.map((category) => {
                    const count = tags.filter((tag) => tag.category === category).length;

                    return (
                        <Link key={category} href={`/tags?category=${category}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
                            {category}
                            <span className="text-slate-400">{count}개</span>
                        </Link>
                    );
                })}
            </div>
        </SidePanel>
    );
}

function WeakTagPanel({ weakTags }: { weakTags: TagItem[] }) {
    return (
        <SidePanel title="복습 추천 태그" badge={<Flame className="h-5 w-5 text-rose-600" />}>
            <div className="space-y-2">
                {weakTags.map((tag) => (
                    <Link key={tag.slug} href={`/tags/${tag.slug}`} className="block rounded-2xl bg-rose-50 px-4 py-3 transition hover:bg-rose-100">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-rose-800">#{tag.name}</span>
                            <span className="text-xs font-black text-rose-600">{tag.accuracy}%</span>
                        </div>
                        <div className="mt-2">
                            <ProgressBar value={getProgress(tag)} barClassName="bg-rose-600" />
                        </div>
                    </Link>
                ))}
            </div>
        </SidePanel>
    );
}

function LearningPathPanel() {
    const path = [
        { label: "구현", href: "/tags/implementation", icon: Code2 },
        { label: "스택 / 큐", href: "/tags/stack", icon: Database },
        { label: "BFS", href: "/tags/bfs", icon: Route },
        { label: "DP", href: "/tags/dp", icon: Target }
    ];

    return (
        <SidePanel title="추천 학습 흐름" badge={<Compass className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {path.map((item, index) => {
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                                <Icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800">{index + 1}. {item.label}</p>
                                <p className="mt-0.5 text-xs font-bold text-slate-400">단계별 태그 학습</p>
                            </div>
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

export default function TagsPage() {
    const [tags, setTags] = useState<TagItem[]>([]);

    useEffect(() => {
        let ignore = false;

        async function loadDbData() {
            try {
                const response = await fetch("/api/tags", { cache: "no-store" });
                if (!response.ok) return;

                const data = await response.json();
                const items = Array.isArray(data.tags) ? data.tags : [];
                if (ignore) return;

                setTags(items as TagItem[]);
            } catch (error) {
                console.error("Failed to load /api/tags", error);
            }
        }

        void loadDbData();

        return () => {
            ignore = true;
        };
    }, []);

    const [keyword, setKeyword] = useState("");
    const [category, setCategory] = useState<TagCategory>("전체");
    const [difficulty, setDifficulty] = useState<DifficultyFilter>("전체");
    const [status, setStatus] = useState<TagStatusFilter>("전체");
    const [sort, setSort] = useState<SortOption>("recommended");
    const [viewMode, setViewMode] = useState<ViewMode>("card");

    const filteredTags = useMemo(() => {
        const lowerKeyword = keyword.trim().toLowerCase();

        const result = tags.filter((tag) => {
            const matchesKeyword =
                !lowerKeyword ||
                tag.name.toLowerCase().includes(lowerKeyword) ||
                tag.slug.toLowerCase().includes(lowerKeyword) ||
                tag.description.toLowerCase().includes(lowerKeyword) ||
                tag.category.toLowerCase().includes(lowerKeyword) ||
                tag.relatedTags.some((related) => related.toLowerCase().includes(lowerKeyword)) ||
                tag.representativeProblems.some((problem) => problem.title.toLowerCase().includes(lowerKeyword));

            const matchesCategory = category === "전체" || tag.category === category;
            const matchesDifficulty = difficulty === "전체" || tag.difficulty === difficulty;
            const matchesStatus =
                status === "전체" ||
                (status === "추천" ? tag.recommended : tag.status === statusLabelToValue[status]);

            return matchesKeyword && matchesCategory && matchesDifficulty && matchesStatus;
        });

        return result.sort((a, b) => {
            switch (sort) {
                case "solved-desc":
                    return b.solvedProblems - a.solvedProblems;
                case "total-desc":
                    return b.totalProblems - a.totalProblems;
                case "accuracy-desc":
                    return b.accuracy - a.accuracy;
                case "accuracy-asc":
                    return a.accuracy - b.accuracy;
                case "recent":
                    return b.updatedAt.localeCompare(a.updatedAt);
                case "recommended":
                default:
                    return Number(b.recommended) - Number(a.recommended) || Number(b.featured) - Number(a.featured) || b.updatedAt.localeCompare(a.updatedAt);
            }
        });
    }, [keyword, category, difficulty, status, sort]);

    const totalProblems = tags.reduce((sum, tag) => sum + tag.totalProblems, 0);
    const solvedProblems = tags.reduce((sum, tag) => sum + tag.solvedProblems, 0);
    const weakCount = tags.filter((tag) => tag.status === "weak").length;
    const strongCount = tags.filter((tag) => tag.status === "strong").length;
    const featuredTags = tags.filter((tag) => tag.featured).slice(0, 3);
    const weakTags = tags.filter((tag) => tag.status === "weak").sort((a, b) => a.accuracy - b.accuracy).slice(0, 4);
    const totalProgress = Math.round((solvedProblems / Math.max(totalProblems, 1)) * 100);
    const averageAccuracy = Math.round((tags.reduce((sum, tag) => sum + tag.accuracy, 0) / tags.length) * 10) / 10;

    const resetFilters = () => {
        setKeyword("");
        setCategory("전체");
        setDifficulty("전체");
        setStatus("전체");
        setSort("recommended");
    };

    return (
        <AppShell title="태그" description="알고리즘 태그별 문제와 학습 상태를 확인합니다.">
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Badge variant="blue">Tags</Badge>
                            <Badge>Algorithm Map</Badge>
                            <Badge variant="amber">Featured {featuredTags.length}</Badge>
                        </>
                    }
                    title="태그별로 약점과 강점을 정리하세요."
                    description="문제 태그를 기준으로 해결 수, 정답률, 오답 수, 복습 필요 여부를 확인하고 다음 학습 방향을 잡을 수 있습니다."
                    icon={Hash}
                    rightTitle="전체 진행률"
                    rightValue={`${totalProgress}%`}
                    rightCaption={`${solvedProblems} / ${totalProblems} 문제 해결`}
                    metrics={[
                        { label: "태그", value: `${tags.length}` },
                        { label: "강점", value: `${strongCount}` },
                        { label: "약점", value: `${weakCount}` }
                    ]}
                    actions={
                        <>
                            <AppLinkButton href="/tags/bfs" variant="primary" size="lg" iconRight={ArrowRight}>추천 태그 시작</AppLinkButton>
                            <AppLinkButton href="/problems" variant="white" size="lg" icon={BookOpen}>전체 문제 보기</AppLinkButton>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="전체 태그" value={tags.length.toLocaleString()} caption="학습 태그 수" icon={Hash} />
                    <StatCard label="전체 문제" value={totalProblems.toLocaleString()} caption="태그 기준 중복 포함" icon={Database} tone="blue" />
                    <StatCard label="평균 정답률" value={`${averageAccuracy}%`} caption="태그별 평균" icon={Gauge} tone="orange" />
                    <StatCard label="복습 필요" value={weakCount.toLocaleString()} caption="약점 태그" icon={Flame} tone="red" />
                </section>

                <section>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-xl font-black text-slate-950">추천 태그</h3>
                            <p className="mt-1 text-sm text-slate-500">현재 학습 흐름에서 먼저 보면 좋은 대표 태그입니다.</p>
                        </div>
                        <Sparkles className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="grid gap-4 xl:grid-cols-3">
                        {featuredTags.map((tag) => <FeaturedTagCard key={tag.slug} tag={tag} />)}
                    </div>
                </section>

                <FilterPanel
                    title="태그 검색 / 필터"
                    onReset={resetFilters}
                    gridClassName="grid gap-3 xl:grid-cols-[1.4fr_150px_150px_150px_190px_auto] xl:items-end"
                >
                    <SearchInput value={keyword} onChange={setKeyword} placeholder="태그명, slug, 설명, 관련 태그, 대표 문제 검색" />
                    <FilterSelect label="분류" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
                    <FilterSelect label="난이도" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} />
                    <FilterSelect label="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                    <FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} />
                </FilterPanel>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-4">
                        <ListHeader
                            title="태그 목록"
                            description={`검색 조건에 맞는 태그 ${filteredTags.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`}
                            right={<ViewModeToggle value={viewMode} onChange={setViewMode} />}
                        />

                        {filteredTags.length === 0 ? (
                            <EmptyState
                                title="태그를 찾을 수 없습니다."
                                description="검색어 또는 필터 조건을 변경해보세요."
                                icon={Search}
                                onReset={resetFilters}
                            />
                        ) : viewMode === "card" ? (
                            <div className="space-y-4">
                                {filteredTags.map((tag) => <TagCard key={tag.slug} tag={tag} />)}
                            </div>
                        ) : (
                            <TagsTable items={filteredTags} />
                        )}
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="태그 학습률" badge={<BarChart3 className="h-5 w-5 text-blue-600" />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">전체 진행률</p>
                                <p className="mt-1 text-5xl font-black">{totalProgress}%</p>
                                <ProgressBar value={totalProgress} className="mt-5 bg-white/10" />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="해결" value={`${solvedProblems}`} />
                                <MiniStat label="전체" value={`${totalProblems}`} />
                                <MiniStat label="강점" value={`${strongCount}`} />
                            </div>
                        </SidePanel>

                        <WeakTagPanel weakTags={weakTags} />
                        <LearningPathPanel />
                        <CategoryPanel />

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href="/problems" label="전체 문제" icon={BookOpen} />
                                <QuickLink href="/sets" label="문제 세트" icon={Layers3} />
                                <QuickLink href="/notes" label="오답노트" icon={NotebookPen} />
                                <QuickLink href="/goals" label="학습 목표" icon={Target} />
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
