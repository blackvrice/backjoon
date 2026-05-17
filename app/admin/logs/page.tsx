"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import AppShell from "@/components/layout/AppShell";
import { AppButton, Badge, Card, EmptyState, MiniStat, Notice, PageHero, ProgressBar, SidePanel, StatCard } from "@/components/ui";
import { FilterPanel, FilterSelect, SearchInput } from "@/components/forms";
import { ListHeader, ViewModeToggle, type ViewMode } from "@/components/common";
import { Activity, AlertTriangle, BarChart3, Bug, CheckCircle2, ChevronRight, Clock3, Code2, Cpu, Database, Download, Gauge, History, Info, Layers3, RefreshCcw, RotateCcw, Search, Server, ShieldAlert, ShieldCheck, Terminal, Trash2, UserRound, Wrench, Zap } from "lucide-react";

type LogLevel = "debug" | "info" | "warning" | "error" | "critical";
type LogLevelFilter = "전체" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";
type LogSource = "api" | "auth" | "judge" | "worker" | "data" | "admin" | "system" | "web" | string;
type LogSourceFilter = "전체" | "API" | "Auth" | "Judge" | "Worker" | "Data" | "Admin" | "System" | "Web";
type LogStatus = "open" | "investigating" | "resolved" | "ignored" | string;
type LogStatusFilter = "전체" | "열림" | "조사 중" | "해결" | "무시";
type SortOption = "recent" | "level" | "source" | "count-desc" | "status";

type LogItem = {
    id: string;
    level: LogLevel;
    source: LogSource;
    status: LogStatus;
    title: string;
    message: string;
    detail: string;
    stack?: string;
    requestId?: string;
    user?: string;
    path?: string;
    method?: string;
    worker?: string;
    count: number;
    firstSeen: string;
    firstSeenText: string;
    lastSeen: string;
    lastSeenText: string;
    tags: string[];
    relatedHref: string;
    actionHref?: string;
};

const LEVEL_OPTIONS: readonly LogLevelFilter[] = ["전체", "DEBUG", "INFO", "WARN", "ERROR", "CRITICAL"];
const SOURCE_OPTIONS: readonly LogSourceFilter[] = ["전체", "API", "Auth", "Judge", "Worker", "Data", "Admin", "System", "Web"];
const STATUS_OPTIONS: readonly LogStatusFilter[] = ["전체", "열림", "조사 중", "해결", "무시"];
const SORT_OPTIONS: readonly SortOption[] = ["recent", "level", "source", "count-desc", "status"];
const levelLabelToValue: Record<Exclude<LogLevelFilter, "전체">, LogLevel> = { DEBUG: "debug", INFO: "info", WARN: "warning", ERROR: "error", CRITICAL: "critical" };
const sourceLabelToValue: Record<Exclude<LogSourceFilter, "전체">, LogSource> = { API: "api", Auth: "auth", Judge: "judge", Worker: "worker", Data: "data", Admin: "admin", System: "system", Web: "web" };
const statusLabelToValue: Record<Exclude<LogStatusFilter, "전체">, LogStatus> = { 열림: "open", "조사 중": "investigating", 해결: "resolved", 무시: "ignored" };
const sortLabels: Record<SortOption, string> = { recent: "최근 발생순", level: "레벨 우선순", source: "소스순", "count-desc": "발생 많은순", status: "상태순" };
const levelOrder: Record<LogLevel, number> = { critical: 0, error: 1, warning: 2, info: 3, debug: 4 };
const statusOrder: Record<string, number> = { open: 0, investigating: 1, resolved: 2, ignored: 3 };

