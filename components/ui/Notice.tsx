
import type { ComponentType, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

export type NoticeVariant = "info" | "success" | "warning" | "danger";

const noticeVariants: Record<NoticeVariant, string> = {
    info: "border-blue-100 bg-blue-50 text-blue-900",
    success: "border-emerald-100 bg-emerald-50 text-emerald-900",
    warning: "border-orange-100 bg-orange-50 text-orange-900",
    danger: "border-rose-100 bg-rose-50 text-rose-900"
};

const noticeIcons: Record<NoticeVariant, ComponentType<{ className?: string }>> = {
    info: ShieldCheck,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertTriangle
};

export type NoticeProps = {
    title?: string;
    children: ReactNode;
    variant?: NoticeVariant;
    icon?: ComponentType<{ className?: string }>;
    className?: string;
};

export default function Notice({ title, children, variant = "info", icon, className = "" }: NoticeProps) {
    const Icon = icon ?? noticeIcons[variant];

    return (
        <div className={`rounded-3xl border p-5 shadow-sm ${noticeVariants[variant]} ${className}`}>
            {title && (
                <div className="mb-3 flex items-center gap-2 font-black">
                    <Icon className="h-5 w-5" />
                    {title}
                </div>
            )}
            <div className="text-sm leading-7">{children}</div>
        </div>
    );
}
