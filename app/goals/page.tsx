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
    ArrowRight,
    BarChart3,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Edit3,
    Flame,
    Gauge,
    Hash,
    History,
    Layers3,
    ListChecks,
    NotebookPen,
    PauseCircle,
    Play,
    Plus,
    RefreshCcw,
    RotateCcw,
    Search,
    Settings,
    Sparkles,
    Star,
    Target,
    Terminal,
    Timer,
    Trophy,
    Zap
} from "lucide-react";

type GoalType = "problems" | "study-time" | "streak" | "tag" | "test" | "review";
type GoalTypeFilter = "전체" | "문제" | "학습 시간" | "연속 학습" | "태그" | "테스트" | "복습";
type GoalStatus = "active" | "completed" | "paused" | "failed";
type GoalStatusFilter = "전체" | "진행 중" | "완료" | "보류" | "실패";
type GoalPeriod = "daily" | "weekly" | "monthly" | "custom";
type GoalPeriodFilter = "전체" | "일간" | "주간" | "월간" | "사용자 지정";
type Priority = "low" | "medium" | "high";
type SortOption = "deadline" | "progress-desc" | "progress-asc" | "priority" | "created" | "title";

type GoalItem = {
    id: string;
    title: string;
    description: string;
    type: GoalType;
    status: GoalStatus;
    period: GoalPeriod;
    priority: Priority;
    current: number;
    target: number;
    unit: string;
    startAt: string;
    startAtText: string;
    dueAt: string;
    dueAtText: string;
    createdAt: string;
    createdAtText: string;
    updatedAt: string;
    updatedAtText: string;
    href: string;
    tags: string[];
    memo: string;
};

type GoalMilestone = {
    id: string;
    title: string;
    description: string;
    done: boolean;
    href: string;
};

type GoalActivity = {
    day: string;
    value: number;
    target: number;
};

