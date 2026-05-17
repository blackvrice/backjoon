"use client";

import AppShell from "@/components/layout/AppShell";
import {
    AppButton,
    Badge,
    Card,
    MiniStat,
    Notice,
    PageHero,
    ProgressBar,
    SidePanel,
    StatCard
} from "@/components/ui";
import { FilterSelect } from "@/components/forms";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
    AlertTriangle,
    ArrowRight,
    Bell,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Code2,
    Database,
    Download,
    Eye,
    EyeOff,
    FileCode2,
    Globe2,
    HardDrive,
    KeyRound,
    Laptop,
    Mail,
    Monitor,
    Moon,
    Palette,
    RotateCcw,
    Save,
    Settings,
    ShieldCheck,
    SlidersHorizontal, Sparkles,
    Sun,
    Terminal,
    Trash2,
    Upload,
    UserRound,
    Zap
} from "lucide-react";

type SettingsTab = "profile" | "editor" | "judge" | "appearance" | "notifications" | "data";
type ThemeMode = "system" | "light" | "dark";
type AccentColor = "blue" | "emerald" | "purple" | "orange" | "rose";
type DefaultLanguage = "C++17" | "Python 3.12" | "Java 17" | "JavaScript";
type FontSize = "12" | "13" | "14" | "15" | "16" | "18";
type TabSize = "2" | "4" | "8";
type JudgeMode = "local" | "docker" | "remote";
type ResultVisibility = "private" | "public" | "followers";

type ProfileSettings = {
    displayName: string;
    handle: string;
    bio: string;
    email: string;
    website: string;
    location: string;
    publicProfile: boolean;
    resultVisibility: ResultVisibility;
};

type EditorSettings = {
    defaultLanguage: DefaultLanguage;
    fontSize: FontSize;
    tabSize: TabSize;
    wordWrap: boolean;
    minimap: boolean;
    autoSave: boolean;
    autoFormat: boolean;
    vimMode: boolean;
};

type JudgeSettings = {
    mode: JudgeMode;
    timeLimitScale: string;
    memoryLimitScale: string;
    parallelWorkers: string;
    useSandbox: boolean;
    saveFailedCases: boolean;
    showRuntimeDetail: boolean;
};

type AppearanceSettings = {
    theme: ThemeMode;
    accentColor: AccentColor;
    compactMode: boolean;
    reduceMotion: boolean;
    showSidebarLabels: boolean;
};

type NotificationSettings = {
    submissionResult: boolean;
    weeklySummary: boolean;
    goalReminder: boolean;
    contestReminder: boolean;
    emailNotification: boolean;
    desktopNotification: boolean;
};

type DataSettings = {
    problemDataPath: string;
    submissionDataPath: string;
    backupPath: string;
    autoBackup: boolean;
    backupInterval: string;
    keepLogsDays: string;
};

const tabItems: Array<{ id: SettingsTab; label: string; icon: ComponentType<{ className?: string }> }> = [
    { id: "profile", label: "프로필", icon: UserRound },
    { id: "editor", label: "에디터", icon: Code2 },
    { id: "judge", label: "채점", icon: Terminal },
    { id: "appearance", label: "화면", icon: Palette },
    { id: "notifications", label: "알림", icon: Bell },
    { id: "data", label: "데이터", icon: Database }
];

const languageOptions: readonly DefaultLanguage[] = ["C++17", "Python 3.12", "Java 17", "JavaScript"];
const fontSizeOptions: readonly FontSize[] = ["12", "13", "14", "15", "16", "18"];
const tabSizeOptions: readonly TabSize[] = ["2", "4", "8"];
const judgeModeOptions: readonly JudgeMode[] = ["local", "docker", "remote"];
const themeOptions: readonly ThemeMode[] = ["system", "light", "dark"];
const accentOptions: readonly AccentColor[] = ["blue", "emerald", "purple", "orange", "rose"];
const visibilityOptions: readonly ResultVisibility[] = ["private", "public", "followers"];

