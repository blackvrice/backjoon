"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import AppShell from "@/components/layout/AppShell";
import { AppButton, Badge, Card, EmptyState, MiniStat, Notice, PageHero, ProgressBar, SidePanel, StatCard } from "@/components/ui";
import { FilterPanel, FilterSelect, SearchInput } from "@/components/forms";
import { ListHeader, ViewModeToggle, type ViewMode } from "@/components/common";
import { Activity, AlertTriangle, BarChart3, BookOpen, CheckCircle2, ChevronRight, Clock3, Code2, Copy, Cpu, Download, Gauge, History, ListChecks, RefreshCcw, RotateCcw, Search, ShieldAlert, ShieldCheck, Terminal, Trash2, UserRound, Wrench, Zap } from "lucide-react";

type Difficulty = "Easy" | "Medium" | "Hard";
type Language = "C++17" | "Python 3.12" | "Java 17" | "JavaScript" | "C" | "C#" | "Dart" | string;
type LanguageFilter = "전체" | string;
type SubmissionStatus = "accepted" | "wrong" | "compile" | "judging" | "pending" | "timeLimit" | "runtime" | "memory" | string;
type StatusFilter = "전체" | "정답" | "오답" | "컴파일 에러" | "채점 중" | "대기" | "시간 초과" | "런타임 에러" | "메모리 초과";
type DifficultyFilter = "전체" | Difficulty;
type SortOption = "recent" | "status" | "runtime-desc" | "memory-desc" | "problem" | "user" | "language";

type AdminSubmission = {
    id: number;
    problemId: number;
    problemTitle: string;
    difficulty: Difficulty;
    user: string;
    handle: string;
    status: SubmissionStatus;
    language: Language;
    timeMs?: number;
    memoryKb?: number;
    codeLength: number;
    submittedAt: string;
    submittedAtText: string;
    judgedAt?: string;
    judgedAtText?: string;
    worker?: string;
    queueJobId?: string;
    retryCount: number;
    score: number;
    testPassed: number;
    testTotal: number;
    ip: string;
    message: string;
    codePreview: string;
    tags: string[];
};

const STATUS_OPTIONS: readonly StatusFilter[] = ["전체", "정답", "오답", "컴파일 에러", "채점 중", "대기", "시간 초과", "런타임 에러", "메모리 초과"];
const DIFFICULTY_OPTIONS: readonly DifficultyFilter[] = ["전체", "Easy", "Medium", "Hard"];
const SORT_OPTIONS: readonly SortOption[] = ["recent", "status", "runtime-desc", "memory-desc", "problem", "user", "language"];
const statusLabelToValue: Record<Exclude<StatusFilter, "전체">, SubmissionStatus> = { 정답: "accepted", 오답: "wrong", "컴파일 에러": "compile", "채점 중": "judging", 대기: "pending", "시간 초과": "timeLimit", "런타임 에러": "runtime", "메모리 초과": "memory" };
const sortLabels: Record<SortOption, string> = { recent: "최근 제출순", status: "상태 우선순", "runtime-desc": "실행시간 높은순", "memory-desc": "메모리 높은순", problem: "문제 번호순", user: "사용자순", language: "언어순" };
const statusOrder: Record<string, number> = { wrong: 0, compile: 1, runtime: 2, timeLimit: 3, memory: 4, judging: 5, pending: 6, accepted: 7 };

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) { const variant = difficulty === "Hard" ? "red" : difficulty === "Medium" ? "orange" : "green"; return <Badge variant={variant as "red" | "orange" | "green"}>{difficulty}</Badge>; }
function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) { const meta = status === "accepted" ? ["정답", "green", CheckCircle2] : status === "pending" ? ["대기", "orange", Clock3] : status === "judging" ? ["채점 중", "blue", Activity] : status === "wrong" ? ["오답", "red", AlertTriangle] : status === "compile" ? ["컴파일", "red", Code2] : status === "timeLimit" ? ["시간 초과", "red", Clock3] : status === "memory" ? ["메모리", "red", Cpu] : ["런타임", "red", Terminal]; const Icon = meta[2] as ComponentType<{ className?: string }>; return <Badge variant={meta[1] as "green" | "orange" | "blue" | "red"}><Icon className="mr-1 h-3.5 w-3.5" />{meta[0] as string}</Badge>; }

