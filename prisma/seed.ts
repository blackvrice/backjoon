import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL이 설정되어 있지 않습니다.");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const now = new Date();
const day = 24 * 60 * 60 * 1000;

async function upsertUser(data: {
    handle: string;
    email: string;
    name: string;
    role?: string;
    score?: number;
    rank?: number;
    solvedCount?: number;
    tags?: string[];
}) {
    return prisma.user.upsert({
        where: { handle: data.handle },
        update: {
            email: data.email,
            name: data.name,
            role: data.role ?? "user",
            score: data.score ?? 0,
            rank: data.rank ?? 0,
            solvedCount: data.solvedCount ?? 0,
            tags: data.tags ?? [],
            status: "active",
            lastActiveAt: new Date(),
        },
        create: {
            handle: data.handle,
            email: data.email,
            name: data.name,
            role: data.role ?? "user",
            score: data.score ?? 0,
            rank: data.rank ?? 0,
            solvedCount: data.solvedCount ?? 0,
            tags: data.tags ?? [],
            status: "active",
            verification: "verified",
            risk: "low",
            ip: "127.0.0.1",
            memo: "시드 사용자",
            lastActiveAt: new Date(),
        },
    });
}

async function upsertProblem(data: {
    number: number;
    title: string;
    difficulty: string;
    category: string;
    score: number;
    tags: string[];
    description: string;
    inputDescription: string;
    outputDescription: string;
    constraints: string[];
    sampleInput: string;
    sampleOutput: string;
    hiddenInput: string;
    hiddenOutput: string;
    order: number;
    timeLimitMs?: number;
    memoryLimitMb?: number;
}) {
    return prisma.problem.upsert({
        where: { number: data.number },
        update: {
            title: data.title,
            slug: String(data.number),
            difficulty: data.difficulty,
            category: data.category,
            score: data.score,
            tags: data.tags,
            description: data.description,
            inputDescription: data.inputDescription,
            outputDescription: data.outputDescription,
            constraints: data.constraints,
            hints: ["입력 형식을 먼저 확인하세요.", "출력 끝의 공백과 줄바꿈을 주의하세요."],
            status: "published",
            source: "Local",
            note: "DB seed 문제입니다.",
            memo: "관리자 메모",
            recommendedOrder: data.order,
            solvedRate: 60 + data.order,
            timeLimitMs: data.timeLimitMs ?? 2000,
            memoryLimitMb: data.memoryLimitMb ?? 256,
            publishedAt: new Date(now.getTime() - data.order * day),
        },
        create: {
            number: data.number,
            slug: String(data.number),
            title: data.title,
            difficulty: data.difficulty,
            category: data.category,
            score: data.score,
            tags: data.tags,
            description: data.description,
            inputDescription: data.inputDescription,
            outputDescription: data.outputDescription,
            constraints: data.constraints,
            hints: ["입력 형식을 먼저 확인하세요.", "출력 끝의 공백과 줄바꿈을 주의하세요."],
            status: "published",
            source: "Local",
            note: "DB seed 문제입니다.",
            memo: "관리자 메모",
            recommendedOrder: data.order,
            solvedRate: 60 + data.order,
            timeLimitMs: data.timeLimitMs ?? 2000,
            memoryLimitMb: data.memoryLimitMb ?? 256,
            publishedAt: new Date(now.getTime() - data.order * day),
            testCases: {
                create: [
                    { input: data.sampleInput, output: data.sampleOutput, isSample: true, isHidden: false, isVerified: true, explanation: "예제 테스트 케이스" },
                    { input: data.hiddenInput, output: data.hiddenOutput, isSample: false, isHidden: true, isVerified: true },
                ],
            },
        },
    });
}

