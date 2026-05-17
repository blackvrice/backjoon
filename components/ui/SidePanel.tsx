
import Link from "next/link";
import type { ReactNode } from "react";

export type SidePanelProps = {
    title: string;
    badge?: ReactNode;
    href?: string;
    children: ReactNode;
    className?: string;
};

export default function SidePanel({ title, badge, href, children, className = "" }: SidePanelProps) {
    const header = (
        <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-black text-slate-950">{title}</h3>
            {badge}
        </div>
    );

    return (
        <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
            {href ? <Link href={href}>{header}</Link> : header}
            {children}
        </div>
    );
}
