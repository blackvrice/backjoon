
import { Grid3X3, ListChecks } from "lucide-react";

export type ViewMode = "card" | "table";

export type ViewModeToggleProps = {
    value: ViewMode;
    onChange: (value: ViewMode) => void;
};

export default function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
    return (
        <div className="flex gap-2">
            <button
                onClick={() => onChange("card")}
                className={`inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-black transition ${
                    value === "card" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
            >
                <Grid3X3 className="h-4 w-4" />
                카드
            </button>
            <button
                onClick={() => onChange("table")}
                className={`inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-black transition ${
                    value === "table" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
            >
                <ListChecks className="h-4 w-4" />
                테이블
            </button>
        </div>
    );
}

