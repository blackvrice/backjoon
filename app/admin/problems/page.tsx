"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import AppShell from "@/components/layout/AppShell";
import { AppButton, Badge, Card, EmptyState, MiniStat, Notice, PageHero, ProgressBar, SidePanel, StatCard } from "@/components/ui";
import { FilterPanel, FilterSelect, SearchInput } from "@/components/forms";
import { ListHeader, ViewModeToggle, type ViewMode } from "@/components/common";
import { AlertTriangle, BarChart3, BookOpen, CheckCircle2, ChevronRight, Clock3, Code2, Copy, Database, Download, Edit3, Eye, EyeOff, FileArchive, FileCode2, FileText, Gauge, Hash, History, Import, ListChecks, Plus, RefreshCcw, RotateCcw, Search, ShieldAlert, ShieldCheck, Terminal, Trash2, Upload, Wrench, Zap } from "lucide-react";

type Difficulty = "Easy" | "Medium" | "Hard";
type ProblemPublishStatus = "published" | "draft" | "review" | "hidden" | "archived";
type ProblemStatusFilter = "전체" | "공개" | "초안" | "검수" | "숨김" | "보관";
type DifficultyFilter = "전체" | Difficulty;
type SourceFilter = "전체" | "Baekjoon" | "Local" | "Custom";
type TestCaseStatus = "verified" | "pending" | "failed" | "missing";
type TestCaseStatusFilter = "전체" | "검증 완료" | "검증 대기" | "검증 실패" | "없음";
type SortOption = "recent" | "number-asc" | "number-desc" | "review-first" | "testcase-first" | "submissions-desc" | "title" | "difficulty";

type AdminProblem = {
    id: number;
    dbId: number;
    title: string;
    slug: string;
    difficulty: Difficulty;
    score: number;
    source: Exclude<SourceFilter, "전체">;
    status: ProblemPublishStatus;
    testCaseStatus: TestCaseStatus;
    timeLimit: string;
    memoryLimit: string;
    tags: string[];
    category: string;
    submissions: number;
    accepted: number;
    note: string;
    author: string;
    reviewer?: string;
    testCaseCount: number;
    sampleCount: number;
    hiddenCaseCount: number;
    createdAt: string;
    createdAtText: string;
    updatedAt: string;
    updatedAtText: string;
    publishedAt?: string;
    publishedAtText?: string;
    reviewMessage?: string;
};

const STATUS_OPTIONS: readonly ProblemStatusFilter[] = ["전체", "공개", "초안", "검수", "숨김", "보관"];
const DIFFICULTY_OPTIONS: readonly DifficultyFilter[] = ["전체", "Easy", "Medium", "Hard"];
const SOURCE_OPTIONS: readonly SourceFilter[] = ["전체", "Baekjoon", "Local", "Custom"];
const TEST_CASE_OPTIONS: readonly TestCaseStatusFilter[] = ["전체", "검증 완료", "검증 대기", "검증 실패", "없음"];
const SORT_OPTIONS: readonly SortOption[] = ["recent", "number-asc", "number-desc", "review-first", "testcase-first", "submissions-desc", "title", "difficulty"];
const statusLabelToValue: Record<Exclude<ProblemStatusFilter, "전체">, ProblemPublishStatus> = { 공개: "published", 초안: "draft", 검수: "review", 숨김: "hidden", 보관: "archived" };
const testCaseLabelToValue: Record<Exclude<TestCaseStatusFilter, "전체">, TestCaseStatus> = { "검증 완료": "verified", "검증 대기": "pending", "검증 실패": "failed", 없음: "missing" };
const sortLabels: Record<SortOption, string> = { recent: "최근 수정순", "number-asc": "번호 낮은순", "number-desc": "번호 높은순", "review-first": "검수 우선순", "testcase-first": "테스트 문제 우선순", "submissions-desc": "제출 많은순", title: "제목순", difficulty: "난이도순" };
const statusOrder: Record<ProblemPublishStatus, number> = { review: 0, draft: 1, hidden: 2, published: 3, archived: 4 };
const testCaseOrder: Record<TestCaseStatus, number> = { failed: 0, missing: 1, pending: 2, verified: 3 };
const difficultyOrder: Record<Difficulty, number> = { Easy: 1, Medium: 2, Hard: 3 };

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
    const variant = difficulty === "Hard" ? "red" : difficulty === "Medium" ? "orange" : "green";
    return <Badge variant={variant as "red" | "orange" | "green"}>{difficulty}</Badge>;
}
function PublishStatusBadge({ status }: { status: ProblemPublishStatus }) {
    const meta = status === "published" ? ["공개", "green", Eye] : status === "review" ? ["검수", "orange", Clock3] : status === "hidden" ? ["숨김", "blue", EyeOff] : status === "archived" ? ["보관", "default", FileArchive] : ["초안", "default", Edit3];
    const Icon = meta[2] as ComponentType<{ className?: string }>;
    return <Badge variant={meta[1] as "green" | "orange" | "blue" | "default"}><Icon className="mr-1 h-3.5 w-3.5" />{meta[0] as string}</Badge>;
}
function TestCaseStatusBadge({ status }: { status: TestCaseStatus }) {
    const meta = status === "verified" ? ["검증 완료", "green", CheckCircle2] : status === "failed" ? ["검증 실패", "red", AlertTriangle] : status === "missing" ? ["없음", "default", FileCode2] : ["검증 대기", "orange", Clock3];
    const Icon = meta[2] as ComponentType<{ className?: string }>;
    return <Badge variant={meta[1] as "green" | "red" | "default" | "orange"}><Icon className="mr-1 h-3.5 w-3.5" />{meta[0] as string}</Badge>;
}
function getAcceptedRate(problem: AdminProblem) { return problem.submissions <= 0 ? 0 : Math.round((problem.accepted / problem.submissions) * 100); }