function LogLevelBadge({ level }: { level: LogLevel }) {
    const meta = level === "critical" ? ["CRITICAL", "red", ShieldAlert] : level === "error" ? ["ERROR", "red", Bug] : level === "warning" ? ["WARN", "orange", AlertTriangle] : level === "debug" ? ["DEBUG", "default", Code2] : ["INFO", "blue", Info];
    const Icon = meta[2] as ComponentType<{ className?: string }>;
    return <Badge variant={meta[1] as "red" | "orange" | "default" | "blue"}><Icon className="mr-1 h-3.5 w-3.5" />{meta[0] as string}</Badge>;
}
function LogStatusBadge({ status }: { status: LogStatus }) { const meta = status === "resolved" ? ["해결", "green"] : status === "ignored" ? ["무시", "default"] : status === "investigating" ? ["조사 중", "orange"] : ["열림", "red"]; return <Badge variant={meta[1] as "green" | "default" | "orange" | "red"}>{meta[0]}</Badge>; }
function SourceIcon({ source }: { source: LogSource }) { const Icon = source === "judge" ? Cpu : source === "worker" ? Terminal : source === "api" ? Server : source === "data" ? Database : source === "auth" ? UserRound : source === "admin" ? ShieldCheck : Layers3; return <Icon className="h-5 w-5" />; }

