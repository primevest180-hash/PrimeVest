import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Coins, Zap, TrendingUp, Gift, Trophy, Target, Rocket,
  CheckCircle2, Users, Flame, Crown, Sparkles, Clock, ChevronRight, Shield, Gamepad2, Wallet, X, Terminal
} from "lucide-react";
import { supabase, api } from "./app";

const fmt = n => Math.floor(Number(n || 0)).toLocaleString("en-US");
const panel = "rounded-[24px] border border-white/[0.07] bg-[#111827]/90 shadow-[0_12px_40px_rgba(0,0,0,.18)]";

const WALLET_ICONS = {
  Bronze: "🟤",
  Silver: "⚪",
  Gold: "🟡",
  Platinum: "🩵",
  Diamond: "💎",
  Sapphire: "🟣"
};

export function HamsterGame() {
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [tapEffect, setTapEffect] = useState(0);
  const [activeTab, setActiveTab] = useState("game");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

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
      setMessage(data?.message || "Success!");
      setMessageError(false);
      await refresh();
    } catch (err) {
      setMessage(err.message || "Something went wrong."); setMessageError(true);
    } finally {
      setBusy("");
    }
  }

  async function buyWithPaystack(item, price) {
    // Redirects to our internal checkout page which handles the Paystack logic
    navigate(`/hamster/checkout?item=${item}&price=${price}`);
  }

  async function handleWithdraw(amount, cash) {
    if (!confirm(`Convert ${fmt(amount)} HC to ₦${fmt(cash)}?`)) return;
    setShowWithdrawModal(false);
    await run("hamster_withdraw", { p_amount: amount, p_cash: cash });
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

  const isLocked = state.lockout_until && new Date(state.lockout_until).getTime() > now;
  const lockoutTime = isLocked ? new Date(new Date(state.lockout_until).getTime() - now).toISOString().substr(11, 8) : null;
  const energyPct = Math.max(0, Math.min(100, state.max_energy ? state.energy / state.max_energy * 100 : 0));
  const dailyReady = !state.last_daily_claim || state.last_daily_claim !== state.today;
  const turboActive = state.turbo_until && new Date(state.turbo_until).getTime() > now;

  const upgrades = [
    { key: "tap", title: "Multitap", description: "Increases HC per tap", detail: `Power: ${state.tap_power.toFixed(1)} HC`, cost: state.tap_cost, paystack: 450, icon: Coins },
    { key: "energy", title: "Energy limit", description: "Max energy to 2,000", detail: `Capacity: ${fmt(state.max_energy)}`, cost: state.energy_cost, paystack: 1000, icon: Zap },
    { key: "profit", title: "Profit per hour", description: "Offline earnings", detail: `Income: ${fmt(state.profit_per_hour)}/h`, cost: state.profit_cost, paystack: 2750, icon: TrendingUp },
  ];

  const navItems = [ { id: "game", label: "Game", icon: Gamepad2 }, { id: "mine", label: "Mine", icon: Rocket }, { id: "earn", label: "Earn", icon: Gift }, { id: "rank", label: "Ranks", icon: Trophy } ];

  function goTo(id) {
    setActiveTab(id);
    document.getElementById(`hamster-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function tapHamster() {
    if (busy || isLocked || state.energy <= 0) return;
    setTapEffect(v => v + 1);
    await run("hamster_tap", { p_count: 5 });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080D18] pb-28 text-white">
      <style>{`
        @keyframes hamsterFloat { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
        @keyframes coinPulse { 0%,100% { box-shadow: 0 0 35px rgba(251,191,36,.16), inset 0 0 25px rgba(255,255,255,.12); } 50% { box-shadow: 0 0 65px rgba(251,191,36,.35), inset 0 0 30px rgba(255,255,255,.2); } }
        .hamster-float { animation: hamsterFloat 3s ease-in-out infinite; }
        .coin-pulse { animation: coinPulse 2.5s ease-in-out infinite; }
        .hamster-scroll { scroll-margin-top: 20px; }
      `}</style>

      <div className="mx-auto max-w-xl px-4 pt-5">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
            <ArrowLeft size={18} /> PrimeVest
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[10px] font-black uppercase text-amber-200">Wallet Game</span>
          </div>
        </header>

        {/* Balance */}
        <section className="relative overflow-hidden rounded-[28px] border border-amber-300/20 bg-gradient-to-br from-[#38240E] via-[#1B1D2D] to-[#111A2B] p-5">
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-200/70"><Sparkles size={13} /> Game Balance</div>
              <div className="mt-3 flex items-baseline gap-2">
                <h1 className="text-4xl font-black">{fmt(state.coins)}</h1>
                <span className="text-sm font-black text-amber-300">HC</span>
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300/10 text-3xl">
              {WALLET_ICONS[state.league] || "🟤"}
            </div>
          </div>
          <div className="relative mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/20 p-3">
              <div className="text-xs text-slate-400">Profit per hour</div>
              <p className="mt-1 text-lg font-black text-emerald-300">+{fmt(state.profit_per_hour)}</p>
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
              <div className="text-xs text-slate-400">League</div>
              <p className="mt-1 text-lg font-black text-amber-200">{state.league}</p>
            </div>
          </div>
        </section>

        {/* Energy */}
        <section className={`${panel} mt-4 p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={19} className="text-yellow-300" />
              <p className="text-sm font-bold">Energy</p>
            </div>
            <p className="text-sm font-black">{fmt(state.energy)} / {fmt(state.max_energy)}</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#263044]">
            <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-emerald-400" style={{ width: `${energyPct}%` }} />
          </div>
          {isLocked && (
            <p className="mt-3 text-center text-xs font-bold text-red-400">
              Game locked! Energy refills in {lockoutTime}
            </p>
          )}
        </section>

        {/* Tap Area */}
        <section id="hamster-game" className="hamster-scroll relative mt-5 overflow-hidden rounded-[30px] border border-amber-300/10 bg-[#172238] px-4 pb-6 pt-6 text-center">
          <h2 className="mt-2 text-xl font-black">Tap to earn</h2>
          <button type="button" disabled={!!busy || isLocked || state.energy <= 0} onClick={tapHamster}
            className="coin-pulse relative mx-auto my-7 flex h-60 w-60 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_25%,#FFE9A6,#F6B83D_45%,#B85A18_100%)] text-[112px] active:scale-90 disabled:opacity-50">
            <span key={tapEffect} className="hamster-float drop-shadow-lg">🐹</span>
          </button>
          <div className="flex justify-center gap-2">
            <span className="rounded-full bg-amber-300/10 px-4 py-2 text-sm font-black text-amber-200">+{state.tap_power.toFixed(1)} HC / tap</span>
            {turboActive && <span className="rounded-full bg-purple-400/10 px-3 py-2 text-xs font-black text-purple-200"><Flame size={13} className="inline" /> TURBO</span>}
          </div>
        </section>

        <nav className="sticky top-2 z-20 mt-5 grid grid-cols-4 gap-1 rounded-2xl bg-[#101827]/95 p-2 shadow-xl">
          {navItems.map(item => (
            <button key={item.id} onClick={() => goTo(item.id)} className={`flex flex-col items-center rounded-xl py-2 text-[10px] font-bold ${activeTab === item.id ? "bg-amber-400/15 text-amber-300" : "text-slate-500"}`}>
              <item.icon size={18} />{item.label}
            </button>
          ))}
        </nav>

        {/* Upgrades */}
        <section id="hamster-mine" className="hamster-scroll mt-7">
          <h2 className="mb-4 text-xl font-black">Upgrade your hamster</h2>
          <div className="space-y-3">
            {upgrades.map(u => (
              <div key={u.key} className={`${panel} flex items-center gap-3 p-4`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-300"><u.icon size={23} /></div>
                <div className="flex-1">
                  <p className="font-bold">{u.title}</p>
                  <p className="text-[11px] text-slate-400">{u.description}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{u.detail}</p>
                  <p className="mt-2 text-xs font-black text-amber-300">{fmt(u.cost)} HC</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => run("hamster_upgrade", { p_kind: u.key })} disabled={!!busy} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-black">BUY HC</button>
                  <button onClick={() => buyWithPaystack(u.key, u.paystack)} className="rounded-lg border border-white/20 px-4 py-1.5 text-[10px] font-black">PAY ₦{u.paystack}</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Boosts */}
        <section className="mt-7">
          <h2 className="mb-4 text-xl font-black">Power boosts</h2>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => buyWithPaystack('energy', 1000)} className="rounded-[22px] border border-yellow-300/15 bg-yellow-400/5 p-4 text-left">
              <Zap size={23} className="text-yellow-300 mb-2" />
              <p className="font-black">Energy refill</p>
              <p className="text-[10px] text-slate-400">700 Energy</p>
              <p className="mt-2 text-xs font-black text-yellow-300">₦1,000</p>
            </button>
            <button onClick={() => buyWithPaystack('turbo', 2500)} className="rounded-[22px] border border-purple-300/15 bg-purple-400/5 p-4 text-left">
              <Flame size={23} className="text-purple-300 mb-2" />
              <p className="font-black">Turbo mode</p>
              <p className="text-[10px] text-slate-400">1,250 Energy + 2x</p>
              <p className="mt-2 text-xs font-black text-purple-300">₦2,500</p>
            </button>
          </div>
        </section>

        {/* Wallet Hack */}
        <section className="mt-7 rounded-[25px] border-2 border-emerald-500/40 bg-[#0A1A12] p-5 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="relative">
            <div className="flex items-center gap-3">
              <Terminal size={24} className="text-emerald-400" />
              <div>
                <h2 className="font-black text-emerald-400 uppercase tracking-widest text-sm">Wallet Hack</h2>
                <p className="text-[10px] text-emerald-200/50">Bypass the system.</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-emerald-100/80 leading-relaxed">
              Buy the wallet hack which will grant you <strong className="text-white">30,000 HC + VIP 1 + Faster Taps + Energy Boost to 5,000.</strong>
            </p>
            {state.has_hack ? (
              <div className="mt-4 w-full rounded-xl bg-emerald-500/20 py-3 text-center text-sm font-black text-emerald-300 border border-emerald-500/30">
                HACK ACTIVATED
              </div>
            ) : (
              <button onClick={() => buyWithPaystack('hack', 15500)} className="mt-4 w-full rounded-xl bg-gradient-to-r from-red-600 to-emerald-600 py-3 text-sm font-black text-white hover:brightness-110">
                BUY FOR ₦15,500
              </button>
            )}
          </div>
        </section>

        {/* Daily Bonus */}
        <section id="hamster-earn" className="hamster-scroll mt-7 rounded-[25px] border border-emerald-300/15 bg-[#103C32] p-5">
          <div className="flex items-center gap-3">
            <Gift size={23} className="text-emerald-300" />
            <div><h2 className="font-black">Daily Login Bonus</h2><p className="text-[10px] text-emerald-100/50">Come back every day</p></div>
          </div>
          <button disabled={!dailyReady || !!busy} onClick={() => run("hamster_claim_daily")} className="mt-4 w-full rounded-xl bg-emerald-500 py-3 text-sm font-black text-[#05251C] disabled:opacity-40">
            {dailyReady ? "CLAIM 500 HC" : "✓ CLAIMED TODAY"}
          </button>
        </section>

        {/* Withdrawal Tiers */}
        <section className="mt-7 rounded-[25px] border border-indigo-300/15 bg-[#1A1D31] p-5">
          <div className="flex items-center gap-3">
            <Wallet size={23} className="text-indigo-300" />
            <div><h2 className="font-black">Withdraw Cash</h2><p className="text-[10px] text-indigo-200/50">Convert your HC</p></div>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: "Bronze", hc: 49999, cash: 2000 },
              { label: "Silver", hc: 249999, cash: 5000 },
              { label: "Gold", hc: 999999, cash: 8000 },
              { label: "Platinum", hc: 4999999, cash: 18000 },
              { label: "Diamond", hc: 9999999, cash: 25000 },
            ].map(tier => (
              <div key={tier.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0B1020] p-3">
                <div>
                  <p className="text-sm font-bold text-white">{tier.label}</p>
                  <p className="text-[10px] text-slate-400">{fmt(tier.hc)} HC</p>
                </div>
                <button onClick={() => handleWithdraw(tier.hc, tier.cash)} disabled={state.coins < tier.hc || !!busy} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold disabled:opacity-50">
                  ₦{fmt(tier.cash)}
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl border border-purple-500/30 bg-purple-900/20 p-3">
              <div>
                <p className="text-sm font-bold text-purple-300">Sapphire</p>
                <p className="text-[10px] text-purple-200/50">10,000,000+ HC</p>
              </div>
              <button onClick={() => handleWithdraw(10000000, 30000)} disabled={state.coins < 10000000 || !!busy} className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold disabled:opacity-50">
                VIP 3 + ₦30k
              </button>
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section id="hamster-rank" className="hamster-scroll mt-7">
          <h2 className="mb-4 text-xl font-black flex items-center gap-2"><Trophy size={20} /> Leaderboard</h2>
          <div className={`${panel} p-2`}>
            {leaderboard.length ? leaderboard.map((p, i) => (
              <div key={p.user_id || i} className="flex items-center gap-3 rounded-xl px-3 py-3 border-b border-white/5 last:border-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300/15 font-black text-amber-300">{i + 1}</div>
                <p className="flex-1 truncate text-sm font-bold">{p.username || "Player"}</p>
                <p className="text-sm font-black text-amber-200">{fmt(p.coins)} HC</p>
              </div>
            )) : (<p className="p-6 text-center text-sm text-slate-500">No players yet.</p>)}
          </div>
        </section>

        {message && (
          <div role="status" className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm ${messageError ? "border-red-400/20 bg-red-400/10 text-red-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>
            {messageError ? <Shield size={18} /> : <CheckCircle2 size={18} />}<p>{message}</p>
          </div>
        )}
      </div>
    </main>
  );
}