const goals: GoalItem[] = [
    {
        id: "weekly-solve-25",
        title: "이번 주 25문제 풀기",
        description: "주간 목표 문제 수를 채워 풀이 리듬을 유지합니다.",
        type: "problems",
        status: "active",
        period: "weekly",
        priority: "high",
        current: 18,
        target: 25,
        unit: "문제",
        startAt: "2026-04-27",
        startAtText: "2026.04.27",
        dueAt: "2026-05-03",
        dueAtText: "2026.05.03",
        createdAt: "2026-04-27T09:00:00",
        createdAtText: "2026.04.27",
        updatedAt: "2026-05-03T12:20:00",
        updatedAtText: "2026.05.03 12:20",
        href: "/problems",
        tags: ["Weekly", "Problems", "Routine"],
        memo: "7문제 남음. 쉬운 구현 2문제 + BFS 3문제 + DP 2문제 추천"
    },
    {
        id: "daily-study-90",
        title: "하루 90분 학습",
        description: "문제 풀이와 오답 정리를 합쳐 하루 학습 시간을 채웁니다.",
        type: "study-time",
        status: "active",
        period: "daily",
        priority: "medium",
        current: 72,
        target: 90,
        unit: "분",
        startAt: "2026-05-03",
        startAtText: "2026.05.03",
        dueAt: "2026-05-03",
        dueAtText: "2026.05.03",
        createdAt: "2026-05-01T08:00:00",
        createdAtText: "2026.05.01",
        updatedAt: "2026-05-03T12:00:00",
        updatedAtText: "2026.05.03 12:00",
        href: "/dashboard",
        tags: ["Daily", "Study Time"],
        memo: "18분만 더 하면 오늘 목표 달성"
    },
    {
        id: "streak-30-days",
        title: "30일 연속 학습",
        description: "매일 최소 1문제 풀이 또는 오답노트 작성을 기록합니다.",
        type: "streak",
        status: "active",
        period: "custom",
        priority: "high",
        current: 14,
        target: 30,
        unit: "일",
        startAt: "2026-04-20",
        startAtText: "2026.04.20",
        dueAt: "2026-05-19",
        dueAtText: "2026.05.19",
        createdAt: "2026-04-20T07:30:00",
        createdAtText: "2026.04.20",
        updatedAt: "2026-05-03T12:30:00",
        updatedAtText: "2026.05.03 12:30",
        href: "/dashboard",
        tags: ["Streak", "Habit"],
        memo: "연속 기록 유지 중. 오늘은 이미 조건 달성"
    },
    {
        id: "bfs-10-problems",
        title: "BFS 10문제 마무리",
        description: "격자 BFS, 다중 시작점 BFS, 최단거리 BFS를 집중 복습합니다.",
        type: "tag",
        status: "active",
        period: "weekly",
        priority: "high",
        current: 6,
        target: 10,
        unit: "문제",
        startAt: "2026-04-29",
        startAtText: "2026.04.29",
        dueAt: "2026-05-05",
        dueAtText: "2026.05.05",
        createdAt: "2026-04-29T10:00:00",
        createdAtText: "2026.04.29",
        updatedAt: "2026-05-03T11:38:00",
        updatedAtText: "2026.05.03 11:38",
        href: "/tags/bfs",
        tags: ["BFS", "Graph", "Queue"],
        memo: "토마토, 미로 탐색, 숨바꼭질 순서로 복습"
    },
    {
        id: "dp-review-5",
        title: "DP 오답 5개 정리",
        description: "DP 오답 문제의 상태 정의와 점화식을 오답노트에 정리합니다.",
        type: "review",
        status: "active",
        period: "weekly",
        priority: "high",
        current: 2,
        target: 5,
        unit: "개",
        startAt: "2026-05-01",
        startAtText: "2026.05.01",
        dueAt: "2026-05-07",
        dueAtText: "2026.05.07",
        createdAt: "2026-05-01T09:00:00",
        createdAtText: "2026.05.01",
        updatedAt: "2026-05-03T13:40:00",
        updatedAtText: "2026.05.03 13:40",
        href: "/notes",
        tags: ["DP", "Review", "Wrong Answer"],
        memo: "평범한 배낭 갱신 방향 정리는 완료. LIS 복습 추가 필요"
    },
    {
        id: "mock-test-2-times",
        title: "모의 테스트 2회 응시",
        description: "실전 시간 관리 연습을 위해 이번 달 모의 테스트를 2회 이상 응시합니다.",
        type: "test",
        status: "active",
        period: "monthly",
        priority: "medium",
        current: 1,
        target: 2,
        unit: "회",
        startAt: "2026-05-01",
        startAtText: "2026.05.01",
        dueAt: "2026-05-31",
        dueAtText: "2026.05.31",
        createdAt: "2026-05-01T08:30:00",
        createdAtText: "2026.05.01",
        updatedAt: "2026-05-03T10:52:00",
        updatedAtText: "2026.05.03 10:52",
        href: "/tests",
        tags: ["Mock Test", "Monthly"],
        memo: "실전 코딩테스트 1회차 완료. 다음은 자료구조 중간 점검 추천"
    },
    {
        id: "beginner-set-complete",
        title: "입문 세트 완료",
        description: "기초 구현과 문자열 세트를 모두 완료합니다.",
        type: "problems",
        status: "completed",
        period: "custom",
        priority: "low",
        current: 20,
        target: 20,
        unit: "문제",
        startAt: "2026-04-01",
        startAtText: "2026.04.01",
        dueAt: "2026-04-30",
        dueAtText: "2026.04.30",
        createdAt: "2026-04-01T09:00:00",
        createdAtText: "2026.04.01",
        updatedAt: "2026-04-30T22:10:00",
        updatedAtText: "2026.04.30 22:10",
        href: "/sets",
        tags: ["Beginner", "Implementation"],
        memo: "기초 입출력과 문자열 반복까지 완료"
    }
];

const DEFAULT_goals = goals;

