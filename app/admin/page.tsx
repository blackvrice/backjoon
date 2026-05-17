"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import AppShell from "@/components/layout/AppShell";
import { Badge, Card, EmptyState, MiniStat, Notice, PageHero, ProgressBar, SidePanel, StatCard } from "@/components/ui";
import { FilterPanel, FilterSelect, SearchInput } from "@/components/forms";
import { ListHeader, ViewModeToggle, type ViewMode } from "@/components/common";
import {
    AlertTriangle,
    BarChart3,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Cpu,
    Database,
    Gauge,
    History,
    Layers3,
    ListChecks,
    RefreshCcw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Terminal,
    UsersRound,
    Wrench,
    Zap,
} from "lucide-react";

type ModuleStatus = "healthy" | "warning" | "critical" | "offline";
type ModuleStatusFilter = "전체" | "정상" | "주의" | "위험" | "중지";
type QueueStatus = "waiting" | "running" | "failed" | "done";
type QueueStatusFilter = "전체" | "대기" | "실행 중" | "실패" | "완료";
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
    id: string;
    title: string;
    description: string;
    href: string;
    status: ModuleStatus;
    count: number;
    countLabel: string;
    updatedAt: string;
    updatedAtText: string;
    priority: number;
    actions: Array<{ label: string; href: string }>;
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
    status: string;
    language: string;
    time: string;
    memory: string;
    submittedAt: string;
};

type AdminLogItem = {
    id: string;
    level: "info" | "warning" | "error" | "critical";
    source: string;
    message: string;
    createdAtText: string;
    href: string;
};

type SummaryResponse = {
    stats: AdminStats;
    modules: AdminModuleItem[];
    judgeQueue: JudgeQueueItem[];
    recentSubmissions: RecentAdminSubmission[];
    logs: AdminLogItem[];
};

const EMPTY_STATS: AdminStats = {
    totalProblems: 0,
    activeUsers: 0,
    todaySubmissions: 0,
    acceptedRate: 0,
    judgeQueue: 0,
    failedJobs: 0,
    systemHealth: 0,
    storageUsage: 0,
    pendingReviews: 0,
    adminAlerts: 0,
};

const STATUS_OPTIONS: readonly ModuleStatusFilter[] = ["전체", "정상", "주의", "위험", "중지"];
const QUEUE_STATUS_OPTIONS: readonly QueueStatusFilter[] = ["전체", "대기", "실행 중", "실패", "완료"];
const SORT_OPTIONS: readonly SortOption[] = ["priority", "recent", "status", "count-desc", "name"];

const statusLabelToValue: Record<Exclude<ModuleStatusFilter, "전체">, ModuleStatus> = {
    정상: "healthy",
    주의: "warning",
    위험: "critical",
    중지: "offline",
};

const queueStatusLabelToValue: Record<Exclude<QueueStatusFilter, "전체">, QueueStatus> = {
    대기: "waiting",
    "실행 중": "running",
    실패: "failed",
    완료: "done",
};

const sortLabels: Record<SortOption, string> = {
    priority: "우선순위",
    recent: "최근 업데이트",
    status: "상태",
    "count-desc": "건수 많은순",
    name: "이름순",
};

const moduleIcons: Record<string, ComponentType<{ className?: string }>> = {
    problems: BookOpen,
    users: UsersRound,
    submissions: ListChecks,
    judge: Cpu,
    logs: History,
    data: Database,
};

const statusOrder: Record<ModuleStatus, number> = {
    critical: 0,
    warning: 1,
    offline: 2,
    healthy: 3,
};

function statusMeta(status: ModuleStatus) {
    switch (status) {
        case "healthy":
            return { label: "정상", variant: "green" as const, icon: CheckCircle2 };
        case "warning":
            return { label: "주의", variant: "orange" as const, icon: AlertTriangle };
        case "critical":
            return { label: "위험", variant: "red" as const, icon: ShieldAlert };
        case "offline":
        default:
            return { label: "중지", variant: "default" as const, icon: Clock3 };
    }
}

function queueMeta(status: QueueStatus) {
    switch (status) {
        case "running":
            return { label: "실행 중", variant: "blue" as const };
        case "waiting":
            return { label: "대기", variant: "orange" as const };
        case "failed":
            return { label: "실패", variant: "red" as const };
        case "done":
        default:
            return { label: "완료", variant: "green" as const };
    }
}

