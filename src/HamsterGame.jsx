import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Coins, Zap, TrendingUp, Gift, Trophy, Target, Rocket,
  RefreshCw, CheckCircle2, Lock, Users, Flame, Star
} from "lucide-react";
import { supabase } from "./app";

const TASKS = [
  { key: "tap_100", title: "Tap 100 times", description: "Make 100 taps today", reward: 1000, icon: Target },
  { key: "upgrade_once", title: "Improve your hamster", description: "Buy one upgrade today", reward: 1500, icon: Rocket },
  { key: "boost_once", title: "Use a boost", description: "Use an energy or turbo boost", reward: 500, icon: Zap },
];

const fmt = n => Math.floor(Number(n || 0)).toLocaleString("en-US");

export function HamsterGame() {
  const [state, setState] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [comboChoice, setComboChoice] = useState("");
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc("hamster_get_state");
    if (error) { setMessage(error.message); return; }
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
    setBusy(action);
    setMessage("");
    const { data, error } = await supabase.rpc(action, args);
    setBusy("");
    if (error) { setMessage(error.message); return; }
    if (data?.error) { setMessage(data.error); return; }
    setMessage(data?.message || "Done!");
    await refresh();
  }

  if (!state) {
    return <div className="min-h-screen bg-slate-950 p-8 text-center text-white">
      <p>Loading your game...</p>
      {message && <p className="mt-3 text-sm text-red-300">{message}</p>}
    </div>;
  }

  const energyPct = Math.max(0, Math.min(100, state.max_energy ? state.energy / state.max_energy * 100 : 0));
  const dailyReady = !state.last_daily_claim || state.last_daily_claim !== state.today;
  const upgrades = [
    { key: "tap", title: "Tap power", detail: `+1 coin per tap · Current ${fmt(state.tap_power)}`, cost: state.tap_upgrade_cost },
    { key: "energy", title: "Energy capacity", detail: `+500 max energy · Current ${fmt(state.max_energy)}`, cost: state.energy_upgrade_cost },
    { key: "profit", title: "Hourly profit", detail: `+100 coins/hour · Current ${fmt(state.profit_per_hour)}/h`, cost: state.profit_upgrade_cost },
  ];

  return (
    <main className="min-h-screen bg-[#080D1B] px-4 pb-28 pt-5 text-white">
      <div className="mx-auto max-w-xl">
        <header className="mb-5 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 text-sm text-slate-300"><ArrowLeft size={18}/> PrimeVest</Link>
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-300">Hamster Arena</span>
        </header>

        <section className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#30200C] via-[#17172B] to-[#10172B] p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div><p className="text-xs uppercase tracking-widest text-amber-200/70">Your game balance</p>
              <h1 className="mt-1 text-3xl font-black">{fmt(state.coins)} <span className="text-sm font-semibold text-amber-300">HC</span></h1></div>
            <div className="rounded-2xl bg-amber-300/10 p-3 text-amber-300"><Coins size={28}/></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-black/20 p-3"><p className="text-xs text-slate-400">Profit per hour</p><p className="mt-1 font-bold text-emerald-300">+{fmt(state.profit_per_hour)}</p></div>
            <div className="rounded-xl bg-black/20 p-3"><p className="text-xs text-slate-400">League</p><p className="mt-1 font-bold text-amber-200">{state.league || "Bronze"}</p></div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-white/10 bg-[#111A2D] p-4">
          <div className="mb-2 flex justify-between text-sm"><span className="flex items-center gap-2"><Zap size={16} className="text-yellow-300"/> Energy</span><b>{fmt(state.energy)} / {fmt(state.max_energy)}</b></div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-emerald-400" style={{ width: `${energyPct}%` }}/></div>
          <p className="mt-2 text-xs text-slate-500">Energy regenerates automatically while you are away.</p>
        </section>

        <section className="mt-5 flex flex-col items-center rounded-3xl border border-blue-400/10 bg-[#10192B] p-5">
          <p className="text-sm text-slate-300">Tap the hamster to earn coins</p>
          <button disabled={busy === "hamster_tap" || state.energy <= 0} onClick={() => run("hamster_tap", { p_count: 10 })}
            className="my-5 flex h-56 w-56 select-none items-center justify-center rounded-full border-8 border-amber-300/20 bg-gradient-to-br from-amber-200 via-amber-500 to-orange-700 text-8xl shadow-[0_0_55px_rgba(245,158,11,.22)] transition active:scale-95 disabled:opacity-40"
            aria-label="Tap hamster to earn coins">🐹</button>
          <p className="font-bold text-amber-200">+{fmt(state.tap_power)} coins per tap</p>
          <p className="mt-1 text-xs text-slate-500">Each tap batch uses up to 10 energy.</p>
        </section>

        <section className="mt-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Rocket size={19} className="text-blue-300"/> Upgrades</h2>
          <div className="space-y-3">
            {upgrades.map(u => <div key={u.key} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111A2D] p-4">
              <div><p className="font-semibold">{u.title}</p><p className="mt-1 text-xs text-slate-400">{u.detail}</p><p className="mt-2 text-xs text-amber-300">{fmt(u.cost)} HC</p></div>
              <button disabled={!!busy} onClick={() => run("hamster_upgrade", { p_kind: u.key })} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold disabled:opacity-40">Buy</button>
            </div>)}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Zap size={19} className="text-yellow-300"/> Boosts</h2>
          <div className="grid grid-cols-2 gap-3">
            <button disabled={!!busy} onClick={() => run("hamster_boost", { p_kind: "refill" })} className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-left disabled:opacity-40">
              <RefreshCw className="mb-2 text-yellow-300"/><b className="block">Energy refill</b><span className="text-xs text-slate-400">Restore your energy · 2,000 HC</span>
            </button>
            <button disabled={!!busy} onClick={() => run("hamster_boost", { p_kind: "turbo" })} className="rounded-2xl border border-purple-400/20 bg-purple-400/10 p-4 text-left disabled:opacity-40">
              <Flame className="mb-2 text-purple-300"/><b className="block">Turbo mode</b><span className="text-xs text-slate-400">Double tap power for 60 seconds · 3,000 HC</span>
            </button>
          </div>
          {state.turbo_until && new Date(state.turbo_until).getTime() > now && <p className="mt-2 text-xs text-purple-300">Turbo active until {new Date(state.turbo_until).toLocaleTimeString()}.</p>}
        </section>

        <section className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
          <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold"><Gift size={18} className="text-emerald-300"/> Daily reward</h2><span className="text-xs text-slate-400">Streak: {state.daily_streak || 0} days</span></div>
          <p className="my-2 text-sm text-slate-300">Claim your daily game coins and build your streak.</p>
          <button disabled={!dailyReady || !!busy} onClick={() => run("hamster_claim_daily")} className="w-full rounded-xl bg-emerald-600 py-3 font-bold disabled:opacity-40">{dailyReady ? "Claim daily reward" : "Already claimed today"}</button>
        </section>

        <section className="mt-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Target size={19} className="text-pink-300"/> Daily missions</h2>
          <div className="space-y-3">
            {TASKS.map(t => {
              const Icon = t.icon;
              const progress = state.tasks?.[t.key] || {};
              const done = !!progress.claimed;
              const ready = !!progress.ready;
              return <div key={t.key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111A2D] p-4">
                <Icon className="shrink-0 text-pink-300"/>
                <div className="min-w-0 flex-1"><p className="font-semibold">{t.title}</p><p className="text-xs text-slate-400">{t.description} · {fmt(t.reward)} HC</p></div>
                <button disabled={!ready || done || !!busy} onClick={() => run("hamster_claim_task", { p_task: t.key })} className="rounded-lg bg-pink-600 px-3 py-2 text-xs font-bold disabled:opacity-40">{done ? "Claimed" : ready ? "Claim" : "In progress"}</button>
              </div>;
            })}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-indigo-400/20 bg-indigo-400/5 p-4">
          <h2 className="flex items-center gap-2 font-bold"><Star size={18} className="text-indigo-300"/> Daily combo</h2>
          <p className="mt-2 text-sm text-slate-300">Choose the daily three-digit combo to win 5,000 HC. One attempt per day.</p>
          <div className="mt-3 flex gap-2"><input inputMode="numeric" maxLength={3} value={comboChoice} onChange={e => setComboChoice(e.target.value.replace(/\D/g, "").slice(0,3))} placeholder="000" className="min-w-0 flex-1 rounded-xl bg-slate-950 px-4 py-3 text-center text-xl tracking-[.4em] outline-none"/><button disabled={comboChoice.length !== 3 || !!busy || state.combo_claimed} onClick={() => run("hamster_claim_combo", { p_code: comboChoice })} className="rounded-xl bg-indigo-600 px-4 font-bold disabled:opacity-40">{state.combo_claimed ? "Done" : "Try"}</button></div>
          <p className="mt-2 text-xs text-slate-500">The combo changes daily. A wrong attempt uses today's try.</p>
        </section>

        <section className="mt-5 rounded-2xl border border-white/10 bg-[#111A2D] p-4">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><Trophy size={18} className="text-amber-300"/> Leaderboard</h2>
          {leaderboard.length ? leaderboard.map((p, i) => <div key={p.user_id || i} className="flex justify-between border-b border-white/5 py-2 text-sm last:border-0"><span>{i + 1}. {p.username || "Player"}</span><b className="text-amber-200">{fmt(p.coins)} HC</b></div>) : <p className="text-sm text-slate-500">Be the first to appear on the leaderboard.</p>}
        </section>

        <section className="mt-5 rounded-2xl border border-blue-400/10 bg-[#111A2D] p-4">
          <h2 className="flex items-center gap-2 font-bold"><Users size={18} className="text-blue-300"/> Invite friends</h2>
          <p className="mt-2 text-sm text-slate-300">Share your existing PrimeVest referral link to invite friends. Referral cash rewards remain managed by PrimeVest's existing referral system.</p>
          <Link to="/home" className="mt-3 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold">Open referral section</Link>
        </section>

        {message && <p role="status" className="mt-4 rounded-xl border border-white/10 bg-slate-900 p-3 text-sm text-emerald-200">{message}</p>}
        <p className="mt-5 text-center text-xs text-slate-600">Game coins are virtual points only. They are not cash and cannot be withdrawn or exchanged for wallet funds.</p>
      </div>
    </main>
  );
}
