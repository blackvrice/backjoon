"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import AppShell from "@/components/layout/AppShell";
import {
    AppButton,
    AppLinkButton,
    Badge,
    Card,
    EmptyState,
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
    SubmissionStatusBadge,
    type SubmissionStatus
} from "@/components/domain";
import {
    Activity,
    AlertTriangle,
    BookOpen,
    Bug,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Cpu,
    Database,
    FileText,
    Gauge,
    HardDrive,
    History,
    ListChecks,
    Plus,
    RefreshCcw,
    Search,
    Server,
    Settings,
    ShieldAlert,
    ShieldCheck,
    Timer,
    Trophy,
    UserCog,
    UsersRound,
    Wrench,
    Zap
} from "lucide-react";

type AdminModule = "problems" | "users" | "submissions" | "judge" | "logs" | "data" | "settings";
type ModuleStatus = "healthy" | "warning" | "critical" | "syncing";
type ModuleStatusFilter = "전체" | "정상" | "주의" | "위험" | "동기화 중";
type QueueStatus = "running" | "waiting" | "failed" | "done";
type QueueStatusFilter = "전체" | "실행 중" | "대기" | "실패" | "완료";
type SortOption = "priority" | "recent" | "status" | "count-desc" | "name";

type AdminStats = {
    totalProblems: number;
    activeUsers: number;
    todaySubmissions: number;
    acceptedRate: number;
    judgeQueue: number;
    failedJobs: number;
    systemHealth: number;
    storageUsage: number;
    pendingReviews: number;
    adminAlerts: number;
};

type AdminModuleItem = {
    id: AdminModule;
    title: string;
    description: string;
    href: string;
    status: ModuleStatus;
    count: number;
    countLabel: string;
    updatedAt: string;
    updatedAtText: string;
    priority: number;
    icon: ComponentType<{ className?: string }>;
    actions: Array<{
        label: string;
        href: string;
    }>;
};

type JudgeQueueItem = {
    id: string;
    submissionId: number;
    problemId: number;
    user: string;
    language: string;
    status: QueueStatus;
    worker: string;
    elapsedMs: number;
    createdAtText: string;
};

type RecentAdminSubmission = {
    id: number;
    problemId: number;
    problemTitle: string;
    user: string;
    status: SubmissionStatus;
    language: string;
    time: string;
    memory: string;
    submittedAt: string;
};

type AdminLogItem = {
    id: string;
    level: "info" | "warning" | "error";
    source: string;
    message: string;
    createdAtText: string;
    href: string;
};

type SystemMetric = {
    label: string;
    value: number;
    caption: string;
    icon: ComponentType<{ className?: string }>;
};

const adminStats: AdminStats = {
    totalProblems: 2481,
    activeUsers: 342,
    todaySubmissions: 1184,
    acceptedRate: 73.8,
    judgeQueue: 13,
    failedJobs: 3,
    systemHealth: 91,
    storageUsage: 62,
    pendingReviews: 17,
    adminAlerts: 4
};

