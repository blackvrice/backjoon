"use client";

import AppShell from "@/components/layout/AppShell";
import {
  AppLinkButton,
  Badge,
  Card,
  MiniStat,
  PageHero,
  ProgressBar,
  SectionHeader,
  SidePanel,
  StatCard
} from "@/components/ui";
import { ActivityList, ProblemSetCard, RankingList, TestCard } from "@/components/domain";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CirclePlay,
  Code2,
  Database,
  Medal,
  Trophy,
  UsersRound
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";

type IconKey = "book" | "test" | "submission" | "users" | "database" | "code" | "calendar" | "trophy";

type HomeStat = {
  label: string;
  value: string;
  caption: string;
  iconKey: IconKey;
};

type HomeTest = {
  title: string;
  category: string;
  level: "초급" | "중급" | "고급";
  duration: string;
  problemCount: number;
  participants: string;
  status: "진행 가능" | "마감 임박" | "종료";
  href: string;
};

type HomeProblemSet = {
  title: string;
  description: string;
  count: number;
  level: "Easy" | "Medium" | "Hard";
  tags: string[];
  href: string;
};

type HomeActivity = {
  title: string;
  description: string;
  time: string;
  iconKey: IconKey;
};

type HomeRanking = {
  rank: number;
  name: string;
  score: string;
  href: string;
};

type HomeLearningStats = {
  goalProgress: number;
  solvedCount: number;
  submissionCount: number;
  acceptanceRate: number;
};

type HomeRecommendedTest = {
  title: string;
  problemCount: number;
  duration: string;
  level: string;
};

type HomeSummaryResponse = {
  stats: HomeStat[];
  tests: HomeTest[];
  problemSets: HomeProblemSet[];
  activities: HomeActivity[];
  rankings: HomeRanking[];
  learning: HomeLearningStats;
  recommendedTest: HomeRecommendedTest | null;
};

const iconMap: Record<IconKey, ComponentType<{ className?: string }>> = {
  book: BookOpen,
  test: CirclePlay,
  submission: BarChart3,
  users: UsersRound,
  database: Database,
  code: Code2,
  calendar: CalendarDays,
  trophy: Trophy
};

const emptyLearning: HomeLearningStats = {
  goalProgress: 0,
  solvedCount: 0,
  submissionCount: 0,
  acceptanceRate: 0
};

const emptyStats: HomeStat[] = [
  { label: "등록 문제", value: "0", caption: "DB 기준", iconKey: "book" },
  { label: "진행 테스트", value: "0", caption: "현재 응시 가능한 테스트", iconKey: "test" },
  { label: "오늘 제출", value: "0", caption: "최근 24시간 기준", iconKey: "submission" },
  { label: "참여자", value: "0", caption: "누적 사용자 수", iconKey: "users" }
];

function toStatCardItem(item: HomeStat) {
  return {
    label: item.label,
    value: item.value,
    caption: item.caption,
    icon: iconMap[item.iconKey] ?? Database
  };
}

function toActivityListItem(item: HomeActivity) {
  return {
    title: item.title,
    description: item.description,
    time: item.time,
    icon: iconMap[item.iconKey] ?? Database
  };
}

function EmptyDbCard({ message }: { message: string }) {
  return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="font-black text-slate-950">DB 데이터가 없습니다.</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{message}</p>
          </div>
        </div>
      </Card>
  );
}

