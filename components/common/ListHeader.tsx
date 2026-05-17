import type { ReactNode } from "react";

export type ListHeaderProps = {
    title: string;
    description?: string;
    right?: ReactNode;
    className?: string;
};

export default function ListHeader({ title, description, right, className = "" }: ListHeaderProps) {
    return (
        <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}>
            <div>
                <h3 className="text-xl font-black text-slate-950">{title}</h3>
                {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>
            {right}
        </div>
    );
}