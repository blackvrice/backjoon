// ============================================================
// components/layout/navigation.ts
// ============================================================

import type { ComponentType } from "react";
import {
    BarChart3,
    BookOpen,
    CheckSquare,
    ClipboardList,
    Code2,
    Database,
    FileText,
    Flag,
    Gauge,
    Hash,
    Heart,
    Home,
    Layers3,
    ListChecks,
    LogIn,
    Medal,
    MessageSquare,
    NotebookPen,
    Server,
    Settings,
    Shield,
    ShieldCheck,
    Target,
    Terminal,
    Trophy,
    UserRound,
    UsersRound
} from "lucide-react";

export type NavigationIcon = ComponentType<{ className?: string }>;

export type NavigationItem = {
    label: string;
    href: string;
    icon: NavigationIcon;
    badge?: string;
    exact?: boolean;
};

export type NavigationGroup = {
    title: string;
    items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
    {
        title: "Main",
        items: [
            { label: "메인", href: "/", icon: Home, exact: true },
            { label: "대시보드", href: "/dashboard", icon: Gauge },
            { label: "문제 검색", href: "/problems", icon: BookOpen },
            { label: "제출 기록", href: "/submissions", icon: ListChecks },
            { label: "랭킹", href: "/ranking", icon: Medal }
        ]
    },
    {
        title: "Study",
        items: [
            { label: "목표", href: "/goals", icon: Target },
            { label: "오답노트", href: "/notes", icon: NotebookPen },
            { label: "즐겨찾기", href: "/favorites", icon: Heart },
            { label: "문제 세트", href: "/sets", icon: Layers3 },
            { label: "태그", href: "/tags", icon: Hash },
            { label: "프로필", href: "/profile", icon: UserRound }
        ]
    },
    {
        title: "Test",
        items: [
            { label: "모의 테스트", href: "/tests", icon: ClipboardList },
            { label: "데이터", href: "/data", icon: Database }
        ]
    },
    {
        title: "Admin",
        items: [
            { label: "관리자 홈", href: "/admin", icon: Shield, exact: true },
            { label: "문제 관리", href: "/admin/problems", icon: FileText },
            { label: "사용자 관리", href: "/admin/users", icon: UsersRound },
            { label: "제출 관리", href: "/admin/submissions", icon: CheckSquare },
            { label: "채점 서버", href: "/admin/judge", icon: Server },
            { label: "시스템 로그", href: "/admin/logs", icon: Terminal },
            { label: "관리자 설정", href: "/admin/settings", icon: Settings, badge: "soon" }
        ]
    }
];

export const utilityNavigation: NavigationItem[] = [
    { label: "설정", href: "/settings", icon: Settings },
    { label: "로그인", href: "/login", icon: LogIn }
];


// ============================================================
// components/layout/Sidebar.tsx
// ============================================================


// ============================================================
// components/layout/Header.tsx
// ============================================================

// ============================================================
// components/layout/index.ts
// ============================================================