const milestones: GoalMilestone[] = [
    {
        id: "m1",
        title: "오늘 학습 시간 90분 채우기",
        description: "18분만 더 진행하면 오늘 목표를 달성합니다.",
        done: false,
        href: "/problems"
    },
    {
        id: "m2",
        title: "토마토 다시 풀기",
        description: "다중 시작점 BFS 실수를 복습합니다.",
        done: false,
        href: "/problems/7576/solve"
    },
    {
        id: "m3",
        title: "DP 오답노트 1개 추가",
        description: "평범한 배낭 풀이 실수를 정리합니다.",
        done: true,
        href: "/notes"
    }
];

const weeklyActivity: GoalActivity[] = [
    { day: "월", value: 2, target: 3 },
    { day: "화", value: 3, target: 3 },
    { day: "수", value: 4, target: 3 },
    { day: "목", value: 1, target: 3 },
    { day: "금", value: 4, target: 3 },
    { day: "토", value: 0, target: 3 },
    { day: "일", value: 4, target: 4 }
];

const TYPE_OPTIONS: readonly GoalTypeFilter[] = ["전체", "문제", "학습 시간", "연속 학습", "태그", "테스트", "복습"];
const STATUS_OPTIONS: readonly GoalStatusFilter[] = ["전체", "진행 중", "완료", "보류", "실패"];
const PERIOD_OPTIONS: readonly GoalPeriodFilter[] = ["전체", "일간", "주간", "월간", "사용자 지정"];
const SORT_OPTIONS: readonly SortOption[] = ["deadline", "progress-desc", "progress-asc", "priority", "created", "title"];

const typeLabelToValue: Record<Exclude<GoalTypeFilter, "전체">, GoalType> = {
    문제: "problems",
    "학습 시간": "study-time",
    "연속 학습": "streak",
    태그: "tag",
    테스트: "test",
    복습: "review"
};

const statusLabelToValue: Record<Exclude<GoalStatusFilter, "전체">, GoalStatus> = {
    "진행 중": "active",
    완료: "completed",
    보류: "paused",
    실패: "failed"
};

const periodLabelToValue: Record<Exclude<GoalPeriodFilter, "전체">, GoalPeriod> = {
    일간: "daily",
    주간: "weekly",
    월간: "monthly",
    "사용자 지정": "custom"
};

const sortLabels: Record<SortOption, string> = {
    deadline: "마감 임박순",
    "progress-desc": "진행률 높은순",
    "progress-asc": "진행률 낮은순",
    priority: "우선순위순",
    created: "생성일순",
    title: "이름순"
};

const goalTypeMeta: Record<GoalType, { label: string; variant: "default" | "blue" | "green" | "orange" | "purple" | "red"; icon: ComponentType<{ className?: string }> }> = {
    problems: { label: "문제", variant: "blue", icon: BookOpen },
    "study-time": { label: "학습 시간", variant: "orange", icon: Timer },
    streak: { label: "연속 학습", variant: "red", icon: Flame },
    tag: { label: "태그", variant: "purple", icon: Hash },
    test: { label: "테스트", variant: "green", icon: Terminal },
    review: { label: "복습", variant: "default", icon: NotebookPen }
};

const goalStatusMeta: Record<GoalStatus, { label: string; variant: "default" | "blue" | "green" | "orange" | "red"; icon: ComponentType<{ className?: string }> }> = {
    active: { label: "진행 중", variant: "blue", icon: Play },
    completed: { label: "완료", variant: "green", icon: CheckCircle2 },
    paused: { label: "보류", variant: "orange", icon: PauseCircle },
    failed: { label: "실패", variant: "red", icon: RotateCcw }
};

const periodMeta: Record<GoalPeriod, { label: string; variant: "default" | "blue" | "green" | "orange" }> = {
    daily: { label: "일간", variant: "blue" },
    weekly: { label: "주간", variant: "green" },
    monthly: { label: "월간", variant: "orange" },
    custom: { label: "사용자 지정", variant: "default" }
};

const priorityMeta: Record<Priority, { label: string; variant: "default" | "orange" | "red"; order: number }> = {
    high: { label: "중요", variant: "red", order: 1 },
    medium: { label: "보통", variant: "orange", order: 2 },
    low: { label: "낮음", variant: "default", order: 3 }
};

