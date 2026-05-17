
import type { ComponentType } from "react";

export type StatCardTone = "default" | "blue" | "green" | "orange" | "red" | "purple";

export type StatCardProps = {
    label: string;
    value: string;
    caption?: string;
    icon: ComponentType<{ className?: string }>;
    tone?: StatCardTone;
    className?: string;
};

const statIconTones: Record<StatCardTone, string> = {
    default: "bg-slate-950 text-white",
    blue: "bg-blue-600 text-white",
    green: "bg-emerald-600 text-white",
    orange: "bg-orange-500 text-white",
    red: "bg-rose-600 text-white",
    purple: "bg-purple-600 text-white"
};

export default function StatCard({ label, value, caption, icon: Icon, tone = "default", className = "" }: StatCardProps) {
    return (
        <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${className}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
                    {caption && <p className="mt-1 text-xs font-medium text-slate-400">{caption}</p>}
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${statIconTones[tone]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

