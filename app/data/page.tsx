"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import AppShell from "@/components/layout/AppShell";
import {
    AppButton,
    AppLinkButton,
    Badge,
    Card,
    EmptyState,
    MiniStat,
    Notice,
    PageHero,
    ProgressBar,
    SidePanel,
    StatCard
} from "@/components/ui";
import {
    FilterPanel,
    FilterSelect,
    SearchInput
} from "@/components/forms";
import {
    ListHeader,
    ViewModeToggle,
    type ViewMode
} from "@/components/common";
import {
    AlertTriangle,
    Archive,
    ArrowRight,
    BarChart3,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Code2,
    Database,
    Download,
    FileArchive,
    FileCode2,
    FileJson,
    FileSpreadsheet,
    Gauge,
    HardDrive,
    Hash,
    History,
    Import,
    Layers3,
    ListChecks,
    LockKeyhole,
    NotebookPen,
    Play,
    RefreshCcw,
    RotateCcw,
    Search,
    Settings,
    ShieldCheck,
    Sparkles,
    Terminal,
    Trash2,
    Upload,
    Zap
} from "lucide-react";

type DataCategory = "전체" | "문제" | "제출" | "테스트" | "태그" | "노트" | "백업" | "설정";
type DataStatus = "healthy" | "warning" | "syncing" | "archived";
type DataStatusFilter = "전체" | "정상" | "주의" | "동기화 중" | "보관됨";
type DataFormat = "JSON" | "CSV" | "SQLite" | "PostgreSQL" | "ZIP" | "Markdown";
type DataFormatFilter = "전체" | DataFormat;
type SortOption = "recent" | "size-desc" | "count-desc" | "name-asc" | "status";

type DataSource = {
    id: string;
    name: string;
    description: string;
    category: Exclude<DataCategory, "전체">;
    status: DataStatus;
    format: DataFormat;
    itemCount: number;
    sizeMb: number;
    updatedAt: string;
    updatedAtText: string;
    path: string;
    autoBackup: boolean;
    encrypted: boolean;
    tags: string[];
};

type BackupItem = {
    id: string;
    name: string;
    sizeMb: number;
    createdAtText: string;
    status: "success" | "failed" | "running";
    includes: string[];
};

type ImportJob = {
    id: string;
    title: string;
    source: string;
    status: "ready" | "running" | "done" | "failed";
    progress: number;
    message: string;
};

type DataApiResponse = {
    sources?: DataSource[];
    backups?: BackupItem[];
    importJobs?: ImportJob[];
    error?: string;
};

const CATEGORY_OPTIONS: readonly DataCategory[] = ["전체", "문제", "제출", "테스트", "태그", "노트", "백업", "설정"];
const STATUS_OPTIONS: readonly DataStatusFilter[] = ["전체", "정상", "주의", "동기화 중", "보관됨"];
const FORMAT_OPTIONS: readonly DataFormatFilter[] = ["전체", "JSON", "CSV", "SQLite", "PostgreSQL", "ZIP", "Markdown"];
const SORT_OPTIONS: readonly SortOption[] = ["recent", "size-desc", "count-desc", "name-asc", "status"];

const statusLabelToValue: Record<Exclude<DataStatusFilter, "전체">, DataStatus> = {
    정상: "healthy",
    주의: "warning",
    "동기화 중": "syncing",
    보관됨: "archived"
};

const sortLabels: Record<SortOption, string> = {
    recent: "최근 업데이트순",
    "size-desc": "용량 큰순",
    "count-desc": "항목 많은순",
    "name-asc": "이름순",
    status: "상태순"
};

const statusMeta: Record<DataStatus, { label: string; variant: "default" | "blue" | "green" | "orange"; icon: ComponentType<{ className?: string }> }> = {
    healthy: { label: "정상", variant: "green", icon: CheckCircle2 },
    warning: { label: "주의", variant: "orange", icon: AlertTriangle },
    syncing: { label: "동기화 중", variant: "blue", icon: RefreshCcw },
    archived: { label: "보관됨", variant: "default", icon: Archive }
};

const formatMeta: Record<DataFormat, { icon: ComponentType<{ className?: string }>; variant: "default" | "blue" | "green" | "orange" }> = {
    JSON: { icon: FileJson, variant: "blue" },
    CSV: { icon: FileSpreadsheet, variant: "green" },
    SQLite: { icon: Database, variant: "orange" },
    PostgreSQL: { icon: Database, variant: "blue" },
    ZIP: { icon: FileArchive, variant: "default" },
    Markdown: { icon: NotebookPen, variant: "blue" }
};

