import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Coins, Zap, TrendingUp, Gift, Trophy, Target, Rocket,
  RefreshCw, CheckCircle2, Users, Flame, Star, Crown, Sparkles,
  Clock, ChevronRight, Shield, Gamepad2
} from "lucide-react";
import { supabase } from "./app";

const TASKS = [
  { key: "tap_100", title: "Tap Master", description: "Make 100 taps today", reward: 1000, icon: Target, color: "pink" },
  { key: "upgrade_once", title: "Hamster Builder", description: "Purchase an upgrade", reward: 1500, icon: Rocket, color: "blue" },
  { key: "boost_once", title: "Power Up", description: "Activate a boost", reward: 500, icon: Zap, color: "purple" },
];

const fmt = n => Math.floor(Number(n || 0)).toLocaleString("en-US");
const panel = "rounded-[24px] border border-white/[0.07] bg-[#111827]/90 shadow-[0_12px_40px_rgba(0,0,0,.18)]";

export function HamsterGame() {
  const [state, setState] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [comboChoice, setComboChoice] = useState("");
  const [now, setNow] = useState(Date.now());
  const [tapEffect, setTapEffect] = useState(0);
  const [activeTab, setActiveTab] = useState("game");

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc("hamster_get_state");
    if (error) { setMessage(error.message); setMessageError(true); return; }
    setState(data);
    const board = await supabase.rpc("hamster_leaderboard");
    if (!board.error) setLeaderboard(board.data || []);
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [refresh]);

  async function run(action, args = {}) {
    if (busy) return;
    setBusy(action); setMessage(""); setMessageError(false);
    try {
      const { data, error } = await supabase.rpc(action, args);
      if (error) { setMessage(error.message); setMessageError(true); return; }
      if (data?.error) { setMessage(data.error); setMessageError(true); return; }
      setMessage(data?.message || "Successfully completed!");
      setMessageError(false);
      await refresh();
    } catch (err) {
      setMessage(err.message || "Something went wrong."); setMessageError(true);
    } finally {
      setBusy("");
    }
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-[#080D18] flex flex-col items-center justify-center text-white">
        <div className="text-6xl animate-bounce">🐹</div>
        <p className="mt-5 text-sm font-bold tracking-widest text-amber-300">PREPARING YOUR ARENA</p>
        {message && <p className="mt-3 text-sm text-red-300">{message}</p>}
      </div>
    );
  }

  const energyPct = Math.max(0, Math.min(100, state.max_energy ? state.energy / state.max_energy * 100 : 0));
  const dailyReady = !state.last_daily_claim || state.last_daily_claim !== state.today;

  const upgrades = [
    { key: "tap", title: "Multitap", description: "Earn more coins with every tap", detail: `Current power: ${fmt(state.tap_power)}`, cost: state.tap_upgrade_cost, icon: Coins, color: "amber" },
    { key: "energy", title: "Energy limit", description: "Increase your maximum energy", detail: `Current capacity: ${fmt(state.max_energy)}`, cost: state.energy_upgrade_cost, icon: Zap, color: "blue" },
    { key: "profit", title: "Profit per hour", description: "Earn coins automatically", detail: `Current income: ${fmt(state.profit_per_hour)}/h`, cost: state.profit_upgrade_cost, icon: TrendingUp, color: "emerald" },
  ];

  const turboActive = state.turbo_until && new Date(state.turbo_until).getTime() > now;
  const navItems = [ { id: "game", label: "Game", icon: Gamepad2 }, { id: "mine", label: "Mine", icon: Rocket }, { id: "earn", label: "Earn", icon: Gift }, { id: "friends", label: "Friends", icon: Users }, { id: "rank", label: "Ranks", icon: Trophy } ];

  function goTo(id) {
    setActiveTab(id);
    const element = document.getElementById(`hamster-${id}`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function tapHamster() {
    if (busy || state.energy <= 0) return;
    setTapEffect(v => v + 1);
    await run("hamster_tap", { p_count: 10 });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080D18] pb-28 text-white">
      <style>{`
        @keyframes hamsterFloat { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
        @keyframes coinPulse { 0%,100% { box-shadow: 0 0 35px rgba(251,191,36,.16), inset 0 0 25px rgba(255,255,255,.12); } 50% { box-shadow: 0 0 65px rgba(251,191,36,.35), inset 0 0 30px rgba(255,255,255,.2); } }
        @keyframes shine { 0% { transform: translateX(-150%) rotate(25deg); } 100% { transform: translateX(250%) rotate(25deg); } }
        @keyframes pop { 0% { transform: scale(.92); } 50% { transform: scale(1.07); } 100% { transform: scale(1); } }
        .hamster-float { animation: hamsterFloat 3s ease-in-out infinite; }
        .coin-pulse { animation: coinPulse 2.5s ease-in-out infinite; }
        .tap-pop { animation: pop .2s ease-out; }
        .hamster-scroll { scroll-margin-top: 20px; }
      `}</style>

      <div className="mx-auto max-w-xl px-4 pt-5">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
            <ArrowLeft size={18} /> PrimeVest
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-[.16em] text-amber-200">Hamster Arena</span>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[28px] border border-amber-300/20 bg-gradient-to-br from-[#38240E] via-[#1B1D2D] to-[#111A2B] p-5 shadow-[0_20px_65px_rgba(245,158,11,.10)]">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-amber-200/70"><Sparkles size={13} /> Your game balance</div>
              <div className="mt-3 flex items-baseline gap-2">
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{fmt(state.coins)}</h1>
                <span className="text-sm font-black text-amber-300">HC</span>
              </div>
              <p className="mt-2 text-xs text-amber-100/50">Your virtual Hamster Coins</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-300/10 text-amber-300"><Coins size={30} /></div>
          </div>
          <div className="relative mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-400"><TrendingUp size={14} className="text-emerald-300" /> Profit per hour</div>
              <p className="mt-2 text-lg font-black text-emerald-300">+{fmt(state.profit_per_hour)}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-400"><Crown size={14} className="text-amber-300" /> Your league</div>
              <p className="mt-2 text-lg font-black text-amber-200">{state.league || "Bronze"}</p>
            </div>
          </div>
        </section>

        <section className={`${panel} mt-4 p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-300"><Zap size={19} /></div>
              <div><p className="text-sm font-bold">Energy</p><p className="text-[10px] text-slate-500">Power for your taps</p></div>
            </div>
            <p className="text-sm font-black tabular-nums">{fmt(state.energy)} <span className="text-slate-500">/ {fmt(state.max_energy)}</span></p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#263044]">
            <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-lime-300 to-emerald-400 transition-all duration-700" style={{ width: `${energyPct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>Energy regenerates automatically</span><span>{Math.floor(energyPct)}%</span></div>
        </section>

        <section id="hamster-game" className="hamster-scroll relative mt-5 overflow-hidden rounded-[30px] border border-amber-300/10 bg-gradient-to-b from-[#172238] via-[#131B2B] to-[#101725] px-4 pb-6 pt-6 text-center">
          <div className="pointer-events-none absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-400/10 blur-[75px]" />
          <div className="relative">
            <div className="flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <p className="text-[10px] font-black uppercase tracking-[.24em] text-amber-200/70">Tap to earn</p>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            </div>
            <h2 className="mt-2 text-xl font-black">Your hamster is ready!</h2>
            <p className="mt-1 text-xs text-slate-400">Tap the hamster and collect your coins</p>
            <button type="button" disabled={!!busy || state.energy <= 0} onClick={tapHamster}
              className="coin-pulse group relative mx-auto my-7 flex h-60 w-60 select-none items-center justify-center rounded-full border-[10px] border-amber-200/20 bg-[radial-gradient(circle_at_35%_25%,#FFE9A6,#F6B83D_45%,#B85A18_100%)] text-[112px] shadow-[inset_0_0_35px_rgba(255,255,255,.22)] transition duration-150 hover:brightness-110 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-64 sm:w-64">
              <span className="pointer-events-none absolute inset-3 overflow-hidden rounded-full"><span className="absolute -left-1/2 top-0 h-full w-1/3 bg-white/20 blur-md" style={{ animation: "shine 4s linear infinite" }} /></span>
              <span key={tapEffect} className="hamster-float relative drop-shadow-[0_12px_10px_rgba(91,43,5,.3)]">🐹</span>
              <span className="absolute bottom-5 right-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-amber-950 shadow-lg"><Coins size={21} /></span>
            </button>
            <div className="flex items-center justify-center gap-2">
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-black text-amber-200">+{fmt(state.tap_power)} HC / tap</span>
              {turboActive && <span className="rounded-full border border-purple-300/30 bg-purple-400/10 px-3 py-2 text-xs font-black text-purple-200"><Flame size={13} className="mr-1 inline" /> TURBO</span>}
            </div>
            <p className="mt-3 text-[10px] text-slate-500">Each press submits up to 10 taps. Energy is required.</p>
            {state.energy <= 0 && <p className="mt-3 text-xs font-bold text-red-300">You're out of energy. Use a refill boost!</p>}
          </div>
        </section>

        <nav className="sticky top-2 z-20 mt-5 grid grid-cols-5 gap-1 rounded-2xl border border-white/10 bg-[#101827]/95 p-2 shadow-xl backdrop-blur-xl">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => goTo(item.id)} className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-bold transition ${activeTab === item.id ? "bg-amber-400/15 text-amber-300" : "text-slate-500 hover:bg-white/5 hover:text-white"}`}>
                <Icon size={18} />{item.label}
              </button>
            );
          })}
        </nav>

        <section id="hamster-mine" className="hamster-scroll mt-7">
          <div className="mb-4 flex items-end justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-blue-300">Build your empire</p><h2 className="mt-1 text-xl font-black">Upgrade your hamster</h2></div>
            <Rocket className="text-blue-300" size={23} />
          </div>
          <div className="space-y-3">
            {upgrades.map(u => {
              const Icon = u.icon;
              return (
                <div key={u.key} className={`${panel} flex items-center gap-3 p-4`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-300"><Icon size={23} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{u.title}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{u.description}</p>
                    <p className="mt-1 text-[10px] text-slate-500">{u.detail}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs font-black text-amber-300"><Coins size={12} /> {fmt(u.cost)} HC</p>
                  </div>
                  <button disabled={!!busy} onClick={() => run("hamster_upgrade", { p_kind: u.key })} className="shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-xs font-black shadow-lg shadow-blue-950/40 transition hover:brightness-110 disabled:opacity-40">BUY</button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4 flex items-center justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-purple-300">Get stronger</p><h2 className="mt-1 text-xl font-black">Power boosts</h2></div>
            <Flame className="text-purple-300" size={23} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button disabled={!!busy} onClick={() => run("hamster_boost", { p_kind: "refill" })} className="rounded-[22px] border border-yellow-300/15 bg-gradient-to-br from-yellow-400/10 to-orange-500/[0.04] p-4 text-left transition hover:border-yellow-300/30 disabled:opacity-40">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300"><RefreshCw size={23} /></div>
              <p className="font-black">Energy refill</p><p className="mt-1 text-[10px] leading-relaxed text-slate-400">Restore your energy</p><p className="mt-3 text-xs font-black text-yellow-300">2,000 HC</p>
            </button>
            <button disabled={!!busy} onClick={() => run("hamster_boost", { p_kind: "turbo" })} className="rounded-[22px] border border-purple-300/15 bg-gradient-to-br from-purple-400/10 to-pink-500/[0.04] p-4 text-left transition hover:border-purple-300/30 disabled:opacity-40">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-400/10 text-purple-300"><Flame size={23} /></div>
              <p className="font-black">Turbo mode</p><p className="mt-1 text-[10px] leading-relaxed text-slate-400">Double tap power for 60 seconds</p><p className="mt-3 text-xs font-black text-purple-300">3,000 HC</p>
            </button>
          </div>
          {turboActive && <div className="mt-3 flex items-center gap-2 rounded-xl border border-purple-300/20 bg-purple-400/10 p-3 text-xs font-bold text-purple-200"><Flame size={16} /> Turbo active until {new Date(state.turbo_until).toLocaleTimeString()}.</div>}
        </section>

        <section id="hamster-earn" className="hamster-scroll mt-7 overflow-hidden rounded-[25px] border border-emerald-300/15 bg-gradient-to-br from-[#103C32] to-[#101D2A] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300"><Gift size={23} /></div>
              <div><h2 className="font-black">Daily reward</h2><p className="text-[10px] text-emerald-100/50">Come back every day</p></div>
            </div>
            <div className="rounded-xl bg-black/20 px-3 py-2 text-right"><p className="text-[9px] uppercase text-emerald-100/50">Your streak</p><p className="font-black text-emerald-200"><Flame size={13} className="mr-1 inline" />{state.daily_streak || 0} days</p></div>
          </div>
          <p className="my-4 text-sm text-emerald-50/80">Claim your daily coins and keep your streak alive.</p>
          <button disabled={!dailyReady || !!busy} onClick={() => run("hamster_claim_daily")} className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-black text-[#05251C] shadow-lg shadow-emerald-950/40 transition hover:brightness-110 disabled:opacity-40">
            {dailyReady ? "CLAIM DAILY REWARD" : "✓ ALREADY CLAIMED TODAY"}
          </button>
        </section>

        <section className="mt-7">
          <div className="mb-4"><p className="text-[10px] font-black uppercase tracking-[.2em] text-pink-300">Complete & collect</p><h2 className="mt-1 text-xl font-black">Daily missions</h2></div>
          <div className="space-y-3">
            {TASKS.map(t => {
              const Icon = t.icon;
              const progress = state.tasks?.[t.key] || {};
              const done = !!progress.claimed;
              const ready = !!progress.ready;
              return (
                <div key={t.key} className={`${panel} flex items-center gap-3 p-4`}>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-400/10 text-pink-300"><Icon size={21} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{t.title}</p><p className="mt-1 text-[10px] text-slate-400">{t.description}</p><p className="mt-2 text-xs font-black text-amber-300">+{fmt(t.reward)} HC</p>
                  </div>
                  <button disabled={!ready || done || !!busy} onClick={() => run("hamster_claim_task", { p_task: t.key })} className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-black ${done ? "bg-emerald-400/10 text-emerald-300" : ready ? "bg-pink-600 text-white" : "bg-white/[0.06] text-slate-500"}`}>
                    {done ? "CLAIMED" : ready ? "CLAIM" : "LOCKED"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-7 rounded-[25px] border border-indigo-300/15 bg-gradient-to-br from-[#252052] to-[#121A31] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-300/10 text-indigo-300"><Star size={23} /></div>
            <div><h2 className="font-black">Daily combo</h2><p className="text-[10px] text-indigo-200/50">One attempt every day</p></div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/20 p-4 text-center">
            <p className="text-[10px] uppercase tracking-[.2em] text-indigo-200/60">Today's challenge</p>
            <p className="mt-2 text-3xl font-black tracking-[.5em] text-indigo-100">? ? ?</p>
            <p className="mt-2 text-xs text-slate-400">Enter the three-digit combination to try for 5,000 HC.</p>
          </div>
          <div className="mt-4 flex gap-2">
            <input inputMode="numeric" maxLength={3} value={comboChoice} disabled={!!state.combo_claimed || !!busy} onChange={e => setComboChoice(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="000" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0B1020] px-4 py-3 text-center text-xl font-black tracking-[.4em] outline-none focus:border-indigo-400" />
            <button disabled={comboChoice.length !== 3 || !!busy || !!state.combo_claimed} onClick={async () => { await run("hamster_claim_combo", { p_code: comboChoice }); setComboChoice(""); }} className="rounded-xl bg-indigo-600 px-5 text-sm font-black transition hover:bg-indigo-500 disabled:opacity-40">{state.combo_claimed ? "DONE" : "TRY"}</button>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-indigo-100/40">The combo is checked securely by the game server. A wrong attempt may use today's try.</p>
        </section>

        <section id="hamster-rank" className="hamster-scroll mt-7">
          <div className="mb-4 flex items-center justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-amber-300">Top players</p><h2 className="mt-1 text-xl font-black">Leaderboard</h2></div>
            <Trophy className="text-amber-300" size={25} />
          </div>
          <div className={`${panel} overflow-hidden p-2`}>
            {leaderboard.length ? leaderboard.map((p, i) => (
              <div key={p.user_id || i} className="flex items-center gap-3 rounded-xl px-3 py-3 even:bg-white/[0.025]">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ${i === 0 ? "bg-amber-300/15 text-amber-300" : i === 1 ? "bg-slate-300/10 text-slate-300" : i === 2 ? "bg-orange-400/10 text-orange-300" : "bg-white/5 text-slate-500"}`}>{i + 1}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{p.username || "Player"}</p><p className="text-[10px] text-slate-500">{i === 0 ? "Arena champion" : "Arena player"}</p></div>
                <p className="text-sm font-black text-amber-200">{fmt(p.coins)} <span className="text-[10px] text-amber-300/60">HC</span></p>
              </div>
            )) : (<p className="p-6 text-center text-sm text-slate-500">Be the first to appear on the leaderboard.</p>)}
          </div>
        </section>

        <section id="hamster-friends" className="hamster-scroll mt-7 overflow-hidden rounded-[25px] border border-blue-300/15 bg-gradient-to-br from-[#142D4A] to-[#101A2B] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-300/10 text-blue-300"><Users size={23} /></div>
            <div><h2 className="font-black">Invite your friends</h2><p className="text-[10px] text-blue-100/50">Grow your PrimeVest community</p></div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">Invite friends using your existing PrimeVest referral system. Your referral cash rewards remain separate from Hamster Coins.</p>
          <Link to="/home" className="mt-4 flex items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-sm font-black transition hover:bg-blue-500">Open referral section <ChevronRight size={18} /></Link>
        </section>

        {message && (
          <div role="status" className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm ${messageError ? "border-red-400/20 bg-red-400/10 text-red-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>
            {messageError ? <Shield size={18} /> : <CheckCircle2 size={18} />}<p>{message}</p>
          </div>
        )}

        {busy && <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-300"><span className="h-2 w-2 animate-ping rounded-full bg-amber-300" />Processing your action...</div>}

        <p className="mt-8 px-4 text-center text-[10px] leading-relaxed text-slate-600">Hamster Coins are virtual game points only. They are not cash and cannot be withdrawn or exchanged for PrimeVest wallet funds.</p>
      </div>
    </main>
  );
}