async function main() {
    const admin = await upsertUser({ handle: "admin", email: "admin@local", name: "관리자", role: "admin", score: 9800, rank: 1, solvedCount: 128, tags: ["admin", "judge"] });
    const user = await upsertUser({ handle: "demo", email: "user@codetest.local", name: "Demo User", score: 4200, rank: 7, solvedCount: 43, tags: ["local", "study"] });
    const runner = await upsertUser({ handle: "runner", email: "runner@local", name: "채점 러너", score: 3100, rank: 12, solvedCount: 31, tags: ["worker"] });

    const p1000 = await upsertProblem({
        number: 1000,
        title: "두 수의 합",
        difficulty: "Easy",
        category: "구현",
        score: 100,
        tags: ["implementation", "math", "입출력"],
        description: "두 정수 A와 B가 주어졌을 때 A+B를 출력하는 프로그램을 작성하세요.",
        inputDescription: "첫째 줄에 A와 B가 공백으로 구분되어 주어집니다.",
        outputDescription: "첫째 줄에 A+B를 출력합니다.",
        constraints: ["0 < A, B < 10"],
        sampleInput: "1 2\n",
        sampleOutput: "3\n",
        hiddenInput: "5 7\n",
        hiddenOutput: "12\n",
        order: 1,
        timeLimitMs: 1000,
    });
    const p10871 = await upsertProblem({
        number: 10871,
        title: "X보다 작은 수",
        difficulty: "Easy",
        category: "구현",
        score: 100,
        tags: ["implementation", "array", "반복문"],
        description: "정수 N개로 이루어진 수열 A와 정수 X가 주어질 때, X보다 작은 수를 입력받은 순서대로 출력하세요.",
        inputDescription: "첫째 줄에 N과 X, 둘째 줄에 수열 A가 주어집니다.",
        outputDescription: "X보다 작은 수를 공백으로 구분해 출력합니다.",
        constraints: ["1 ≤ N, X ≤ 10,000"],
        sampleInput: "10 5\n1 10 4 9 2 3 8 5 7 6\n",
        sampleOutput: "1 4 2 3\n",
        hiddenInput: "5 3\n1 2 3 4 5\n",
        hiddenOutput: "1 2\n",
        order: 2,
    });
    const p9012 = await upsertProblem({
        number: 9012,
        title: "괄호",
        difficulty: "Medium",
        category: "자료구조",
        score: 130,
        tags: ["stack", "string"],
        description: "괄호 문자열이 올바른 괄호 문자열인지 판단하세요.",
        inputDescription: "첫째 줄에 테스트 데이터 수 T가 주어지고, 다음 줄부터 괄호 문자열이 주어집니다.",
        outputDescription: "각 줄마다 YES 또는 NO를 출력합니다.",
        constraints: ["문자열 길이 2 이상 50 이하"],
        sampleInput: "3\n(())())\n(((()())()\n(()())((()))\n",
        sampleOutput: "NO\nNO\nYES\n",
        hiddenInput: "2\n()\n)(\n",
        hiddenOutput: "YES\nNO\n",
        order: 3,
    });
    const p10828 = await upsertProblem({
        number: 10828,
        title: "스택 명령 처리",
        difficulty: "Medium",
        category: "자료구조",
        score: 150,
        tags: ["stack", "data-structure", "자료구조"],
        description: "정수를 저장하는 스택을 구현한 다음 입력 명령을 처리하세요.",
        inputDescription: "첫째 줄에 명령 수 N이 주어집니다.",
        outputDescription: "출력이 필요한 명령마다 결과를 출력합니다.",
        constraints: ["1 ≤ N ≤ 10,000"],
        sampleInput: "7\npush 1\npush 2\ntop\nsize\nempty\npop\npop\n",
        sampleOutput: "2\n2\n0\n2\n1\n",
        hiddenInput: "3\nempty\npush 10\ntop\n",
        hiddenOutput: "1\n10\n",
        order: 4,
        timeLimitMs: 2000,
        memoryLimitMb: 512,
    });
    const p1463 = await upsertProblem({
        number: 1463,
        title: "1로 만들기",
        difficulty: "Hard",
        category: "DP",
        score: 200,
        tags: ["dp", "dynamic-programming"],
        description: "정수 X에 사용할 수 있는 연산 3가지를 이용해 1을 만드는 최소 연산 횟수를 구하세요.",
        inputDescription: "첫째 줄에 정수 X가 주어집니다.",
        outputDescription: "첫째 줄에 연산 횟수의 최솟값을 출력합니다.",
        constraints: ["1 ≤ X ≤ 1,000,000"],
        sampleInput: "10\n",
        sampleOutput: "3\n",
        hiddenInput: "2\n",
        hiddenOutput: "1\n",
        order: 5,
    });

    await prisma.submission.createMany({
        data: [
            { problemId: p1000.id, userId: user.id, language: "cpp", sourceFile: "Main.cpp", code: "#include <bits/stdc++.h>\nusing namespace std;\nint main(){int a,b;cin>>a>>b;cout<<a+b;}", status: "accepted", resultMessage: "정답입니다.", executionTimeMs: 12, memoryKb: 1024, judgedAt: new Date(now.getTime() - 2 * day), queueJobId: "seed-job-1", testPassed: 2, testTotal: 2 },
            { problemId: p10871.id, userId: user.id, language: "python", sourceFile: "Main.py", code: "n,x=map(int,input().split())\nprint(*[a for a in map(int,input().split()) if a<x])", status: "wrong", resultMessage: "출력이 다릅니다.", executionTimeMs: 31, memoryKb: 16384, judgedAt: new Date(now.getTime() - day), queueJobId: "seed-job-2", testPassed: 1, testTotal: 2 },
            { problemId: p9012.id, userId: runner.id, language: "javascript", sourceFile: "Main.js", code: "console.log('YES')", status: "compile", resultMessage: "컴파일 또는 문법 오류입니다.", executionTimeMs: null, memoryKb: null, judgedAt: new Date(), queueJobId: "seed-job-3", testPassed: 0, testTotal: 2 },
            { problemId: p1463.id, userId: admin.id, language: "cpp", sourceFile: "Main.cpp", code: "// pending sample", status: "pending", resultMessage: "채점 대기 중입니다.", queueJobId: "seed-job-4", testPassed: 0, testTotal: 2 },
        ],
        skipDuplicates: true,
    });

    const set = await prisma.problemSet.upsert({
        where: { slug: "starter" },
        update: { title: "입문 추천 세트", description: "기본 입출력부터 자료구조까지 연습합니다.", tags: ["beginner", "local"], progress: 35 },
        create: { slug: "starter", title: "입문 추천 세트", description: "기본 입출력부터 자료구조까지 연습합니다.", category: "추천", difficulty: "Easy", tags: ["beginner", "local"], progress: 35 },
    });
    for (const [idx, problem] of [p1000, p10871, p9012, p10828].entries()) {
        await prisma.problemSetItem.upsert({
            where: { setId_problemId: { setId: set.id, problemId: problem.id } },
            update: { order: idx + 1 },
            create: { setId: set.id, problemId: problem.id, order: idx + 1 },
        });
    }

    const test = await prisma.studyTest.upsert({
        where: { slug: "basic-mock" },
        update: { title: "기본기 모의 테스트", description: "입출력, 배열, 스택을 확인하는 로컬 테스트입니다.", tags: ["mock", "basic"] },
        create: { slug: "basic-mock", title: "기본기 모의 테스트", description: "입출력, 배열, 스택을 확인하는 로컬 테스트입니다.", type: "mock", status: "ready", durationMin: 90, difficulty: "Medium", tags: ["mock", "basic"] },
    });
    for (const [idx, problem] of [p1000, p10871, p9012].entries()) {
        await prisma.studyTestProblem.upsert({
            where: { testId_problemId: { testId: test.id, problemId: problem.id } },
            update: { order: idx + 1, score: problem.score },
            create: { testId: test.id, problemId: problem.id, order: idx + 1, score: problem.score },
        });
    }
    await prisma.testAttempt.create({
        data: { testId: test.id, userId: user.id, status: "finished", score: 200, totalScore: 330, solved: 2, total: 3, durationMin: 52, summary: "스택 문제 복습이 필요합니다." },
    });

    await prisma.note.createMany({
        data: [
            { userId: user.id, problemId: p9012.id, title: "괄호 문제 오답 노트", type: "wrong-answer", status: "review", reviewLevel: "high", difficulty: "Medium", summary: "닫는 괄호가 먼저 나오는 케이스 확인", content: "스택이 비어있을 때 닫는 괄호가 나오면 실패 처리해야 한다.", tags: ["stack", "review"], priority: 1, nextReviewAt: new Date(now.getTime() + 2 * day) },
            { userId: user.id, problemId: p1463.id, title: "DP 점화식 정리", type: "concept", status: "active", reviewLevel: "medium", difficulty: "Hard", summary: "dp[i] = min(dp[i-1], dp[i/2], dp[i/3]) + 1", content: "작은 값부터 누적해서 계산한다.", tags: ["dp"], priority: 2, nextReviewAt: new Date(now.getTime() + 5 * day) },
        ],
        skipDuplicates: true,
    });
    await prisma.goal.createMany({
        data: [
            { userId: user.id, title: "이번 주 25문제 풀기", type: "problems", status: "active", period: "weekly", target: 25, current: 11, unit: "문제", description: "기초 문제 위주로 해결", tags: ["weekly"], deadlineAt: new Date(now.getTime() + 6 * day) },
            { userId: user.id, title: "DP 복습 3시간", type: "study-time", status: "active", period: "weekly", target: 180, current: 45, unit: "분", description: "동적 계획법 개념 복습", tags: ["dp"], deadlineAt: new Date(now.getTime() + 3 * day) },
        ],
        skipDuplicates: true,
    });
    await prisma.favorite.createMany({
        data: [
            { userId: user.id, problemId: p1463.id, type: "problem", title: "1로 만들기", status: "active", difficulty: "Hard", priority: 1, progress: 20, href: "/problems/1463", memo: "DP 연습용", tags: ["dp"] },
            { userId: user.id, type: "set", title: "입문 추천 세트", status: "active", difficulty: "Easy", priority: 2, progress: 35, href: "/sets/starter", memo: "처음부터 다시 풀기", tags: ["beginner"] },
        ],
        skipDuplicates: true,
    });

    await prisma.adminLog.upsert({
        where: { id: "seed-log-judge" },
        update: { message: "PostgreSQL 기반 채점 큐가 준비되었습니다.", updatedAt: new Date() },
        create: { id: "seed-log-judge", level: "info", source: "judge", status: "open", title: "채점 큐 초기화", message: "PostgreSQL 기반 채점 큐가 준비되었습니다.", detail: "seed.ts에서 생성된 시스템 로그입니다.", tags: ["seed", "judge"], relatedHref: "/admin/judge", actionHref: "/admin/judge", userId: admin.id },
    });

    console.log("Seed completed.");
}

main()
    .then(async () => prisma.$disconnect())
    .catch(async (error) => {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    });
