import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, CreditCard, Bitcoin, Wallet, Check, Copy, LockKeyhole,
  Loader2, CheckCircle2, Crown, ArrowRight, TrendingUp, Timer, Rocket, Zap,
  HelpCircle, LogOut, User, Gamepad2, ArrowUpFromLine, Clock, Gift,
  MessageSquare, UserPlus, Send, Clock3, Menu, ShieldCheck, Eye, EyeOff, Upload, UserRound, Lock
} from "lucide-react";
import { api, supabase } from "./app";

export const Toast = ({ message, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] rounded-2xl border border-emerald-500/30 bg-[#0D1526] px-6 py-4 shadow-2xl flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
      </div>
      <p className="text-sm font-semibold text-white">{message}</p>
    </div>
  );
};

/* =========================== LOGIN / SIGNUP =========================== */
export function Login() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    const { error } = await api.login(form.email.trim(), form.password);
    setLoading(false);
    if (error) return setError(error.message || "Incorrect email or password.");
    navigate("/home");
  }

  async function handleForgotPassword() {
    if (!form.email) return alert("Please type your email address first, then click Forgot Password.");
    const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
      redirectTo: `${window.location.origin}/settings`,
    });
    if (error) alert(error.message);
    else alert("Password reset link sent to your email!");
  }

  async function signInWith(provider) {
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/home` } });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 p-10 lg:flex">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck size={27} />
            </div>
            <span className="text-2xl font-bold">Prime<span className="text-blue-200">Vest</span></span>
          </Link>
          <div className="mt-24">
            <TrendingUp size={30} />
            <h1 className="mt-3 text-4xl font-bold">Welcome back.</h1>
          </div>
        </section>
        <section className="p-6 sm:p-10 lg:p-12">
          <p className="text-sm text-blue-400">WELCOME BACK</p>
          <h2 className="mt-2 text-3xl font-bold">Log in</h2>
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Email</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4">
                <User className="text-slate-500" size={19} />
                <input type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="flex-1 bg-transparent py-3.5 text-sm outline-none" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Password</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4">
                <LockKeyhole className="text-slate-500" size={19} />
                <input type={show ? "text" : "password"} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="flex-1 bg-transparent py-3.5 text-sm outline-none" placeholder="Your password" />
                <button type="button" onClick={() => setShow(!show)}>
                  {show ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-end">
              <button type="button" onClick={handleForgotPassword} className="text-xs text-blue-400 hover:text-blue-300">
                Forgot Password?
              </button>
            </div>

            {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            <button disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold disabled:opacity-60">
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
          
          <div className="mt-6 space-y-3">
            <button onClick={() => signInWith("google")} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">Continue with Google</button>
            <button onClick={() => signInWith("github")} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#24292F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1b1f23]">Continue with GitHub</button>
          </div>

          <p className="mt-8 text-center text-sm text-slate-400">
            Don't have an account? <Link to="/signup" className="text-blue-400">Create one</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const referral = params.get("ref") || "";
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError("");
    if (!agree) return setError("Agree to Terms first.");
    if (form.name.trim().length < 2) return setError("Enter your full name.");
    if (form.password.length < 8) return setError("Password must be 8+ chars.");
    if (form.password !== form.confirm) return setError("Passwords don't match.");
    setLoading(true);
    const { error } = await api.signup(form.name.trim(), form.email.trim().toLowerCase(), form.password, referral);
    setLoading(false);
    if (error) return setError(error.message);
    navigate("/home");
  }

  async function signInWith(provider) {
    if (!agree) return setError("You must agree to the Terms & Conditions first.");
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/home` } });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 lg:grid-cols-2">
        <section className="hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 p-10 lg:block">
          <Link to="/" className="inline-flex items-center gap-3">
            <ShieldCheck size={27} />
            <span className="text-2xl font-bold">PrimeVest</span>
          </Link>
          <h1 className="mt-16 text-4xl font-bold">Create your PrimeVest account.</h1>
        </section>
        <section className="p-6 sm:p-10 lg:p-12">
          <p className="text-sm text-blue-400">GET STARTED</p>
          <h2 className="mt-2 text-3xl font-bold">Create account</h2>
          
          <form onSubmit={submit} className="mt-6 space-y-4">
            {[
              { k: "name", label: "Full name", type: "text", ph: "Your name" },
              { k: "email", label: "Email", type: "email", ph: "you@example.com" },
            ].map(({ k, label, type, ph }) => (
              <div key={k}>
                <label className="mb-2 block text-sm text-slate-300">{label}</label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4">
                  <UserRound size={19} className="text-slate-500" />
                  <input type={type} required value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    className="flex-1 bg-transparent py-3.5 text-sm outline-none" placeholder={ph} />
                </div>
              </div>
            ))}
            <div>
              <label className="mb-2 block text-sm text-slate-300">Password</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4">
                <Lock size={19} className="text-slate-500" />
                <input type={show ? "text" : "password"} minLength={8} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="flex-1 bg-transparent py-3.5 text-sm outline-none" placeholder="8+ characters" />
                <button type="button" onClick={() => setShow(!show)}>
                  {show ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Confirm password</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4">
                <Lock size={19} className="text-slate-500" />
                <input type="password" required value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className="flex-1 bg-transparent py-3.5 text-sm outline-none" placeholder="Again" />
              </div>
            </div>
            <button disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold disabled:opacity-60">
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <button onClick={() => signInWith("google")} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">Sign up with Google</button>
            <button onClick={() => signInWith("github")} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#24292F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1b1f23]">Sign up with GitHub</button>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <label className="text-xs text-slate-400">
              I agree to the <Link to="/terms" className="text-blue-400">Terms</Link>
            </label>
          </div>
          <p className="mt-6 text-center text-sm text-slate-400">
            Have an account? <Link to="/login" className="text-blue-400">Log in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

/* =========================== DEPOSIT =========================== */
export function Deposit() {
  const [amount, setAmount] = useState("");
  const [region, setRegion] = useState("Nigeria");
  const [error, setError] = useState("");

  const go = () => {
    const n = Number(amount);
    if (!n || n <= 0) return setError("Enter a valid amount.");
    if (n < 2000) return setError("Minimum ₦2,000.");
    if (region !== "Nigeria") window.location.href = `/deposit/bitcoin?amount=${n}`;
    else window.location.href = `/deposit/payment?amount=${n}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95">
        <div className="mx-auto flex h-20 max-w-5xl items-center gap-4 px-4">
          <a href="/home" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <h1 className="text-xl font-bold">Deposit</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          Note: If Paystack fails, use Bitcoin.
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 p-6">
          <Wallet className="h-8 w-8 text-blue-200" />
          <p className="mt-6 text-sm text-blue-200">Minimum Deposit</p>
          <h2 className="mt-2 text-4xl font-bold">₦2,000.00</h2>
        </div>
        <div className="mt-6 rounded-3xl border border-blue-400/10 bg-slate-900 p-6">
          <label className="mb-2 block text-sm text-slate-300">Region</label>
          <select value={region} onChange={e => setRegion(e.target.value)}
            className="mb-6 w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 outline-none">
            <option value="Nigeria">Nigeria (Paystack)</option>
            <option value="USA">USA (Bitcoin)</option>
            <option value="UK">UK (Bitcoin)</option>
            <option value="Europe">Europe (Bitcoin)</option>
          </select>
          <label className="mb-2 block text-sm text-slate-300">Amount (NGN)</label>
          <div className="flex rounded-xl border border-blue-400/10 bg-slate-950">
            <span className="flex items-center px-4 text-slate-400">₦</span>
            <input value={amount}
              onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) { setAmount(e.target.value); setError(""); } }}
              placeholder="2,000" className="w-full bg-transparent px-2 py-4 outline-none" />
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-500/5 p-3 text-sm text-red-300">{error}</p>}
          <button onClick={go} className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-semibold">Continue</button>
        </div>
      </main>
    </div>
  );
}

export function DepositPayment() {
  const p = new URLSearchParams(window.location.search);
  const amount = p.get("amount") || "0";
  const fmt = Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 });
  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95">
        <div className="mx-auto flex h-20 max-w-2xl items-center gap-4 px-4">
          <a href="/deposit" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <h1 className="text-xl font-bold">Payment Method</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-blue-950 to-blue-700 p-6">
          <p className="text-sm text-blue-200">Amount</p>
          <h2 className="mt-2 text-3xl font-bold">₦{fmt}</h2>
        </div>
        <div className="mt-6 space-y-4">
          <a href={`/deposit/card?amount=${amount}`} className="flex items-center gap-4 rounded-2xl border border-blue-400/10 bg-slate-900 p-5 hover:border-blue-500">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
              <CreditCard className="h-7 w-7 text-blue-400" />
            </div>
            <h3 className="font-semibold">Card / Transfer (Paystack)</h3>
          </a>
          <a href={`/deposit/bitcoin?amount=${amount}`} className="flex items-center gap-4 rounded-2xl border border-blue-400/10 bg-slate-900 p-5 hover:border-amber-500">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
              <Bitcoin className="h-7 w-7 text-amber-400" />
            </div>
            <h3 className="font-semibold">Bitcoin</h3>
          </a>
        </div>
      </main>
    </div>
  );
}

export function DepositCard() {
  const p = new URLSearchParams(window.location.search);
  const amount = Number(p.get("amount") || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fmt = amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });

  async function pay() {
    setLoading(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const r = await api.cardDepositInit(amount, user.email);
    setLoading(false);
    const url = r?.authorization_url || r?.url;
    if (url) window.location.href = url;
    else setError(r?.error || "Failed.");
  }

  return (
    <div className="min-h-screen bg-[#070D1A] pb-24 text-white">
      <header className="border-b border-white/5 bg-[#070D1A]/95">
        <div className="mx-auto flex h-20 max-w-5xl items-center gap-4 px-5">
          <a href={`/deposit/payment?amount=${amount}`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10">
            <ArrowLeft size={19} />
          </a>
          <h1 className="text-lg font-semibold">Card Payment</h1>
        </div>
      </header>
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5">
        <div className="w-full max-w-xl rounded-2xl border border-white/8 bg-[#0D1526] p-6">
          {error && <div className="mb-4 rounded-xl bg-red-500/5 p-4 text-sm text-red-300">{error}</div>}
          <button onClick={pay} disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold disabled:opacity-60">
            <LockKeyhole size={17} />{loading ? "Redirecting..." : `Pay ₦${fmt}`}
          </button>
        </div>
      </main>
    </div>
  );
}

export function DepositBitcoin() {
  const p = new URLSearchParams(window.location.search);
  const amount = Number(p.get("amount") || 0);
  const [copied, setCopied] = useState(false);
  const address = "bc1qlp2jy9vm46v9jm6jxlzsakcs9qmtxxujt68jpz";
  const fmt = amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });

  async function copyAddress() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(address);
      } else {
        const field = document.createElement("textarea");
        field.value = address;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const copiedSuccessfully = document.execCommand("copy");
        document.body.removeChild(field);
        if (!copiedSuccessfully) throw new Error("Copy was not successful");
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Unable to copy Bitcoin address:", error);
      setCopied(false);
      alert("Could not copy automatically. Please select and copy the address.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95">
        <div className="mx-auto flex h-20 max-w-2xl items-center px-4">
          <h1 className="text-xl font-bold">Bitcoin Deposit</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-amber-950 to-amber-700 p-6">
          <Bitcoin className="h-8 w-8 text-amber-200" />
          <p className="mt-6 text-sm text-amber-200">Deposit amount</p>
          <h2 className="mt-2 text-3xl font-bold">₦{fmt}</h2>
        </div>

        <div className="mt-6 rounded-3xl border border-blue-400/10 bg-slate-900 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Bitcoin (BTC) wallet address
          </p>
          <p className="mt-3 break-all rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-white">
            {address}
          </p>
          <button
            type="button"
            onClick={copyAddress}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold transition hover:bg-blue-500"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? "Copied" : "Copy address"}
          </button>
          <p className="mt-4 text-xs leading-5 text-amber-200">
            Send BTC on the Bitcoin network only. Do not send USDT, other
            cryptocurrencies, or funds through another network to this address.
          </p>
        </div>
      </main>
    </div>
  );
}

/* =========================== PORTFOLIO / HISTORY =========================== */
export function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [claiming, setClaiming] = useState(null);
  const [claimed, setClaimed] = useState({});
  const [toastMsg, setToastMsg] = useState("");
  const [, setTick] = useState(0);

  const load = async () => {
    const { data } = await api.portfolio();
    setHoldings(data || []);
  };

  useEffect(() => {
    load();
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (n) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n || 0);

  const timeLeft = (last) => {
    if (!last) return null;
    const diff = new Date(last).getTime() + 86400000 - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  async function claim(h) {
    if (claimed[h.id]) return setToastMsg("Wait 24h between claims.");
    const left = timeLeft(h.last_daily_claim);
    if (left) return setToastMsg(`Wait ${left}.`);
    setClaimed(p => ({ ...p, [h.id]: true }));
    setClaiming(h.id);
    let amt = 0;
    if ((h.plans?.name || "").includes("Affiliate")) amt = Math.floor(Math.random() * 1500) + 500;
    else amt = h.amount * (h.plans.expected_return / 100);
    const r = await api.claimInvestment(h.id, amt);
    if (r?.success) { await load(); setToastMsg(`Claimed ${fmt(amt)}!`); }
    else { setToastMsg(r?.error || "Failed."); setClaimed(p => ({ ...p, [h.id]: false })); }
    setClaiming(null);
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white p-4">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
      <header className="mb-6"><a href="/home" className="inline-flex items-center gap-2"><ArrowLeft size={18} /> Back</a></header>
      <h1 className="text-2xl font-bold mb-4">Active Investments</h1>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {holdings.map(h => {
          const left = timeLeft(h.last_daily_claim);
          const canClaim = !left && !claimed[h.id];
          const planName = h.plans?.name || "";
          const display = planName.includes("Affiliate") ? 500 : h.amount * (h.plans.expected_return / 100);
          return (
            <div key={h.id} className="rounded-2xl border border-blue-400/10 bg-slate-900 p-6">
              <p className="font-bold">{planName}</p>
              <p className="text-2xl mt-2">{fmt(h.amount)}</p>
              <p className="text-xs text-slate-500 mt-1">Status: {h.status}</p>
              {h.status === "active" && (
                <div className="mt-4">
                  {left && (
                    <p className="text-center text-xs text-amber-400 mb-2 flex items-center justify-center gap-1">
                      <Timer size={14} /> {left}
                    </p>
                  )}
                  <button onClick={() => claim(h)} disabled={!canClaim || claiming === h.id}
                    className={`w-full rounded-xl py-2 text-sm font-semibold ${canClaim ? "bg-indigo-600" : "bg-slate-800 text-slate-500"}`}>
                    {claiming === h.id ? "Claiming..." : canClaim ? `Claim ${fmt(display)}` : "Wait"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.history().then(({ data }) => { setHistory(data || []); setLoading(false); });
  }, []);

  const fmt = (n) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n || 0);

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white p-4">
      <header className="mb-6 flex items-center gap-4">
        <a href="/settings" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <h1 className="text-xl font-bold">Transaction History</h1>
      </header>
      <div className="space-y-3">
        {history.length === 0
          ? <p className="text-slate-500 text-sm">No transactions yet.</p>
          : history.map(tx => (
              <div key={tx.id} className="rounded-xl border border-white/10 bg-[#0D1526] p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold capitalize">{tx.type.replace("_", " ")}</p>
                  <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleString()}</p>
                  <p className={`text-xs mt-1 ${tx.status === "success" ? "text-emerald-400" : tx.status === "pending" ? "text-amber-400" : "text-red-400"}`}>{tx.status}</p>
                </div>
                <p className={`font-bold ${tx.type === "withdraw" ? "text-red-400" : "text-emerald-400"}`}>
                  {tx.type === "withdraw" ? "-" : "+"}{fmt(tx.amount)}
                </p>
              </div>
            ))}
      </div>
    </div>
  );
}

/* =========================== SETTINGS =========================== */
export function Settings() {
  const [profile, setProfile] = useState({ name: "", email: "", avatar_url: "", username: "" });
  const [uploading, setUploading] = useState(false);
  const [pendingWD, setPendingWD] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [newFriend, setNewFriend] = useState("");
  const [busy, setBusy] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [, setTick] = useState(0);

  const reload = async () => {
    const p = await api.profile();
    if (p.data) setProfile(p.data);
    const f = await api.getFriends();
    setFriends(f.data || []);
    const r = await api.getFriendRequests();
    setIncoming(r.data.incoming || []);
    setOutgoing(r.data.outgoing || []);
  };

  useEffect(() => {
    reload();
    
    // 🚨 FIX: Only fetch the pending withdrawal for the CURRENT logged-in user
    const fetchPending = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("withdrawals")
        .select("*")
        .eq("status", "pending")
        .eq("user_id", user.id) // <--- This line is the fix
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setPendingWD(data[0]); 
      } else {
        setPendingWD(null); 
      }
    };

    fetchPending();
    
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!pendingWD) return;
    const end = new Date(pendingWD.created_at).getTime() + 3 * 60 * 60 * 1000;
    const diff = end - Date.now();
    if (diff <= 0) setTimeLeft("Processing...");
    else {
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }
  }, [pendingWD, timeLeft]);

  async function uploadAvatar(e) {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;
      const { data: { user } } = await supabase.auth.getUser();
      const url = await api.uploadAvatar?.(file, user.id);
      if (url) { setProfile({ ...profile, avatar_url: url }); alert("Avatar updated."); }
    } catch (err) { alert(err.message); }
    finally { setUploading(false); }
  }

  async function handleChangeUsername() {
    if (usernameInput.length < 3) return alert("Min 3 chars.");
    if (!confirm("You will be charged ₦1,000 from your wallet to change your username. Proceed?")) return;
    
    setBusy(true);
    const { data, error } = await supabase.rpc("change_username_charged", { new_username: usernameInput });
    setBusy(false);

    if (error) return alert("Database error: " + error.message);
    if (data.error) return alert(data.error);

    alert("Username changed successfully!");
    setShowUsernameModal(false);
    await reload();
  }

  async function sendFriend() {
    if (!newFriend.trim()) return alert("Enter a username.");
    setBusy(true);
    const r = await api.addFriend(newFriend);
    setBusy(false);
    if (r.error) return alert(r.error);
    alert("Request sent!");
    setNewFriend("");
    await reload();
  }

  async function accept(id) {
    setBusy(true);
    const r = await api.acceptFriendRequest(id);
    setBusy(false);
    if (r.error) return alert(r.error);
    await reload();
  }

  async function reject(id) {
    setBusy(true);
    const r = await api.rejectFriendRequest(id);
    setBusy(false);
    if (r.error) return alert(r.error);
    await reload();
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95">
        <div className="mx-auto flex h-20 items-center gap-4 px-4 max-w-2xl">
          <a href="/home" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        
        <div className="rounded-2xl border border-blue-400/10 bg-slate-900 p-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-blue-400/30 bg-blue-500/10 flex items-center justify-center">
              {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <User className="h-8 w-8 text-blue-400" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{profile.name}</p>
              <p className="text-sm text-slate-500">{profile.email}</p>
              <p className="text-xs text-emerald-400 mt-1">{profile.username ? `@${profile.username}` : "No username set"}</p>
            </div>
            <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold hover:bg-blue-500 transition">
              {uploading ? "Uploading..." : "Upload Photo"}
              <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
            </label>
          </div>
        </div>

        {/* USERNAME CHANGE SECTION */}
        {profile.username ? (
          <div className="rounded-2xl border border-blue-400/10 bg-slate-900 p-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold">Change Username</h3>
              <p className="text-xs text-slate-400">Costs ₦1,000 per change.</p>
            </div>
            <button onClick={() => setShowUsernameModal(true)} className="bg-slate-800 px-4 py-2 rounded-xl font-bold text-sm border border-white/10 hover:bg-slate-700">
              Change
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-500/30 bg-[#1A1500] p-5">
            <h3 className="font-bold text-amber-500 mb-2">Set Your Username</h3>
            <div className="flex gap-2">
              <input value={usernameInput} onChange={e => setUsernameInput(e.target.value.replace(/\s/g, ""))}
                placeholder="john_doe"
                className="flex-1 rounded-xl bg-slate-950 px-4 py-2" />
              <button onClick={async () => {
                if (usernameInput.length < 3) return alert("Min 3 chars.");
                const r = await api.setUsername(usernameInput);
                if (r.error) return alert(r.error);
                alert("Username set!");
                await reload();
              }} className="bg-amber-500 text-black px-4 py-2 rounded-xl font-bold">Save</button>
            </div>
          </div>
        )}

        {showUsernameModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0D1526] p-6 text-center">
              <h3 className="text-xl font-bold mb-2">New Username</h3>
              <p className="text-xs text-slate-400 mb-4">This will deduct ₦1,000 from your wallet.</p>
              <input value={usernameInput} onChange={e => setUsernameInput(e.target.value.replace(/\s/g, ""))} placeholder="New username" className="w-full bg-slate-950 rounded-xl px-4 py-3 text-center mb-4 outline-none" />
              <div className="flex gap-2">
                <button onClick={() => setShowUsernameModal(false)} className="flex-1 bg-slate-800 py-3 rounded-xl font-bold">Cancel</button>
                <button onClick={handleChangeUsername} disabled={busy} className="flex-1 bg-amber-500 text-black py-3 rounded-xl font-bold disabled:opacity-50">
                  {busy ? "..." : "Pay ₦1,000"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🚨 WITHDRAWAL PENDING (Now only shows if user has a pending withdrawal) */}
        {pendingWD && (
          <div className="rounded-2xl border border-amber-500/30 bg-[#1A1500] p-5">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-amber-500">Withdrawal Pending</h3>
            </div>
            <p className="text-sm text-slate-300">₦{Number(pendingWD.amount).toLocaleString()}</p>
            <div className="mt-3 bg-black/40 p-3 rounded-xl flex justify-between">
              <span className="text-xs text-slate-400">Completes in:</span>
              <span className="font-mono text-amber-400 font-bold">{timeLeft}</span>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-blue-400/10 bg-slate-900 p-5 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus size={18} /> Friends</h3>

          <div className="flex gap-2">
            <input value={newFriend} onChange={e => setNewFriend(e.target.value)}
              placeholder="@username or username"
              className="flex-1 rounded-xl bg-slate-950 px-4 py-2 text-white outline-none" />
            <button onClick={sendFriend} disabled={busy}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50">
              {busy ? "..." : "Send"}
            </button>
          </div>

          {incoming.length > 0 && (
            <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30">
              <p className="text-xs text-blue-400 font-bold mb-3 uppercase">Incoming Requests ({incoming.length})</p>
              {incoming.map(r => (
                <div key={r.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg mb-2">
                  <div>
                    <p className="text-sm font-bold">{r.profiles?.name || "Unknown"}</p>
                    <p className="text-xs text-slate-400">@{r.profiles?.username || "no-username"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => accept(r.id)} disabled={busy}
                      className="text-xs bg-emerald-600 px-3 py-2 rounded-lg font-bold disabled:opacity-50">Accept</button>
                    <button onClick={() => reject(r.id)} disabled={busy}
                      className="text-xs bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg font-bold disabled:opacity-50">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {outgoing.length > 0 && (
            <div>
              <p className="text-xs text-amber-400 font-bold mb-2 uppercase">Sent Requests ({outgoing.length})</p>
              {outgoing.map(r => (
                <div key={r.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg mb-2">
                  <div>
                    <p className="text-sm font-bold">{r.profiles?.name || "Unknown"}</p>
                    <p className="text-xs text-slate-400">@{r.profiles?.username || "no-username"}</p>
                  </div>
                  <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded">Pending</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs text-slate-400 font-bold mb-2 uppercase">My Friends ({friends.length})</p>
            {friends.length === 0
              ? <p className="text-xs text-slate-500">No friends yet.</p>
              : friends.map(f => (
                  <div key={f.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg mb-2">
                    <div>
                      <p className="text-sm font-bold">{f.profiles?.name || "Unknown"}</p>
                      <p className="text-xs text-slate-400">@{f.profiles?.username || "no-username"}</p>
                    </div>
                    <a href={`/chat/${f.friend_id}`} className="text-xs bg-blue-600 px-4 py-2 rounded-lg font-bold">Chat</a>
                  </div>
                ))}
          </div>
        </div>

        <a href="/history" className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm"><Clock3 size={18} /> Transaction History</a>
        <a href="/help" className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm"><HelpCircle size={18} /> Help Center</a>
        <button onClick={async () => { await api.logout(); window.location.href = "/"; }}
          className="flex w-full items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-red-400">
          <LogOut className="h-5 w-5" /> Log Out
        </button>
      </main>
    </div>
  );
}

/* =========================== HELP =========================== */
export function Help() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl pb-20">
        <a href="/home" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400"><ArrowLeft size={18} />Back</a>
        <h1 className="text-3xl font-bold mb-6">Investment Guide</h1>
        <div className="space-y-6">
          <div className="rounded-2xl border border-indigo-500/20 bg-[#0D1526] p-6">
            <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2"><Zap size={20} /> 1. Growth Portfolio</h2>
            <p className="mt-3 text-sm text-slate-300">Pays daily. Claim from Portfolio. Capital locked 7 days.</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-[#0D1526] p-6">
            <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2"><TrendingUp size={20} /> 2. Affiliate</h2>
            <p className="mt-3 text-sm text-slate-300">Share your link. Earn random bonuses ₦3k–₦20k.</p>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-[#0D1526] p-6">
            <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><Rocket size={20} /> 3. Real Estate</h2>
            <p className="mt-3 text-sm text-slate-300">6 tiers. Bigger estate = higher ROI.</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-[#0D1526] p-6">
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2"><Timer size={20} /> 4. Crypto Index</h2>
            <p className="mt-3 text-sm text-slate-300">Lock 30 days–1 year. Longer = higher returns.</p>
          </div>
        </div>
      </div>
    </main>
  );
}