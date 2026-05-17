"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import AppShell from "@/components/layout/AppShell";
import { AppButton, Badge, Card, EmptyState, MiniStat, Notice, PageHero, ProgressBar, SidePanel, StatCard } from "@/components/ui";
import { FilterPanel, FilterSelect, SearchInput } from "@/components/forms";
import { ListHeader, ViewModeToggle, type ViewMode } from "@/components/common";
import { AlertTriangle, BarChart3, CheckCircle2, ChevronRight, Copy, History, KeyRound, Mail, RefreshCcw, RotateCcw, Search, ShieldAlert, ShieldCheck, Star, Trophy, UserCheck, UserCog, UserMinus, UserPlus, UserRound, UsersRound, Zap } from "lucide-react";

type UserRole = "user" | "admin" | "moderator" | "guest";
type UserRoleFilter = "전체" | "사용자" | "관리자" | "운영자" | "게스트";
type UserStatus = "active" | "pending" | "suspended" | "banned" | "deleted";
type UserStatusFilter = "전체" | "활성" | "승인 대기" | "정지" | "차단" | "삭제됨";
type VerificationStatus = "verified" | "unverified" | "oauth";
type VerificationFilter = "전체" | "인증 완료" | "미인증" | "OAuth";
type RiskLevel = "low" | "medium" | "high";
type RiskFilter = "전체" | "낮음" | "보통" | "높음";
type SortOption = "recent-active" | "joined-desc" | "submissions-desc" | "solved-desc" | "risk" | "role" | "handle";

type AdminUser = {
    id: string;
    dbId: number;
    handle: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    verification: VerificationStatus;
    risk: RiskLevel;
    joinedAt: string;
    joinedAtText: string;
    lastActiveAt: string;
    lastActiveAtText: string;
    submissions: number;
    accepted: number;
    solved: number;
    wrong: number;
    notes: number;
    favorites: number;
    testsTaken: number;
    score: number;
    rank: number;
    repeatedCodeCount: number;
    failedRate: number;
    ip: string;
    memo: string;
    tags: string[];
};

const ROLE_OPTIONS: readonly UserRoleFilter[] = ["전체", "사용자", "관리자", "운영자", "게스트"];
const STATUS_OPTIONS: readonly UserStatusFilter[] = ["전체", "활성", "승인 대기", "정지", "차단", "삭제됨"];
const VERIFICATION_OPTIONS: readonly VerificationFilter[] = ["전체", "인증 완료", "미인증", "OAuth"];
const RISK_OPTIONS: readonly RiskFilter[] = ["전체", "낮음", "보통", "높음"];
const SORT_OPTIONS: readonly SortOption[] = ["recent-active", "joined-desc", "submissions-desc", "solved-desc", "risk", "role", "handle"];

const roleLabelToValue: Record<Exclude<UserRoleFilter, "전체">, UserRole> = { 사용자: "user", 관리자: "admin", 운영자: "moderator", 게스트: "guest" };
const statusLabelToValue: Record<Exclude<UserStatusFilter, "전체">, UserStatus> = { 활성: "active", "승인 대기": "pending", 정지: "suspended", 차단: "banned", 삭제됨: "deleted" };
const verificationLabelToValue: Record<Exclude<VerificationFilter, "전체">, VerificationStatus> = { "인증 완료": "verified", 미인증: "unverified", OAuth: "oauth" };
const riskLabelToValue: Record<Exclude<RiskFilter, "전체">, RiskLevel> = { 낮음: "low", 보통: "medium", 높음: "high" };
const sortLabels: Record<SortOption, string> = { "recent-active": "최근 활동순", "joined-desc": "최근 가입순", "submissions-desc": "제출 많은순", "solved-desc": "해결 많은순", risk: "위험도순", role: "권한순", handle: "핸들순" };
const roleOrder: Record<UserRole, number> = { admin: 0, moderator: 1, user: 2, guest: 3 };
const riskOrder: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };

function getAcceptedRate(user: AdminUser) {
    if (user.submissions <= 0) return 0;
    return Math.round((user.accepted / user.submissions) * 100);
}

