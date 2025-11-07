import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { CupSoda, Plus, Salad, Sparkles, Swords, Medal, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";

// -------------------------------
// Types
// -------------------------------

type RewardMode = "random" | "weighted";

type Match = {
  id: string;
  a: string | null;
  b: string | null;
  winner: string | null;
};

type Tournament = {
  id: string;
  title: string;
  description?: string;
  size: number; // 8 | 16 | 32 | 64
  entries: string[];
  rounds: Match[][]; // rounds[0] = first round matches
  currentRoundIndex: number; // starts at 0
  isFinished: boolean;
  winner?: string;
  rewardMode: RewardMode;
  rewardsPool: string[]; // e.g., badges/coupons/etc
  createdAt: number;
  locationTag?: string; // e.g. 종로구 관철동
};

// -------------------------------
// Helpers
// -------------------------------

function toPowerOfTwo(n: number) {
  const sizes = [4, 8, 16, 32, 64];
  for (let s of sizes) if (n <= s) return s;
  return 64;
}

function seedMatches(entries: string[]): Match[] {
  const pairs: Match[] = [];
  for (let i = 0; i < entries.length; i += 2) {
    pairs.push({ id: uuidv4(), a: entries[i] ?? null, b: entries[i + 1] ?? null, winner: null });
  }
  return pairs;
}

function buildRounds(entries: string[]): Match[][] {
  // Ensure power-of-two entries by padding with BYE
  const size = toPowerOfTwo(entries.length);
  const filled = [...entries];
  while (filled.length < size) filled.push("(BYE)");
  const first = seedMatches(filled);
  const rounds: Match[][] = [first];
  let currentSize = size / 2;
  while (currentSize >= 1) {
    const blank: Match[] = [];
    for (let i = 0; i < currentSize; i++) blank.push({ id: uuidv4(), a: null, b: null, winner: null });
    if (currentSize >= 1) rounds.push(blank);
    currentSize = currentSize / 2;
  }
  // remove last empty round (beyond final)
  rounds.pop();
  return rounds;
}

function nextRoundFrom(round: Match[]): Match[] {
  const next: Match[] = [];
  for (let i = 0; i < round.length; i += 2) {
    next.push({ id: uuidv4(), a: round[i]?.winner ?? null, b: round[i + 1]?.winner ?? null, winner: null });
  }
  return next;
}

function generateCoupon(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `FOOD-${code}`;
}

const DEFAULT_REWARDS = [
  "배지: 맛집 큐레이터 🧭",
  "쿠폰: 배달비 3,000원 할인",
  "쿠폰: 아메리카노 무료",
  "랜덤 스티커 팩 🎉",
  "배지: 미식가의 길 🍽️",
];

const DEFAULT_TOURNAMENTS: Omit<Tournament, "rounds" | "currentRoundIndex" | "isFinished" | "winner" | "createdAt">[] = [
  {
    id: uuidv4(),
    title: "종로구 관철동 맛집 32강",
    description: "관철동의 찐 로컬 맛집들을 가려보자!",
    size: 32,
    entries: [
      "광화문국밥",
      "을지로양말식당",
      "삼거리포차",
      "인사동만두",
      "청계천메밀막국수",
      "경복궁비빔밥",
      "효자동닭한마리",
      "단성사칼국수",
      "관철동김치찌개",
      "피맛골비빔막국수",
      "종각돈카츠",
      "보신각곰탕",
      "낙원떡볶이",
      "서린낙지",
      "광장시장육회",
      "계동볶음밥",
      "무교동낙지",
      "종로파스타",
      "커리페스트",
      "북촌칼국수",
      "연탄불고기",
      "계동칼비빔",
      "종로쌀국수",
      "인사동국시",
      "돈부리상회",
      "종로라멘",
      "닭갈비연구소",
      "막창연대",
      "김밥세상",
      "골목김치말이",
      "불백장인",
      "곰탕연구소",
    ],
    rewardMode: "random",
    rewardsPool: DEFAULT_REWARDS,
    locationTag: "서울 종로구 관철동",
  },
  {
    id: uuidv4(),
    title: "강남 직장인 점심 16강",
    description: "가성비 & 빠른 점심",
    size: 16,
    entries: [
      "국물닭갈비",
      "규동마스터",
      "마라샹궈클럽",
      "김치찌개연구소",
      "회덮밥천국",
      "수제버거앤프라이",
      "덮밥의정석",
      "평양냉면",
      "비빔국수",
      "바질파스타",
      "쌀국수",
      "돈코츠라멘",
      "초밥",
      "분짜",
      "타코",
      "연어덮밥",
    ],
    rewardMode: "weighted",
    rewardsPool: DEFAULT_REWARDS,
    locationTag: "서울 강남구",
  },
];

// -------------------------------
// Storage
// -------------------------------

const STORAGE_KEY = "food-tournaments";
function loadTournaments(): Tournament[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Tournament[];
    return parsed;
  } catch (e) {
    console.error(e);
    return [];
  }
}
function saveTournaments(list: Tournament[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// -------------------------------
// Main App
// -------------------------------

export default function App() {
  const [tab, setTab] = useState("browse");
  const [query, setQuery] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [active, setActive] = useState<Tournament | null>(null);
  const [rewardDialog, setRewardDialog] = useState<{ open: boolean; reward?: string; code?: string }>();

  useEffect(() => {
    const existing = loadTournaments();
    if (existing.length === 0) {
      // Seed defaults on first use
      const seeded = DEFAULT_TOURNAMENTS.map((t) => toTournament(t));
      setTournaments(seeded);
      saveTournaments(seeded);
    } else {
      setTournaments(existing);
    }
  }, []);

  useEffect(() => {
    saveTournaments(tournaments);
  }, [tournaments]);

  const filtered = useMemo(() => {
    if (!query.trim()) return tournaments;
    const q = query.toLowerCase();
    return tournaments.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.locationTag ?? "").toLowerCase().includes(q)
    );
  }, [query, tournaments]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <CupSoda className="w-6 h-6" />
          <h1 className="text-xl font-semibold">맛집 토너먼트</h1>
          <Badge className="ml-2" variant="secondary">vibe coding</Badge>
          <div className="ml-auto flex items-center gap-2">
            <Input placeholder="지역/제목 검색" value={query} onChange={(e) => setQuery(e.target.value)} className="w-56" />
            <Button variant="outline" onClick={() => setTab("create")}>
              <Plus className="w-4 h-4 mr-1" /> 토너먼트 만들기
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="browse"><Swords className="w-4 h-4 mr-1" />참여하기</TabsTrigger>
            <TabsTrigger value="create"><Plus className="w-4 h-4 mr-1" />만들기</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            <TournamentGrid items={filtered} onOpen={(t) => { setActive(t); setTab("play"); }} />
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <CreateTournament onCreate={(t) => { setTournaments([t, ...tournaments]); setTab("browse"); }} />
          </TabsContent>

          <TabsContent value="play" className="mt-6">
            {active ? (
              <PlayTournament
                key={active.id}
                data={active}
                onUpdate={(updated, finishedReward) => {
                  setTournaments((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                  setActive(updated);
                  if (finishedReward) setRewardDialog({ open: true, reward: finishedReward.reward, code: finishedReward.code });
                }}
                onBack={() => setTab("browse")}
              />
            ) : (
              <EmptyState />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!rewardDialog?.open} onOpenChange={(o) => setRewardDialog({ open: o })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Gift className="w-5 h-5" /> 리워드 지급 완료!</DialogTitle>
            <DialogDescription>토너먼트 우승을 결정해주셔서 고마워요 🥳</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-slate-100">
              <p className="text-sm">리워드</p>
              <p className="text-lg font-semibold">{rewardDialog?.reward}</p>
            </div>
            {rewardDialog?.code && (
              <div className="p-3 rounded-2xl bg-emerald-100">
                <p className="text-sm">쿠폰 코드</p>
                <p className="text-lg font-mono tracking-wider">{rewardDialog.code}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setRewardDialog({ open: false })}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -------------------------------
// Components
// -------------------------------

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center space-y-3">
        <Salad className="w-10 h-10 mx-auto" />
        <p className="text-slate-600">왼쪽에서 토너먼트를 선택하거나 새로 만들어주세요.</p>
      </CardContent>
    </Card>
  );
}

function TournamentGrid({ items, onOpen }: { items: Tournament[]; onOpen: (t: Tournament) => void }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onOpen(t)}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t.title}</span>
                  {t.isFinished ? <Badge variant="secondary">완료</Badge> : <Badge>진행중</Badge>}
                </CardTitle>
                {t.locationTag && <CardDescription>{t.locationTag}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-slate-600 text-sm">
                  <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4" /> {t.size}강
                  </div>
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4" /> {t.rewardMode === "random" ? "랜덤 리워드" : "가중 리워드"}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-xs text-slate-500">생성일 {new Date(t.createdAt).toLocaleDateString()}</div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function CreateTournament({ onCreate }: { onCreate: (t: Tournament) => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [locationTag, setLocationTag] = useState("");
  const [rewardMode, setRewardMode] = useState<RewardMode>("random");
  const [entriesText, setEntriesText] = useState("");
  const [rewardsPoolText, setRewardsPoolText] = useState(DEFAULT_REWARDS.join("\n"));

  const entries = useMemo(() => entriesText.split(/\n|,/).map((s) => s.trim()).filter(Boolean), [entriesText]);
  const rewardsPool = useMemo(() => rewardsPoolText.split(/\n|,/).map((s) => s.trim()).filter(Boolean), [rewardsPoolText]);
  const size = useMemo(() => toPowerOfTwo(entries.length), [entries.length]);

  function handleCreate() {
    if (!title.trim() || entries.length < 4) return alert("제목과 최소 4개 이상의 식당을 입력해주세요.");
    const t = toTournament({
      id: uuidv4(),
      title: title.trim(),
      description: desc.trim(),
      size,
      entries,
      rewardMode,
      rewardsPool,
      locationTag: locationTag.trim() || undefined,
    });
    onCreate(t);
    // reset form
    setTitle("");
    setDesc("");
    setLocationTag("");
    setRewardMode("random");
    setEntriesText("");
    setRewardsPoolText(DEFAULT_REWARDS.join("\n"));
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>제목과 지역, 설명을 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="제목 (예: 종로구 관철동 맛집 32강)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="지역 태그 (선택)" value={locationTag} onChange={(e) => setLocationTag(e.target.value)} />
          <Textarea placeholder="설명 (선택)" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>참가 식당</CardTitle>
          <CardDescription>한 줄에 하나씩, 또는 콤마로 구분해 입력</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea rows={10} placeholder={"예)\n광화문국밥\n인사동만두\n경복궁비빔밥"} value={entriesText} onChange={(e) => setEntriesText(e.target.value)} />
          <div className="flex items-center justify-between mt-2 text-sm text-slate-600">
            <span>등록: {entries.length}개</span>
            <span>토너먼트 크기: {size}강</span>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>리워드 설정</CardTitle>
          <CardDescription>랜덤 또는 가중(결승/준결승 가산점) 모드 선택</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">모드</label>
            <Select value={rewardMode} onValueChange={(v: RewardMode) => setRewardMode(v)}>
              <SelectTrigger><SelectValue placeholder="리워드 모드" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="random">랜덤</SelectItem>
                <SelectItem value="weighted">가중</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">리워드 풀 (한 줄당 하나)</label>
            <Textarea rows={6} value={rewardsPoolText} onChange={(e) => setRewardsPoolText(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-1" /> 만들기</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function toTournament(base: Omit<Tournament, "rounds" | "currentRoundIndex" | "isFinished" | "winner" | "createdAt">): Tournament {
  const rounds = buildRounds(base.entries);
  // Pre-advance BYE winners for first round
  for (const m of rounds[0]) {
    if (m.a === "(BYE)") m.winner = m.b;
    if (m.b === "(BYE)") m.winner = m.a;
  }
  return {
    ...base,
    size: toPowerOfTwo(base.entries.length),
    rounds,
    currentRoundIndex: 0,
    isFinished: false,
    createdAt: Date.now(),
  };
}

function PlayTournament({ data, onUpdate, onBack }: { data: Tournament; onUpdate: (t: Tournament, finishedReward?: { reward: string; code?: string }) => void; onBack: () => void }) {
  const [t, setT] = useState<Tournament>(data);

  useEffect(() => setT(data), [data.id]);

  useEffect(() => {
    onUpdate(t);
  }, [t.rounds, t.currentRoundIndex, t.isFinished]);

  const currentRound = t.rounds[t.currentRoundIndex];
  const totalRounds = t.rounds.length;
  const progress = Math.round(((t.currentRoundIndex) / (totalRounds - 1)) * 100);

  function pickWinner(match: Match, choice: "a" | "b") {
    if (t.isFinished) return;
    if (!match.a || !match.b) return;
    const winner = choice === "a" ? match.a : match.b;

    setT((prev) => {
      const copy: Tournament = JSON.parse(JSON.stringify(prev));
      const m = copy.rounds[copy.currentRoundIndex].find((mm) => mm.id === match.id)!;
      m.winner = winner;

      // If round completed, advance
      const allDone = copy.rounds[copy.currentRoundIndex].every((mm) => mm.winner);
      if (allDone) {
        if (copy.currentRoundIndex === copy.rounds.length - 1) {
          // Finished!
          copy.isFinished = true;
          copy.winner = copy.rounds[copy.currentRoundIndex][0].winner ?? undefined;
          const reward = resolveReward(copy);
          onUpdate(copy, reward);
          return copy;
        }
        const next = nextRoundFrom(copy.rounds[copy.currentRoundIndex]);
        copy.rounds[copy.currentRoundIndex + 1] = next;
        copy.currentRoundIndex += 1;
      }
      return copy;
    });
  }

  function resolveReward(t: Tournament): { reward: string; code?: string } {
    let reward = t.rewardsPool[Math.floor(Math.random() * t.rewardsPool.length)] ?? "배지: 참가 감사";
    if (t.rewardMode === "weighted") {
      // Simple weighting: deeper rounds add a small chance to upgrade to coupon code
      const chance = 0.35; // 35% chance to give coupon on weighted mode
      if (Math.random() < chance) {
        reward = "쿠폰 지급";
        return { reward, code: generateCoupon() };
      }
    } else {
      // Random mode: smaller chance for coupon
      const chance = 0.15;
      if (Math.random() < chance) return { reward: "쿠폰 지급", code: generateCoupon() };
    }
    return { reward };
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onBack}>목록으로</Button>
        <Badge variant="secondary" className="ml-2">{t.size}강</Badge>
        <Badge variant="secondary">{t.rewardMode === "random" ? "랜덤" : "가중"} 리워드</Badge>
        {t.isFinished ? (
          <Badge className="ml-auto">우승: {t.winner}</Badge>
        ) : (
          <span className="ml-auto text-sm text-slate-600">라운드 {t.currentRoundIndex + 1}/{totalRounds} · 진행률 {progress}%</span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Swords className="w-5 h-5" /> 매치업</CardTitle>
            <CardDescription>선호하는 곳을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            {t.isFinished ? (
              <WinnerPanel winner={t.winner!} />
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {currentRound.map((m) => (
                  <MatchCard key={m.id} match={m} onPick={pickWinner} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Medal className="w-5 h-5" /> 개요</CardTitle>
            <CardDescription>{t.title}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {t.description && <p className="text-slate-700">{t.description}</p>}
            {t.locationTag && (
              <p className="text-slate-600">지역: <Badge variant="outline">{t.locationTag}</Badge></p>
            )}
            <p className="text-slate-600">참가 수: {t.entries.length}개</p>
            <div className="pt-2">
              <p className="font-medium mb-2">라운드 차트</p>
              <div className="flex flex-col gap-2">
                {t.rounds.map((round, idx) => (
                  <div key={idx} className={`grid grid-cols-4 gap-2 ${idx === t.currentRoundIndex ? "opacity-100" : "opacity-70"}`}>
                    {round.map((m) => (
                      <div key={m.id} className="text-xs truncate px-2 py-1 rounded-xl bg-slate-100">
                        {m.a ?? "-"} vs {m.b ?? "-"}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MatchCard({ match, onPick }: { match: Match; onPick: (m: Match, c: "a" | "b") => void }) {
  const disabled = !!match.winner || !match.a || !match.b || match.a === "(BYE)" || match.b === "(BYE)";
  return (
    <motion.div layout initial={{ opacity: 0.7, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`overflow-hidden ${match.winner ? "ring-2 ring-emerald-400" : ""}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Swords className="w-4 h-4" /> {match.a} <span className="text-xs text-slate-400">vs</span> {match.b}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={disabled} onClick={() => onPick(match, "a")}>
            {match.a}
          </Button>
          <Button variant="secondary" disabled={disabled} onClick={() => onPick(match, "b")}>
            {match.b}
          </Button>
        </CardContent>
        {match.winner && (
          <CardFooter className="justify-between text-sm text-emerald-700">
            <span>선택됨: <b>{match.winner}</b></span>
            <Sparkles className="w-4 h-4" />
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}

function WinnerPanel({ winner }: { winner: string }) {
  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-100 border">
      <div className="text-center space-y-2">
        <Medal className="w-8 h-8 mx-auto" />
        <p className="text-2xl font-bold">우승: {winner}</p>
        <p className="text-slate-600">참여해주셔서 감사합니다! 리워드 안내를 확인해주세요.</p>
      </div>
    </div>
  );
}
