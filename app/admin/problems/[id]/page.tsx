"use client";

import AppShell from "@/components/layout/AppShell";
import {
    AppButton,
    AppLinkButton,
    Badge,
    Card,
    EmptyState,
    Notice,
    StatCard
} from "@/components/ui";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    Database,
    FileCode2,
    Plus,
    RefreshCw,
    Save,
    Trash2
} from "lucide-react";

type AdminProblem = {
    dbId: number;
    number: number;
    slug: string;
    title: string;
    description: string;
    inputDescription: string;
    outputDescription: string;
    constraints: string[];
    hints: string[];
    difficulty: string;
    category: string;
    score: number;
    source: string;
    status: string;
    timeLimitMs: number;
    memoryLimitMb: number;
    compareMode: string;
    tags: string[];
    note: string;
    memo: string;
    recommendedOrder: number;
    solvedRate: number;
    authorEmail: string;
    reviewerEmail: string;
    reviewMessage: string;
    submissionsCount: number;
    testCases: AdminTestCase[];
};

type AdminTestCase = {
    id: number;
    input: string;
    output: string;
    explanation: string;
    isSample: boolean;
    isHidden: boolean;
    isVerified: boolean;
};

type AdminProblemApiResponse = {
    ok: boolean;
    message?: string;
    problem?: AdminProblem;
};

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];
const STATUS_OPTIONS = ["published", "draft", "archived"];
const COMPARE_MODE_OPTIONS = ["default", "exact", "token"];