function LogCard({ log }: { log: LogItem }) {
    return <Card className="p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><SourceIcon source={log.source} /></div><div><div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-lg font-black text-slate-950">{log.title}</span><LogLevelBadge level={log.level} /><LogStatusBadge status={log.status} /></div><p className="text-sm font-bold leading-6 text-slate-500">{log.message}</p><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{log.detail}</p><div className="mt-3 flex flex-wrap gap-2">{log.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></div></div><div className="grid min-w-[320px] grid-cols-2 gap-2 md:grid-cols-4"><MiniStat label="발생" value={`${log.count}`} /><MiniStat label="소스" value={String(log.source)} /><MiniStat label="메서드" value={log.method ?? "-"} /><MiniStat label="워커" value={log.worker ?? "-"} /></div></div>{log.stack && <pre className="mt-4 max-h-48 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs font-bold text-slate-100">{log.stack}</pre>}<div className="mt-4 grid gap-2 md:grid-cols-4"><Link href={log.relatedHref} className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-sm font-black text-slate-700 hover:bg-blue-50">관련 화면</Link>{log.actionHref && <Link href={log.actionHref} className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-sm font-black text-slate-700 hover:bg-blue-50">조치</Link>}<span className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-black text-slate-500">최근 {log.lastSeenText}</span><span className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-black text-slate-500">{log.requestId ?? log.id}</span></div></Card>;
}
function LogsTable({ items }: { items: LogItem[] }) { return <Card className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-50 text-xs font-black uppercase text-slate-500"><tr><th className="px-4 py-3">로그</th><th className="px-4 py-3">레벨</th><th className="px-4 py-3">소스</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">횟수</th><th className="px-4 py-3">최근</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((log) => <tr key={log.id} className="hover:bg-slate-50"><td className="px-4 py-4"><p className="font-black text-slate-900">{log.title}</p><p className="line-clamp-1 text-xs font-bold text-slate-500">{log.message}</p></td><td className="px-4 py-4"><LogLevelBadge level={log.level} /></td><td className="px-4 py-4 font-bold">{log.source}</td><td className="px-4 py-4"><LogStatusBadge status={log.status} /></td><td className="px-4 py-4 font-bold">{log.count}</td><td className="px-4 py-4 font-bold text-slate-500">{log.lastSeenText}</td></tr>)}</tbody></table></div></Card>; }
function DistributionPanel({ title, icon: Icon, rows }: { title: string; icon: ComponentType<{ className?: string }>; rows: Array<{ label: string; count: number }> }) { const total = Math.max(rows.reduce((s, r) => s + r.count, 0), 1); return <SidePanel title={title} badge={<Icon className="h-5 w-5 text-blue-600" />}><div className="space-y-4">{rows.map((row) => <div key={row.label}><div className="mb-2 flex items-center justify-between text-sm font-black"><span>{row.label}</span><span className="text-slate-500">{row.count}건</span></div><ProgressBar value={Math.round((row.count / total) * 100)} /></div>)}</div></SidePanel>; }
function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: ComponentType<{ className?: string }> }) { return <Link href={href} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"><span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span><ChevronRight className="h-4 w-4" /></Link>; }

export default function AdminLogsPage() {
    const [keyword, setKeyword] = useState("");
    const [level, setLevel] = useState<LogLevelFilter>("전체");
    const [source, setSource] = useState<LogSourceFilter>("전체");
    const [status, setStatus] = useState<LogStatusFilter>("전체");
    const [sort, setSort] = useState<SortOption>("recent");
    const [viewMode, setViewMode] = useState<ViewMode>("card");
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLogs = async () => { try { setLoading(true); setError(null); const res = await fetch("/api/admin/logs", { cache: "no-store" }); if (!res.ok) throw new Error("로그 데이터를 불러오지 못했습니다."); const json = await res.json(); setLogs(json.logs ?? []); } catch (err) { setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."); } finally { setLoading(false); } };
    useEffect(() => { void loadLogs(); }, []);

    const filteredLogs = useMemo(() => { const lower = keyword.trim().toLowerCase(); const result = logs.filter((log) => { const matchesKeyword = !lower || log.title.toLowerCase().includes(lower) || log.message.toLowerCase().includes(lower) || log.detail.toLowerCase().includes(lower) || log.stack?.toLowerCase().includes(lower) || log.requestId?.toLowerCase().includes(lower) || log.user?.toLowerCase().includes(lower) || log.path?.toLowerCase().includes(lower) || log.worker?.toLowerCase().includes(lower) || log.tags.some((tag) => tag.toLowerCase().includes(lower)); const matchesLevel = level === "전체" || log.level === levelLabelToValue[level]; const matchesSource = source === "전체" || log.source === sourceLabelToValue[source]; const matchesStatus = status === "전체" || log.status === statusLabelToValue[status]; return matchesKeyword && matchesLevel && matchesSource && matchesStatus; }); return [...result].sort((a, b) => { switch (sort) { case "level": return levelOrder[a.level] - levelOrder[b.level]; case "source": return String(a.source).localeCompare(String(b.source)); case "count-desc": return b.count - a.count; case "status": return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99); default: return b.lastSeen.localeCompare(a.lastSeen); } }); }, [logs, keyword, level, source, status, sort]);
    const errorCount = logs.filter((log) => log.level === "error" || log.level === "critical").reduce((sum, log) => sum + log.count, 0); const warningCount = logs.filter((log) => log.level === "warning").reduce((sum, log) => sum + log.count, 0); const openCount = logs.filter((log) => log.status === "open" || log.status === "investigating").length; const criticalCount = logs.filter((log) => log.level === "critical").length; const health = Math.max(0, 100 - errorCount * 8 - warningCount * 2);
    const resetFilters = () => { setKeyword(""); setLevel("전체"); setSource("전체"); setStatus("전체"); setSort("recent"); };

    return <AppShell title="시스템 로그" description="DB 로그와 채점 결과 기반 로그를 확인합니다."><div className="space-y-6"><PageHero eyebrow={<><Badge variant="blue">Admin</Badge><Badge>Log DB</Badge><Badge variant={criticalCount > 0 ? "red" : "green"}>Critical {criticalCount}</Badge></>} title="시스템 로그를 DB 기준으로 확인하세요." description="AdminLog 테이블을 우선 조회하고, 로그가 없으면 최근 Submission 결과를 로그 형태로 표시합니다." actions={<><button onClick={loadLogs} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><RefreshCcw className="h-4 w-4" />새로고침</button><AppButton><Download className="h-4 w-4" />Export</AppButton></>} />{error && <Notice title="DB 조회 오류" variant="danger">{error}</Notice>}{loading && <Notice title="데이터 조회 중" variant="info">로그 데이터를 불러오는 중입니다.</Notice>}<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><StatCard label="전체 로그" value={logs.length.toLocaleString()} caption="AdminLog/Submission" icon={History} /><StatCard label="Error" value={errorCount.toLocaleString()} caption="error/critical" icon={ShieldAlert} /><StatCard label="Warning" value={warningCount.toLocaleString()} caption="warning" icon={AlertTriangle} /><StatCard label="Open" value={openCount.toLocaleString()} caption="open/investigating" icon={Clock3} /><StatCard label="Health" value={`${health}%`} caption="간이 지표" icon={Gauge} /></section><FilterPanel title="로그 검색 / 필터" onReset={resetFilters} gridClassName="grid gap-3 xl:grid-cols-[1.4fr_130px_130px_130px_170px_auto] xl:items-end"><SearchInput value={keyword} onChange={setKeyword} placeholder="제목, 메시지, 상세, 스택, 요청 ID, 사용자, 경로, 태그 검색" /><FilterSelect label="레벨" value={level} onChange={setLevel} options={LEVEL_OPTIONS} /><FilterSelect label="소스" value={source} onChange={setSource} options={SOURCE_OPTIONS} /><FilterSelect label="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} /><FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} /></FilterPanel><section className="grid gap-6 2xl:grid-cols-[1fr_380px]"><div className="space-y-4"><ListHeader title="로그 목록" description={`검색 조건에 맞는 로그 ${filteredLogs.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`} right={<ViewModeToggle value={viewMode} onChange={setViewMode} />} />{filteredLogs.length === 0 ? <EmptyState title="로그를 찾을 수 없습니다." description="검색어 또는 필터 조건을 변경해보세요." icon={Search} onReset={resetFilters} /> : viewMode === "card" ? <div className="space-y-4">{filteredLogs.map((log) => <LogCard key={log.id} log={log} />)}</div> : <LogsTable items={filteredLogs} />}</div><aside className="space-y-4"><SidePanel title="로그 상태" badge={<Gauge className="h-5 w-5 text-blue-600" />}><div className="rounded-[1.5rem] bg-slate-950 p-5 text-white"><p className="text-sm font-black text-slate-300">Log Health</p><p className="mt-1 text-5xl font-black">{health}%</p><ProgressBar value={health} className="mt-5 bg-white/10" /></div><div className="mt-4 grid grid-cols-3 gap-3"><MiniStat label="Error" value={`${errorCount}`} /><MiniStat label="Warn" value={`${warningCount}`} /><MiniStat label="Open" value={`${openCount}`} /></div></SidePanel><DistributionPanel title="레벨 분포" icon={BarChart3} rows={[{ label: "Critical", count: logs.filter((l) => l.level === "critical").length }, { label: "Error", count: logs.filter((l) => l.level === "error").length }, { label: "Warn", count: logs.filter((l) => l.level === "warning").length }, { label: "Info", count: logs.filter((l) => l.level === "info").length }]} /><DistributionPanel title="소스 분포" icon={Layers3} rows={Array.from(new Set(logs.map((l) => String(l.source)))).map((sourceName) => ({ label: sourceName, count: logs.filter((l) => l.source === sourceName).length }))} /><SidePanel title="운영 액션" badge={<Wrench className="h-5 w-5 text-blue-600" />}><div className="space-y-2"><AppButton><CheckCircle2 className="h-4 w-4" />선택 로그 해결</AppButton><AppButton><Trash2 className="h-4 w-4" />오래된 로그 정리</AppButton></div></SidePanel><SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}><div className="space-y-2"><QuickLink href="/admin" label="관리자 홈" icon={ShieldCheck} /><QuickLink href="/admin/judge" label="채점 서버" icon={Cpu} /><QuickLink href="/admin/submissions" label="제출 관리" icon={History} /><QuickLink href="/admin/problems" label="문제 관리" icon={Layers3} /></div></SidePanel></aside></section></div></AppShell>;
}
