
"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export type AppShellProps = {
    title?: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    fullWidth?: boolean;
    contentClassName?: string;
};

export default function AppShell({
                                     title,
                                     description,
                                     actions,
                                     children,
                                     fullWidth = false,
                                     contentClassName = ""
                                 }: AppShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="lg:pl-72">
                <Header
                    title={title}
                    description={description}
                    actions={actions}
                    onMenuClick={() => setSidebarOpen(true)}
                />

                <main className={`px-4 py-6 md:px-6 md:py-8 ${contentClassName}`}>
                    <div className={fullWidth ? "w-full" : "mx-auto w-full max-w-[1600px]"}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
