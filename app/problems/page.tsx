import { Suspense } from "react";
import ProblemsClientPage from "./ProblemsClientPage";

export default function ProblemsPage() {
    return (
        <Suspense
            fallback={
                <div className="p-6 text-sm font-bold text-slate-500">
                    문제 목록을 불러오는 중입니다...
                </div>
            }
        >
            <ProblemsClientPage />
        </Suspense>
    );
}