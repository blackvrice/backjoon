"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    CheckCircle2,
    Code2,
    Eye,
    EyeOff,
    FileCode2,
    KeyRound,
    LockKeyhole,
    Mail,
    ShieldCheck,
    Sparkles,
    Trophy,
    UserRound,
    X
} from "lucide-react";
import {
    AppButton,
    AppLinkButton,
    Badge,
    Card,
    Notice,
    ProgressBar
} from "@/components/ui";

type SignupForm = {
    name: string;
    handle: string;
    email: string;
    password: string;
    confirmPassword: string;
    agreeTerms: boolean;
    agreePrivacy: boolean;
    agreeMarketing: boolean;
};

type PasswordRule = {
    label: string;
    passed: boolean;
};

const initialForm: SignupForm = {
    name: "",
    handle: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false
};

function getPasswordRules(password: string, confirmPassword: string): PasswordRule[] {
    return [
        {
            label: "8자 이상",
            passed: password.length >= 8
        },
        {
            label: "영문 포함",
            passed: /[a-zA-Z]/.test(password)
        },
        {
            label: "숫자 포함",
            passed: /\d/.test(password)
        },
        {
            label: "특수문자 포함",
            passed: /[^a-zA-Z0-9]/.test(password)
        },
        {
            label: "비밀번호 확인 일치",
            passed: password.length > 0 && password === confirmPassword
        }
    ];
}

function getPasswordStrength(rules: PasswordRule[]) {
    return Math.round((rules.filter((rule) => rule.passed).length / rules.length) * 100);
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidHandle(handle: string) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(handle);
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <span className="mb-1.5 block text-xs font-black text-slate-500">{children}</span>;
}

function TextField({
                       label,
                       value,
                       onChange,
                       placeholder,
                       icon: Icon,
                       type = "text",
                       autoComplete
                   }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    icon: typeof UserRound;
    type?: "text" | "email";
    autoComplete?: string;
}) {
    return (
        <label className="block">
            <FieldLabel>{label}</FieldLabel>
            <div className="relative">
                <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-bold text-slate-700 outline-none ring-blue-100 transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4"
                />
            </div>
        </label>
    );
}

function PasswordField({
                           label,
                           value,
                           onChange,
                           placeholder,
                           visible,
                           onVisibleChange,
                           autoComplete
                       }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    visible: boolean;
    onVisibleChange: (value: boolean) => void;
    autoComplete?: string;
}) {
    return (
        <label className="block">
            <FieldLabel>{label}</FieldLabel>
            <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-12 text-sm font-bold text-slate-700 outline-none ring-blue-100 transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4"
                />
                <button
                    type="button"
                    onClick={() => onVisibleChange(!visible)}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </label>
    );
}

function AgreementCheckbox({
                               checked,
                               onChange,
                               label,
                               required,
                               href
                           }: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
    required?: boolean;
    href?: string;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/30"
        >
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${checked ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-transparent"}`}>
        <Check className="h-3.5 w-3.5" />
      </span>
            <span className="min-w-0 text-sm font-bold leading-6 text-slate-600">
        {required && <span className="mr-1 text-blue-600">필수</span>}
                {href ? (
                    <Link href={href} className="text-slate-800 underline decoration-slate-300 underline-offset-4 hover:text-blue-600">
                        {label}
                    </Link>
                ) : (
                    label
                )}
                에 동의합니다.
      </span>
        </button>
    );
}

