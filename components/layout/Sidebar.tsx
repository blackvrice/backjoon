
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, X } from "lucide-react";
import { navigationGroups, utilityNavigation, type NavigationItem } from "@/components/layout/navigation";

function isActivePath(pathname: string, item: NavigationItem) {
    if (item.exact) {
        return pathname === item.href;
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarLink({ item, onNavigate }: { item: NavigationItem; onNavigate?: () => void }) {
    const pathname = usePathname();
    const active = isActivePath(pathname, item);
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm font-black transition ${
                active
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            }`}
        >
    <span className="flex min-w-0 items-center gap-3">
    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-400 group-hover:text-slate-700"}`} />
    <span className="truncate">{item.label}</span>
        </span>

            {item.badge && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${active ? "bg-white/15 text-white" : "bg-blue-50 text-blue-600"}`}>
        {item.badge}
        </span>
            )}
        </Link>
    );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
    return (
        <div className="flex h-full flex-col bg-white">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
                <Link href="/" onClick={onClose} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                        <Code2 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-black leading-none text-slate-950">CodeTest</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">Local Judge</p>
                    </div>
                </Link>

                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden"
                        aria-label="사이드바 닫기"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
                {navigationGroups.map((group) => (
                    <div key={group.title}>
                        <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{group.title}</p>
                        <div className="space-y-1">
                            {group.items.map((item) => (
                                <SidebarLink key={item.href} item={item} onNavigate={onClose} />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="border-t border-slate-200 p-4">
                <div className="space-y-1">
                    {utilityNavigation.map((item) => (
                        <SidebarLink key={item.href} item={item} onNavigate={onClose} />
                    ))}
                </div>

                <div className="mt-4 rounded-3xl border border-blue-100 bg-blue-50 p-4 text-blue-900">
                    <p className="text-sm font-black">MVP Mode</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-blue-700">로컬 문제 데이터와 샘플 UI 기반으로 동작합니다.</p>
                </div>
            </div>
        </div>
    );
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <>
            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-slate-200 bg-white lg:block">
                <SidebarContent />
            </aside>

            {open && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                        onClick={onClose}
                        aria-label="사이드바 배경 닫기"
                    />
                    <aside className="absolute left-0 top-0 h-full w-80 max-w-[86vw] border-r border-slate-200 bg-white shadow-2xl">
                        <SidebarContent onClose={onClose} />
                    </aside>
                </div>
            )}
        </>
    );
}