export default function HomePage() {
  const [summary, setSummary] = useState<HomeSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadSummary() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/home/summary", {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(`대시보드 데이터를 불러오지 못했습니다. (${response.status})`);
        }

        const data = (await response.json()) as HomeSummaryResponse;
        if (!ignore) {
          setSummary(data);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "대시보드 데이터를 불러오지 못했습니다.");
          setSummary(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(() => (summary?.stats?.length ? summary.stats : emptyStats), [summary]);
  const tests = summary?.tests ?? [];
  const problemSets = summary?.problemSets ?? [];
  const activities = summary?.activities ?? [];
  const rankings = summary?.rankings ?? [];
  const learning = summary?.learning ?? emptyLearning;
  const recommendedTest = summary?.recommendedTest;

  return (
      <AppShell title="메인 대시보드" description="코딩 테스트와 문제 풀이 현황을 한눈에 확인합니다.">
        <div className="space-y-6">
          <PageHero
              eyebrow={
                <>
                  <Badge variant="blue">Local Judge</Badge>
                  <Badge>문제 검색</Badge>
                  <Badge>실시간 채점</Badge>
                </>
              }
              title="코딩 테스트를 연습하고, 제출하고, 결과를 바로 확인하세요."
              description="DB에 저장된 문제, 테스트, 제출 기록, 학습 현황을 기반으로 로컬 코딩 테스트 플랫폼을 관리합니다."
              icon={Trophy}
              rightTitle="현재 추천 테스트"
              rightValue={isLoading ? "불러오는 중" : recommendedTest ? `${recommendedTest.problemCount}문제` : "없음"}
              rightCaption={recommendedTest?.title ?? "DB에 진행 가능한 테스트가 없습니다."}
              metrics={[
                { label: "문제", value: recommendedTest ? `${recommendedTest.problemCount}개` : "0개" },
                { label: "시간", value: recommendedTest?.duration ?? "-" },
                { label: "난이도", value: recommendedTest?.level ?? "-" }
              ]}
              actions={
                <>
                  <AppLinkButton href="/problems" variant="primary" size="lg" iconRight={ArrowRight}>문제 풀기 시작</AppLinkButton>
                  <AppLinkButton href="/tests" variant="white" size="lg">모의 테스트 보기</AppLinkButton>
                </>
              }
          />

          {errorMessage && (
              <Card className="border-red-100 bg-red-50 p-5">
                <p className="font-black text-red-700">DB 연결 오류</p>
                <p className="mt-1 text-sm font-bold text-red-500">{errorMessage}</p>
              </Card>
          )}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => <StatCard key={item.label} {...toStatCardItem(item)} />)}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <section>
                <SectionHeader title="진행 가능한 테스트" description="DB에 등록된 테스트와 추천 평가를 확인합니다." href="/tests" />
                <div className="space-y-3">
                  {tests.length === 0 ? (
                      <EmptyDbCard message="Test 또는 MockTest 테이블에 진행 가능한 테스트를 등록하면 이 영역에 표시됩니다." />
                  ) : (
                      tests.map((item) => <TestCard key={item.title} item={item} />)
                  )}
                </div>
              </section>

              <section>
                <SectionHeader title="추천 문제 세트" description="DB에 저장된 문제 세트를 단계적으로 풀 수 있습니다." href="/sets" />
                <div className="grid gap-4 lg:grid-cols-3">
                  {problemSets.length === 0 ? (
                      <div className="lg:col-span-3">
                        <EmptyDbCard message="ProblemSet 테이블에 문제 세트를 등록하면 이 영역에 표시됩니다." />
                      </div>
                  ) : (
                      problemSets.map((item) => <ProblemSetCard key={item.title} item={item} />)
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <SidePanel title="나의 학습 현황" badge={<Badge variant="blue">DB 기준</Badge>}>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm font-bold">
                      <span className="text-slate-500">목표 달성률</span>
                      <span className="text-slate-950">{learning.goalProgress}%</span>
                    </div>
                    <ProgressBar value={learning.goalProgress} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <MiniStat label="해결" value={learning.solvedCount.toLocaleString()} />
                    <MiniStat label="제출" value={learning.submissionCount.toLocaleString()} />
                    <MiniStat label="정답률" value={`${learning.acceptanceRate}%`} />
                  </div>
                </div>
              </SidePanel>

              <SidePanel title="실시간 랭킹" href="/ranking" badge={<Medal className="h-5 w-5 text-amber-500" />}>
                {rankings.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-500">
                      아직 랭킹을 만들 제출 데이터가 없습니다.
                    </p>
                ) : (
                    <RankingList items={rankings} />
                )}
              </SidePanel>

              <SidePanel title="최근 활동" badge={<Badge variant="blue">DB 기준</Badge>}>
                {activities.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-500">
                      최근 제출 또는 운영 로그가 없습니다.
                    </p>
                ) : (
                    <ActivityList items={activities.map(toActivityListItem)} />
                )}
              </SidePanel>
            </aside>
          </section>
        </div>
      </AppShell>
  );
}