const adminModules: AdminModuleItem[] = [
    {
        id: "problems",
        title: "문제 관리",
        description: "문제 등록, 수정, 테스트 케이스, 태그, 공개 상태를 관리합니다.",
        href: "/admin/problems",
        status: "healthy",
        count: 2481,
        countLabel: "문제",
        updatedAt: "2026-05-03T12:30:00",
        updatedAtText: "2026.05.03 12:30",
        priority: 2,
        icon: BookOpen,
        actions: [
            { label: "문제 추가", href: "/admin/problems/new" },
            { label: "검수 대기", href: "/admin/problems?status=review" }
        ]
    },
    {
        id: "users",
        title: "사용자 관리",
        description: "회원, 권한, 정지 상태, 관리자 역할, 최근 활동을 확인합니다.",
        href: "/admin/users",
        status: "healthy",
        count: 342,
        countLabel: "사용자",
        updatedAt: "2026-05-03T12:15:00",
        updatedAtText: "2026.05.03 12:15",
        priority: 3,
        icon: UsersRound,
        actions: [
            { label: "사용자 목록", href: "/admin/users" },
            { label: "권한 관리", href: "/admin/users?role=admin" }
        ]
    },
    {
        id: "submissions",
        title: "제출 관리",
        description: "전체 제출 기록, 결과, 언어, 실행 시간, 메모리, 재채점 대상을 관리합니다.",
        href: "/admin/submissions",
        status: "warning",
        count: 1184,
        countLabel: "오늘 제출",
        updatedAt: "2026-05-03T12:22:00",
        updatedAtText: "2026.05.03 12:22",
        priority: 1,
        icon: ListChecks,
        actions: [
            { label: "제출 목록", href: "/admin/submissions" },
            { label: "오류 제출", href: "/admin/submissions?status=error" }
        ]
    },
    {
        id: "judge",
        title: "채점 서버",
        description: "채점 큐, 워커 상태, 실패 작업, 재채점, 샌드박스 상태를 모니터링합니다.",
        href: "/admin/judge",
        status: "warning",
        count: 13,
        countLabel: "대기 작업",
        updatedAt: "2026-05-03T12:25:00",
        updatedAtText: "2026.05.03 12:25",
        priority: 1,
        icon: Cpu,
        actions: [
            { label: "큐 보기", href: "/admin/judge" },
            { label: "실패 작업", href: "/admin/judge?status=failed" }
        ]
    },
    {
        id: "logs",
        title: "시스템 로그",
        description: "API, 채점, 인증, 데이터 동기화, 관리자 작업 로그를 확인합니다.",
        href: "/admin/logs",
        status: "critical",
        count: 4,
        countLabel: "경고/오류",
        updatedAt: "2026-05-03T12:28:00",
        updatedAtText: "2026.05.03 12:28",
        priority: 0,
        icon: History,
        actions: [
            { label: "로그 보기", href: "/admin/logs" },
            { label: "오류 로그", href: "/admin/logs?level=error" }
        ]
    },
    {
        id: "data",
        title: "데이터 관리",
        description: "문제 DB, 제출 기록, 백업, 가져오기/내보내기, 저장소 상태를 관리합니다.",
        href: "/data",
        status: "syncing",
        count: 8,
        countLabel: "데이터 소스",
        updatedAt: "2026-05-03T12:10:00",
        updatedAtText: "2026.05.03 12:10",
        priority: 4,
        icon: Database,
        actions: [
            { label: "데이터 보기", href: "/data" },
            { label: "백업", href: "/data?category=백업" }
        ]
    },
    {
        id: "settings",
        title: "관리자 설정",
        description: "채점 제한, 언어 옵션, 데이터 경로, 권한, 보안 설정을 관리합니다.",
        href: "/settings",
        status: "healthy",
        count: 1,
        countLabel: "설정 파일",
        updatedAt: "2026-05-03T09:10:00",
        updatedAtText: "2026.05.03 09:10",
        priority: 5,
        icon: Settings,
        actions: [
            { label: "설정", href: "/settings" },
            { label: "데이터 경로", href: "/settings?tab=data" }
        ]
    }
];

const judgeQueue: JudgeQueueItem[] = [
    {
        id: "job-001",
        submissionId: 202605030014,
        problemId: 7576,
        user: "user@codetest.local",
        language: "C++17",
        status: "running",
        worker: "judge-worker-01",
        elapsedMs: 2400,
        createdAtText: "2026.05.03 12:24:12"
    },
    {
        id: "job-002",
        submissionId: 202605030015,
        problemId: 12865,
        user: "demo@codetest.local",
        language: "JavaScript",
        status: "failed",
        worker: "judge-worker-02",
        elapsedMs: 0,
        createdAtText: "2026.05.03 12:22:40"
    },
    {
        id: "job-003",
        submissionId: 202605030016,
        problemId: 2178,
        user: "student01@codetest.local",
        language: "Python 3.12",
        status: "waiting",
        worker: "-",
        elapsedMs: 0,
        createdAtText: "2026.05.03 12:26:03"
    },
    {
        id: "job-004",
        submissionId: 202605030002,
        problemId: 10828,
        user: "user@codetest.local",
        language: "C++17",
        status: "done",
        worker: "judge-worker-01",
        elapsedMs: 1180,
        createdAtText: "2026.05.03 10:42:21"
    },
    {
        id: "job-005",
        submissionId: 202605030017,
        problemId: 1000,
        user: "dartuser@codetest.local",
        language: "Dart",
        status: "waiting",
        worker: "-",
        elapsedMs: 0,
        createdAtText: "2026.05.03 12:27:18"
    }
];

