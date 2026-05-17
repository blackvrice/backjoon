
import type { ReactNode } from "react";

export type BadgeVariant =
    | "default"
    | "dark"
    | "blue"
    | "green"
    | "orange"
    | "red"
    | "purple"
    | "amber"
    | "cyan";

const badgeVariants: Record<BadgeVariant, string> = {
    default: "border-slate-200 bg-slate-50 text-slate-600",
    dark: "border-slate-800 bg-slate-950 text-white",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    orange: "border-orange-100 bg-orange-50 text-orange-700",
    red: "border-rose-100 bg-rose-50 text-rose-700",
    purple: "border-purple-100 bg-purple-50 text-purple-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    cyan: "border-cyan-100 bg-cyan-50 text-cyan-700"
};

export type BadgeProps = {
    children: ReactNode;
    variant?: BadgeVariant;
    className?: string;
};

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black ${badgeVariants[variant]} ${className}`}>
      {children}
    </span>
    );
}
