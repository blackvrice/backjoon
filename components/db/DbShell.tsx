"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

export type Column<T> = {
    key: string;
    header: string;
    className?: string;
    render: (item: T) => React.ReactNode;
};

const navItems = [
    ["/", "홈"],
    ["/dashboard", "대시보드"],
    ["/problems", "문제"],
    ["/submissions", "제출"],
    ["/ranking", "랭킹"],
    ["/tags", "태그"],
    ["/sets", "세트"],
    ["/tests", "테스트"],
    ["/notes", "노트"],
    ["/goals", "목표"],
    ["/favorites", "즐겨찾기"],
    ["/admin", "관리자"],
];

export function DbShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-slate-950/95 p-5 lg:block">
                <Link href="/" className="block rounded-3xl bg-white/10 p-4">
                    <div className="text-xs font-semibold text-cyan-300">LOCAL JUDGE</div>
                    <div className="mt-1 text-xl font-black">Backjoon DB</div>
                    <div className="mt-2 text-xs text-slate-400">PostgreSQL + Prisma</div>
                </Link>
                <nav className="mt-6 space-y-1">
                    {navItems.map(([href, label]) => (
                        <Link key={href} href={href} className="block rounded-2xl px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">
                            {label}
                        </Link>
                    ))}
                </nav>
            </aside>
            <main className="lg:pl-64">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
            </main>
        </div>
    );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
    return (
        <div className="mb-6 rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="mb-2 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">DB 연결 화면</div>
                    <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
                    {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p> : null}
                </div>
                {action}
            </div>
        </div>
    );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl ${className}`}>{children}</div>;
}

export function StatGrid({ stats }: { stats?: Array<{ label: string; value: React.ReactNode; hint?: string }> }) {
    if (!stats?.length) return null;
    return (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.label}>
                    <div className="text-xs font-semibold text-slate-400">{stat.label}</div>
                    <div className="mt-2 text-2xl font-black text-white">{stat.value}</div>
                    {stat.hint ? <div className="mt-1 text-xs text-slate-500">{stat.hint}</div> : null}
                </Card>
            ))}
        </div>
    );
}

export function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "red" | "orange" | "blue" | "purple" | "cyan" }) {
    const cls = {
        slate: "border-slate-500/30 bg-slate-500/10 text-slate-200",
        green: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
        red: "border-red-400/30 bg-red-400/10 text-red-200",
        orange: "border-orange-400/30 bg-orange-400/10 text-orange-200",
        blue: "border-blue-400/30 bg-blue-400/10 text-blue-200",
        purple: "border-purple-400/30 bg-purple-400/10 text-purple-200",
        cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
    }[tone];
    return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${cls}`}>{children}</span>;
}

export function useDbApi<T>(api: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        async function load() {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch(api, { cache: "no-store" });
                if (!res.ok) throw new Error(`API 오류: ${res.status}`);
                const json = (await res.json()) as T;
                if (alive) setData(json);
            } catch (err) {
                if (alive) setError(err instanceof Error ? err.message : "알 수 없는 오류");
            } finally {
                if (alive) setLoading(false);
            }
        }
        load();
        return () => { alive = false; };
    }, [api]);

    return { data, loading, error, setData };
}

export function DbListPage<T extends object>({
    title,
    description,
    api,
    itemsKey,
    columns,
    searchFields,
    stats,
    getHref,
    getCardTitle,
    getCardSubtitle,
}: {
    title: string;
    description?: string;
    api: string;
    itemsKey: string;
    columns: Column<T>[];
    searchFields?: Array<keyof T>;
    stats?: (data: any, items: T[]) => Array<{ label: string; value: React.ReactNode; hint?: string }>;
    getHref?: (item: T) => string;
    getCardTitle?: (item: T) => React.ReactNode;
    getCardSubtitle?: (item: T) => React.ReactNode;
}) {
    const { data, loading, error } = useDbApi<any>(api);
    const [keyword, setKeyword] = useState("");
    const items = useMemo(() => {
        const raw = ((data?.[itemsKey] ?? []) as T[]);
        const lower = keyword.trim().toLowerCase();
        if (!lower) return raw;
        return raw.filter((item) =>
            (searchFields ?? (Object.keys(item) as Array<keyof T>)).some((key) => String(item[key] ?? "").toLowerCase().includes(lower))
        );
    }, [data, itemsKey, keyword, searchFields]);

    return (
        <DbShell>
            <PageHeader title={title} description={description} />
            <StatGrid stats={stats?.(data, items)} />
            <Card className="mb-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="검색어를 입력하세요"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/30 placeholder:text-slate-500 focus:ring-4 md:max-w-md"
                    />
                    <div className="text-sm text-slate-400">총 {items.length.toLocaleString()}건</div>
                </div>
            </Card>
            {loading ? <Card>DB에서 데이터를 불러오는 중입니다...</Card> : null}
            {error ? <Card className="border-red-400/30 text-red-200">{error}</Card> : null}
            {!loading && !error && items.length === 0 ? <Card>표시할 데이터가 없습니다.</Card> : null}
            <div className="grid gap-4 xl:hidden">
                {items.map((item, index) => {
                    const content = (
                        <Card className="transition hover:border-cyan-400/30 hover:bg-cyan-400/5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-lg font-black text-white">{getCardTitle ? getCardTitle(item) : String(item.title ?? item.name ?? item.id ?? index)}</div>
                                    {getCardSubtitle ? <div className="mt-1 text-sm text-slate-400">{getCardSubtitle(item)}</div> : null}
                                </div>
                                <Pill tone="cyan">#{index + 1}</Pill>
                            </div>
                            <div className="mt-4 grid gap-2 text-sm text-slate-300">
                                {columns.slice(0, 5).map((col) => (
                                    <div key={col.key} className="flex justify-between gap-3 border-t border-white/5 pt-2">
                                        <span className="text-slate-500">{col.header}</span>
                                        <span className="text-right">{col.render(item)}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    );
                    return getHref ? <Link key={String(item.id ?? index)} href={getHref(item)}>{content}</Link> : <div key={String(item.id ?? index)}>{content}</div>;
                })}
            </div>
            <Card className="hidden overflow-hidden p-0 xl:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/[0.04] text-xs uppercase text-slate-400">
                        <tr>
                            {columns.map((col) => <th key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>{col.header}</th>)}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {items.map((item, index) => (
                            <tr key={String(item.id ?? index)} className="hover:bg-white/[0.03]">
                                {columns.map((col) => (
                                    <td key={col.key} className={`px-4 py-3 text-slate-200 ${col.className ?? ""}`}>{col.render(item)}</td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </DbShell>
    );
}

export function statusTone(status?: string) {
    if (!status) return "slate";
    if (["accepted", "solved", "active", "published", "resolved", "verified", "ready", "finished"].includes(status)) return "green";
    if (["wrong", "compile", "runtime", "timeLimit", "memory", "error", "critical", "failed", "blocked"].includes(status)) return "red";
    if (["pending", "judging", "review", "warning", "investigating"].includes(status)) return "orange";
    return "slate";
}

export function difficultyTone(difficulty?: string) {
    if (difficulty === "Hard") return "red";
    if (difficulty === "Medium") return "orange";
    return "green";
}