const judgeModeLabels: Record<JudgeMode, string> = {
    local: "로컬 실행",
    docker: "Docker 샌드박스",
    remote: "원격 채점 서버"
};

const themeLabels: Record<ThemeMode, string> = {
    system: "시스템 설정",
    light: "라이트 모드",
    dark: "다크 모드"
};

const accentLabels: Record<AccentColor, string> = {
    blue: "Blue",
    emerald: "Emerald",
    purple: "Purple",
    orange: "Orange",
    rose: "Rose"
};

const visibilityLabels: Record<ResultVisibility, string> = {
    private: "비공개",
    public: "전체 공개",
    followers: "팔로워 공개"
};

function SettingTextField({
                              label,
                              value,
                              onChange,
                              placeholder,
                              type = "text",
                              description
                          }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: "text" | "email" | "url" | "password";
    description?: string;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-black text-slate-500">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none ring-blue-100 transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4"
            />
            {description && <p className="mt-1.5 text-xs font-medium leading-5 text-slate-400">{description}</p>}
        </label>
    );
}

function SettingTextarea({
                             label,
                             value,
                             onChange,
                             placeholder,
                             description
                         }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    description?: string;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-black text-slate-500">{label}</span>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="min-h-32 w-full resize-y rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold leading-7 text-slate-700 outline-none ring-blue-100 transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4"
            />
            {description && <p className="mt-1.5 text-xs font-medium leading-5 text-slate-400">{description}</p>}
        </label>
    );
}

function SettingToggle({
                           label,
                           description,
                           checked,
                           onChange,
                           icon: Icon
                       }: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (value: boolean) => void;
    icon?: ComponentType<{ className?: string }>;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="flex w-full items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/30"
        >
      <span className="flex min-w-0 items-start gap-3">
        {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Icon className="h-5 w-5" />
          </span>
        )}
          <span className="min-w-0">
          <span className="block font-black text-slate-950">{label}</span>
              {description && <span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span>}
        </span>
      </span>

            <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-blue-600" : "bg-slate-200"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`} />
      </span>
        </button>
    );
}