function RoleBadge({ role }: { role: UserRole }) {
    const meta = role === "admin" ? ["관리자", "red"] : role === "moderator" ? ["운영자", "purple"] : role === "guest" ? ["게스트", "default"] : ["사용자", "blue"];
    return <Badge variant={meta[1] as "red" | "purple" | "default" | "blue"}>{meta[0]}</Badge>;
}

function StatusBadge({ status }: { status: UserStatus }) {
    const meta = status === "active" ? ["활성", "green"] : status === "pending" ? ["대기", "orange"] : status === "banned" || status === "suspended" ? ["제한", "red"] : ["삭제", "default"];
    return <Badge variant={meta[1] as "green" | "orange" | "red" | "default"}>{meta[0]}</Badge>;
}

function VerificationBadge({ verification }: { verification: VerificationStatus }) {
    const meta = verification === "verified" ? ["인증", "green"] : verification === "oauth" ? ["OAuth", "blue"] : ["미인증", "orange"];
    return <Badge variant={meta[1] as "green" | "blue" | "orange"}>{meta[0]}</Badge>;
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
    const meta = risk === "high" ? ["높음", "red"] : risk === "medium" ? ["보통", "orange"] : ["낮음", "green"];
    return <Badge variant={meta[1] as "red" | "orange" | "green"}>{meta[0]}</Badge>;
}