const recentSubmissions: RecentAdminSubmission[] = [
    {
        id: 202605030014,
        problemId: 7576,
        problemTitle: "토마토",
        user: "user@codetest.local",
        status: "accepted",
        language: "C++17",
        time: "20ms",
        memory: "4020KB",
        submittedAt: "2026.05.03 12:02"
    },
    {
        id: 202605030004,
        problemId: 12865,
        problemTitle: "평범한 배낭",
        user: "demo@codetest.local",
        status: "wrong",
        language: "C++17",
        time: "20ms",
        memory: "4256KB",
        submittedAt: "2026.05.03 12:15"
    },
    {
        id: 202605030015,
        problemId: 12865,
        problemTitle: "평범한 배낭",
        user: "demo@codetest.local",
        status: "compile",
        language: "JavaScript",
        time: "-",
        memory: "-",
        submittedAt: "2026.05.03 12:22"
    },
    {
        id: 202605030017,
        problemId: 1000,
        problemTitle: "두 수의 합",
        user: "dartuser@codetest.local",
        status: "accepted",
        language: "Dart",
        time: "18ms",
        memory: "6020KB",
        submittedAt: "2026.05.03 12:27"
    },
    {
        id: 202605030002,
        problemId: 10828,
        problemTitle: "스택 명령 처리",
        user: "user@codetest.local",
        status: "accepted",
        language: "C++17",
        time: "12ms",
        memory: "2144KB",
        submittedAt: "2026.05.03 10:42"
    }
];

const adminLogs: AdminLogItem[] = [
    {
        id: "log-001",
        level: "error",
        source: "judge-worker-02",
        message: "JavaScript sandbox compile step failed for submission 202605030015.",
        createdAtText: "2026.05.03 12:22:44",
        href: "/admin/logs?level=error"
    },
    {
        id: "log-002",
        level: "warning",
        source: "data-sync",
        message: "Tag index regeneration is still running. Estimated progress 68%.",
        createdAtText: "2026.05.03 12:10:18",
        href: "/admin/logs?source=data-sync"
    },
    {
        id: "log-003",
        level: "warning",
        source: "problem-import",
        message: "17 imported problems are waiting for admin review.",
        createdAtText: "2026.05.03 11:45:02",
        href: "/admin/problems?status=review"
    },
    {
        id: "log-004",
        level: "info",
        source: "auth",
        message: "Admin user signed in from local network.",
        createdAtText: "2026.05.03 09:02:11",
        href: "/admin/logs?source=auth"
    }
];

const systemMetrics: SystemMetric[] = [
    {
        label: "CPU",
        value: 54,
        caption: "judge worker 평균",
        icon: Cpu
    },
    {
        label: "Memory",
        value: 67,
        caption: "샌드박스 포함",
        icon: Server
    },
    {
        label: "Storage",
        value: 62,
        caption: "데이터/백업 포함",
        icon: HardDrive
    },
    {
        label: "Queue",
        value: 38,
        caption: "대기 작업 기준",
        icon: Timer
    }
];

const STATUS_OPTIONS: readonly ModuleStatusFilter[] = [
    "전체",
    "정상",
    "주의",
    "위험",
    "동기화 중"
];

const QUEUE_STATUS_OPTIONS: readonly QueueStatusFilter[] = [
    "전체",
    "실행 중",
    "대기",
    "실패",
    "완료"
];

