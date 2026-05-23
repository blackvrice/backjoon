"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Code2,
    Eye,
    EyeOff,
    Gauge,
    KeyRound,
    Laptop,
    LockKeyhole,
    Mail,
    ShieldCheck,
    Sparkles,
    Terminal,
    Trophy,
    UserRound,
    Zap
} from "lucide-react";
import {
    Badge,
    Card,
    Notice,
    ProgressBar
} from "@/components/ui";

type LoginMethod = "email" | "google" | "github";

type DemoAccount = {
    label: string;
    email: string;
    password: string;
    role: string;
};

const demoAccounts: DemoAccount[] = [
    {
        label: "학습자 데모",
        email: "user@codetest.local",
        password: "Demo1234!",
        role: "문제 풀이, 제출 기록, 목표 관리"
    },
    {
        label: "관리자 데모",
        email: "admin@codetest.local",
        password: "Admin1234!",
        role: "문제/사용자/채점 로그 관리"
    }
];

const highlights = [
    {
        title: "로컬 채점 기록",
        description: "제출 결과, 실행 시간, 메모리, 코드 이력을 안전하게 관리합니다.",
        icon: Terminal
    },
    {
        title: "학습 대시보드",
        description: "목표, 약점 태그, 추천 문제, 모의 테스트를 한눈에 확인합니다.",
        icon: Gauge
    },
    {
        title: "실전 코딩테스트",
        description: "제한 시간, 점수, 문제별 분석으로 실전 감각을 유지합니다.",
        icon: Trophy
    }
];

function isEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getLoginReadiness(email: string, password: string, accepted: boolean) {
    let score = 0;
    if (email.trim()) score += 25;
    if (isEmail(email)) score += 25;
    if (password.length >= 8) score += 30;
    if (accepted) score += 20;
    return score;
}

function AuthFeatureCard({ title, description, icon: Icon }: { title: string; description: string; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur transition hover:bg-white/15">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950">
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-black text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        </div>
    );
}