function getProgress(goal: GoalItem) {
    return Math.min(100, Math.round((goal.current / Math.max(goal.target, 1)) * 100));
}

function getRemaining(goal: GoalItem) {
    return Math.max(goal.target - goal.current, 0);
}

function GoalTypeBadge({ type }: { type: GoalType }) {
    const meta = goalTypeMeta[type];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function GoalStatusBadge({ status }: { status: GoalStatus }) {
    const meta = goalStatusMeta[status];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function GoalCard({ goal }: { goal: GoalItem }) {
    const progress = getProgress(goal);
    const TypeIcon = goalTypeMeta[goal.type].icon;
    const priority = priorityMeta[goal.priority];
    const period = periodMeta[goal.period];

    return (
        <Card hover className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <GoalTypeBadge type={goal.type} />
                        <GoalStatusBadge status={goal.status} />
                        <Badge variant={period.variant}>{period.label}</Badge>
                        <Badge variant={priority.variant}>{priority.label}</Badge>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                            <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <Link href={goal.href} className="text-xl font-black tracking-tight text-slate-950 transition hover:text-blue-600">
                                {goal.title}
                            </Link>
                            <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-500">{goal.description}</p>
                        </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600">
                        <span className="font-black text-slate-950">메모:</span> {goal.memo}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {goal.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>)}
                    </div>
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[360px]">
                    <MetricBox label="현재" value={`${goal.current}${goal.unit}`} />
                    <MetricBox label="목표" value={`${goal.target}${goal.unit}`} />
                    <MetricBox label="남음" value={`${getRemaining(goal)}${goal.unit}`} />
                    <MetricBox label="마감" value={goal.dueAtText} />
                </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm font-black">
                    <span className="text-slate-600">진행률</span>
                    <span className="text-blue-600">{progress}%</span>
                </div>
                <ProgressBar value={progress} barClassName={progress >= 100 ? "bg-emerald-600" : progress >= 70 ? "bg-blue-600" : progress >= 40 ? "bg-orange-500" : "bg-rose-600"} />
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-bold text-slate-400">
                    {goal.startAtText} 시작 · 최근 업데이트 {goal.updatedAtText}
                </div>
                <div className="flex flex-wrap gap-2">
                    <AppButton variant="secondary" icon={Edit3}>수정</AppButton>
                    <AppLinkButton href={goal.href} variant="primary" iconRight={ArrowRight}>목표 진행</AppLinkButton>
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

function GoalsTable({ items }: { items: GoalItem[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1160px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">목표</th>
                        <th className="px-5 py-4">유형</th>
                        <th className="px-5 py-4">상태</th>
                        <th className="px-5 py-4">기간</th>
                        <th className="px-5 py-4">우선순위</th>
                        <th className="px-5 py-4 text-right">현재</th>
                        <th className="px-5 py-4 text-right">목표</th>
                        <th className="px-5 py-4 text-right">진행률</th>
                        <th className="px-5 py-4">마감</th>
                        <th className="px-5 py-4" />
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {items.map((goal) => {
                        const priority = priorityMeta[goal.priority];
                        const period = periodMeta[goal.period];
                        const progress = getProgress(goal);

                        return (
                            <tr key={goal.id} className="transition hover:bg-slate-50">
                                <td className="px-5 py-4">
                                    <Link href={goal.href} className="font-black text-slate-950 transition hover:text-blue-600">{goal.title}</Link>
                                    <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-400">{goal.memo}</p>
                                </td>
                                <td className="px-5 py-4"><GoalTypeBadge type={goal.type} /></td>
                                <td className="px-5 py-4"><GoalStatusBadge status={goal.status} /></td>
                                <td className="px-5 py-4"><Badge variant={period.variant}>{period.label}</Badge></td>
                                <td className="px-5 py-4"><Badge variant={priority.variant}>{priority.label}</Badge></td>
                                <td className="px-5 py-4 text-right font-bold text-slate-600">{goal.current}{goal.unit}</td>
                                <td className="px-5 py-4 text-right font-bold text-slate-600">{goal.target}{goal.unit}</td>
                                <td className="px-5 py-4 text-right font-black text-blue-600">{progress}%</td>
                                <td className="px-5 py-4 font-bold text-slate-500">{goal.dueAtText}</td>
                                <td className="px-5 py-4 text-right">
                                    <AppLinkButton href={goal.href} size="sm" iconRight={ChevronRight}>진행</AppLinkButton>
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

function GoalActivityChart({ items }: { items: GoalActivity[] }) {
    const maxValue = Math.max(...items.map((item) => item.target), ...items.map((item) => item.value), 1);

    return (
        <Card className="p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-xl font-black text-slate-950">주간 목표 달성</h3>
                    <p className="mt-1 text-sm text-slate-500">요일별 실제 해결 수와 목표 문제 수를 비교합니다.</p>
                </div>
                <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>

            <div className="grid h-56 grid-cols-7 items-end gap-3">
                {items.map((item) => {
                    const valueHeight = Math.max(8, Math.round((item.value / maxValue) * 100));
                    const targetHeight = Math.max(8, Math.round((item.target / maxValue) * 100));

                    return (
                        <div key={item.day} className="flex h-full flex-col items-center justify-end gap-2">
                            <div className="relative flex h-full w-full items-end rounded-2xl bg-slate-50 p-1">
                                <div className="absolute left-1 right-1 rounded-xl border-t-2 border-dashed border-slate-400" style={{ bottom: `${targetHeight}%` }} />
                                <div className="w-full rounded-xl bg-blue-600" style={{ height: `${valueHeight}%` }} />
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-black text-slate-950">{item.day}</p>
                                <p className="text-[11px] font-bold text-slate-400">{item.value}/{item.target}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

function MilestonesPanel() {
    return (
        <SidePanel title="오늘의 마일스톤" badge={<ListChecks className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {milestones.map((item) => (
                    <Link key={item.id} href={item.href} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-400"}`}>
                            {item.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-800">{item.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs font-bold leading-5 text-slate-400">{item.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </SidePanel>
    );
}

function GoalTypePanel({ items }: { items: GoalItem[] }) {
    const types: GoalType[] = ["problems", "study-time", "streak", "tag", "test", "review"];
    const total = Math.max(items.length, 1);

    return (
        <SidePanel title="유형별 목표" badge={<Target className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-4">
                {types.map((type) => {
                    const meta = goalTypeMeta[type];
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

function UrgentGoalsPanel({ items }: { items: GoalItem[] }) {
    const urgent = [...items]
        .filter((item) => item.status === "active")
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
        .slice(0, 4);

    return (
        <SidePanel title="마감 임박 목표" badge={<Flame className="h-5 w-5 text-rose-600" />}>
            <div className="space-y-2">
                {urgent.map((goal) => (
                    <Link key={goal.id} href={goal.href} className="block rounded-2xl bg-rose-50 px-4 py-3 transition hover:bg-rose-100">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="truncate text-sm font-black text-rose-900">{goal.title}</span>
                            <span className="text-xs font-black text-rose-600">{goal.dueAtText}</span>
                        </div>
                        <ProgressBar value={getProgress(goal)} barClassName="bg-rose-600" />
                    </Link>
                ))}
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

export default function GoalsPage() {
    const [goals, setGoals] = useState<GoalItem[]>([]);

    useEffect(() => {
        let ignore = false;

        async function loadDbData() {
            try {
                const response = await fetch("/api/goals", { cache: "no-store" });
                if (!response.ok) return;

                const data = await response.json();
                const items = Array.isArray(data.goals) ? data.goals : [];
                if (ignore) return;

                setGoals(items as GoalItem[]);
            } catch (error) {
                console.error("Failed to load /api/goals", error);
            }
        }

        void loadDbData();

        return () => {
            ignore = true;
        };
    }, []);

    const [keyword, setKeyword] = useState("");
    const [type, setType] = useState<GoalTypeFilter>("전체");
    const [status, setStatus] = useState<GoalStatusFilter>("전체");
    const [period, setPeriod] = useState<GoalPeriodFilter>("전체");
    const [sort, setSort] = useState<SortOption>("deadline");
    const [viewMode, setViewMode] = useState<ViewMode>("card");

    const filteredGoals = useMemo(() => {
        const lowerKeyword = keyword.trim().toLowerCase();

        const result = goals.filter((goal) => {
            const matchesKeyword =
                !lowerKeyword ||
                goal.title.toLowerCase().includes(lowerKeyword) ||
                goal.description.toLowerCase().includes(lowerKeyword) ||
                goal.memo.toLowerCase().includes(lowerKeyword) ||
                goal.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword));

            const matchesType = type === "전체" || goal.type === typeLabelToValue[type];
            const matchesStatus = status === "전체" || goal.status === statusLabelToValue[status];
            const matchesPeriod = period === "전체" || goal.period === periodLabelToValue[period];

            return matchesKeyword && matchesType && matchesStatus && matchesPeriod;
        });

        return result.sort((a, b) => {
            switch (sort) {
                case "progress-desc":
                    return getProgress(b) - getProgress(a);
                case "progress-asc":
                    return getProgress(a) - getProgress(b);
                case "priority":
                    return priorityMeta[a.priority].order - priorityMeta[b.priority].order;
                case "created":
                    return b.createdAt.localeCompare(a.createdAt);
                case "title":
                    return a.title.localeCompare(b.title);
                case "deadline":
                default:
                    return a.dueAt.localeCompare(b.dueAt);
            }
        });
    }, [keyword, type, status, period, sort]);

    const activeGoals = goals.filter((goal) => goal.status === "active");
    const completedGoals = goals.filter((goal) => goal.status === "completed");
    const highPriorityGoals = goals.filter((goal) => goal.priority === "high");
    const averageProgress = Math.round(goals.reduce((sum, goal) => sum + getProgress(goal), 0) / Math.max(goals.length, 1));
    const weeklyGoal = goals.find((goal) => goal.id === "weekly-solve-25") ?? goals[0] ?? null;
    const dailyGoal = goals.find((goal) => goal.id === "daily-study-90") ?? goals[0] ?? null;
    const highlightedGoals = [weeklyGoal, dailyGoal, goals.find((goal) => goal.id === "bfs-10-problems") ?? null].filter(Boolean) as GoalItem[];

    const resetFilters = () => {
        setKeyword("");
        setType("전체");
        setStatus("전체");
        setPeriod("전체");
        setSort("deadline");
    };

    return (
        <AppShell title="학습 목표" description="문제 풀이, 학습 시간, 태그 복습, 모의 테스트 목표를 관리합니다.">
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Badge variant="blue">Goals</Badge>
                            <Badge>Study Plan</Badge>
                            <Badge variant="green">Active {activeGoals.length}</Badge>
                        </>
                    }
                    title="목표를 작게 나누고 꾸준히 달성하세요."
                    description="주간 문제 수, 하루 학습 시간, 연속 학습, 태그별 복습, 모의 테스트 응시 목표를 관리합니다."
                    icon={Target}
                    rightTitle="평균 진행률"
                    rightValue={`${averageProgress}%`}
                    rightCaption={`진행 중 ${activeGoals.length}개 · 완료 ${completedGoals.length}개`}
                    metrics={[
                        { label: "전체", value: `${goals.length}` },
                        { label: "중요", value: `${highPriorityGoals.length}` },
                        { label: "완료", value: `${completedGoals.length}` }
                    ]}
                    actions={
                        <>
                            <AppButton variant="primary" size="lg" icon={Plus}>목표 추가</AppButton>
                            <AppLinkButton href="/dashboard" variant="white" size="lg" icon={Gauge}>대시보드</AppLinkButton>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="진행 중 목표" value={activeGoals.length.toLocaleString()} caption="현재 추적 중" icon={Play} tone="blue" />
                    <StatCard label="평균 진행률" value={`${averageProgress}%`} caption="전체 목표 기준" icon={Gauge} tone="green" />
                    <StatCard label="주간 문제 목표" value={weeklyGoal ? `${weeklyGoal.current}/${weeklyGoal.target}` : "0/0"} caption={weeklyGoal ? `${getProgress(weeklyGoal)}% 달성` : "DB 목표 없음"} icon={BookOpen} tone="orange" />
                    <StatCard label="오늘 학습 시간" value={dailyGoal ? `${dailyGoal.current}분` : "0분"} caption={dailyGoal ? `${dailyGoal.target}분 목표` : "DB 목표 없음"} icon={Timer} tone="red" />
                </section>

                <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
                    <GoalActivityChart items={weeklyActivity} />

                    <Card className="p-5">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-xl font-black text-slate-950">핵심 목표</h3>
                                <p className="mt-1 text-sm text-slate-500">오늘 가장 먼저 보면 좋은 목표입니다.</p>
                            </div>
                            <Sparkles className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="space-y-3">
                            {highlightedGoals.map((goal) => (
                                <Link key={goal.id} href={goal.href} className="block rounded-2xl bg-slate-50 p-4 transition hover:bg-blue-50">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <p className="font-black text-slate-950">{goal.title}</p>
                                        <Badge variant="blue">{getProgress(goal)}%</Badge>
                                    </div>
                                    <ProgressBar value={getProgress(goal)} />
                                    <p className="mt-2 text-xs font-bold text-slate-400">{goal.current}/{goal.target}{goal.unit} · 마감 {goal.dueAtText}</p>
                                </Link>
                            ))}
                        </div>
                    </Card>
                </section>

                <FilterPanel
                    title="목표 검색 / 필터"
                    onReset={resetFilters}
                    gridClassName="grid gap-3 xl:grid-cols-[1.4fr_150px_150px_150px_190px_auto] xl:items-end"
                >
                    <SearchInput value={keyword} onChange={setKeyword} placeholder="목표명, 설명, 메모, 태그 검색" />
                    <FilterSelect label="유형" value={type} onChange={setType} options={TYPE_OPTIONS} />
                    <FilterSelect label="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                    <FilterSelect label="기간" value={period} onChange={setPeriod} options={PERIOD_OPTIONS} />
                    <FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} />
                </FilterPanel>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-4">
                        <ListHeader
                            title="목표 목록"
                            description={`검색 조건에 맞는 목표 ${filteredGoals.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`}
                            right={<ViewModeToggle value={viewMode} onChange={setViewMode} />}
                        />

                        {filteredGoals.length === 0 ? (
                            <EmptyState
                                title="목표를 찾을 수 없습니다."
                                description="검색어 또는 필터 조건을 변경해보세요."
                                icon={Search}
                                onReset={resetFilters}
                            />
                        ) : viewMode === "card" ? (
                            <div className="space-y-4">
                                {filteredGoals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
                            </div>
                        ) : (
                            <GoalsTable items={filteredGoals} />
                        )}
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="목표 요약" badge={<Gauge className="h-5 w-5 text-blue-600" />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">전체 진행률</p>
                                <p className="mt-1 text-5xl font-black">{averageProgress}%</p>
                                <ProgressBar value={averageProgress} className="mt-5 bg-white/10" />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="진행" value={`${activeGoals.length}`} />
                                <MiniStat label="완료" value={`${completedGoals.length}`} />
                                <MiniStat label="중요" value={`${highPriorityGoals.length}`} />
                            </div>
                        </SidePanel>

                        <MilestonesPanel />
                        <UrgentGoalsPanel items={goals} />
                        <GoalTypePanel items={goals} />

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href="/dashboard" label="대시보드" icon={Gauge} />
                                <QuickLink href="/problems" label="문제 풀기" icon={BookOpen} />
                                <QuickLink href="/tests" label="모의 테스트" icon={Terminal} />
                                <QuickLink href="/tags" label="태그 복습" icon={Hash} />
                                <QuickLink href="/notes" label="오답노트" icon={NotebookPen} />
                                <QuickLink href="/settings" label="목표 설정" icon={Settings} />
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