const SORT_OPTIONS: readonly SortOption[] = [
    "priority",
    "recent",
    "status",
    "count-desc",
    "name"
];

const statusLabelToValue: Record<Exclude<ModuleStatusFilter, "전체">, ModuleStatus> = {
    정상: "healthy",
    주의: "warning",
    위험: "critical",
    "동기화 중": "syncing"
};

const queueStatusLabelToValue: Record<Exclude<QueueStatusFilter, "전체">, QueueStatus> = {
    "실행 중": "running",
    대기: "waiting",
    실패: "failed",
    완료: "done"
};

const sortLabels: Record<SortOption, string> = {
    priority: "우선순위순",
    recent: "최근 업데이트순",
    status: "상태순",
    "count-desc": "항목 많은순",
    name: "이름순"
};

const moduleStatusMeta: Record<
    ModuleStatus,
    {
        label: string;
        variant: "default" | "blue" | "green" | "orange" | "red";
        icon: ComponentType<{ className?: string }>;
    }
> = {
    healthy: {
        label: "정상",
        variant: "green",
        icon: CheckCircle2
    },
    warning: {
        label: "주의",
        variant: "orange",
        icon: AlertTriangle
    },
    critical: {
        label: "위험",
        variant: "red",
        icon: ShieldAlert
    },
    syncing: {
        label: "동기화 중",
        variant: "blue",
        icon: RefreshCcw
    }
};

const queueStatusMeta: Record<
    QueueStatus,
    {
        label: string;
        variant: "default" | "blue" | "green" | "orange" | "red";
        icon: ComponentType<{ className?: string }>;
    }
> = {
    running: {
        label: "실행 중",
        variant: "blue",
        icon: Activity
    },
    waiting: {
        label: "대기",
        variant: "orange",
        icon: Clock3
    },
    failed: {
        label: "실패",
        variant: "red",
        icon: Bug
    },
    done: {
        label: "완료",
        variant: "green",
        icon: CheckCircle2
    }
};

const logLevelMeta: Record<
    AdminLogItem["level"],
    {
        label: string;
        variant: "blue" | "orange" | "red";
        icon: ComponentType<{ className?: string }>;
    }
> = {
    info: {
        label: "INFO",
        variant: "blue",
        icon: CheckCircle2
    },
    warning: {
        label: "WARN",
        variant: "orange",
        icon: AlertTriangle
    },
    error: {
        label: "ERROR",
        variant: "red",
        icon: ShieldAlert
    }
};

const statusOrder: Record<ModuleStatus, number> = {
    critical: 1,
    warning: 2,
    syncing: 3,
    healthy: 4
};