function DemoAccountButton({ account, onUse }: { account: DemoAccount; onUse: (account: DemoAccount) => void }) {
    return (
        <button
            type="button"
            onClick={() => onUse(account)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
        >
            <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-black text-slate-950">{account.label}</span>
                <Badge variant="blue">Demo</Badge>
            </div>
            <p className="text-sm font-bold text-slate-500">{account.email}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-400">{account.role}</p>
        </button>
    );
}

function SecurityItem({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {label}
        </div>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("user@codetest.local");
    const [password, setPassword] = useState("Demo1234!");
    const [rememberMe, setRememberMe] = useState(true);
    const [acceptedLocalMode, setAcceptedLocalMode] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [method, setMethod] = useState<LoginMethod>("email");

    const readiness = useMemo(() => getLoginReadiness(email, password, acceptedLocalMode), [email, password, acceptedLocalMode]);
    const canSubmit = isEmail(email) && password.length >= 8 && acceptedLocalMode;

    const handleDemoAccount = (account: DemoAccount) => {
        setEmail(account.email);
        setPassword(account.password);
        setAcceptedLocalMode(true);
        setMethod("email");
        setMessage(`${account.label} 정보가 입력되었습니다.`);
        window.setTimeout(() => setMessage(null), 1800);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMethod("email");

        if (!isEmail(email)) {
            setMessage("이메일 형식을 확인해주세요.");
            return;
        }

        if (password.length < 8) {
            setMessage("비밀번호는 8자 이상이어야 합니다.");
            return;
        }

        if (!acceptedLocalMode) {
            setMessage("로컬 학습 데이터 사용 안내를 확인해주세요.");
            return;
        }

        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email, password, rememberMe }),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            setMessage(data?.message ?? "로그인에 실패했습니다.");
            return;
        }

        setMessage("로그인 완료. 대시보드로 이동합니다.");
        router.push("/dashboard");
        router.refresh();
    };

    const handleOAuth = (nextMethod: LoginMethod) => {
        setMethod(nextMethod);
        setMessage(`${nextMethod === "google" ? "Google" : "GitHub"} 로그인 mock 처리입니다. 실제 OAuth 라우트와 연결하세요.`);
        window.setTimeout(() => setMessage(null), 2200);
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-950">
            <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
                <section className="relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.45),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.22),_transparent_30%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(15,23,42,0.92),_rgba(15,23,42,0.76))]" />

                    <div className="relative z-10">
                        <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">
                            <Terminal className="h-4 w-4" />
                            CodeTest Platform
                        </Link>

                        <div className="mt-16 max-w-2xl">
                            <div className="mb-4 flex flex-wrap gap-2">
                                <Badge variant="blue">Local Judge</Badge>
                                <Badge variant="green">Study Dashboard</Badge>
                                <Badge>Mock Test</Badge>
                            </div>
                            <h1 className="text-5xl font-black tracking-tight text-white xl:text-6xl">
                                오늘의 풀이 기록을 이어가세요.
                            </h1>
                            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                                문제 풀이, 제출 기록, 오답노트, 목표, 모의 테스트 결과를 하나의 학습 흐름으로 관리합니다.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 grid gap-4 xl:grid-cols-3">
                        {highlights.map((item) => <AuthFeatureCard key={item.title} {...item} />)}
                    </div>
                </section>

                <section className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-10">
                    <div className="w-full max-w-[560px] space-y-5">
                        <div className="lg:hidden">
                            <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white">
                                <Terminal className="h-4 w-4" />
                                CodeTest Platform
                            </Link>
                        </div>

                        <Card className="overflow-hidden">
                            <div className="border-b border-slate-100 bg-white p-6 sm:p-8">
                                <div className="mb-5 flex items-center justify-between gap-3">
                                    <div>
                                        <Badge variant="blue">Login</Badge>
                                        <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">로그인</h2>
                                        <p className="mt-2 text-sm leading-7 text-slate-500">
                                            계정으로 로그인하고 학습 대시보드로 이동하세요.
                                        </p>
                                    </div>
                                    <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-slate-950 text-white">
                                        <LockKeyhole className="h-6 w-6" />
                                    </div>
                                </div>

                                {message && (
                                    <div className="mb-5">
                                        <Notice variant={message.includes("확인") || message.includes("8자") ? "warning" : "info"} title="알림">
                                            {message}
                                        </Notice>
                                    </div>
                                )}

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => handleOAuth("google")}
                                        className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                                    >
                                        <FcGoogle className="h-5 w-5" />
                                        Google 로그인
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOAuth("github")}
                                        className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                    >
                                        <FaGithub className="h-5 w-5" />
                                        GitHub 로그인
                                    </button>
                                </div>

                                <div className="my-6 flex items-center gap-3">
                                    <div className="h-px flex-1 bg-slate-200" />
                                    <span className="text-xs font-black uppercase tracking-wide text-slate-400">or email</span>
                                    <div className="h-px flex-1 bg-slate-200" />
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-black text-slate-700">이메일</span>
                                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                                            <Mail className="h-5 w-5 text-slate-400" />
                                            <input
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                type="email"
                                                placeholder="you@example.com"
                                                className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
                                            />
                                        </div>
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-black text-slate-700">비밀번호</span>
                                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                                            <KeyRound className="h-5 w-5 text-slate-400" />
                                            <input
                                                value={password}
                                                onChange={(event) => setPassword(event.target.value)}
                                                type={showPassword ? "text" : "password"}
                                                placeholder="8자 이상 입력"
                                                className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((current) => !current)}
                                                className="text-slate-400 transition hover:text-slate-700"
                                                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </label>

                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <div className="mb-2 flex items-center justify-between text-sm font-black">
                                            <span className="text-slate-600">로그인 준비도</span>
                                            <span className="text-blue-600">{readiness}%</span>
                                        </div>
                                        <ProgressBar value={readiness} barClassName={readiness >= 100 ? "bg-emerald-600" : readiness >= 60 ? "bg-blue-600" : "bg-orange-500"} />
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(event) => setRememberMe(event.target.checked)}
                                                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                            />
                                            로그인 유지
                                        </label>
                                        <Link href="/forgot-password" className="text-sm font-black text-blue-600 transition hover:text-blue-700">
                                            비밀번호를 잊으셨나요?
                                        </Link>
                                    </div>

                                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-900">
                                        <input
                                            type="checkbox"
                                            checked={acceptedLocalMode}
                                            onChange={(event) => setAcceptedLocalMode(event.target.checked)}
                                            className="mt-1 h-4 w-4 rounded border-blue-300 text-blue-600"
                                        />
                                        <span>
                      로컬 학습 데이터와 제출 기록을 계정에 연결해 대시보드, 목표, 오답노트에 활용하는 것을 확인했습니다.
                    </span>
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={!canSubmit}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                        로그인
                                        <ArrowRight className="h-5 w-5" />
                                    </button>
                                </form>
                            </div>

                            <div className="bg-slate-50 p-6 sm:p-8">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="font-black text-slate-950">데모 계정</h3>
                                        <p className="mt-1 text-sm text-slate-500">개발 중 빠르게 화면을 확인할 때 사용합니다.</p>
                                    </div>
                                    <Sparkles className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="grid gap-3">
                                    {demoAccounts.map((account) => <DemoAccountButton key={account.email} account={account} onUse={handleDemoAccount} />)}
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-950">보안 / 데이터 안내</h3>
                                    <p className="mt-1 text-sm text-slate-500">로컬 채점 서비스 기준으로 설계했습니다.</p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <SecurityItem label="제출 기록 계정 연결" />
                                <SecurityItem label="오답노트 개인 데이터 보호" />
                                <SecurityItem label="OAuth 로그인 확장 가능" />
                                <SecurityItem label="관리자 권한 분리 가능" />
                            </div>
                        </Card>

                        <p className="text-center text-sm font-bold text-slate-500">
                            아직 계정이 없나요?{" "}
                            <Link href="/signup" className="font-black text-blue-600 transition hover:text-blue-700">
                                회원가입
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