function SettingSection({
                            title,
                            description,
                            icon: Icon,
                            children
                        }: {
    title: string;
    description?: string;
    icon: ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <Card className="p-5">
            <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-950">{title}</h3>
                    {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
                </div>
            </div>
            {children}
        </Card>
    );
}

function TabButton({ tab, activeTab, onClick }: { tab: SettingsTab; activeTab: SettingsTab; onClick: (tab: SettingsTab) => void }) {
    const item = tabItems.find((entry) => entry.id === tab)!;
    const Icon = item.icon;

    return (
        <button
            type="button"
            onClick={() => onClick(tab)}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                activeTab === tab
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            }`}
        >
            <Icon className="h-4 w-4" />
            {item.label}
        </button>
    );
}

function ProfileSettingsTab({ profile, setProfile }: { profile: ProfileSettings; setProfile: (value: ProfileSettings) => void }) {
    return (
        <div className="space-y-4">
            <SettingSection title="기본 프로필" description="공개 프로필과 랭킹에 표시되는 정보를 설정합니다." icon={UserRound}>
                <div className="grid gap-4 lg:grid-cols-2">
                    <SettingTextField label="표시 이름" value={profile.displayName} onChange={(value) => setProfile({ ...profile, displayName: value })} placeholder="표시 이름" />
                    <SettingTextField label="핸들" value={profile.handle} onChange={(value) => setProfile({ ...profile, handle: value })} placeholder="handle" description="프로필 URL에 사용됩니다." />
                    <SettingTextField label="이메일" type="email" value={profile.email} onChange={(value) => setProfile({ ...profile, email: value })} placeholder="email@example.com" />
                    <SettingTextField label="웹사이트" type="url" value={profile.website} onChange={(value) => setProfile({ ...profile, website: value })} placeholder="https://example.com" />
                    <SettingTextField label="지역" value={profile.location} onChange={(value) => setProfile({ ...profile, location: value })} placeholder="Seoul, KR" />
                    <FilterSelect label="제출 결과 공개 범위" value={profile.resultVisibility} onChange={(value) => setProfile({ ...profile, resultVisibility: value })} options={visibilityOptions} />
                    <div className="lg:col-span-2">
                        <SettingTextarea label="소개" value={profile.bio} onChange={(value) => setProfile({ ...profile, bio: value })} placeholder="간단한 자기소개를 작성하세요." />
                    </div>
                </div>
            </SettingSection>

            <SettingSection title="공개 설정" description="다른 사용자가 볼 수 있는 프로필 정보를 설정합니다." icon={Eye}>
                <SettingToggle
                    label="공개 프로필 사용"
                    description="켜면 /profile/[handle] 페이지에서 내 프로필을 볼 수 있습니다."
                    checked={profile.publicProfile}
                    onChange={(value) => setProfile({ ...profile, publicProfile: value })}
                    icon={profile.publicProfile ? Eye : EyeOff}
                />
            </SettingSection>
        </div>
    );
}

function EditorSettingsTab({ editor, setEditor }: { editor: EditorSettings; setEditor: (value: EditorSettings) => void }) {
    return (
        <div className="space-y-4">
            <SettingSection title="기본 에디터" description="문제 풀이 화면의 Monaco Editor 기본값을 설정합니다." icon={Code2}>
                <div className="grid gap-4 lg:grid-cols-3">
                    <FilterSelect label="기본 언어" value={editor.defaultLanguage} onChange={(value) => setEditor({ ...editor, defaultLanguage: value })} options={languageOptions} />
                    <FilterSelect label="폰트 크기" value={editor.fontSize} onChange={(value) => setEditor({ ...editor, fontSize: value })} options={fontSizeOptions} />
                    <FilterSelect label="탭 크기" value={editor.tabSize} onChange={(value) => setEditor({ ...editor, tabSize: value })} options={tabSizeOptions} />
                </div>
            </SettingSection>

            <SettingSection title="에디터 동작" description="자동 저장, 자동 포맷, 줄바꿈 등의 코딩 편의 기능입니다." icon={FileCode2}>
                <div className="grid gap-3 lg:grid-cols-2">
                    <SettingToggle label="자동 저장" description="코드 변경 후 일정 시간이 지나면 자동 저장합니다." checked={editor.autoSave} onChange={(value) => setEditor({ ...editor, autoSave: value })} icon={Save} />
                    <SettingToggle label="자동 포맷" description="저장 또는 제출 전에 코드 포맷을 적용합니다." checked={editor.autoFormat} onChange={(value) => setEditor({ ...editor, autoFormat: value })} icon={Sparkles} />
                    <SettingToggle label="미니맵 표시" description="에디터 오른쪽에 코드 미니맵을 표시합니다." checked={editor.minimap} onChange={(value) => setEditor({ ...editor, minimap: value })} icon={Monitor} />
                    <SettingToggle label="자동 줄바꿈" description="긴 코드를 화면 너비에 맞춰 줄바꿈합니다." checked={editor.wordWrap} onChange={(value) => setEditor({ ...editor, wordWrap: value })} icon={SlidersHorizontal} />
                    <SettingToggle label="Vim 모드" description="Vim 키 바인딩을 사용하는 고급 옵션입니다." checked={editor.vimMode} onChange={(value) => setEditor({ ...editor, vimMode: value })} icon={Terminal} />
                </div>
            </SettingSection>
        </div>
    );
}

function JudgeSettingsTab({ judge, setJudge }: { judge: JudgeSettings; setJudge: (value: JudgeSettings) => void }) {
    return (
        <div className="space-y-4">
            <SettingSection title="채점 실행 환경" description="코드 실행 방식과 리소스 제한 배율을 설정합니다." icon={Terminal}>
                <div className="grid gap-4 lg:grid-cols-3">
                    <FilterSelect label="채점 모드" value={judge.mode} onChange={(value) => setJudge({ ...judge, mode: value })} options={judgeModeOptions} />
                    <SettingTextField label="시간 제한 배율" value={judge.timeLimitScale} onChange={(value) => setJudge({ ...judge, timeLimitScale: value })} placeholder="1.0" />
                    <SettingTextField label="메모리 제한 배율" value={judge.memoryLimitScale} onChange={(value) => setJudge({ ...judge, memoryLimitScale: value })} placeholder="1.0" />
                    <SettingTextField label="병렬 워커 수" value={judge.parallelWorkers} onChange={(value) => setJudge({ ...judge, parallelWorkers: value })} placeholder="4" />
                </div>
            </SettingSection>

            <SettingSection title="채점 옵션" description="샌드박스, 실패 케이스 저장, 실행 상세 표시 여부를 설정합니다." icon={ShieldCheck}>
                <div className="grid gap-3 lg:grid-cols-2">
                    <SettingToggle label="샌드박스 사용" description="사용자 코드를 격리된 환경에서 실행합니다." checked={judge.useSandbox} onChange={(value) => setJudge({ ...judge, useSandbox: value })} icon={ShieldCheck} />
                    <SettingToggle label="실패 케이스 저장" description="오답/런타임 에러 발생 시 입력과 로그를 저장합니다." checked={judge.saveFailedCases} onChange={(value) => setJudge({ ...judge, saveFailedCases: value })} icon={Database} />
                    <SettingToggle label="실행 상세 표시" description="실행 시간, 메모리, 컴파일 로그를 자세히 표시합니다." checked={judge.showRuntimeDetail} onChange={(value) => setJudge({ ...judge, showRuntimeDetail: value })} icon={Terminal} />
                </div>
            </SettingSection>

            <Notice variant={judge.mode === "local" ? "warning" : "info"} title="채점 모드 안내">
                현재 선택된 모드는 <b>{judgeModeLabels[judge.mode]}</b>입니다. 실제 서비스 환경에서는 Docker 샌드박스 모드를 기본값으로 두는 것을 권장합니다.
            </Notice>
        </div>
    );
}

function AppearanceSettingsTab({ appearance, setAppearance }: { appearance: AppearanceSettings; setAppearance: (value: AppearanceSettings) => void }) {
    return (
        <div className="space-y-4">
            <SettingSection title="테마" description="화면 표시 방식과 강조 색상을 설정합니다." icon={Palette}>
                <div className="grid gap-4 lg:grid-cols-2">
                    <FilterSelect label="테마 모드" value={appearance.theme} onChange={(value) => setAppearance({ ...appearance, theme: value })} options={themeOptions} />
                    <FilterSelect label="강조 색상" value={appearance.accentColor} onChange={(value) => setAppearance({ ...appearance, accentColor: value })} options={accentOptions} />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <ThemePreview label="시스템" selected={appearance.theme === "system"} icon={Laptop} />
                    <ThemePreview label="라이트" selected={appearance.theme === "light"} icon={Sun} />
                    <ThemePreview label="다크" selected={appearance.theme === "dark"} icon={Moon} />
                </div>
            </SettingSection>

            <SettingSection title="화면 밀도" description="대시보드와 목록 화면의 표시 방식을 조정합니다." icon={Monitor}>
                <div className="grid gap-3 lg:grid-cols-2">
                    <SettingToggle label="컴팩트 모드" description="카드와 목록의 여백을 줄여 더 많은 정보를 표시합니다." checked={appearance.compactMode} onChange={(value) => setAppearance({ ...appearance, compactMode: value })} icon={Monitor} />
                    <SettingToggle label="애니메이션 줄이기" description="화면 전환과 hover 애니메이션을 줄입니다." checked={appearance.reduceMotion} onChange={(value) => setAppearance({ ...appearance, reduceMotion: value })} icon={Zap} />
                    <SettingToggle label="사이드바 라벨 표시" description="아이콘 옆 메뉴 이름을 항상 표시합니다." checked={appearance.showSidebarLabels} onChange={(value) => setAppearance({ ...appearance, showSidebarLabels: value })} icon={SlidersHorizontal} />
                </div>
            </SettingSection>
        </div>
    );
}

function ThemePreview({ label, selected, icon: Icon }: { label: string; selected: boolean; icon: ComponentType<{ className?: string }> }) {
    return (
        <div className={`rounded-3xl border p-4 ${selected ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-black text-slate-950">{label}</p>
                    <p className="text-xs font-bold text-slate-400">{selected ? "선택됨" : "미선택"}</p>
                </div>
            </div>
        </div>
    );
}

function NotificationSettingsTab({ notifications, setNotifications }: { notifications: NotificationSettings; setNotifications: (value: NotificationSettings) => void }) {
    return (
        <div className="space-y-4">
            <SettingSection title="알림 이벤트" description="풀이와 학습 목표 관련 알림을 설정합니다." icon={Bell}>
                <div className="grid gap-3 lg:grid-cols-2">
                    <SettingToggle label="제출 결과 알림" description="채점이 끝나면 결과 알림을 표시합니다." checked={notifications.submissionResult} onChange={(value) => setNotifications({ ...notifications, submissionResult: value })} icon={CheckCircle2} />
                    <SettingToggle label="주간 학습 요약" description="매주 해결 수, 정답률, 목표 달성률을 요약합니다." checked={notifications.weeklySummary} onChange={(value) => setNotifications({ ...notifications, weeklySummary: value })} icon={BookOpen} />
                    <SettingToggle label="목표 리마인더" description="목표 마감일이 가까워지면 알림을 표시합니다." checked={notifications.goalReminder} onChange={(value) => setNotifications({ ...notifications, goalReminder: value })} icon={AlertTriangle} />
                    <SettingToggle label="테스트 리마인더" description="예약된 모의 테스트 시작 전 알림을 표시합니다." checked={notifications.contestReminder} onChange={(value) => setNotifications({ ...notifications, contestReminder: value })} icon={Terminal} />
                </div>
            </SettingSection>

            <SettingSection title="알림 채널" description="알림을 받을 채널을 선택합니다." icon={Mail}>
                <div className="grid gap-3 lg:grid-cols-2">
                    <SettingToggle label="이메일 알림" description="중요 알림을 이메일로 받습니다." checked={notifications.emailNotification} onChange={(value) => setNotifications({ ...notifications, emailNotification: value })} icon={Mail} />
                    <SettingToggle label="데스크톱 알림" description="브라우저 데스크톱 알림을 사용합니다." checked={notifications.desktopNotification} onChange={(value) => setNotifications({ ...notifications, desktopNotification: value })} icon={Monitor} />
                </div>
            </SettingSection>
        </div>
    );
}

function DataSettingsTab({ data, setData }: { data: DataSettings; setData: (value: DataSettings) => void }) {
    return (
        <div className="space-y-4">
            <SettingSection title="데이터 경로" description="문제, 제출, 백업 데이터가 저장되는 위치를 설정합니다." icon={HardDrive}>
                <div className="grid gap-4">
                    <SettingTextField label="문제 데이터 경로" value={data.problemDataPath} onChange={(value) => setData({ ...data, problemDataPath: value })} />
                    <SettingTextField label="제출 데이터 경로" value={data.submissionDataPath} onChange={(value) => setData({ ...data, submissionDataPath: value })} />
                    <SettingTextField label="백업 경로" value={data.backupPath} onChange={(value) => setData({ ...data, backupPath: value })} />
                </div>
            </SettingSection>

            <SettingSection title="백업 / 로그" description="자동 백업과 로그 보관 기간을 설정합니다." icon={Database}>
                <div className="grid gap-4 lg:grid-cols-2">
                    <SettingToggle label="자동 백업" description="설정한 주기마다 로컬 데이터를 백업합니다." checked={data.autoBackup} onChange={(value) => setData({ ...data, autoBackup: value })} icon={Database} />
                    <SettingTextField label="백업 주기" value={data.backupInterval} onChange={(value) => setData({ ...data, backupInterval: value })} placeholder="daily" />
                    <SettingTextField label="로그 보관 기간" value={data.keepLogsDays} onChange={(value) => setData({ ...data, keepLogsDays: value })} placeholder="30" />
                </div>
            </SettingSection>

            <SettingSection title="데이터 관리" description="데이터를 내보내거나 초기화합니다." icon={Database}>
                <div className="grid gap-3 md:grid-cols-3">
                    <AppButton variant="secondary" icon={Download}>데이터 내보내기</AppButton>
                    <AppButton variant="secondary" icon={Upload}>데이터 가져오기</AppButton>
                    <AppButton variant="danger" icon={Trash2}>캐시 초기화</AppButton>
                </div>
            </SettingSection>
        </div>
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

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
    const [savedMessage, setSavedMessage] = useState<string | null>(null);

    const [profile, setProfile] = useState<ProfileSettings>({
        displayName: "Kim Code",
        handle: "kimcode",
        bio: "로컬 코딩 테스트 환경에서 알고리즘, 자료구조, DP를 꾸준히 연습하고 있습니다.",
        email: "kimcode@example.com",
        website: "https://example.dev",
        location: "Seoul, KR",
        publicProfile: true,
        resultVisibility: "public"
    });

    const [editor, setEditor] = useState<EditorSettings>({
        defaultLanguage: "C++17",
        fontSize: "14",
        tabSize: "4",
        wordWrap: false,
        minimap: true,
        autoSave: true,
        autoFormat: false,
        vimMode: false
    });

    const [judge, setJudge] = useState<JudgeSettings>({
        mode: "docker",
        timeLimitScale: "1.0",
        memoryLimitScale: "1.0",
        parallelWorkers: "4",
        useSandbox: true,
        saveFailedCases: true,
        showRuntimeDetail: true
    });

    const [appearance, setAppearance] = useState<AppearanceSettings>({
        theme: "system",
        accentColor: "blue",
        compactMode: false,
        reduceMotion: false,
        showSidebarLabels: true
    });

    const [notifications, setNotifications] = useState<NotificationSettings>({
        submissionResult: true,
        weeklySummary: true,
        goalReminder: true,
        contestReminder: false,
        emailNotification: false,
        desktopNotification: true
    });

    const [data, setData] = useState<DataSettings>({
        problemDataPath: "./data/problems",
        submissionDataPath: "./data/submissions",
        backupPath: "./backup",
        autoBackup: true,
        backupInterval: "daily",
        keepLogsDays: "30"
    });

    const enabledNotificationCount = useMemo(() => {
        return Object.values(notifications).filter(Boolean).length;
    }, [notifications]);

    const handleSave = () => {
        setSavedMessage("설정을 저장했습니다. 실제 구현 시에는 PATCH /api/settings로 저장하면 됩니다.");
        window.setTimeout(() => setSavedMessage(null), 2200);
    };

    const handleReset = () => {
        setSavedMessage("현재 탭의 설정을 기본값으로 되돌리는 동작을 연결하면 됩니다.");
        window.setTimeout(() => setSavedMessage(null), 2200);
    };

    return (
        <AppShell title="설정" description="프로필, 에디터, 채점, 화면, 알림, 데이터 경로를 관리합니다.">
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Badge variant="blue">Settings</Badge>
                            <Badge>Local Judge</Badge>
                            <Badge variant="green">Saved locally</Badge>
                        </>
                    }
                    title="코딩 테스트 환경을 내 방식대로 설정하세요."
                    description="프로필 공개 범위, Monaco Editor 기본값, 채점 실행 환경, 화면 테마, 알림, 로컬 데이터 경로를 한 곳에서 관리합니다."
                    icon={Settings}
                    rightTitle="현재 프로필"
                    rightValue={`@${profile.handle}`}
                    rightCaption={`${editor.defaultLanguage} · ${judgeModeLabels[judge.mode]}`}
                    metrics={[
                        { label: "테마", value: themeLabels[appearance.theme] },
                        { label: "알림", value: `${enabledNotificationCount}개` },
                        { label: "언어", value: editor.defaultLanguage }
                    ]}
                    actions={
                        <>
                            <AppButton variant="primary" size="lg" icon={Save} onClick={handleSave}>설정 저장</AppButton>
                            <AppButton variant="white" size="lg" icon={RotateCcw} onClick={handleReset}>기본값</AppButton>
                        </>
                    }
                />

                {savedMessage && <Notice variant="success" title="알림">{savedMessage}</Notice>}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="기본 언어" value={editor.defaultLanguage} caption={`${editor.fontSize}px · tab ${editor.tabSize}`} icon={Code2} tone="blue" />
                    <StatCard label="채점 모드" value={judgeModeLabels[judge.mode]} caption={judge.useSandbox ? "Sandbox enabled" : "Sandbox disabled"} icon={Terminal} tone="green" />
                    <StatCard label="화면 모드" value={themeLabels[appearance.theme]} caption={`Accent ${accentLabels[appearance.accentColor]}`} icon={Palette} tone="orange" />
                    <StatCard label="알림" value={`${enabledNotificationCount}개`} caption="활성화된 알림" icon={Bell} tone="purple" />
                </section>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-5">
                        <Card className="p-2">
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                                {tabItems.map((tab) => <TabButton key={tab.id} tab={tab.id} activeTab={activeTab} onClick={setActiveTab} />)}
                            </div>
                        </Card>

                        {activeTab === "profile" && <ProfileSettingsTab profile={profile} setProfile={setProfile} />}
                        {activeTab === "editor" && <EditorSettingsTab editor={editor} setEditor={setEditor} />}
                        {activeTab === "judge" && <JudgeSettingsTab judge={judge} setJudge={setJudge} />}
                        {activeTab === "appearance" && <AppearanceSettingsTab appearance={appearance} setAppearance={setAppearance} />}
                        {activeTab === "notifications" && <NotificationSettingsTab notifications={notifications} setNotifications={setNotifications} />}
                        {activeTab === "data" && <DataSettingsTab data={data} setData={setData} />}
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="설정 요약" badge={<Settings className="h-5 w-5 text-blue-600" />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">현재 탭</p>
                                <p className="mt-1 text-4xl font-black">{tabItems.find((item) => item.id === activeTab)?.label}</p>
                                <ProgressBar value={75} className="mt-5 bg-white/10" />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="언어" value={editor.defaultLanguage} />
                                <MiniStat label="테마" value={appearance.theme} />
                                <MiniStat label="알림" value={`${enabledNotificationCount}`} />
                            </div>
                        </SidePanel>

                        <SidePanel title="보안 상태" badge={<ShieldCheck className="h-5 w-5 text-emerald-600" />}>
                            <div className="space-y-3">
                                <StatusRow label="샌드박스" enabled={judge.useSandbox} />
                                <StatusRow label="공개 프로필" enabled={profile.publicProfile} />
                                <StatusRow label="자동 백업" enabled={data.autoBackup} />
                                <StatusRow label="데스크톱 알림" enabled={notifications.desktopNotification} />
                            </div>
                        </SidePanel>

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href="/profile" label="내 프로필" icon={UserRound} />
                                <QuickLink href="/dashboard" label="대시보드" icon={Monitor} />
                                <QuickLink href="/problems" label="문제 검색" icon={BookOpen} />
                                <QuickLink href="/submissions" label="제출 기록" icon={Terminal} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 `/settings`는 클라이언트 상태 기반입니다. API는 `GET /api/settings`, `PATCH /api/settings`, `POST /api/settings/export`, `POST /api/settings/import`를 붙이면 됩니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}

function StatusRow({ label, enabled }: { label: string; enabled: boolean }) {
    return (
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black">
            <span className="text-slate-700">{label}</span>
            <Badge variant={enabled ? "green" : "default"}>{enabled ? "ON" : "OFF"}</Badge>
        </div>
    );
}
