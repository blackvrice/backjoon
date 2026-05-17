
import type { ComponentType, ReactNode } from "react";
import { Search, X } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";

export type EmptyStateProps = {
    title?: string;
    description?: string;
    icon?: ComponentType<{ className?: string }>;
    action?: ReactNode;
    onReset?: () => void;
    resetText?: string;
};

export default function EmptyState({
                                       title = "결과를 찾을 수 없습니다.",
                                       description = "검색어 또는 필터 조건을 변경해보세요.",
                                       icon: Icon = Search,
                                       action,
                                       onReset,
                                       resetText = "필터 초기화"
                                   }: EmptyStateProps) {
    return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Icon className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
            {action ??
                (onReset && (
                    <AppButton onClick={onReset} variant="dark" className="mt-5" icon={X}>
                        {resetText}
                    </AppButton>
                ))}
        </div>
    );
}