const statusOrder: Record<DataStatus, number> = {
    warning: 1,
    syncing: 2,
    healthy: 3,
    archived: 4
};

function formatSize(sizeMb: number) {
    if (sizeMb >= 1024) {
        return `${(sizeMb / 1024).toFixed(1)}GB`;
    }
    return `${sizeMb.toFixed(1)}MB`;
}

function getTotalSize(items: DataSource[]) {
    return items.reduce((sum, item) => sum + item.sizeMb, 0);
}

function getTotalCount(items: DataSource[]) {
    return items.reduce((sum, item) => sum + item.itemCount, 0);
}

function DataStatusBadge({ status }: { status: DataStatus }) {
    const meta = statusMeta[status];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function FormatBadge({ format }: { format: DataFormat }) {
    const meta = formatMeta[format];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {format}
        </Badge>
    );
}

function DataSourceCard({ source }: { source: DataSource }) {
    const Icon = formatMeta[source.format].icon;

    return (
        <Card hover className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge>{source.category}</Badge>
                        <DataStatusBadge status={source.status} />
                        <FormatBadge format={source.format} />
                        {source.autoBackup && <Badge variant="green"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Auto Backup</Badge>}
                        {source.encrypted && <Badge variant="blue"><LockKeyhole className="mr-1 h-3.5 w-3.5" />Encrypted</Badge>}
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xl font-black tracking-tight text-slate-950">{source.name}</h3>
                            <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-500">{source.description}</p>
                        </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 font-mono text-xs font-bold text-slate-500">
                        {source.path}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {source.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>)}
                    </div>
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[360px]">
                    <MetricBox label="항목" value={`${source.itemCount.toLocaleString()}개`} />
                    <MetricBox label="용량" value={formatSize(source.sizeMb)} />
                    <MetricBox label="형식" value={source.format} />
                    <MetricBox label="업데이트" value={source.updatedAtText.split(" ")[0]} />
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-bold text-slate-400">최근 업데이트 {source.updatedAtText}</div>
                <div className="flex flex-wrap gap-2">
                    <AppButton variant="secondary" icon={Download}>내보내기</AppButton>
                    <AppButton variant="secondary" icon={RefreshCcw}>동기화</AppButton>
                    <AppButton variant="danger" icon={Trash2}>정리</AppButton>
                </div>
            </div>
        </Card>
    );
}

function MetricBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400">{label}</p>
            <p className="mt-1 font-black text-slate-950">{value}</p>
        </div>
    );
}