function SubmissionAdminCard({ submission, onCopy }: { submission: AdminSubmission; onCopy: (value: string) => void }) {
    const progress = submission.testTotal > 0 ? Math.round((submission.testPassed / submission.testTotal) * 100) : 0;
    return <Card className="p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><Code2 className="h-5 w-5" /></div><div><div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-lg font-black text-slate-950">#{submission.id}</span><SubmissionStatusBadge status={submission.status} /><DifficultyBadge difficulty={submission.difficulty} /><Badge>{submission.language}</Badge></div><p className="text-sm font-bold text-slate-500">{submission.problemId}. {submission.problemTitle} · @{submission.handle} · {submission.submittedAtText}</p><p className="mt-2 text-sm font-bold leading-6 text-slate-500">{submission.message}</p><pre className="mt-3 max-h-28 overflow-auto rounded-2xl bg-slate-950 p-3 text-xs font-bold text-slate-100">{submission.codePreview || "코드 미리보기가 없습니다."}</pre></div></div><div className="grid min-w-[320px] grid-cols-2 gap-2 md:grid-cols-4"><MiniStat label="시간" value={submission.timeMs == null ? "-" : `${submission.timeMs}ms`} /><MiniStat label="메모리" value={submission.memoryKb == null ? "-" : `${submission.memoryKb}KB`} /><MiniStat label="통과" value={`${submission.testPassed}/${submission.testTotal}`} /><MiniStat label="점수" value={`${submission.score}`} /></div></div><ProgressBar value={progress} className="mt-4" /><div className="mt-4 grid gap-2 md:grid-cols-4"><button onClick={() => onCopy(submission.codePreview)} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 hover:bg-blue-50"><Copy className="mr-1 inline h-4 w-4" />코드 복사</button><Link href={`/problems/${submission.problemId}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-sm font-black text-slate-700 hover:bg-blue-50">문제</Link><button className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 hover:bg-blue-50">재채점</button><button className="rounded-2xl bg-rose-50 px-3 py-2 text-sm font-black text-rose-700 hover:bg-rose-100">삭제</button></div></Card>;
}
function AdminSubmissionsTable({ items }: { items: AdminSubmission[] }) { return <Card className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="bg-slate-50 text-xs font-black uppercase text-slate-500"><tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">문제</th><th className="px-4 py-3">사용자</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">언어</th><th className="px-4 py-3">시간</th><th className="px-4 py-3">메모리</th><th className="px-4 py-3">제출일</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((s) => <tr key={s.id} className="hover:bg-slate-50"><td className="px-4 py-4 font-black">#{s.id}</td><td className="px-4 py-4"><p className="font-black text-slate-900">{s.problemId}. {s.problemTitle}</p><DifficultyBadge difficulty={s.difficulty} /></td><td className="px-4 py-4 font-bold text-slate-600">@{s.handle}</td><td className="px-4 py-4"><SubmissionStatusBadge status={s.status} /></td><td className="px-4 py-4 font-bold">{s.language}</td><td className="px-4 py-4 font-bold">{s.timeMs ?? "-"}</td><td className="px-4 py-4 font-bold">{s.memoryKb ?? "-"}</td><td className="px-4 py-4 font-bold text-slate-500">{s.submittedAtText}</td></tr>)}</tbody></table></div></Card>; }
function DistributionPanel({ title, icon: Icon, rows }: { title: string; icon: ComponentType<{ className?: string }>; rows: Array<{ label: string; count: number }> }) { const total = Math.max(rows.reduce((s, r) => s + r.count, 0), 1); return <SidePanel title={title} badge={<Icon className="h-5 w-5 text-blue-600" />}><div className="space-y-4">{rows.map((row) => <div key={row.label}><div className="mb-2 flex items-center justify-between text-sm font-black"><span>{row.label}</span><span className="text-slate-500">{row.count}개</span></div><ProgressBar value={Math.round((row.count / total) * 100)} /></div>)}</div></SidePanel>; }
function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: ComponentType<{ className?: string }> }) { return <Link href={href} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"><span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span><ChevronRight className="h-4 w-4" /></Link>; }

export default function AdminSubmissionsPage() {
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState<StatusFilter>("전체");
    const [language, setLanguage] = useState<LanguageFilter>("전체");
    const [difficulty, setDifficulty] = useState<DifficultyFilter>("전체");
    const [sort, setSort] = useState<SortOption>("recent");
    const [viewMode, setViewMode] = useState<ViewMode>("card");
    const [message, setMessage] = useState<string | null>(null);
    const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSubmissions = async () => { try { setLoading(true); setError(null); const res = await fetch("/api/admin/submissions", { cache: "no-store" }); if (!res.ok) throw new Error("제출 데이터를 불러오지 못했습니다."); const json = await res.json(); setSubmissions(json.submissions ?? []); } catch (err) { setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."); } finally { setLoading(false); } };
    useEffect(() => { void loadSubmissions(); }, []);
    const languageOptions = useMemo(() => ["전체", ...Array.from(new Set(submissions.map((s) => s.language)))], [submissions]);
    const filteredSubmissions = useMemo(() => { const lower = keyword.trim().toLowerCase(); const rows = submissions.filter((s) => { const matchesKeyword = !lower || String(s.id).includes(lower) || String(s.problemId).includes(lower) || s.problemTitle.toLowerCase().includes(lower) || s.user.toLowerCase().includes(lower) || s.handle.toLowerCase().includes(lower) || s.worker?.toLowerCase().includes(lower) || s.queueJobId?.toLowerCase().includes(lower) || s.message.toLowerCase().includes(lower) || s.tags.some((tag) => tag.toLowerCase().includes(lower)); const matchesStatus = status === "전체" || s.status === statusLabelToValue[status]; const matchesLanguage = language === "전체" || s.language === language; const matchesDifficulty = difficulty === "전체" || s.difficulty === difficulty; return matchesKeyword && matchesStatus && matchesLanguage && matchesDifficulty; }); return [...rows].sort((a, b) => { switch (sort) { case "status": return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99); case "runtime-desc": return (b.timeMs ?? 0) - (a.timeMs ?? 0); case "memory-desc": return (b.memoryKb ?? 0) - (a.memoryKb ?? 0); case "problem": return a.problemId - b.problemId; case "user": return a.handle.localeCompare(b.handle); case "language": return String(a.language).localeCompare(String(b.language)); default: return b.submittedAt.localeCompare(a.submittedAt); } }); }, [submissions, keyword, status, language, difficulty, sort]);
    const totalCount = submissions.length; const acceptedCount = submissions.filter((s) => s.status === "accepted").length; const failedCount = submissions.filter((s) => !["accepted", "pending", "judging"].includes(s.status)).length; const pendingCount = submissions.filter((s) => ["pending", "judging"].includes(s.status)).length; const acceptedRate = totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0;
    const resetFilters = () => { setKeyword(""); setStatus("전체"); setLanguage("전체"); setDifficulty("전체"); setSort("recent"); };
    const handleCopyCode = (value: string) => { void navigator.clipboard?.writeText(value); setMessage("코드 미리보기를 복사했습니다."); };

    return <AppShell title="제출 관리" description="DB 제출 기록과 채점 결과를 관리합니다."><div className="space-y-6"><PageHero eyebrow={<><Badge variant="blue">Admin</Badge><Badge>Submission DB</Badge><Badge variant={failedCount > 0 ? "red" : "green"}>Failed {failedCount}</Badge></>} title="제출 데이터를 DB 기준으로 확인하세요." description="Submission, Problem, User 테이블을 조인해서 제출 상태와 채점 결과를 표시합니다." actions={<><button onClick={loadSubmissions} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><RefreshCcw className="h-4 w-4" />새로고침</button><AppButton><Download className="h-4 w-4" />Export</AppButton></>} />{message && <Notice title="작업 완료" variant="success">{message}</Notice>}{error && <Notice title="DB 조회 오류" variant="danger">{error}</Notice>}{loading && <Notice title="데이터 조회 중" variant="info">제출 데이터를 불러오는 중입니다.</Notice>}<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><StatCard label="전체 제출" value={totalCount.toLocaleString()} caption="Submission" icon={ListChecks} /><StatCard label="정답" value={acceptedCount.toLocaleString()} caption="accepted" icon={CheckCircle2} /><StatCard label="실패" value={failedCount.toLocaleString()} caption="wrong/error" icon={ShieldAlert} /><StatCard label="대기/채점" value={pendingCount.toLocaleString()} caption="pending/judging" icon={Cpu} /><StatCard label="정답률" value={`${acceptedRate}%`} caption="accepted/total" icon={Gauge} /></section><FilterPanel title="제출 검색 / 필터" onReset={resetFilters} gridClassName="grid gap-3 xl:grid-cols-[1.4fr_150px_160px_130px_170px_auto] xl:items-end"><SearchInput value={keyword} onChange={setKeyword} placeholder="제출 ID, 문제, 사용자, 메시지, 워커, 태그 검색" /><FilterSelect label="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} /><FilterSelect label="언어" value={language} onChange={setLanguage} options={languageOptions} /><FilterSelect label="난이도" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} /><FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} /></FilterPanel><section className="grid gap-6 2xl:grid-cols-[1fr_380px]"><div className="space-y-4"><ListHeader title="제출 목록" description={`검색 조건에 맞는 제출 ${filteredSubmissions.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`} right={<ViewModeToggle value={viewMode} onChange={setViewMode} />} />{filteredSubmissions.length === 0 ? <EmptyState title="제출 기록을 찾을 수 없습니다." description="검색어 또는 필터 조건을 변경해보세요." icon={Search} onReset={resetFilters} /> : viewMode === "card" ? <div className="space-y-4">{filteredSubmissions.map((submission) => <SubmissionAdminCard key={submission.id} submission={submission} onCopy={handleCopyCode} />)}</div> : <AdminSubmissionsTable items={filteredSubmissions} />}</div><aside className="space-y-4"><SidePanel title="제출 운영 요약" badge={<Gauge className="h-5 w-5 text-blue-600" />}><div className="rounded-[1.5rem] bg-slate-950 p-5 text-white"><p className="text-sm font-black text-slate-300">정답률</p><p className="mt-1 text-5xl font-black">{acceptedRate}%</p><ProgressBar value={acceptedRate} className="mt-5 bg-white/10" /></div><div className="mt-4 grid grid-cols-3 gap-3"><MiniStat label="정답" value={`${acceptedCount}`} /><MiniStat label="실패" value={`${failedCount}`} /><MiniStat label="대기" value={`${pendingCount}`} /></div></SidePanel><DistributionPanel title="상태 분포" icon={BarChart3} rows={[{ label: "정답", count: acceptedCount }, { label: "실패", count: failedCount }, { label: "대기/채점", count: pendingCount }]} /><DistributionPanel title="언어 분포" icon={Code2} rows={languageOptions.filter((l) => l !== "전체").map((l) => ({ label: l, count: submissions.filter((s) => s.language === l).length }))} /><SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}><div className="space-y-2"><QuickLink href="/admin" label="관리자 홈" icon={ShieldCheck} /><QuickLink href="/admin/judge" label="채점 서버" icon={Cpu} /><QuickLink href="/admin/logs" label="시스템 로그" icon={History} /><QuickLink href="/admin/problems" label="문제 관리" icon={BookOpen} /></div></SidePanel></aside></section></div></AppShell>;
}