function splitLines(value: string) {
    return value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function splitTags(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function joinLines(value: string[]) {
    return value.join("\n");
}

function joinTags(value: string[]) {
    return value.join(", ");
}

async function fetchAdminProblem(id: string): Promise<AdminProblem> {
    const response = await fetch(`/api/admin/problems/${id}`, {
        method: "GET",
        cache: "no-store"
    });

    const data = (await response.json()) as AdminProblemApiResponse;

    if (!response.ok || !data.ok || !data.problem) {
        throw new Error(data.message ?? "문제를 불러오지 못했습니다.");
    }

    return data.problem;
}

async function saveAdminProblem(id: string, problem: AdminProblem) {
    const response = await fetch(`/api/admin/problems/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            ...problem,
            constraints: problem.constraints,
            hints: problem.hints,
            tags: problem.tags,
            testCases: problem.testCases
        })
    });

    const data = (await response.json()) as AdminProblemApiResponse;

    if (!response.ok || !data.ok || !data.problem) {
        throw new Error(data.message ?? "문제 저장에 실패했습니다.");
    }

    return data.problem;
}

function Field({
                   label,
                   value,
                   onChange,
                   type = "text",
                   placeholder
               }: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-500">{label}</span>
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none ring-blue-100 transition focus:border-blue-300 focus:ring-4"
            />
        </label>
    );
}

function SelectField({
                         label,
                         value,
                         options,
                         onChange
                     }: {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-500">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none ring-blue-100 transition focus:border-blue-300 focus:ring-4"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}

function TextAreaField({
                           label,
                           value,
                           onChange,
                           rows = 5,
                           placeholder
                       }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    placeholder?: string;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-500">{label}</span>
            <textarea
                value={value}
                rows={rows}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold leading-7 text-slate-800 outline-none ring-blue-100 transition focus:border-blue-300 focus:ring-4"
            />
        </label>
    );
}

function CheckField({
                        label,
                        checked,
                        onChange
                    }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
            />
            {label}
        </label>
    );
}

function LoadingPage() {
    return (
        <AppShell
            title="문제 관리"
            description="관리자 문제 정보를 불러오는 중입니다."
        >
            <Card className="p-6">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    문제 정보를 불러오는 중입니다.
                </div>
            </Card>
        </AppShell>
    );
}

function NotFoundPage({ id, message }: { id: string; message?: string }) {
    return (
        <AppShell
            title="문제를 찾을 수 없습니다"
            description="요청한 관리자 문제 페이지를 열 수 없습니다."
        >
            <EmptyState
                title={`#${id} 문제를 찾을 수 없습니다.`}
                description={message ?? "문제 번호를 다시 확인하세요."}
                icon={BookOpen}
                action={
                    <AppLinkButton href="/admin/problems" variant="dark" icon={ArrowLeft}>
                        관리자 문제 목록으로
                    </AppLinkButton>
                }
            />
        </AppShell>
    );
}

export default function AdminProblemDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = String(params.id ?? "");

    const [problem, setProblem] = useState<AdminProblem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const constraintsText = useMemo(
        () => joinLines(problem?.constraints ?? []),
        [problem?.constraints]
    );

    const hintsText = useMemo(
        () => joinLines(problem?.hints ?? []),
        [problem?.hints]
    );

    const tagsText = useMemo(
        () => joinTags(problem?.tags ?? []),
        [problem?.tags]
    );

    useEffect(() => {
        let alive = true;

        async function loadProblem() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const data = await fetchAdminProblem(id);

                if (!alive) return;

                setProblem(data);
            } catch (error) {
                if (!alive) return;

                setProblem(null);
                setErrorMessage(
                    error instanceof Error ? error.message : "문제를 불러오지 못했습니다."
                );
            } finally {
                if (alive) {
                    setIsLoading(false);
                }
            }
        }

        if (id) {
            void loadProblem();
        }

        return () => {
            alive = false;
        };
    }, [id]);

    const updateProblem = <K extends keyof AdminProblem>(
        key: K,
        value: AdminProblem[K]
    ) => {
        setProblem((current) => {
            if (!current) return current;

            return {
                ...current,
                [key]: value
            };
        });
    };

    const updateTestCase = <K extends keyof AdminTestCase>(
        index: number,
        key: K,
        value: AdminTestCase[K]
    ) => {
        setProblem((current) => {
            if (!current) return current;

            return {
                ...current,
                testCases: current.testCases.map((testCase, testIndex) =>
                    testIndex === index
                        ? {
                            ...testCase,
                            [key]: value
                        }
                        : testCase
                )
            };
        });
    };

    const addTestCase = () => {
        setProblem((current) => {
            if (!current) return current;

            const nextId = -Date.now();

            return {
                ...current,
                testCases: [
                    ...current.testCases,
                    {
                        id: nextId,
                        input: "",
                        output: "",
                        explanation: "",
                        isSample: false,
                        isHidden: true,
                        isVerified: true
                    }
                ]
            };
        });
    };

    const removeTestCase = (index: number) => {
        setProblem((current) => {
            if (!current) return current;

            return {
                ...current,
                testCases: current.testCases.filter((_, testIndex) => testIndex !== index)
            };
        });
    };

    const handleSave = async () => {
        if (!problem) return;

        setIsSaving(true);
        setErrorMessage(null);
        setNotice(null);

        try {
            const saved = await saveAdminProblem(id, problem);
            setProblem(saved);
            setNotice("문제와 테스트케이스를 저장했습니다.");
            window.setTimeout(() => setNotice(null), 2000);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "저장 중 오류가 발생했습니다."
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingPage />;
    }

    if (errorMessage && !problem) {
        return <NotFoundPage id={id} message={errorMessage} />;
    }

    if (!problem) {
        return <NotFoundPage id={id} />;
    }

    const sampleCount = problem.testCases.filter((item) => item.isSample).length;
    const hiddenCount = problem.testCases.filter((item) => item.isHidden).length;
    const verifiedCount = problem.testCases.filter((item) => item.isVerified).length;

    return (
        <AppShell
            title={`관리자 문제 #${problem.number}`}
            description="문제 본문, 제한, 태그, 테스트케이스를 관리합니다."
            fullWidth
            contentClassName="py-4"
        >
            <div className="space-y-5">
                <Card className="p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <Link
                                    href="/admin/problems"
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    관리자 문제 목록
                                </Link>

                                <Badge variant="blue">#{problem.number}</Badge>
                                <Badge>{problem.status}</Badge>
                                <Badge>{problem.difficulty}</Badge>
                                <Badge>{problem.category}</Badge>
                            </div>

                            <h1 className="text-2xl font-black text-slate-950">
                                {problem.title || "제목 없음"}
                            </h1>

                            <p className="mt-2 text-sm font-bold text-slate-500">
                                DB ID {problem.dbId} · slug {problem.slug}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <AppLinkButton
                                href={`/problems/${problem.number}`}
                                variant="secondary"
                                icon={BookOpen}
                            >
                                사용자 화면
                            </AppLinkButton>

                            <AppLinkButton
                                href={`/problems/${problem.number}/solve`}
                                variant="secondary"
                                icon={FileCode2}
                            >
                                풀이 화면
                            </AppLinkButton>

                            <AppButton
                                variant="primary"
                                icon={Save}
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? "저장 중" : "저장"}
                            </AppButton>
                        </div>
                    </div>
                </Card>

                {notice && (
                    <Notice title="저장 완료" variant="success">
                        {notice}
                    </Notice>
                )}

                {errorMessage && (
                    <Notice title="오류" variant="danger">
                        {errorMessage}
                    </Notice>
                )}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="테스트케이스"
                        value={problem.testCases.length.toString()}
                        caption={`예제 ${sampleCount}개 · 숨김 ${hiddenCount}개`}
                        icon={Database}
                    />

                    <StatCard
                        label="검증 완료"
                        value={verifiedCount.toString()}
                        caption="isVerified=true"
                        icon={CheckCircle2}
                        tone="green"
                    />

                    <StatCard
                        label="시간 제한"
                        value={`${problem.timeLimitMs}ms`}
                        caption="채점 실행 제한"
                        icon={RefreshCw}
                        tone="blue"
                    />

                    <StatCard
                        label="제출 수"
                        value={problem.submissionsCount.toString()}
                        caption="이 문제 전체 제출"
                        icon={FileCode2}
                        tone="orange"
                    />
                </section>

                <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_430px]">
                    <div className="space-y-5">
                        <Card className="p-5">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-black text-slate-950">
                                        기본 정보
                                    </h2>
                                    <p className="mt-1 text-sm font-bold text-slate-500">
                                        문제 번호와 제목, 난이도, 채점 제한을 수정합니다.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <Field
                                    label="문제 번호"
                                    value={problem.number}
                                    type="number"
                                    onChange={(value) => updateProblem("number", Number(value))}
                                />

                                <Field
                                    label="Slug"
                                    value={problem.slug}
                                    onChange={(value) => updateProblem("slug", value)}
                                />

                                <Field
                                    label="제목"
                                    value={problem.title}
                                    onChange={(value) => updateProblem("title", value)}
                                />

                                <SelectField
                                    label="상태"
                                    value={problem.status}
                                    options={STATUS_OPTIONS}
                                    onChange={(value) => updateProblem("status", value)}
                                />

                                <SelectField
                                    label="난이도"
                                    value={problem.difficulty}
                                    options={DIFFICULTY_OPTIONS}
                                    onChange={(value) => updateProblem("difficulty", value)}
                                />

                                <Field
                                    label="분류"
                                    value={problem.category}
                                    onChange={(value) => updateProblem("category", value)}
                                />

                                <Field
                                    label="점수"
                                    value={problem.score}
                                    type="number"
                                    onChange={(value) => updateProblem("score", Number(value))}
                                />

                                <Field
                                    label="출처"
                                    value={problem.source}
                                    onChange={(value) => updateProblem("source", value)}
                                />

                                <Field
                                    label="시간 제한(ms)"
                                    value={problem.timeLimitMs}
                                    type="number"
                                    onChange={(value) => updateProblem("timeLimitMs", Number(value))}
                                />

                                <Field
                                    label="메모리 제한(MB)"
                                    value={problem.memoryLimitMb}
                                    type="number"
                                    onChange={(value) => updateProblem("memoryLimitMb", Number(value))}
                                />

                                <SelectField
                                    label="출력 비교"
                                    value={problem.compareMode}
                                    options={COMPARE_MODE_OPTIONS}
                                    onChange={(value) => updateProblem("compareMode", value)}
                                />

                                <Field
                                    label="추천 순서"
                                    value={problem.recommendedOrder}
                                    type="number"
                                    onChange={(value) =>
                                        updateProblem("recommendedOrder", Number(value))
                                    }
                                />
                            </div>
                        </Card>

                        <Card className="p-5">
                            <h2 className="text-xl font-black text-slate-950">문제 본문</h2>

                            <div className="mt-5 space-y-4">
                                <TextAreaField
                                    label="문제 설명"
                                    value={problem.description}
                                    rows={7}
                                    onChange={(value) => updateProblem("description", value)}
                                />

                                <div className="grid gap-4 xl:grid-cols-2">
                                    <TextAreaField
                                        label="입력 설명"
                                        value={problem.inputDescription}
                                        rows={5}
                                        onChange={(value) =>
                                            updateProblem("inputDescription", value)
                                        }
                                    />

                                    <TextAreaField
                                        label="출력 설명"
                                        value={problem.outputDescription}
                                        rows={5}
                                        onChange={(value) =>
                                            updateProblem("outputDescription", value)
                                        }
                                    />
                                </div>

                                <TextAreaField
                                    label="제한 조건 - 한 줄에 하나"
                                    value={constraintsText}
                                    rows={4}
                                    onChange={(value) =>
                                        updateProblem("constraints", splitLines(value))
                                    }
                                />

                                <TextAreaField
                                    label="힌트 - 한 줄에 하나"
                                    value={hintsText}
                                    rows={4}
                                    onChange={(value) => updateProblem("hints", splitLines(value))}
                                />

                                <Field
                                    label="태그 - 쉼표로 구분"
                                    value={tagsText}
                                    onChange={(value) => updateProblem("tags", splitTags(value))}
                                />

                                <div className="grid gap-4 xl:grid-cols-2">
                                    <TextAreaField
                                        label="관리자 메모"
                                        value={problem.memo}
                                        rows={4}
                                        onChange={(value) => updateProblem("memo", value)}
                                    />

                                    <TextAreaField
                                        label="노트"
                                        value={problem.note}
                                        rows={4}
                                        onChange={(value) => updateProblem("note", value)}
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5">
                            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-slate-950">
                                        테스트케이스
                                    </h2>
                                    <p className="mt-1 text-sm font-bold text-slate-500">
                                        제출 채점에서는 이 문제의 TestCase 전체가 사용됩니다.
                                    </p>
                                </div>

                                <AppButton variant="secondary" icon={Plus} onClick={addTestCase}>
                                    테스트케이스 추가
                                </AppButton>
                            </div>

                            {problem.testCases.length === 0 ? (
                                <EmptyState
                                    title="테스트케이스가 없습니다."
                                    description="제출 채점을 위해 최소 1개 이상의 테스트케이스를 추가하세요."
                                    icon={Database}
                                    action={
                                        <AppButton variant="primary" icon={Plus} onClick={addTestCase}>
                                            추가
                                        </AppButton>
                                    }
                                />
                            ) : (
                                <div className="space-y-4">
                                    {problem.testCases.map((testCase, index) => (
                                        <Card key={testCase.id} className="border-slate-200 p-4">
                                            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge variant="blue">#{index + 1}</Badge>
                                                    {testCase.id > 0 ? (
                                                        <Badge>DB {testCase.id}</Badge>
                                                    ) : (
                                                        <Badge>NEW</Badge>
                                                    )}
                                                    {testCase.isSample && <Badge variant="green">Sample</Badge>}
                                                    {testCase.isHidden && <Badge variant="orange">Hidden</Badge>}
                                                    {testCase.isVerified && <Badge variant="blue">Verified</Badge>}
                                                </div>

                                                <AppButton
                                                    variant="danger"
                                                    icon={Trash2}
                                                    onClick={() => removeTestCase(index)}
                                                >
                                                    삭제
                                                </AppButton>
                                            </div>

                                            <div className="grid gap-4 xl:grid-cols-2">
                                                <TextAreaField
                                                    label="입력 stdin"
                                                    value={testCase.input}
                                                    rows={7}
                                                    onChange={(value) =>
                                                        updateTestCase(index, "input", value)
                                                    }
                                                />

                                                <TextAreaField
                                                    label="정답 출력 stdout"
                                                    value={testCase.output}
                                                    rows={7}
                                                    onChange={(value) =>
                                                        updateTestCase(index, "output", value)
                                                    }
                                                />
                                            </div>

                                            <div className="mt-4">
                                                <TextAreaField
                                                    label="예제 설명"
                                                    value={testCase.explanation}
                                                    rows={3}
                                                    onChange={(value) =>
                                                        updateTestCase(index, "explanation", value)
                                                    }
                                                />
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <CheckField
                                                    label="예제 표시"
                                                    checked={testCase.isSample}
                                                    onChange={(checked) =>
                                                        updateTestCase(index, "isSample", checked)
                                                    }
                                                />

                                                <CheckField
                                                    label="숨김 케이스"
                                                    checked={testCase.isHidden}
                                                    onChange={(checked) =>
                                                        updateTestCase(index, "isHidden", checked)
                                                    }
                                                />

                                                <CheckField
                                                    label="검증 완료"
                                                    checked={testCase.isVerified}
                                                    onChange={(checked) =>
                                                        updateTestCase(index, "isVerified", checked)
                                                    }
                                                />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    <aside className="space-y-5">
                        <Card className="p-5">
                            <h2 className="text-lg font-black text-slate-950">관리 정보</h2>

                            <div className="mt-4 space-y-4">
                                <Field
                                    label="작성자 이메일"
                                    value={problem.authorEmail}
                                    onChange={(value) => updateProblem("authorEmail", value)}
                                />

                                <Field
                                    label="검토자 이메일"
                                    value={problem.reviewerEmail}
                                    onChange={(value) => updateProblem("reviewerEmail", value)}
                                />

                                <TextAreaField
                                    label="검토 메시지"
                                    value={problem.reviewMessage}
                                    rows={4}
                                    onChange={(value) => updateProblem("reviewMessage", value)}
                                />

                                <Field
                                    label="정답률"
                                    value={problem.solvedRate}
                                    type="number"
                                    onChange={(value) => updateProblem("solvedRate", Number(value))}
                                />
                            </div>
                        </Card>

                        <Notice title="채점 기준" variant="info">
                            제출 채점은 DB 내부 Problem.id와 연결된 TestCase를 사용합니다.
                            URL의 1000은 문제 번호이고, TestCase.problemId는 DB 내부 문제 ID입니다.
                        </Notice>

                        <Card className="p-5">
                            <h2 className="text-lg font-black text-slate-950">빠른 이동</h2>

                            <div className="mt-4 space-y-2">
                                <Link
                                    href={`/problems/${problem.number}`}
                                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                                >
                                    사용자 문제 상세
                                    <BookOpen className="h-4 w-4" />
                                </Link>

                                <Link
                                    href={`/problems/${problem.number}/solve`}
                                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                                >
                                    풀이 화면
                                    <FileCode2 className="h-4 w-4" />
                                </Link>

                                <Link
                                    href={`/problems/${problem.number}/submissions`}
                                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                                >
                                    제출 기록
                                    <Database className="h-4 w-4" />
                                </Link>
                            </div>
                        </Card>

                        <AppButton
                            variant="primary"
                            icon={Save}
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full"
                        >
                            {isSaving ? "저장 중" : "전체 저장"}
                        </AppButton>

                        <AppButton
                            variant="secondary"
                            icon={RefreshCw}
                            onClick={() => router.refresh()}
                            className="w-full"
                        >
                            새로고침
                        </AppButton>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}