function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
    const meta = moduleStatusMeta[status];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function QueueStatusBadge({ status }: { status: QueueStatus }) {
    const meta = queueStatusMeta[status];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function LogLevelBadge({ level }: { level: AdminLogItem["level"] }) {
    const meta = logLevelMeta[level];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function AdminModuleCard({ module }: { module: AdminModuleItem }) {
    const Icon = module.icon;

    return (
        <Card hover className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <ModuleStatusBadge status={module.status} />
                        <Badge>{module.countLabel}</Badge>
                        {module.priority <= 1 && <Badge variant="red">긴급</Badge>}
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                            <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                            <Link
                                href={module.href}
                                className="text-xl font-black tracking-tight text-slate-950 transition hover:text-blue-600"
                            >
                                {module.title}
                            </Link>
                            <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-500">
                                {module.description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[320px]">
                    <MetricBox label={module.countLabel} value={module.count.toLocaleString()} />
                    <MetricBox label="업데이트" value={module.updatedAtText.split(" ")[0]} />
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-bold text-slate-400">
                    최근 업데이트 {module.updatedAtText}
                </div>

                <div className="flex flex-wrap gap-2">
                    {module.actions.map((action) => (
                        <AppLinkButton
                            key={action.href}
                            href={action.href}
                            variant="secondary"
                            iconRight={ChevronRight}
                        >
                            {action.label}
                        </AppLinkButton>
                    ))}
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

function AdminModulesTable({ items }: { items: AdminModuleItem[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">모듈</th>
                        <th className="px-5 py-4">상태</th>
                        <th className="px-5 py-4 text-right">항목</th>
                        <th className="px-5 py-4">최근 업데이트</th>
                        <th className="px-5 py-4" />
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {items.map((module) => (
                        <tr key={module.id} className="transition hover:bg-slate-50">
                            <td className="px-5 py-4">
                                <Link
                                    href={module.href}
                                    className="font-black text-slate-950 transition hover:text-blue-600"
                                >
                                    {module.title}
                                </Link>
                                <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-400">
                                    {module.description}
                                </p>
                            </td>
                            <td className="px-5 py-4">
                                <ModuleStatusBadge status={module.status} />
                            </td>
                            <td className="px-5 py-4 text-right font-black text-slate-950">
                                {module.count.toLocaleString()}
                            </td>
                            <td className="px-5 py-4 font-bold text-slate-500">
                                {module.updatedAtText}
                            </td>
                            <td className="px-5 py-4 text-right">
                                <AppLinkButton href={module.href} size="sm" iconRight={ChevronRight}>
                                    관리
                                </AppLinkButton>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function JudgeQueuePanel({ statusFilter }: { statusFilter: QueueStatusFilter }) {
    const rows = judgeQueue.filter(
        (job) => statusFilter === "전체" || job.status === queueStatusLabelToValue[statusFilter]
    );

    return (
        <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-xl font-black text-slate-950">채점 큐</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        현재 실행 중이거나 대기 중인 채점 작업입니다.
                    </p>
                </div>
                <Cpu className="h-6 w-6 text-blue-600" />
            </div>

            <div className="space-y-3">
                {rows.map((job) => (
                    <Link
                        key={job.id}
                        href={`/submissions/${job.submissionId}`}
                        className="grid gap-3 rounded-2xl bg-slate-50 p-4 transition hover:bg-blue-50 xl:grid-cols-[1fr_120px_120px] xl:items-center"
                    >
                        <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap gap-2">
                                <QueueStatusBadge status={job.status} />
                                <Badge variant="blue">{job.language}</Badge>
                            </div>

                            <p className="truncate font-black text-slate-950">
                                #{job.submissionId} · Problem {job.problemId}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-400">{job.user}</p>
                        </div>

                        <div className="text-sm font-bold text-slate-500 xl:text-right">
                            <p>{job.worker}</p>
                            <p>{job.elapsedMs}ms</p>
                        </div>

                        <div className="text-sm font-black text-slate-400 xl:text-right">
                            {job.createdAtText}
                        </div>
                    </Link>
                ))}

                {rows.length === 0 && (
                    <EmptyState
                        title="표시할 채점 작업이 없습니다."
                        description="필터 조건을 변경해보세요."
                        icon={Search}
                    />
                )}
            </div>
        </Card>
    );
}

function RecentSubmissionsPanel() {
    return (
        <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-xl font-black text-slate-950">최근 제출</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        관리자가 빠르게 확인해야 하는 최근 제출입니다.
                    </p>
                </div>
                <ListChecks className="h-6 w-6 text-blue-600" />
            </div>

            <div className="space-y-3">
                {recentSubmissions.map((submission) => (
                    <Link
                        key={submission.id}
                        href={`/submissions/${submission.id}`}
                        className="grid gap-3 rounded-2xl bg-slate-50 p-4 transition hover:bg-blue-50 xl:grid-cols-[1fr_120px_90px] xl:items-center"
                    >
                        <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap gap-2">
                                <SubmissionStatusBadge value={submission.status} />
                                <Badge variant="blue">{submission.language}</Badge>
                            </div>

                            <p className="truncate font-black text-slate-950">
                                {submission.problemId}. {submission.problemTitle}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-400">
                                {submission.user}
                            </p>
                        </div>

                        <div className="text-sm font-bold text-slate-500 xl:text-right">
                            <p>{submission.time}</p>
                            <p>{submission.memory}</p>
                        </div>

                        <div className="text-sm font-black text-slate-400 xl:text-right">
                            {submission.submittedAt}
                        </div>
                    </Link>
                ))}
            </div>
        </Card>
    );
}

function SystemHealthPanel() {
    return (
        <SidePanel title="시스템 상태" badge={<Gauge className="h-5 w-5 text-blue-600" />}>
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <p className="text-sm font-black text-slate-300">전체 상태</p>
                <p className="mt-1 text-5xl font-black">{adminStats.systemHealth}%</p>
                <ProgressBar value={adminStats.systemHealth} className="mt-5 bg-white/10" />
            </div>

            <div className="mt-4 space-y-4">
                {systemMetrics.map((metric) => {
                    const Icon = metric.icon;

                    return (
                        <div key={metric.label}>
                            <div className="mb-2 flex items-center justify-between text-sm font-black">
                                <span className="flex items-center gap-2 text-slate-700">
                                    <Icon className="h-4 w-4" />
                                    {metric.label}
                                </span>
                                <span className="text-slate-500">{metric.value}%</span>
                            </div>

                            <ProgressBar
                                value={metric.value}
                                barClassName={
                                    metric.value >= 80
                                        ? "bg-rose-600"
                                        : metric.value >= 60
                                            ? "bg-orange-500"
                                            : "bg-blue-600"
                                }
                            />

                            <p className="mt-1 text-xs font-bold text-slate-400">
                                {metric.caption}
                            </p>
                        </div>
                    );
                })}
            </div>
        </SidePanel>
    );
}

function AdminLogsPanel() {
    return (
        <SidePanel title="최근 로그" badge={<History className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {adminLogs.map((log) => (
                    <Link
                        key={log.id}
                        href={log.href}
                        className="block rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50"
                    >
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <LogLevelBadge level={log.level} />
                            <span className="text-xs font-black text-slate-400">
                                {log.createdAtText}
                            </span>
                        </div>

                        <p className="text-sm font-black text-slate-800">{log.source}</p>
                        <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">
                            {log.message}
                        </p>
                    </Link>
                ))}
            </div>
        </SidePanel>
    );
}

function QuickAdminAction({
                              href,
                              label,
                              description,
                              icon: Icon
                          }: {
    href: string;
    label: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
}) {
    return (
        <Link
            href={href}
            className="block rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Icon className="h-5 w-5" />
            </div>

            <p className="font-black text-slate-950">{label}</p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                {description}
            </p>
        </Link>
    );
}

function QuickLink({
                       href,
                       label,
                       icon: Icon
                   }: {
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
}) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
        >
            <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
            </span>
            <ChevronRight className="h-4 w-4" />
        </Link>
    );
}

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
    return (
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
            <span className="flex items-center gap-2">
                {done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                )}
                {label}
            </span>

            <Badge variant={done ? "green" : "orange"}>
                {done ? "완료" : "확인"}
            </Badge>
        </div>
    );
}

export default function AdminPage() {
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState<ModuleStatusFilter>("전체");
    const [queueStatus, setQueueStatus] = useState<QueueStatusFilter>("전체");
    const [sort, setSort] = useState<SortOption>("priority");
    const [viewMode, setViewMode] = useState<ViewMode>("card");

    const filteredModules = useMemo(() => {
        const lowerKeyword = keyword.trim().toLowerCase();

        const result = adminModules.filter((module) => {
            const matchesKeyword =
                !lowerKeyword ||
                module.title.toLowerCase().includes(lowerKeyword) ||
                module.description.toLowerCase().includes(lowerKeyword) ||
                module.id.toLowerCase().includes(lowerKeyword) ||
                module.actions.some((action) =>
                    action.label.toLowerCase().includes(lowerKeyword)
                );

            const matchesStatus =
                status === "전체" || module.status === statusLabelToValue[status];

            return matchesKeyword && matchesStatus;
        });

        return result.sort((a, b) => {
            switch (sort) {
                case "recent":
                    return b.updatedAt.localeCompare(a.updatedAt);
                case "status":
                    return statusOrder[a.status] - statusOrder[b.status];
                case "count-desc":
                    return b.count - a.count;
                case "name":
                    return a.title.localeCompare(b.title);
                case "priority":
                default:
                    return a.priority - b.priority;
            }
        });
    }, [keyword, status, sort]);

    const healthyCount = adminModules.filter((module) => module.status === "healthy").length;
    const warningCount = adminModules.filter((module) => module.status === "warning").length;
    const criticalCount = adminModules.filter((module) => module.status === "critical").length;
    const queueFailedCount = judgeQueue.filter((job) => job.status === "failed").length;
    const queueRunningCount = judgeQueue.filter((job) => job.status === "running").length;

    const resetFilters = () => {
        setKeyword("");
        setStatus("전체");
        setQueueStatus("전체");
        setSort("priority");
    };

    return (
        <AppShell
            title="관리자"
            description="문제, 사용자, 제출, 채점 큐, 로그를 관리합니다."
        >
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Badge variant="blue">Admin</Badge>
                            <Badge>Operation Center</Badge>
                            <Badge variant={criticalCount > 0 ? "red" : "green"}>
                                Alerts {adminStats.adminAlerts}
                            </Badge>
                        </>
                    }
                    title="서비스 운영 상태를 한눈에 확인하세요."
                    description="문제 데이터, 사용자, 제출 기록, 채점 서버, 시스템 로그를 관리하고 이상 상태를 빠르게 추적합니다."
                    icon={ShieldCheck}
                    rightTitle="시스템 상태"
                    rightValue={`${adminStats.systemHealth}%`}
                    rightCaption={`정상 ${healthyCount}개 · 주의 ${warningCount}개 · 위험 ${criticalCount}개`}
                    metrics={[
                        {
                            label: "문제",
                            value: adminStats.totalProblems.toLocaleString()
                        },
                        {
                            label: "사용자",
                            value: adminStats.activeUsers.toLocaleString()
                        },
                        {
                            label: "큐",
                            value: adminStats.judgeQueue.toLocaleString()
                        }
                    ]}
                    actions={
                        <>
                            <AppLinkButton
                                href="/admin/problems"
                                variant="primary"
                                size="lg"
                                icon={Plus}
                            >
                                문제 추가
                            </AppLinkButton>

                            <AppButton variant="white" size="lg" icon={RefreshCcw}>
                                상태 새로고침
                            </AppButton>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="오늘 제출"
                        value={adminStats.todaySubmissions.toLocaleString()}
                        caption={`정답률 ${adminStats.acceptedRate}%`}
                        icon={ListChecks}
                        tone="blue"
                    />
                    <StatCard
                        label="채점 큐"
                        value={adminStats.judgeQueue.toLocaleString()}
                        caption={`실행 ${queueRunningCount} · 실패 ${queueFailedCount}`}
                        icon={Cpu}
                        tone="orange"
                    />
                    <StatCard
                        label="검수 대기"
                        value={adminStats.pendingReviews.toLocaleString()}
                        caption="문제/테스트 케이스"
                        icon={FileText}
                        tone="red"
                    />
                    <StatCard
                        label="저장소"
                        value={`${adminStats.storageUsage}%`}
                        caption="데이터 + 백업"
                        icon={HardDrive}
                        tone="green"
                    />
                </section>

                <section className="grid gap-4 xl:grid-cols-4">
                    <QuickAdminAction
                        href="/admin/problems"
                        label="문제 등록"
                        description="문제 본문, 예제, 테스트 케이스, 태그를 추가합니다."
                        icon={BookOpen}
                    />
                    <QuickAdminAction
                        href="/admin/users"
                        label="사용자 권한"
                        description="일반 사용자와 관리자 권한을 확인하고 조정합니다."
                        icon={UserCog}
                    />
                    <QuickAdminAction
                        href="/admin/judge"
                        label="채점 큐 점검"
                        description="워커 상태와 실패 작업을 확인하고 재시도합니다."
                        icon={Cpu}
                    />
                    <QuickAdminAction
                        href="/admin/logs"
                        label="오류 로그"
                        description="최근 오류, 경고, 인증, 데이터 동기화 로그를 확인합니다."
                        icon={Bug}
                    />
                </section>

                <FilterPanel
                    title="관리 모듈 검색 / 필터"
                    onReset={resetFilters}
                    gridClassName="grid gap-3 xl:grid-cols-[1.4fr_160px_160px_190px_auto] xl:items-end"
                >
                    <SearchInput
                        value={keyword}
                        onChange={setKeyword}
                        placeholder="모듈명, 설명, 액션 검색"
                    />
                    <FilterSelect
                        label="모듈 상태"
                        value={status}
                        onChange={setStatus}
                        options={STATUS_OPTIONS}
                    />
                    <FilterSelect
                        label="채점 큐"
                        value={queueStatus}
                        onChange={setQueueStatus}
                        options={QUEUE_STATUS_OPTIONS}
                    />
                    <FilterSelect
                        label="정렬"
                        value={sort}
                        onChange={setSort}
                        options={SORT_OPTIONS}
                    />
                </FilterPanel>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <ListHeader
                                title="관리 모듈"
                                description={`검색 조건에 맞는 모듈 ${filteredModules.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`}
                                right={
                                    <ViewModeToggle
                                        value={viewMode}
                                        onChange={setViewMode}
                                    />
                                }
                            />

                            {filteredModules.length === 0 ? (
                                <EmptyState
                                    title="관리 모듈을 찾을 수 없습니다."
                                    description="검색어 또는 필터 조건을 변경해보세요."
                                    icon={Search}
                                    onReset={resetFilters}
                                />
                            ) : viewMode === "card" ? (
                                <div className="space-y-4">
                                    {filteredModules.map((module) => (
                                        <AdminModuleCard key={module.id} module={module} />
                                    ))}
                                </div>
                            ) : (
                                <AdminModulesTable items={filteredModules} />
                            )}
                        </section>

                        <section className="grid gap-4 xl:grid-cols-2">
                            <JudgeQueuePanel statusFilter={queueStatus} />
                            <RecentSubmissionsPanel />
                        </section>
                    </div>

                    <aside className="space-y-4">
                        <SystemHealthPanel />
                        <AdminLogsPanel />

                        <SidePanel
                            title="운영 체크리스트"
                            badge={<Wrench className="h-5 w-5 text-blue-600" />}
                        >
                            <div className="space-y-2">
                                <ChecklistRow
                                    label="채점 워커 상태 확인"
                                    done={queueFailedCount === 0}
                                />
                                <ChecklistRow
                                    label="검수 대기 문제 확인"
                                    done={adminStats.pendingReviews === 0}
                                />
                                <ChecklistRow
                                    label="오류 로그 확인"
                                    done={criticalCount === 0}
                                />
                                <ChecklistRow label="데이터 백업 확인" done />
                            </div>
                        </SidePanel>

                        <SidePanel
                            title="빠른 이동"
                            badge={<Zap className="h-5 w-5 text-blue-600" />}
                        >
                            <div className="space-y-2">
                                <QuickLink href="/admin/problems" label="문제 관리" icon={BookOpen} />
                                <QuickLink href="/admin/users" label="사용자 관리" icon={UsersRound} />
                                <QuickLink href="/admin/submissions" label="제출 관리" icon={ListChecks} />
                                <QuickLink href="/admin/judge" label="채점 서버" icon={Cpu} />
                                <QuickLink href="/admin/logs" label="시스템 로그" icon={History} />
                                <QuickLink href="/data" label="데이터 관리" icon={Database} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 `/admin`은 DB 운영 데이터 기반입니다. API는
                            `GET /api/admin/summary`, `GET /api/admin/modules`,
                            `GET /api/admin/judge/queue`, `GET /api/admin/logs/recent`를
                            붙이면 됩니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}