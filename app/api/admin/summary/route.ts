import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getStartOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function GET() {
    const today = getStartOfToday();

    const [
        totalProblems,
        activeUsers,
        todaySubmissions,
        totalSubmissions,
        acceptedSubmissions,
        queueCount,
        failedJobs,
        pendingReviews,
        adminAlerts,
        recentSubmissions,
        recentLogs,
    ] = await Promise.all([
        prisma.problem.count(),
        prisma.user.count({ where: { status: "active" } }),
        prisma.submission.count({ where: { createdAt: { gte: today } } }),
        prisma.submission.count(),
        prisma.submission.count({ where: { status: "accepted" } }),
        prisma.submission.count({ where: { status: { in: ["pending", "judging"] } } }),
        prisma.submission.count({ where: { status: { in: ["compile", "runtime", "timeLimit", "memory", "wrong"] } } }),
        prisma.problem.count({ where: { status: "review" } }),
        prisma.adminLog.count({ where: { level: { in: ["error", "critical"] }, status: { in: ["open", "investigating"] } } }),
        prisma.submission.findMany({
            include: {
                problem: true,
                user: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 6,
        }),
        prisma.adminLog.findMany({
            orderBy: {
                updatedAt: "desc",
            },
            take: 6,
        }),
    ]);

    const acceptedRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 1000) / 10 : 0;
    const systemHealth = Math.max(0, 100 - failedJobs * 4 - adminAlerts * 8 - queueCount);

    return NextResponse.json({
        stats: {
            totalProblems,
            activeUsers,
            todaySubmissions,
            acceptedRate,
            judgeQueue: queueCount,
            failedJobs,
            systemHealth,
            storageUsage: 0,
            pendingReviews,
            adminAlerts,
        },
        modules: [
            {
                id: "problems",
                title: "문제 관리",
                description: "문제 등록, 수정, 테스트 케이스, 태그, 공개 상태를 관리합니다.",
                href: "/admin/problems",
                status: pendingReviews > 0 ? "warning" : "healthy",
                count: totalProblems,
                countLabel: "문제",
                priority: 2,
                updatedAt: new Date().toISOString(),
                updatedAtText: "방금 전",
                actions: [
                    { label: "문제 추가", href: "/admin/problems/new" },
                    { label: "검수 대기", href: "/admin/problems?status=review" },
                ],
            },
            {
                id: "users",
                title: "사용자 관리",
                description: "회원, 권한, 정지 상태, 관리자 역할, 최근 활동을 확인합니다.",
                href: "/admin/users",
                status: "healthy",
                count: activeUsers,
                countLabel: "활성 사용자",
                priority: 3,
                updatedAt: new Date().toISOString(),
                updatedAtText: "방금 전",
                actions: [
                    { label: "사용자 목록", href: "/admin/users" },
                    { label: "권한 관리", href: "/admin/users?role=admin" },
                ],
            },
            {
                id: "submissions",
                title: "제출 관리",
                description: "전체 제출 기록, 결과, 언어, 실행 시간, 메모리, 재채점 대상을 관리합니다.",
                href: "/admin/submissions",
                status: failedJobs > 0 ? "warning" : "healthy",
                count: todaySubmissions,
                countLabel: "오늘 제출",
                priority: 1,
                updatedAt: new Date().toISOString(),
                updatedAtText: "방금 전",
                actions: [
                    { label: "제출 목록", href: "/admin/submissions" },
                    { label: "오류 제출", href: "/admin/submissions?status=error" },
                ],
            },
            {
                id: "judge",
                title: "채점 서버",
                description: "채점 큐, 워커 상태, 실패 작업, 재채점, 샌드박스 상태를 모니터링합니다.",
                href: "/admin/judge",
                status: queueCount > 0 ? "warning" : "healthy",
                count: queueCount,
                countLabel: "대기/채점",
                priority: 1,
                updatedAt: new Date().toISOString(),
                updatedAtText: "방금 전",
                actions: [
                    { label: "큐 보기", href: "/admin/judge" },
                    { label: "실패 작업", href: "/admin/judge?status=failed" },
                ],
            },
            {
                id: "logs",
                title: "시스템 로그",
                description: "API, 채점, 인증, 데이터 동기화, 관리자 작업 로그를 확인합니다.",
                href: "/admin/logs",
                status: adminAlerts > 0 ? "critical" : "healthy",
                count: adminAlerts,
                countLabel: "알림",
                priority: 1,
                updatedAt: new Date().toISOString(),
                updatedAtText: "방금 전",
                actions: [
                    { label: "로그 보기", href: "/admin/logs" },
                    { label: "오류 로그", href: "/admin/logs?level=ERROR" },
                ],
            },
        ],
        judgeQueue: recentSubmissions
            .filter((submission) => ["pending", "judging"].includes(submission.status))
            .map((submission) => ({
                id: submission.queueJobId ?? `job-${submission.id}`,
                submissionId: submission.id,
                problemId: submission.problem.number,
                user: submission.user?.email ?? "guest",
                language: submission.language,
                status: submission.status === "pending" ? "waiting" : "running",
                worker: submission.workerId ?? "-",
                elapsedMs: submission.executionTimeMs ?? 0,
                createdAtText: submission.createdAt.toLocaleString("ko-KR"),
            })),
        recentSubmissions: recentSubmissions.map((submission) => ({
            id: submission.id,
            problemId: submission.problem.number,
            problemTitle: submission.problem.title,
            user: submission.user?.email ?? "guest",
            status: submission.status,
            language: submission.language,
            time: submission.executionTimeMs == null ? "-" : `${submission.executionTimeMs}ms`,
            memory: submission.memoryKb == null ? "-" : `${submission.memoryKb}KB`,
            submittedAt: submission.createdAt.toLocaleString("ko-KR"),
        })),
        logs: recentLogs.map((log) => ({
            id: log.id,
            level: log.level,
            source: log.source,
            message: log.message,
            createdAtText: log.updatedAt.toLocaleString("ko-KR"),
            href: log.relatedHref,
        })),
    });
}
