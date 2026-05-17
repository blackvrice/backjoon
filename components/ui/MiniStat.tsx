export type MiniStatProps = {
    label: string;
    value: string;
    variant?: "light" | "dark";
    className?: string;
};

export default function MiniStat({ label, value, variant = "light", className = "" }: MiniStatProps) {
    const isDark = variant === "dark";

    return (
        <div className={`rounded-2xl ${isDark ? "bg-white/10" : "bg-slate-50"} p-4 text-center ${className}`}>
            <p className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-400"}`}>{label}</p>
            <p className={`mt-1 text-xl font-black ${isDark ? "text-white" : "text-slate-950"}`}>{value}</p>
        </div>
    );
}