function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
    const meta = statusMeta(status);
    const Icon = meta.icon;
    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function QueueStatusBadge({ status }: { status: QueueStatus }) {
    const meta = queueMeta(status);
    return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function AdminModuleCard({ module }: { module: AdminModuleItem }) {
    const Icon = moduleIcons[module.id] ?? Layers3;

    return (
        <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Link href={module.href} className="text-lg font-black text-slate-950 hover:text-blue-700">
                                {module.title}
                            </Link>
                            <ModuleStatusBadge status={module.status} />
                        </div>
                        <p className="text-sm font-bold leading-6 text-slate-500">{module.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {module.actions.map((action) => (
                                <Link key={action.href} href={action.href} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-blue-50 hover:text-blue-700">
                                    {action.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="grid min-w-[180px] grid-cols-2 gap-2">
                    <MiniStat label={module.countLabel} value={module.count.toLocaleString()} />
                    <MiniStat label="업데이트" value={module.updatedAtText} />
                </div>
            </div>
        </Card>
    );
}

function AdminModulesTable({ items }: { items: AdminModuleItem[] }) {
    return (
        <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                    <tr>
                        <th className="px-4 py-3">모듈</th>
                        <th className="px-4 py-3">상태</th>
                        <th className="px-4 py-3">건수</th>
                        <th className="px-4 py-3">업데이트</th>
                        <th className="px-4 py-3">이동</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-4 py-4 font-black text-slate-900">{item.title}</td>
                            <td className="px-4 py-4"><ModuleStatusBadge status={item.status} /></td>
                            <td className="px-4 py-4 font-bold text-slate-600">{item.count.toLocaleString()} {item.countLabel}</td>
                            <td className="px-4 py-4 font-bold text-slate-500">{item.updatedAtText}</td>
                            <td className="px-4 py-4"><Link href={item.href} className="font-black text-blue-700">열기</Link></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function JudgeQueuePanel({ items, statusFilter }: { items: JudgeQueueItem[]; statusFilter: QueueStatusFilter }) {
    const filtered = statusFilter === "전체" ? items : items.filter((item) => item.status === queueStatusLabelToValue[statusFilter]);

    return (
        <SidePanel title="채점 큐" badge={<Cpu className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {filtered.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">대기 중인 채점 작업이 없습니다.</p>
                ) : filtered.map((job) => (
                    <Link key={job.id} href={`/admin/submissions?keyword=${job.submissionId}`} className="block rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-slate-900">#{job.submissionId}</span>
                            <QueueStatusBadge status={job.status} />
                        </div>
                        <p className="text-xs font-bold text-slate-500">문제 {job.problemId} · {job.language} · {job.user}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{job.worker} · {job.createdAtText}</p>
                    </Link>
                ))}
            </div>
        </SidePanel>
    );
}

function RecentSubmissionsPanel({ items }: { items: RecentAdminSubmission[] }) {
    return (
        <SidePanel title="최근 제출" badge={<Terminal className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {items.map((submission) => (
                    <Link key={submission.id} href={`/admin/submissions?keyword=${submission.id}`} className="block rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-slate-900">#{submission.id}</span>
                            <Badge variant={submission.status === "accepted" ? "green" : submission.status === "pending" || submission.status === "judging" ? "orange" : "red"}>{submission.status}</Badge>
                        </div>
                        <p className="line-clamp-1 text-xs font-bold text-slate-500">{submission.problemId} · {submission.problemTitle}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{submission.user} · {submission.language}</p>
                    </Link>
                ))}
            </div>
        </SidePanel>
    );
}

function AdminLogsPanel({ items }: { items: AdminLogItem[] }) {
    return (
        <SidePanel title="최근 로그" badge={<History className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {items.length === 0 ? <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">표시할 로그가 없습니다.</p> : items.map((log) => (
                    <Link key={log.id} href={log.href} className="block rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <Badge variant={log.level === "error" || log.level === "critical" ? "red" : log.level === "warning" ? "orange" : "blue"}>{log.level.toUpperCase()}</Badge>
                            <span className="text-xs font-black text-slate-400">{log.createdAtText}</span>
                        </div>
                        <p className="text-sm font-black text-slate-800">{log.source}</p>
                        <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{log.message}</p>
                    </Link>
                ))}
            </div>
        </SidePanel>
    );
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: ComponentType<{ className?: string }> }) {
    return (
        <Link href={href} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
            <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span>
            <ChevronRight className="h-4 w-4" />
        </Link>
    );
}

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
    return (
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
            <span className="flex items-center gap-2">
                {done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-orange-500" />}
                {label}
            </span>
            <Badge variant={done ? "green" : "orange"}>{done ? "완료" : "확인"}</Badge>
        </div>
    );
}

export default function AdminPage() {
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState<ModuleStatusFilter>("전체");
    const [queueStatus, setQueueStatus] = useState<QueueStatusFilter>("전체");
    const [sort, setSort] = useState<SortOption>("priority");
    const [viewMode, setViewMode] = useState<ViewMode>("card");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<SummaryResponse>({ stats: EMPTY_STATS, modules: [], judgeQueue: [], recentSubmissions: [], logs: [] });

    const loadSummary = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch("/api/admin/summary", { cache: "no-store" });
            if (!response.ok) throw new Error("관리자 요약 데이터를 불러오지 못했습니다.");
            setData(await response.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadSummary();
    }, []);

    const filteredModules = useMemo(() => {
        const lowerKeyword = keyword.trim().toLowerCase();
        const result = data.modules.filter((module) => {
            const matchesKeyword = !lowerKeyword || module.title.toLowerCase().includes(lowerKeyword) || module.description.toLowerCase().includes(lowerKeyword) || module.id.toLowerCase().includes(lowerKeyword) || module.actions.some((action) => action.label.toLowerCase().includes(lowerKeyword));
            const matchesStatus = status === "전체" || module.status === statusLabelToValue[status];
            return matchesKeyword && matchesStatus;
        });

        return [...result].sort((a, b) => {
            switch (sort) {
                case "recent": return b.updatedAt.localeCompare(a.updatedAt);
                case "status": return statusOrder[a.status] - statusOrder[b.status];
                case "count-desc": return b.count - a.count;
                case "name": return a.title.localeCompare(b.title);
                case "priority":
                default: return a.priority - b.priority;
            }
        });
    }, [data.modules, keyword, status, sort]);

    const healthyCount = data.modules.filter((module) => module.status === "healthy").length;
    const warningCount = data.modules.filter((module) => module.status === "warning").length;
    const criticalCount = data.modules.filter((module) => module.status === "critical").length;
    const queueFailedCount = data.stats.failedJobs;

    const resetFilters = () => {
        setKeyword("");
        setStatus("전체");
        setQueueStatus("전체");
        setSort("priority");
    };

    return (
        <AppShell title="관리자" description="문제, 사용자, 제출, 채점 큐, 로그를 관리합니다.">
            <div className="space-y-6">
                <PageHero
                    eyebrow={<><Badge variant="blue">Admin</Badge><Badge>DB Connected</Badge><Badge variant={criticalCount > 0 ? "red" : "green"}>Alerts {data.stats.adminAlerts}</Badge></>}
                    title="서비스 운영 상태를 DB 기준으로 확인하세요."
                    description="PostgreSQL과 Prisma API에서 가져온 문제, 사용자, 제출, 채점 큐, 로그 데이터를 표시합니다."
                    actions={<><button onClick={loadSummary} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><RefreshCcw className="h-4 w-4" />새로고침</button><Link href="/admin/problems" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 shadow-sm ring-1 ring-slate-200">문제 관리<ChevronRight className="h-4 w-4" /></Link></>}
                />

                {error && <Notice title="DB 조회 오류" variant="danger">{error}</Notice>}
                {loading && <Notice title="데이터 조회 중" variant="info">관리자 데이터를 불러오는 중입니다.</Notice>}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="전체 문제" value={data.stats.totalProblems.toLocaleString()} caption="Problem 테이블 기준" icon={BookOpen} />
                    <StatCard label="활성 사용자" value={data.stats.activeUsers.toLocaleString()} caption="User.status = active" icon={UsersRound} />
                    <StatCard label="오늘 제출" value={data.stats.todaySubmissions.toLocaleString()} caption="Submission.createdAt 기준" icon={ListChecks} />
                    <StatCard label="정답률" value={`${data.stats.acceptedRate}%`} caption="accepted / total" icon={Gauge} />
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="p-5"><p className="text-sm font-black text-slate-500">모듈 상태</p><div className="mt-4 grid grid-cols-3 gap-2"><MiniStat label="정상" value={`${healthyCount}`} /><MiniStat label="주의" value={`${warningCount}`} /><MiniStat label="위험" value={`${criticalCount}`} /></div></Card>
                    <Card className="p-5"><p className="text-sm font-black text-slate-500">채점 큐</p><p className="mt-2 text-4xl font-black text-slate-950">{data.stats.judgeQueue}</p><p className="text-sm font-bold text-slate-500">대기/채점 중 작업</p></Card>
                    <Card className="p-5"><p className="text-sm font-black text-slate-500">검수 대기</p><p className="mt-2 text-4xl font-black text-slate-950">{data.stats.pendingReviews}</p><p className="text-sm font-bold text-slate-500">Problem.status = review</p></Card>
                    <Card className="p-5"><p className="text-sm font-black text-slate-500">시스템 상태</p><p className="mt-2 text-4xl font-black text-slate-950">{data.stats.systemHealth}%</p><ProgressBar value={data.stats.systemHealth} className="mt-4" /></Card>
                </section>

                <FilterPanel title="관리 모듈 검색 / 필터" onReset={resetFilters} gridClassName="grid gap-3 xl:grid-cols-[1.4fr_140px_140px_160px_auto] xl:items-end">
                    <SearchInput value={keyword} onChange={setKeyword} placeholder="모듈명, 설명, 액션 검색" />
                    <FilterSelect label="모듈 상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                    <FilterSelect label="채점 큐" value={queueStatus} onChange={setQueueStatus} options={QUEUE_STATUS_OPTIONS} />
                    <FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} />
                </FilterPanel>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <ListHeader title="관리 모듈" description={`검색 조건에 맞는 모듈 ${filteredModules.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`} right={<ViewModeToggle value={viewMode} onChange={setViewMode} />} />
                            {filteredModules.length === 0 ? <EmptyState title="관리 모듈을 찾을 수 없습니다." description="검색어 또는 필터 조건을 변경해보세요." icon={Search} onReset={resetFilters} /> : viewMode === "card" ? <div className="space-y-4">{filteredModules.map((module) => <AdminModuleCard key={module.id} module={module} />)}</div> : <AdminModulesTable items={filteredModules} />}
                        </section>

                        <section className="grid gap-4 xl:grid-cols-2">
                            <JudgeQueuePanel items={data.judgeQueue} statusFilter={queueStatus} />
                            <RecentSubmissionsPanel items={data.recentSubmissions} />
                        </section>
                    </div>

                    <aside className="space-y-4">
                        <AdminLogsPanel items={data.logs} />
                        <SidePanel title="운영 체크리스트" badge={<Wrench className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <ChecklistRow label="채점 워커 상태 확인" done={queueFailedCount === 0} />
                                <ChecklistRow label="검수 대기 문제 확인" done={data.stats.pendingReviews === 0} />
                                <ChecklistRow label="오류 로그 확인" done={criticalCount === 0} />
                                <ChecklistRow label="데이터 백업 확인" done />
                            </div>
                        </SidePanel>
                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href="/admin/problems" label="문제 관리" icon={BookOpen} />
                                <QuickLink href="/admin/users" label="사용자 관리" icon={UsersRound} />
                                <QuickLink href="/admin/submissions" label="제출 관리" icon={ListChecks} />
                                <QuickLink href="/admin/judge" label="채점 서버" icon={Cpu} />
                                <QuickLink href="/admin/logs" label="시스템 로그" icon={History} />
                                <QuickLink href="/data" label="데이터 관리" icon={Database} />
                            </div>
                        </SidePanel>
                        <Notice title="DB 연결 메모" variant="info">이 페이지는 `/api/admin/summary`를 통해 PostgreSQL 데이터를 조회합니다.</Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}
