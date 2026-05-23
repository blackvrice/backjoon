
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
    Bell,
    Command,
    LogOut,
    Menu,
    Search,
    Settings,
    UserRound
} from "lucide-react";

export type HeaderProps = {
    title?: string;
    description?: string;
    actions?: ReactNode;
    onMenuClick: () => void;
};

type HeaderUser = {
    handle: string;
    name: string | null;
    role: string;
};

export default function Header({ title, description, actions, onMenuClick }: HeaderProps) {
    const [user, setUser] = useState<HeaderUser | null>(null);

    useEffect(() => {
        let ignore = false;

        async function loadUser() {
            const response = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
            if (!response?.ok) return;

            const data = await response.json().catch(() => null);
            if (!ignore && data?.user) {
                setUser(data.user);
            }
        }

        void loadUser();

        return () => {
            ignore = true;
        };
    }, []);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        setUser(null);
        window.location.href = "/login";
    };

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
            <div className="flex min-h-16 items-center gap-3 px-4 py-3 md:px-6">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 lg:hidden"
                    aria-label="사이드바 열기"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <div className="min-w-0 flex-1">
                    {title && <h1 className="truncate text-lg font-black tracking-tight text-slate-950 md:text-xl">{title}</h1>}
                    {description && <p className="mt-0.5 hidden truncate text-sm font-medium text-slate-500 md:block">{description}</p>}
                </div>

                <div className="hidden min-w-[280px] max-w-md flex-1 xl:block">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            placeholder="문제, 태그, 사용자 검색"
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-16 text-sm font-bold text-slate-700 outline-none ring-blue-100 transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4"
                        />
                        <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-400 2xl:flex">
                            <Command className="h-3 w-3" />K
                        </div>
                    </div>
                </div>

                {actions && <div className="hidden items-center gap-2 md:flex">{actions}</div>}

                <div className="flex items-center gap-2">
                    <Link
                        href="/settings"
                        className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 sm:inline-flex"
                        aria-label="설정"
                    >
                        <Settings className="h-4 w-4" />
                    </Link>

                    <button
                        type="button"
                        className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
                        aria-label="알림"
                    >
                        <Bell className="h-4 w-4" />
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600" />
                    </button>

                    {user ? (
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/profile/${user.handle}`}
                                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
                            >
                                <UserRound className="h-4 w-4" />
                                <span className="hidden sm:inline">{user.name ?? user.handle}</span>
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 sm:inline-flex"
                                aria-label="로그아웃"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
                        >
                            <UserRound className="h-4 w-4" />
                            <span className="hidden sm:inline">로그인</span>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

