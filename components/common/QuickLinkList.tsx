
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import SidePanel from "@/components/ui/SidePanel";

export type QuickLink = {
    label: string;
    href: string;
};

export type QuickLinkListProps = {
    title?: string;
    links: QuickLink[];
};

export default function QuickLinkList({ title = "빠른 이동", links }: QuickLinkListProps) {
    return (
        <SidePanel title={title}>
            <div className="space-y-2">
                {links.map((link) => (
                    <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
                        {link.label}
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                ))}
            </div>
        </SidePanel>
    );
}