function PasswordRules({ rules }: { rules: PasswordRule[] }) {
    return (
        <div className="grid gap-2 sm:grid-cols-2">
            {rules.map((rule) => (
                <div key={rule.label} className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black ${rule.passed ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"}`}>
                    {rule.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    {rule.label}
                </div>
            ))}
        </div>
    );
}

function SocialButton({
                          icon: Icon,
                          label,
                          onClick
                      }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40"
        >
            <Icon className="h-5 w-5" />
            {label}
        </button>
    );
}

function FeatureItem({ icon: Icon, title, description }: { icon: typeof BookOpen; title: string; description: string }) {
    return (
        <div className="flex gap-3 rounded-3xl bg-white/10 p-4 backdrop-blur">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="font-black text-white">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
            </div>
        </div>
    );
}

export default function SignupPage() {
    const [form, setForm] = useState<SignupForm>(initialForm);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const passwordRules = useMemo(() => getPasswordRules(form.password, form.confirmPassword), [form.password, form.confirmPassword]);
    const passwordStrength = useMemo(() => getPasswordStrength(passwordRules), [passwordRules]);

    const completedFields = useMemo(() => {
        const checks = [
            form.name.trim().length >= 2,
            isValidHandle(form.handle),
            isValidEmail(form.email),
            passwordRules.every((rule) => rule.passed),
            form.agreeTerms,
            form.agreePrivacy
        ];

        return checks.filter(Boolean).length;
    }, [form, passwordRules]);

    const formProgress = Math.round((completedFields / 6) * 100);

    const canSubmit =
        form.name.trim().length >= 2 &&
        isValidHandle(form.handle) &&
        isValidEmail(form.email) &&
        passwordRules.every((rule) => rule.passed) &&
        form.agreeTerms &&
        form.agreePrivacy;

    const updateForm = <TKey extends keyof SignupForm>(key: TKey, value: SignupForm[TKey]) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canSubmit) {
            setMessage("필수 입력값과 약관 동의를 확인해주세요.");
            return;
        }

        setMessage("회원가입 요청이 준비되었습니다. 실제 구현 시에는 POST /api/auth/signup으로 연결하면 됩니다.");
    };

    const handleSocialSignup = (provider: "google" | "github") => {
        setMessage(`${provider === "google" ? "Google" : "GitHub"} 회원가입은 실제 구현 시 OAuth 라우트로 연결하면 됩니다.`);
    };

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_620px]">
                <section className="relative hidden overflow-hidden bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
                    <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" />
                    <div className="absolute bottom-24 right-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

                    <div className="relative">
                        <Link href="/" className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15">
                            <ArrowLeft className="h-4 w-4" />
                            메인으로
                        </Link>
                    </div>

                    <div className="relative max-w-2xl">
                        <div className="mb-5 flex flex-wrap gap-2">
                            <Badge variant="blue">Local Judge</Badge>
                            <Badge variant="dark">Coding Test</Badge>
                            <Badge variant="green">MVP</Badge>
                        </div>

                        <h1 className="text-5xl font-black leading-tight tracking-tight">
                            코딩 테스트 학습을 시작할 계정을 만드세요.
                        </h1>
                        <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                            로컬 문제 데이터, Monaco Editor 기반 풀이 화면, 제출 기록, 오답노트, 목표 관리까지 하나의 계정으로 관리할 수 있습니다.
                        </p>

                        <div className="mt-8 grid gap-4 xl:grid-cols-2">
                            <FeatureItem icon={Code2} title="실전형 풀이 화면" description="문제, 에디터, 콘솔을 한 화면에서 사용합니다." />
                            <FeatureItem icon={Trophy} title="랭킹과 목표" description="풀이 기록을 점수와 목표로 관리합니다." />
                            <FeatureItem icon={FileCode2} title="제출 기록" description="언어, 시간, 메모리, 결과를 저장합니다." />
                            <FeatureItem icon={ShieldCheck} title="로컬 중심" description="다운로드한 문제 데이터를 로컬에서 관리합니다." />
                        </div>
                    </div>

                    <div className="relative grid grid-cols-3 gap-3">
                        <div className="rounded-3xl bg-white/10 p-4 text-center backdrop-blur">
                            <p className="text-3xl font-black">2,481</p>
                            <p className="mt-1 text-xs font-bold text-slate-300">문제</p>
                        </div>
                        <div className="rounded-3xl bg-white/10 p-4 text-center backdrop-blur">
                            <p className="text-3xl font-black">12</p>
                            <p className="mt-1 text-xs font-bold text-slate-300">테스트</p>
                        </div>
                        <div className="rounded-3xl bg-white/10 p-4 text-center backdrop-blur">
                            <p className="text-3xl font-black">Local</p>
                            <p className="mt-1 text-xs font-bold text-slate-300">Judge</p>
                        </div>
                    </div>
                </section>

                <section className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
                    <div className="w-full max-w-xl space-y-5">
                        <div className="flex items-center justify-between gap-3">
                            <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-blue-600 lg:hidden">
                                <ArrowLeft className="h-4 w-4" />
                                메인
                            </Link>
                            <div className="ml-auto text-sm font-bold text-slate-500">
                                이미 계정이 있나요? <Link href="/login" className="font-black text-blue-600 hover:text-blue-700">로그인</Link>
                            </div>
                        </div>

                        <Card className="p-6 shadow-sm sm:p-8">
                            <div className="mb-7">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white">
                                    <UserRound className="h-7 w-7" />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight text-slate-950">회원가입</h2>
                                <p className="mt-2 text-sm leading-7 text-slate-500">
                                    코딩 테스트 문제 풀이, 제출 기록, 목표 관리를 시작합니다.
                                </p>
                            </div>

                            {message && (
                                <Notice variant={canSubmit ? "success" : "warning"} title="알림" className="mb-5">
                                    {message}
                                </Notice>
                            )}

                            <div className="mb-6 rounded-3xl bg-slate-50 p-4">
                                <div className="mb-2 flex items-center justify-between text-sm font-black">
                                    <span className="text-slate-600">가입 준비도</span>
                                    <span className="text-blue-600">{formProgress}%</span>
                                </div>
                                <ProgressBar value={formProgress} />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <SocialButton icon={FcGoogle} label="Google로 가입" onClick={() => handleSocialSignup("google")} />
                                <SocialButton icon={FaGithub} label="GitHub로 가입" onClick={() => handleSocialSignup("github")} />
                            </div>

                            <div className="my-6 flex items-center gap-3">
                                <div className="h-px flex-1 bg-slate-200" />
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">or</span>
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <TextField label="이름" value={form.name} onChange={(value) => updateForm("name", value)} placeholder="Kim Code" icon={UserRound} autoComplete="name" />
                                    <TextField label="핸들" value={form.handle} onChange={(value) => updateForm("handle", value)} placeholder="kimcode" icon={KeyRound} autoComplete="username" />
                                </div>

                                <TextField label="이메일" value={form.email} onChange={(value) => updateForm("email", value)} placeholder="kimcode@example.com" icon={Mail} type="email" autoComplete="email" />

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <PasswordField
                                        label="비밀번호"
                                        value={form.password}
                                        onChange={(value) => updateForm("password", value)}
                                        placeholder="8자 이상 입력"
                                        visible={passwordVisible}
                                        onVisibleChange={setPasswordVisible}
                                        autoComplete="new-password"
                                    />
                                    <PasswordField
                                        label="비밀번호 확인"
                                        value={form.confirmPassword}
                                        onChange={(value) => updateForm("confirmPassword", value)}
                                        placeholder="비밀번호 재입력"
                                        visible={confirmPasswordVisible}
                                        onVisibleChange={setConfirmPasswordVisible}
                                        autoComplete="new-password"
                                    />
                                </div>

                                <div className="rounded-3xl bg-slate-50 p-4">
                                    <div className="mb-3 flex items-center justify-between text-sm font-black">
                                        <span className="text-slate-600">비밀번호 강도</span>
                                        <span className="text-blue-600">{passwordStrength}%</span>
                                    </div>
                                    <ProgressBar value={passwordStrength} barClassName={passwordStrength >= 80 ? "bg-emerald-600" : passwordStrength >= 50 ? "bg-orange-500" : "bg-rose-600"} />
                                    <div className="mt-3">
                                        <PasswordRules rules={passwordRules} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <AgreementCheckbox checked={form.agreeTerms} onChange={(value) => updateForm("agreeTerms", value)} label="이용약관" href="/terms" required />
                                    <AgreementCheckbox checked={form.agreePrivacy} onChange={(value) => updateForm("agreePrivacy", value)} label="개인정보 처리방침" href="/privacy" required />
                                    <AgreementCheckbox checked={form.agreeMarketing} onChange={(value) => updateForm("agreeMarketing", value)} label="학습 리포트 및 업데이트 알림 수신" />
                                </div>

                                <AppButton type="submit" variant="primary" size="lg" className="w-full" iconRight={ArrowRight} disabled={!canSubmit}>
                                    계정 만들기
                                </AppButton>
                            </form>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-start gap-3">
                                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                                <p className="text-sm leading-7 text-slate-500">
                                    현재 `/signup`은 UI 상태 기반입니다. 실제 구현 시에는 `POST /api/auth/signup`, `POST /api/auth/oauth/google`, `POST /api/auth/oauth/github`로 연결하면 됩니다.
                                </p>
                            </div>
                        </Card>
                    </div>
                </section>
            </div>
        </main>
    );
}
