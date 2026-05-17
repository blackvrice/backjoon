
import type { ReactNode } from "react";
import { Filter, X } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";

export type FilterPanelProps = {
    children: ReactNode;
    title?: string;
    onReset?: () => void;
    resetText?: string;
    className?: string;
    gridClassName?: string;
};

export default function FilterPanel({
                                        children,
                                        title = "검색 / 필터",
                                        onReset,
                                        resetText = "초기화",
                                        className = "",
                                        gridClassName = "grid gap-3 xl:grid-cols-[1.4fr_160px_160px_180px_auto] xl:items-end"
                                    }: FilterPanelProps) {
    return (
        <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
            <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-700">
                <Filter className="h-4 w-4" />
                {title}
            </div>

            <div className={gridClassName}>
                {children}
                {onReset && (
                    <AppButton onClick={onReset} variant="secondary" icon={X}>
                        {resetText}
                    </AppButton>
                )}
            </div>
        </section>
    );
}