function DataSourcesTable({ items }: { items: DataSource[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">데이터</th>
                        <th className="px-5 py-4">분류</th>
                        <th className="px-5 py-4">상태</th>
                        <th className="px-5 py-4">형식</th>
                        <th className="px-5 py-4 text-right">항목</th>
                        <th className="px-5 py-4 text-right">용량</th>
                        <th className="px-5 py-4">경로</th>
                        <th className="px-5 py-4">업데이트</th>
                        <th className="px-5 py-4" />
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {items.map((source) => (
                        <tr key={source.id} className="transition hover:bg-slate-50">
                            <td className="px-5 py-4">
                                <p className="font-black text-slate-950">{source.name}</p>
                                <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-400">{source.description}</p>
                            </td>
                            <td className="px-5 py-4"><Badge>{source.category}</Badge></td>
                            <td className="px-5 py-4"><DataStatusBadge status={source.status} /></td>
                            <td className="px-5 py-4"><FormatBadge format={source.format} /></td>
                            <td className="px-5 py-4 text-right font-bold text-slate-600">{source.itemCount.toLocaleString()}</td>
                            <td className="px-5 py-4 text-right font-bold text-slate-600">{formatSize(source.sizeMb)}</td>
                            <td className="px-5 py-4 font-mono text-xs font-bold text-slate-500">{source.path}</td>
                            <td className="px-5 py-4 font-bold text-slate-500">{source.updatedAtText}</td>
                            <td className="px-5 py-4 text-right">
                                <AppButton size="sm" variant="secondary" icon={Download}>Export</AppButton>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function StoragePanel({ items }: { items: DataSource[] }) {
    const totalSize = getTotalSize(items);
    const usedPercent = Math.min(100, Math.round((totalSize / 512) * 100));
    const healthy = items.filter((item) => item.status === "healthy").length;
    const warning = items.filter((item) => item.status === "warning").length;
    const syncing = items.filter((item) => item.status === "syncing").length;

    return (
        <SidePanel title="저장소 상태" badge={<HardDrive className="h-5 w-5 text-blue-600" />}>
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <p className="text-sm font-black text-slate-300">사용 용량</p>
                <p className="mt-1 text-5xl font-black">{usedPercent}%</p>
                <p className="mt-1 text-sm font-bold text-slate-300">{formatSize(totalSize)} / 512MB</p>
                <ProgressBar value={usedPercent} className="mt-5 bg-white/10" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
                <MiniStat label="정상" value={`${healthy}`} />
                <MiniStat label="주의" value={`${warning}`} />
                <MiniStat label="동기화" value={`${syncing}`} />
            </div>
        </SidePanel>
    );
}

function BackupPanel({ items }: { items: BackupItem[] }) {
    return (
        <SidePanel title="최근 백업" badge={<FileArchive className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-3">
                {items.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-500">
                        아직 DB에 저장된 백업 기록이 없습니다.
                    </div>
                ) : (
                    items.map((backup) => (
                        <div key={backup.id} className="rounded-2xl bg-slate-50 p-4">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="truncate text-sm font-black text-slate-800">{backup.name}</p>
                                <Badge variant={backup.status === "success" ? "green" : backup.status === "running" ? "blue" : "orange"}>{backup.status}</Badge>
                            </div>
                            <p className="text-xs font-bold text-slate-400">{backup.createdAtText} · {formatSize(backup.sizeMb)}</p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {backup.includes.map((item) => <Badge key={item}>{item}</Badge>)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </SidePanel>
    );
}

function ImportJobsPanel({ items }: { items: ImportJob[] }) {
    return (
        <SidePanel title="가져오기 작업" badge={<Import className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-3">
                {items.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-500">
                        아직 DB에 저장된 가져오기 작업이 없습니다.
                    </div>
                ) : (
                    items.map((job) => (
                        <div key={job.id} className="rounded-2xl bg-slate-50 p-4">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="text-sm font-black text-slate-800">{job.title}</p>
                                <Badge variant={job.status === "done" ? "green" : job.status === "running" ? "blue" : job.status === "failed" ? "orange" : "default"}>{job.status}</Badge>
                            </div>
                            <p className="text-xs font-bold text-slate-400">{job.source}</p>
                            <div className="mt-3">
                                <ProgressBar value={job.progress} />
                            </div>
                            <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{job.message}</p>
                        </div>
                    ))
                )}
            </div>
        </SidePanel>
    );
}

function CategoryPanel({ items }: { items: DataSource[] }) {
    const categories = CATEGORY_OPTIONS.filter((category) => category !== "전체") as Exclude<DataCategory, "전체">[];

    return (
        <SidePanel title="분류별 데이터" badge={<Layers3 className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {categories.map((category) => {
                    const rows = items.filter((item) => item.category === category);
                    const size = getTotalSize(rows);

                    return (
                        <Link key={category} href={`/data?category=${category}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
                            <span>{category}</span>
                            <span className="text-slate-400">{rows.length}개 · {formatSize(size)}</span>
                        </Link>
                    );
                })}
            </div>
        </SidePanel>
    );
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: ComponentType<{ className?: string }> }) {
    return (
        <Link href={href} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
          {label}
      </span>
            <ChevronRight className="h-4 w-4" />
        </Link>
    );
}

export default function DataPage() {
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [backups, setBackups] = useState<BackupItem[]>([]);
    const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [keyword, setKeyword] = useState("");
    const [category, setCategory] = useState<DataCategory>("전체");
    const [status, setStatus] = useState<DataStatusFilter>("전체");
    const [format, setFormat] = useState<DataFormatFilter>("전체");
    const [sort, setSort] = useState<SortOption>("recent");
    const [viewMode, setViewMode] = useState<ViewMode>("card");

    useEffect(() => {
        let ignore = false;

        async function loadData() {
            setIsLoading(true);
            setLoadError(null);

            try {
                const response = await fetch("/api/data/sources", {
                    method: "GET",
                    cache: "no-store"
                });

                const payload = (await response.json()) as DataApiResponse;

                if (!response.ok) {
                    throw new Error(payload.error || "데이터 정보를 불러오지 못했습니다.");
                }

                if (ignore) return;

                setDataSources(payload.sources ?? []);
                setBackups(payload.backups ?? []);
                setImportJobs(payload.importJobs ?? []);
            } catch (error) {
                if (ignore) return;
                setDataSources([]);
                setBackups([]);
                setImportJobs([]);
                setLoadError(error instanceof Error ? error.message : "데이터 정보를 불러오지 못했습니다.");
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        void loadData();

        return () => {
            ignore = true;
        };
    }, []);

    const filteredSources = useMemo(() => {
        const lowerKeyword = keyword.trim().toLowerCase();

        const result = dataSources.filter((source) => {
            const matchesKeyword =
                !lowerKeyword ||
                source.name.toLowerCase().includes(lowerKeyword) ||
                source.description.toLowerCase().includes(lowerKeyword) ||
                source.category.toLowerCase().includes(lowerKeyword) ||
                source.format.toLowerCase().includes(lowerKeyword) ||
                source.path.toLowerCase().includes(lowerKeyword) ||
                source.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword));

            const matchesCategory = category === "전체" || source.category === category;
            const matchesStatus = status === "전체" || source.status === statusLabelToValue[status];
            const matchesFormat = format === "전체" || source.format === format;

            return matchesKeyword && matchesCategory && matchesStatus && matchesFormat;
        });

        return result.sort((a, b) => {
            switch (sort) {
                case "size-desc":
                    return b.sizeMb - a.sizeMb;
                case "count-desc":
                    return b.itemCount - a.itemCount;
                case "name-asc":
                    return a.name.localeCompare(b.name);
                case "status":
                    return statusOrder[a.status] - statusOrder[b.status];
                case "recent":
                default:
                    return b.updatedAt.localeCompare(a.updatedAt);
            }
        });
    }, [keyword, category, status, format, sort]);

    const totalSize = getTotalSize(dataSources);
    const totalCount = getTotalCount(dataSources);
    const healthyCount = dataSources.filter((source) => source.status === "healthy").length;
    const warningCount = dataSources.filter((source) => source.status === "warning").length;
    const encryptedCount = dataSources.filter((source) => source.encrypted).length;
    const backupEnabledCount = dataSources.filter((source) => source.autoBackup).length;

    const resetFilters = () => {
        setKeyword("");
        setCategory("전체");
        setStatus("전체");
        setFormat("전체");
        setSort("recent");
    };

    return (
        <AppShell title="데이터" description="문제, 제출, 테스트, 태그, 백업 데이터를 관리합니다.">
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Badge variant="blue">Data</Badge>
                            <Badge>PostgreSQL DB</Badge>
                            <Badge variant="green">Healthy {healthyCount}</Badge>
                        </>
                    }
                    title="PostgreSQL 채점 데이터와 백업을 관리하세요."
                    description="PostgreSQL에 저장된 문제, 제출, 테스트 케이스, 태그, 오답노트, 설정 데이터를 한 곳에서 확인합니다."
                    icon={Database}
                    rightTitle="전체 용량"
                    rightValue={formatSize(totalSize)}
                    rightCaption={`${totalCount.toLocaleString()}개 항목 · 암호화 ${encryptedCount}개`}
                    metrics={[
                        { label: "데이터", value: `${dataSources.length}` },
                        { label: "백업", value: `${backupEnabledCount}` },
                        { label: "주의", value: `${warningCount}` }
                    ]}
                    actions={
                        <>
                            <AppButton variant="primary" size="lg" icon={Upload}>데이터 가져오기</AppButton>
                            <AppButton variant="white" size="lg" icon={Download}>전체 내보내기</AppButton>
                        </>
                    }
                />

                {loadError && (
                    <Notice title="DB 조회 오류" variant="warning">
                        {loadError}
                    </Notice>
                )}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="전체 데이터" value={dataSources.length.toLocaleString()} caption={`${totalCount.toLocaleString()}개 항목`} icon={Database} tone="blue" />
                    <StatCard label="사용 용량" value={formatSize(totalSize)} caption="PostgreSQL 기준" icon={HardDrive} tone="orange" />
                    <StatCard label="자동 백업" value={backupEnabledCount.toLocaleString()} caption="백업 대상 데이터" icon={ShieldCheck} tone="green" />
                    <StatCard label="주의 필요" value={warningCount.toLocaleString()} caption="확인 필요한 데이터" icon={AlertTriangle} tone="red" />
                </section>

                <section className="grid gap-4 lg:grid-cols-4">
                    <Card className="p-5 lg:col-span-2">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                                <Upload className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-950">데이터 가져오기</h3>
                                <p className="mt-1 text-sm text-slate-500">문제 JSON, 제출 기록, 태그 인덱스를 가져오거나 병합합니다.</p>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <AppButton variant="secondary" icon={FileJson}>JSON 선택</AppButton>
                            <AppButton variant="secondary" icon={FileSpreadsheet}>CSV 선택</AppButton>
                            <AppButton variant="primary" iconRight={ArrowRight}>가져오기 시작</AppButton>
                        </div>
                    </Card>

                    <Card className="p-5 lg:col-span-2">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                                <Download className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-950">데이터 내보내기</h3>
                                <p className="mt-1 text-sm text-slate-500">현재 데이터를 백업하거나 다른 환경으로 이동합니다.</p>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <AppButton variant="secondary" icon={Database}>PostgreSQL</AppButton>
                            <AppButton variant="secondary" icon={FileArchive}>ZIP 백업</AppButton>
                            <AppButton variant="primary" iconRight={ArrowRight}>전체 Export</AppButton>
                        </div>
                    </Card>
                </section>

                <FilterPanel
                    title="데이터 검색 / 필터"
                    onReset={resetFilters}
                    gridClassName="grid gap-3 xl:grid-cols-[1.4fr_150px_150px_150px_190px_auto] xl:items-end"
                >
                    <SearchInput value={keyword} onChange={setKeyword} placeholder="데이터명, 설명, 경로, 태그, 형식 검색" />
                    <FilterSelect label="분류" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
                    <FilterSelect label="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                    <FilterSelect label="형식" value={format} onChange={setFormat} options={FORMAT_OPTIONS} />
                    <FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} />
                </FilterPanel>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-4">
                        <ListHeader
                            title="데이터 소스"
                            description={isLoading ? "PostgreSQL에서 데이터 소스를 불러오는 중입니다." : `검색 조건에 맞는 데이터 ${filteredSources.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`}
                            right={<ViewModeToggle value={viewMode} onChange={setViewMode} />}
                        />

                        {isLoading ? (
                            <EmptyState
                                title="DB 데이터를 불러오는 중입니다."
                                description="PostgreSQL에서 데이터 소스, 백업, 가져오기 작업 정보를 조회하고 있습니다."
                                icon={Database}
                            />
                        ) : filteredSources.length === 0 ? (
                            <EmptyState
                                title="데이터를 찾을 수 없습니다."
                                description={loadError ? "DB 연결 상태와 /api/data/sources 응답을 확인하세요." : "DB에 데이터가 없거나 검색어 또는 필터 조건에 맞는 데이터가 없습니다."}
                                icon={Search}
                                onReset={resetFilters}
                            />
                        ) : viewMode === "card" ? (
                            <div className="space-y-4">
                                {filteredSources.map((source) => <DataSourceCard key={source.id} source={source} />)}
                            </div>
                        ) : (
                            <DataSourcesTable items={filteredSources} />
                        )}
                    </div>

                    <aside className="space-y-4">
                        <StoragePanel items={dataSources} />
                        <BackupPanel items={backups} />
                        <ImportJobsPanel items={importJobs} />
                        <CategoryPanel items={dataSources} />

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href="/problems" label="문제 데이터" icon={BookOpen} />
                                <QuickLink href="/submissions" label="제출 기록" icon={ListChecks} />
                                <QuickLink href="/tests" label="모의 테스트" icon={Terminal} />
                                <QuickLink href="/tags" label="태그 인덱스" icon={Hash} />
                                <QuickLink href="/notes" label="오답노트" icon={NotebookPen} />
                                <QuickLink href="/settings" label="데이터 경로 설정" icon={Settings} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 `/data`는 `GET /api/data/sources` 응답만 화면에 표시합니다. DB가 비어 있거나 API가 실패하면 목업 데이터로 대체하지 않습니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}
