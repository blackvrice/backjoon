
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export type SectionHeaderProps = {
    title: string;
    description?: string;
    href?: string;
    linkText?: string;
    right?: ReactNode;
    className?: string;
};

export default function SectionHeader({
                                          title,
                                          description,
                                          href,
                                          linkText = "전체 보기",
                                          right,
                                          className = ""
                                      }: SectionHeaderProps) {
    return (
        <div className={`mb-4 flex items-end justify-between gap-3 ${className}`}>
            <div>
                <h3 className="text-xl font-black text-slate-950">{title}</h3>
                {description && <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>}
            </div>

            {right ??
                (href && (
                    <Link href={href} className="hidden items-center gap-1 text-sm font-black text-blue-600 transition hover:text-blue-700 md:inline-flex">
                        {linkText}
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                ))}
        </div>
    );
}