function UserAdminCard({ user, onCopy }: { user: AdminUser; onCopy: (value: string) => void }) {
    const rate = getAcceptedRate(user);
    return (
        <Card className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><UserRound className="h-5 w-5" /></div>
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-lg font-black text-slate-950">@{user.handle}</span>
                            <RoleBadge role={user.role} />
                            <StatusBadge status={user.status} />
                            <VerificationBadge verification={user.verification} />
                            <RiskBadge risk={user.risk} />
                        </div>
                        <p className="text-sm font-bold text-slate-500">{user.name} · {user.email}</p>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{user.memo || "관리 메모가 없습니다."}</p>
                        <div className="mt-3 flex flex-wrap gap-2">{user.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>
                    </div>
                </div>
                <div className="grid min-w-[320px] grid-cols-2 gap-2 md:grid-cols-4">
                    <MiniStat label="제출" value={user.submissions.toLocaleString()} />
                    <MiniStat label="정답률" value={`${rate}%`} />
                    <MiniStat label="해결" value={user.solved.toLocaleString()} />
                    <MiniStat label="점수" value={user.score.toLocaleString()} />
                </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-4">
                <button onClick={() => onCopy(user.email)} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 hover:bg-blue-50"><Copy className="mr-1 inline h-4 w-4" />메일 복사</button>
                <Link href={`/admin/submissions?keyword=${user.email}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-sm font-black text-slate-700 hover:bg-blue-50">제출 보기</Link>
                <button className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 hover:bg-blue-50">권한 변경</button>
                <button className="rounded-2xl bg-rose-50 px-3 py-2 text-sm font-black text-rose-700 hover:bg-rose-100">제한 처리</button>
            </div>
        </Card>
    );
}

function UsersTable({ items }: { items: AdminUser[] }) {
    return (
        <Card className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs font-black uppercase text-slate-500"><tr><th className="px-4 py-3">사용자</th><th className="px-4 py-3">권한</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">위험도</th><th className="px-4 py-3">제출</th><th className="px-4 py-3">정답률</th><th className="px-4 py-3">최근 활동</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((user) => <tr key={user.id} className="hover:bg-slate-50"><td className="px-4 py-4"><p className="font-black text-slate-900">@{user.handle}</p><p className="text-xs font-bold text-slate-500">{user.email}</p></td><td className="px-4 py-4"><RoleBadge role={user.role} /></td><td className="px-4 py-4"><StatusBadge status={user.status} /></td><td className="px-4 py-4"><RiskBadge risk={user.risk} /></td><td className="px-4 py-4 font-bold">{user.submissions}</td><td className="px-4 py-4 font-bold">{getAcceptedRate(user)}%</td><td className="px-4 py-4 font-bold text-slate-500">{user.lastActiveAtText}</td></tr>)}</tbody></table></div></Card>
    );
}

function DistributionPanel({ title, icon: Icon, rows }: { title: string; icon: ComponentType<{ className?: string }>; rows: Array<{ label: string; count: number }> }) {
    const total = Math.max(rows.reduce((sum, item) => sum + item.count, 0), 1);
    return <SidePanel title={title} badge={<Icon className="h-5 w-5 text-blue-600" />}><div className="space-y-4">{rows.map((row) => <div key={row.label}><div className="mb-2 flex items-center justify-between text-sm font-black"><span>{row.label}</span><span className="text-slate-500">{row.count}명</span></div><ProgressBar value={Math.round((row.count / total) * 100)} /></div>)}</div></SidePanel>;
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: ComponentType<{ className?: string }> }) {
    return <Link href={href} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"><span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span><ChevronRight className="h-4 w-4" /></Link>;
}

export default function AdminUsersPage() {
    const [keyword, setKeyword] = useState("");
    const [role, setRole] = useState<UserRoleFilter>("전체");
    const [status, setStatus] = useState<UserStatusFilter>("전체");
    const [verification, setVerification] = useState<VerificationFilter>("전체");
    const [risk, setRisk] = useState<RiskFilter>("전체");
    const [sort, setSort] = useState<SortOption>("recent-active");
    const [viewMode, setViewMode] = useState<ViewMode>("card");
    const [message, setMessage] = useState<string | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadUsers = async () => {
        try { setLoading(true); setError(null); const response = await fetch("/api/admin/users", { cache: "no-store" }); if (!response.ok) throw new Error("사용자 데이터를 불러오지 못했습니다."); const json = await response.json(); setUsers(json.users ?? []); }
        catch (err) { setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."); }
        finally { setLoading(false); }
    };

    useEffect(() => { void loadUsers(); }, []);

    const filteredUsers = useMemo(() => {
        const lowerKeyword = keyword.trim().toLowerCase();
        const rows = users.filter((user) => {
            const matchesKeyword = !lowerKeyword || user.id.toLowerCase().includes(lowerKeyword) || user.handle.toLowerCase().includes(lowerKeyword) || user.name.toLowerCase().includes(lowerKeyword) || user.email.toLowerCase().includes(lowerKeyword) || user.memo.toLowerCase().includes(lowerKeyword) || user.ip.toLowerCase().includes(lowerKeyword) || user.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword));
            const matchesRole = role === "전체" || user.role === roleLabelToValue[role];
            const matchesStatus = status === "전체" || user.status === statusLabelToValue[status];
            const matchesVerification = verification === "전체" || user.verification === verificationLabelToValue[verification];
            const matchesRisk = risk === "전체" || user.risk === riskLabelToValue[risk];
            return matchesKeyword && matchesRole && matchesStatus && matchesVerification && matchesRisk;
        });
        return [...rows].sort((a, b) => {
            switch (sort) {
                case "joined-desc": return b.joinedAt.localeCompare(a.joinedAt);
                case "submissions-desc": return b.submissions - a.submissions;
                case "solved-desc": return b.solved - a.solved;
                case "risk": return riskOrder[a.risk] - riskOrder[b.risk];
                case "role": return roleOrder[a.role] - roleOrder[b.role];
                case "handle": return a.handle.localeCompare(b.handle);
                default: return b.lastActiveAt.localeCompare(a.lastActiveAt);
            }
        });
    }, [users, keyword, role, status, verification, risk, sort]);

    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.status === "active").length;
    const adminUsers = users.filter((user) => user.role === "admin" || user.role === "moderator").length;
    const pendingUsers = users.filter((user) => user.status === "pending" || user.verification === "unverified").length;
    const riskUserCount = users.filter((user) => user.risk === "high").length;
    const totalSubmissions = users.reduce((sum, user) => sum + user.submissions, 0);
    const totalAccepted = users.reduce((sum, user) => sum + user.accepted, 0);
    const acceptedRate = totalSubmissions > 0 ? Math.round((totalAccepted / totalSubmissions) * 100) : 0;

    const resetFilters = () => { setKeyword(""); setRole("전체"); setStatus("전체"); setVerification("전체"); setRisk("전체"); setSort("recent-active"); };
    const handleCopy = (value: string) => { void navigator.clipboard?.writeText(value); setMessage(`${value} 복사 완료`); };

    return (
        <AppShell title="사용자 관리" description="DB 사용자, 권한, 활동, 위험도를 관리합니다.">
            <div className="space-y-6">
                <PageHero eyebrow={<><Badge variant="blue">Admin</Badge><Badge>User DB</Badge><Badge variant={riskUserCount > 0 ? "red" : "green"}>Risk {riskUserCount}</Badge></>} title="사용자 데이터를 DB 기준으로 관리하세요." description="User와 Submission 테이블을 기반으로 사용자 상태, 제출 통계, 위험도를 표시합니다." actions={<><button onClick={loadUsers} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><RefreshCcw className="h-4 w-4" />새로고침</button><AppButton><UserPlus className="h-4 w-4" />사용자 추가</AppButton></>} />
                {message && <Notice title="작업 완료" variant="success">{message}</Notice>}
                {error && <Notice title="DB 조회 오류" variant="danger">{error}</Notice>}
                {loading && <Notice title="데이터 조회 중" variant="info">사용자 데이터를 불러오는 중입니다.</Notice>}
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><StatCard label="전체 사용자" value={totalUsers.toLocaleString()} caption="User 테이블" icon={UsersRound} /><StatCard label="활성" value={activeUsers.toLocaleString()} caption="status=active" icon={UserCheck} /><StatCard label="관리 권한" value={adminUsers.toLocaleString()} caption="admin/moderator" icon={UserCog} /><StatCard label="승인/인증 대기" value={pendingUsers.toLocaleString()} caption="pending/unverified" icon={Mail} /><StatCard label="평균 정답률" value={`${acceptedRate}%`} caption="Submission 기준" icon={Trophy} /></section>
                <FilterPanel title="사용자 검색 / 필터" onReset={resetFilters} gridClassName="grid gap-3 xl:grid-cols-[1.4fr_130px_130px_130px_120px_170px_auto] xl:items-end"><SearchInput value={keyword} onChange={setKeyword} placeholder="핸들, 이름, 이메일, 메모, IP, 태그 검색" /><FilterSelect label="권한" value={role} onChange={setRole} options={ROLE_OPTIONS} /><FilterSelect label="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} /><FilterSelect label="인증" value={verification} onChange={setVerification} options={VERIFICATION_OPTIONS} /><FilterSelect label="위험도" value={risk} onChange={setRisk} options={RISK_OPTIONS} /><FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} /></FilterPanel>
                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]"><div className="space-y-4"><ListHeader title="사용자 목록" description={`검색 조건에 맞는 사용자 ${filteredUsers.length.toLocaleString()}명이 표시됩니다. 현재 정렬: ${sortLabels[sort]}`} right={<ViewModeToggle value={viewMode} onChange={setViewMode} />} />{filteredUsers.length === 0 ? <EmptyState title="사용자를 찾을 수 없습니다." description="검색어 또는 필터 조건을 변경해보세요." icon={Search} onReset={resetFilters} /> : viewMode === "card" ? <div className="space-y-4">{filteredUsers.map((user) => <UserAdminCard key={user.id} user={user} onCopy={handleCopy} />)}</div> : <UsersTable items={filteredUsers} />}</div><aside className="space-y-4"><DistributionPanel title="권한 분포" icon={BarChart3} rows={[{ label: "관리자", count: users.filter((u) => u.role === "admin").length }, { label: "운영자", count: users.filter((u) => u.role === "moderator").length }, { label: "사용자", count: users.filter((u) => u.role === "user").length }, { label: "게스트", count: users.filter((u) => u.role === "guest").length }]} /><DistributionPanel title="위험도" icon={ShieldAlert} rows={[{ label: "높음", count: users.filter((u) => u.risk === "high").length }, { label: "보통", count: users.filter((u) => u.risk === "medium").length }, { label: "낮음", count: users.filter((u) => u.risk === "low").length }]} /><SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}><div className="space-y-2"><QuickLink href="/admin" label="관리자 홈" icon={ShieldCheck} /><QuickLink href="/admin/submissions" label="제출 관리" icon={History} /><QuickLink href="/admin/logs" label="시스템 로그" icon={ShieldAlert} /><QuickLink href="/admin/problems" label="문제 관리" icon={Star} /></div></SidePanel></aside></section>
            </div>
        </AppShell>
    );
}