function ProblemAdminCard({ problem, onCopy }: { problem: AdminProblem; onCopy: (value: string) => void }) {
    return <Card className="p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><BookOpen className="h-5 w-5" /></div><div><div className="mb-2 flex flex-wrap items-center gap-2"><Link href={`/problems/${problem.id}`} className="text-lg font-black text-slate-950 hover:text-blue-700">{problem.id}. {problem.title}</Link><DifficultyBadge difficulty={problem.difficulty} /><PublishStatusBadge status={problem.status} /><TestCaseStatusBadge status={problem.testCaseStatus} /></div><p className="text-sm font-bold text-slate-500">{problem.category} · {problem.source} · {problem.timeLimit} · {problem.memoryLimit}</p><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{problem.note || "운영 메모가 없습니다."}</p>{problem.reviewMessage && <p className="mt-2 rounded-2xl bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700">{problem.reviewMessage}</p>}<div className="mt-3 flex flex-wrap gap-2">{problem.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></div></div><div className="grid min-w-[320px] grid-cols-2 gap-2 md:grid-cols-4"><MiniStat label="제출" value={problem.submissions.toLocaleString()} /><MiniStat label="정답률" value={`${getAcceptedRate(problem)}%`} /><MiniStat label="TC" value={`${problem.testCaseCount}`} /><MiniStat label="점수" value={`${problem.score}`} /></div></div><div className="mt-4 grid gap-2 md:grid-cols-4"><button onClick={() => onCopy(String(problem.id))} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 hover:bg-blue-50"><Copy className="mr-1 inline h-4 w-4" />번호 복사</button><Link href={`/admin/problems/${problem.id}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-sm font-black text-slate-700 hover:bg-blue-50">수정</Link><Link href={`/admin/submissions?keyword=${problem.id}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-sm font-black text-slate-700 hover:bg-blue-50">제출</Link><button className="rounded-2xl bg-rose-50 px-3 py-2 text-sm font-black text-rose-700 hover:bg-rose-100">숨김</button></div></Card>;
}

function ProblemsTable({ items }: { items: AdminProblem[] }) {
    return <Card className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-50 text-xs font-black uppercase text-slate-500"><tr><th className="px-4 py-3">문제</th><th className="px-4 py-3">난이도</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">TC</th><th className="px-4 py-3">제출</th><th className="px-4 py-3">정답률</th><th className="px-4 py-3">수정일</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((problem) => <tr key={problem.id} className="hover:bg-slate-50"><td className="px-4 py-4"><p className="font-black text-slate-900">{problem.id}. {problem.title}</p><p className="text-xs font-bold text-slate-500">{problem.category} · {problem.tags.join(", ")}</p></td><td className="px-4 py-4"><DifficultyBadge difficulty={problem.difficulty} /></td><td className="px-4 py-4"><PublishStatusBadge status={problem.status} /></td><td className="px-4 py-4"><TestCaseStatusBadge status={problem.testCaseStatus} /></td><td className="px-4 py-4 font-bold">{problem.submissions}</td><td className="px-4 py-4 font-bold">{getAcceptedRate(problem)}%</td><td className="px-4 py-4 font-bold text-slate-500">{problem.updatedAtText}</td></tr>)}</tbody></table></div></Card>;
}
function DistributionPanel({ title, icon: Icon, rows }: { title: string; icon: ComponentType<{ className?: string }>; rows: Array<{ label: string; count: number }> }) { const total = Math.max(rows.reduce((s, r) => s + r.count, 0), 1); return <SidePanel title={title} badge={<Icon className="h-5 w-5 text-blue-600" />}><div className="space-y-4">{rows.map((row) => <div key={row.label}><div className="mb-2 flex items-center justify-between text-sm font-black"><span>{row.label}</span><span className="text-slate-500">{row.count}개</span></div><ProgressBar value={Math.round((row.count / total) * 100)} /></div>)}</div></SidePanel>; }
function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: ComponentType<{ className?: string }> }) { return <Link href={href} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"><span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span><ChevronRight className="h-4 w-4" /></Link>; }

export default function AdminProblemsPage() {
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState<ProblemStatusFilter>("전체");
    const [difficulty, setDifficulty] = useState<DifficultyFilter>("전체");
    const [source, setSource] = useState<SourceFilter>("전체");
    const [testCaseStatus, setTestCaseStatus] = useState<TestCaseStatusFilter>("전체");
    const [sort, setSort] = useState<SortOption>("recent");
    const [viewMode, setViewMode] = useState<ViewMode>("card");
    const [message, setMessage] = useState<string | null>(null);
    const [problems, setProblems] = useState<AdminProblem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProblems = async () => { try { setLoading(true); setError(null); const res = await fetch("/api/admin/problems", { cache: "no-store" }); if (!res.ok) throw new Error("문제 데이터를 불러오지 못했습니다."); const json = await res.json(); setProblems(json.problems ?? []); } catch (err) { setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."); } finally { setLoading(false); } };
    useEffect(() => { void loadProblems(); }, []);

    const filteredProblems = useMemo(() => { const lowerKeyword = keyword.trim().toLowerCase(); const rows = problems.filter((problem) => { const matchesKeyword = !lowerKeyword || String(problem.id).includes(lowerKeyword) || problem.title.toLowerCase().includes(lowerKeyword) || problem.slug.toLowerCase().includes(lowerKeyword) || problem.note.toLowerCase().includes(lowerKeyword) || problem.category.toLowerCase().includes(lowerKeyword) || problem.author.toLowerCase().includes(lowerKeyword) || problem.reviewer?.toLowerCase().includes(lowerKeyword) || problem.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword)); const matchesStatus = status === "전체" || problem.status === statusLabelToValue[status]; const matchesDifficulty = difficulty === "전체" || problem.difficulty === difficulty; const matchesSource = source === "전체" || problem.source === source; const matchesTestCase = testCaseStatus === "전체" || problem.testCaseStatus === testCaseLabelToValue[testCaseStatus]; return matchesKeyword && matchesStatus && matchesDifficulty && matchesSource && matchesTestCase; }); return [...rows].sort((a, b) => { switch (sort) { case "number-asc": return a.id - b.id; case "number-desc": return b.id - a.id; case "review-first": return statusOrder[a.status] - statusOrder[b.status]; case "testcase-first": return testCaseOrder[a.testCaseStatus] - testCaseOrder[b.testCaseStatus]; case "submissions-desc": return b.submissions - a.submissions; case "title": return a.title.localeCompare(b.title); case "difficulty": return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty]; default: return b.updatedAt.localeCompare(a.updatedAt); } }); }, [problems, keyword, status, difficulty, source, testCaseStatus, sort]);
    const totalProblems = problems.length; const publishedCount = problems.filter((p) => p.status === "published").length; const reviewCount = problems.filter((p) => p.status === "review").length; const failedTcCount = problems.filter((p) => p.testCaseStatus === "failed" || p.testCaseStatus === "missing").length; const totalSubmissions = problems.reduce((sum, p) => sum + p.submissions, 0); const totalAccepted = problems.reduce((sum, p) => sum + p.accepted, 0); const acceptedRate = totalSubmissions > 0 ? Math.round((totalAccepted / totalSubmissions) * 100) : 0;
    const resetFilters = () => { setKeyword(""); setStatus("전체"); setDifficulty("전체"); setSource("전체"); setTestCaseStatus("전체"); setSort("recent"); };
    const handleCopy = (value: string) => { void navigator.clipboard?.writeText(value); setMessage(`${value} 복사 완료`); };

    return <AppShell title="문제 관리" description="DB 문제, 테스트 케이스, 공개 상태를 관리합니다."><div className="space-y-6"><PageHero eyebrow={<><Badge variant="blue">Admin</Badge><Badge>Problem DB</Badge><Badge variant={reviewCount > 0 ? "orange" : "green"}>Review {reviewCount}</Badge></>} title="문제 데이터를 DB 기준으로 관리하세요." description="Problem, TestCase, Submission 테이블을 기반으로 문제 운영 상태를 표시합니다." actions={<><button onClick={loadProblems} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><RefreshCcw className="h-4 w-4" />새로고침</button><Link href="/admin/problems/new" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 shadow-sm ring-1 ring-slate-200"><Plus className="h-4 w-4" />문제 추가</Link></>} />{message && <Notice title="작업 완료" variant="success">{message}</Notice>}{error && <Notice title="DB 조회 오류" variant="danger">{error}</Notice>}{loading && <Notice title="데이터 조회 중" variant="info">문제 데이터를 불러오는 중입니다.</Notice>}<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><StatCard label="전체 문제" value={totalProblems.toLocaleString()} caption="Problem" icon={BookOpen} /><StatCard label="공개" value={publishedCount.toLocaleString()} caption="published" icon={Eye} /><StatCard label="검수" value={reviewCount.toLocaleString()} caption="review" icon={ShieldCheck} /><StatCard label="TC 확인" value={failedTcCount.toLocaleString()} caption="failed/missing" icon={FileCode2} /><StatCard label="정답률" value={`${acceptedRate}%`} caption="Submission" icon={Gauge} /></section><FilterPanel title="문제 검색 / 필터" onReset={resetFilters} gridClassName="grid gap-3 xl:grid-cols-[1.4fr_130px_130px_130px_150px_180px_auto] xl:items-end"><SearchInput value={keyword} onChange={setKeyword} placeholder="문제 번호, 제목, slug, 메모, 분류, 작성자, 검수자, 태그 검색" /><FilterSelect label="공개 상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} /><FilterSelect label="난이도" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} /><FilterSelect label="소스" value={source} onChange={setSource} options={SOURCE_OPTIONS} /><FilterSelect label="TC 상태" value={testCaseStatus} onChange={setTestCaseStatus} options={TEST_CASE_OPTIONS} /><FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} /></FilterPanel><section className="grid gap-6 2xl:grid-cols-[1fr_380px]"><div className="space-y-4"><ListHeader title="관리 문제 목록" description={`검색 조건에 맞는 문제 ${filteredProblems.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`} right={<ViewModeToggle value={viewMode} onChange={setViewMode} />} />{filteredProblems.length === 0 ? <EmptyState title="문제를 찾을 수 없습니다." description="검색어 또는 필터 조건을 변경해보세요." icon={Search} onReset={resetFilters} /> : viewMode === "card" ? <div className="space-y-4">{filteredProblems.map((problem) => <ProblemAdminCard key={problem.id} problem={problem} onCopy={handleCopy} />)}</div> : <ProblemsTable items={filteredProblems} />}</div><aside className="space-y-4"><DistributionPanel title="공개 상태" icon={BarChart3} rows={[{ label: "검수", count: problems.filter((p) => p.status === "review").length }, { label: "초안", count: problems.filter((p) => p.status === "draft").length }, { label: "숨김", count: problems.filter((p) => p.status === "hidden").length }, { label: "공개", count: problems.filter((p) => p.status === "published").length }, { label: "보관", count: problems.filter((p) => p.status === "archived").length }]} /><DistributionPanel title="테스트 케이스 상태" icon={FileCode2} rows={[{ label: "검증 실패", count: problems.filter((p) => p.testCaseStatus === "failed").length }, { label: "없음", count: problems.filter((p) => p.testCaseStatus === "missing").length }, { label: "검증 대기", count: problems.filter((p) => p.testCaseStatus === "pending").length }, { label: "검증 완료", count: problems.filter((p) => p.testCaseStatus === "verified").length }]} /><SidePanel title="운영 액션" badge={<Wrench className="h-5 w-5 text-blue-600" />}><div className="space-y-2"><AppButton><Upload className="h-4 w-4" />문제 가져오기</AppButton><AppButton><Download className="h-4 w-4" />필터 Export</AppButton></div></SidePanel><SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}><div className="space-y-2"><QuickLink href="/admin" label="관리자 홈" icon={ShieldCheck} /><QuickLink href="/admin/submissions" label="제출 관리" icon={ListChecks} /><QuickLink href="/admin/logs" label="시스템 로그" icon={History} /><QuickLink href="/data" label="데이터 관리" icon={Database} /></div></SidePanel></aside></section></div></AppShell>;
}
