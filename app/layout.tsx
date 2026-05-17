
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "CodeTest Local Judge",
    description: "로컬 코딩 테스트 문제 풀이 플랫폼"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
        <body>{children}</body>
        </html>
    );
}
