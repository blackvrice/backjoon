
import type { ReactNode } from "react";

export type CardProps = {
    children: ReactNode;
    className?: string;
    hover?: boolean;
};

export default function Card({ children, className = "", hover = false }: CardProps) {
    return (
        <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${hover ? "transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md" : ""} ${className}`}>
            {children}
        </div>
    );
}
