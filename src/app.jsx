import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, Link, useNavigate, useSearchParams, Outlet } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import {
  ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, TrendingUp, UserRound, CheckCircle2,
  Bell, Home as HomeIcon, Wallet, ArrowDownToLine, ArrowUpFromLine, Users, Gift, Share2,
  Copy, Check, MessageCircle, Send, ChevronRight, ChevronDown, CircleDollarSign, Clock3,
  Settings as SettingsIcon, LogOut, X, Info, ArrowLeft, CreditCard, LockKeyhole, AlertCircle,
  Building2, Bitcoin, PiggyBank, BarChart3, PieChart, Search, XCircle, Loader2, ThumbsUp,
  Headphones, HelpCircle, User, Menu, Star, Sparkles, LineChart, Globe2, ExternalLink, Gamepad2,
  Rocket, Timer, Zap, MessageSquare, Upload, Crown, Unlock, Lock as LockIcon, CheckCircle
} from "lucide-react";
import Terms from "./terms";
import { 
  Deposit, DepositPayment, DepositCard, DepositBitcoin,
  Withdraw, WithdrawAccount, WithdrawSuccess, VIP, VIPCheckout, BonusGame, Invest, 
  Portfolio, Settings, Help 
} from "./pages";

// ============================================================
// SUPABASE CLIENT + API
// ============================================================
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function call(path, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${FN}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` },
    body: JSON.stringify(body || {}),
  });
  return res.json();
}

async function notifyAdmin(name, email) {
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_key: import.meta.env.VITE_WEB3FORMS_KEY, subject: "New PrimeVest Signup", from_name: "PrimeVest", name, email, message: `New user:\nName: ${name}\nEmail: ${email}` }),
    });
  } catch {}
}

export const api = {
  signup: async (name, email, password, ref) => {
    const res = await supabase.auth.signUp({ email, password, options: { data: { name, ref } } });
    if (!res.error) notifyAdmin(name, email);
    return res;
  },
  login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  logout: () => supabase.auth.signOut(),
  wallet: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("wallets").select("*").eq("user_id", user.id).single();
  },
  profile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("profiles").select("*").eq("id", user.id).single();
  },
  notifications: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  },
  markRead: (id) => supabase.from("notifications").update({ read: true }).eq("id", id),
  markAllRead: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("notifications").update({ read: true }).eq("user_id", user.id);
  },
  plans: () => supabase.from("plans").select("*").eq("active", true),
  portfolio: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("investments").select("*, plans(*)").eq("user_id", user.id).order("started_at", { ascending: false });
  },
  history: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  },
  depositInit: (amount, method, email, vip) => call("index/deposit-init", { amount, method, email, vip }),
  banks: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return fetch(`${FN}/index/banks`, { headers: { "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY, "Authorization": `Bearer ${session?.access_token || ""}` } }).then(r => r.json());
  },
  resolveAccount: (account_number, bank_code) => call("index/resolve-account", { account_number, bank_code }),
  withdraw: (p) => call("index/withdraw-request", p),
  
  claimBonus: async (amount) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("transactions").insert({ user_id: user.id, type: "bonus", amount, status: "success", reference: `BONUS-${Date.now()}` });
    const { data: wallet } = await supabase.from("wallets").select("available, total").eq("user_id", user.id).single();
    await supabase.from("wallets").update({ available: (wallet?.available || 0) + amount, total: (wallet?.total || 0) + amount }).eq("user_id", user.id);
    await supabase.from("notifications").insert({ user_id: user.id, title: "Bonus Claimed", message: `You earned ₦${amount} from the tap game!`, type: "bonus" });
    return { success: true };
  },
  
  invest: (plan_id, amount, daily_profit, matured_at) => call("index/invest", { plan_id, amount, daily_profit, matured_at }),
  claimInvestment: async (investment_id, amount) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("investments").update({ last_daily_claim: new Date().toISOString() }).eq("id", investment_id);
    const { data: wallet } = await supabase.from("wallets").select("available, earnings, total").eq("user_id", user.id).single();
    await supabase.from("wallets").update({ available: (wallet?.available || 0) + amount, earnings: (wallet?.earnings || 0) + amount, total: (wallet?.total || 0) + amount }).eq("user_id", user.id);
    await supabase.from("transactions").insert({ user_id: user.id, type: "investment_profit", amount, status: "success", reference: `PROFIT-${Date.now()}` });
    return { success: true };
  },

  claimDailyLogin: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("last_login_claim").eq("id", user.id).single();
    const now = new Date();
    if (profile?.last_login_claim && (now - new Date(profile.last_login_claim)) / 1000 < 86400) return { error: "Already claimed" };
    await supabase.from("profiles").update({ last_login_claim: now.toISOString() }).eq("id", user.id);
    const { data: wallet } = await supabase.from("wallets").select("available, earnings, total").eq("user_id", user.id).single();
    await supabase.from("wallets").update({ available: (wallet?.available || 0) + 100, earnings: (wallet?.earnings || 0) + 100, total: (wallet?.total || 0) + 100 }).eq("user_id", user.id);
    await supabase.from("transactions").insert({ user_id: user.id, type: "daily_login", amount: 100, status: "success", reference: `LOGIN-${Date.now()}` });
    await supabase.from("notifications").insert({ user_id: user.id, title: "Daily Login Bonus", message: "You received ₦100 for logging in today.", type: "deposit" });
    return { success: true };
  },

  rewardReferral: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("referral_earnings").eq("id", user.id).single();
    const amount = (profile?.referral_earnings || 0) > 0 ? 200 : 1000;
    await supabase.from("profiles").update({ referral_earnings: (profile?.referral_earnings || 0) + amount }).eq("id", user.id);
    const { data: wallet } = await supabase.from("wallets").select("available, total").eq("user_id", user.id).single();
    await supabase.from("wallets").update({ available: (wallet?.available || 0) + amount, total: (wallet?.total || 0) + amount }).eq("user_id", user.id);
    await supabase.from("transactions").insert({ user_id: user.id, type: "referral_bonus", amount, status: "success", reference: `REF-${Date.now()}` });
    await supabase.from("notifications").insert({ user_id: user.id, title: "Referral Bonus", message: `You earned ₦${amount} for sharing your link!`, type: "referral" });
    return { amount };
  },

  upgradeVIP: async (tier, cost) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles").update({ vip_tier: tier }).eq("id", user.id);
    await supabase.from("transactions").insert({ user_id: user.id, type: "vip_purchase", amount: cost, status: "success", reference: `VIP-${Date.now()}` });
    const { data: wallet } = await supabase.from("wallets").select("available, total").eq("user_id", user.id).single();
    const bonus = tier === "VIP 1" ? 5000 : tier === "VIP 2" ? 10000 : 17000;
    await supabase.from("wallets").update({ available: (wallet?.available || 0) + bonus, total: (wallet?.total || 0) + bonus }).eq("user_id", user.id);
    await supabase.from("notifications").insert({ user_id: user.id, title: "VIP Upgraded", message: `You are now a ${tier}. ₦${bonus} investment bonus added to your wallet.`, type: "system" });
    return { success: true };
  },
  
  uploadAvatar: async (file, userId) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const { error } = await supabase.storage.from('avatars').upload(fileName, file);
    if (error) throw error;
    const { data } = await supabase.storage.from('avatars').getPublicUrl(fileName);
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId);
    return data.publicUrl;
  },

  getAdminWithdrawals: async () => {
    return supabase.from("withdrawals").select("*").eq("status", "pending").order("created_at", { ascending: false });
  },
  approveWithdrawal: async (withdrawalId, user_id, amount) => {
    await supabase.from("withdrawals").update({ status: "approved" }).eq("id", withdrawalId);
    await supabase.from("transactions").update({ status: "success" }).eq("user_id", user_id).eq("type", "withdraw").eq("status", "pending");
    await supabase.from("notifications").insert({ user_id: user_id, title: "Withdrawal Approved", message: `Your withdrawal of ₦${amount} has been sent to your bank.`, type: "withdraw" });
    return { success: true };
  },
  rejectWithdrawal: async (withdrawalId, user_id, amount) => {
    await supabase.from("withdrawals").update({ status: "rejected" }).eq("id", withdrawalId);
    const { data: wallet } = await supabase.from("wallets").select("available, total").eq("user_id", user_id).single();
    await supabase.from("wallets").update({ available: (wallet?.available || 0) + amount, total: (wallet?.total || 0) + amount }).eq("user_id", user_id);
    await supabase.from("transactions").update({ status: "failed" }).eq("user_id", user_id).eq("type", "withdraw").eq("status", "pending");
    await supabase.from("notifications").insert({ user_id: user_id, title: "Withdrawal Rejected", message: `Your withdrawal of ₦${amount} was rejected. Funds refunded.`, type: "withdraw" });
    return { success: true };
  }
};

// ============================================================
// BRANDED LOADING SCREEN
// ============================================================
function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070D1A]">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping"></div>
        <div className="absolute inset-2 rounded-full border-2 border-blue-500/50 animate-pulse"></div>
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-800 shadow-2xl shadow-blue-900/50">
          <ShieldCheck size={32} className="text-white animate-bounce" />
        </div>
      </div>
      <h1 className="mt-6 text-2xl font-bold text-white tracking-widest">Prime<span className="text-blue-400">Vest</span></h1>
    </div>
  );
}

// ============================================================
// GLOBAL TOAST
// ============================================================
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] rounded-2xl border border-emerald-500/30 bg-[#0D1526] px-6 py-4 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
      </div>
      <p className="text-sm font-semibold text-white">{message}</p>
    </div>
  );
};

// ============================================================
// PROTECTED ROUTE
// ============================================================
function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setAuthed(!!data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);
  if (loading) return <LoadingScreen />;
  if (!authed) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// ============================================================
// LANDING PAGE
// ============================================================
function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-3 py-3 sm:px-4 sm:py-4 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-2xl border border-blue-400/20 bg-blue-950/90 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 lg:px-7">
          <a href="#home" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/40 sm:h-11 sm:w-11"><ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" /></div>
            <div><h2 className="text-base font-bold tracking-tight text-white sm:text-lg">PrimeVest</h2><p className="text-[8px] font-medium uppercase tracking-[0.18em] text-blue-300 sm:text-[9px]">Wealth Management</p></div>
          </a>
          <div className="hidden items-center gap-8 lg:flex">
            <a href="#strategies" className="text-sm font-medium text-slate-300 transition hover:text-blue-300">Strategies</a>
            <a href="#about" className="text-sm font-medium text-slate-300 transition hover:text-blue-300">About</a>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/login" className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-blue-900/60 hover:text-white">Sign in</Link>
            <Link to="/signup" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500">Get Started</Link>
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-900/40 text-slate-200 lg:hidden">
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-slate-950 pt-10">
      <div className="absolute inset-0 [background:linear-gradient(135deg,#020617,#172554,#0f172a)]" />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            <Sparkles className="h-4 w-4" />Trusted by 550,000+ investors
          </div>
          <h1 className="text-5xl font-bold leading-tight text-white lg:text-7xl">Grow your wealth with <span className="bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">confidence</span></h1>
          
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            PrimeVest is your all-in-one wealth management platform. Whether you're looking to grow your savings with high-yield portfolios, invest in real estate, or earn through our interactive bonus games, we provide a secure, transparent, and effortless way to build your financial future.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/signup" className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-500">Start Investing<ArrowRight className="ml-2 h-4 w-4" /></Link>
            <a href="#strategies" className="rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition hover:bg-slate-800">View Strategies</a>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-400" />SEC Registered</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-400" />N2B+ Managed</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-400" />4.9/5 Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { icon: TrendingUp, value: "12.4%", label: "Average Annual Return", color: "bg-blue-500/10 text-blue-400" },
    { icon: Users, value: "550K+", label: "Active Investors", color: "bg-indigo-500/10 text-indigo-400" },
    { icon: Building2, value: "N2.1B", label: "Assets Under Management", color: "bg-sky-500/10 text-sky-400" },
    { icon: Globe2, value: "40+", label: "Global Markets", color: "bg-blue-500/10 text-blue-400" },
  ];
  return (
    <section className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-blue-400/10 bg-slate-900/90 p-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}><Icon className="h-6 w-6" /></div>
                <div><p className="text-2xl font-bold text-white">{s.value}</p><p className="mt-1 text-sm text-slate-400">{s.label}</p></div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function InvestmentCards() {
  const strategies = [
    { icon: LineChart, title: "Growth Portfolio", description: "High-potential stocks and ETFs", return: "12.5%", risk: "Moderate", color: "bg-blue-500/10 text-blue-400", badge: "Popular" },
    { icon: Building2, title: "Real Estate", description: "REITs and property funds", return: "11.9%", risk: "Moderate", color: "bg-sky-500/10 text-sky-400", badge: "New" },
    { icon: Bitcoin, title: "Crypto Index", description: "Diversified digital assets", return: "22.0%", risk: "High", color: "bg-amber-500/10 text-amber-400", badge: "High Growth" },
    { icon: Users, title: "Affiliate Marketing", description: "Digital commerce assets", return: "15.0%", risk: "Moderate", color: "bg-emerald-500/10 text-emerald-400", badge: "Trending" },
  ];
  return (
    <section id="strategies" className="relative bg-slate-950 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto mb-12 flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-400">Investment Options</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Investment Strategies</h2>
          <p className="mt-3 max-w-xl text-slate-400">Choose a strategy that matches your goals.</p>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {strategies.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="rounded-2xl border border-blue-400/10 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl transition hover:-translate-y-2 hover:border-blue-400/30">
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}><Icon className="h-6 w-6" /></div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">{s.badge}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.description}</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                <div><p className="text-xs text-slate-500">Avg. Return</p><p className="mt-1 text-xl font-bold text-blue-400">{s.return}</p></div>
                <div className="text-right"><p className="text-xs text-slate-500">Risk</p><p className="mt-1 text-sm font-medium text-slate-300">{s.risk}</p></div>
              </div>
              <Link to="/signup" className="mt-5 block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500">Invest Now</Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { name: "Olamide John", role: "Civil Servant", quote: "PrimeVest made investing feel approachable.", initials: "OJ", color: "bg-blue-600" },
    { name: "Michael Chukwuma", role: "Business Owner", quote: "The automated tools made managing my investments easier.", initials: "MC", color: "bg-indigo-600" },
    { name: "Joy Temi", role: "Marketing Director", quote: "PrimeVest's strategies made my goals clearer.", initials: "JT", color: "bg-sky-600" },
  ];
  return (
    <section id="about" className="bg-slate-900 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-400">Client Stories</p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Trusted by thousands of investors</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((t) => (
            <div key={t.name} className="rounded-2xl border border-blue-400/10 bg-slate-800/60 p-6 shadow-xl">
              <div className="mb-5 flex gap-1">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
              <p className="text-sm leading-relaxed text-slate-300">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3 border-t border-slate-700 pt-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${t.color} text-sm font-bold text-white`}>{t.initials}</div>
                <div><p className="text-sm font-semibold text-white">{t.name}</p><p className="text-xs text-slate-400">{t.role}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// UPDATED LANDING PAGE (Redirects logged-in users)
// ============================================================
function LandingPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = "/home"; 
      } else {
        setCheckingAuth(false);
      }
    });
  }, []);

  if (checkingAuth) return <LoadingScreen />;

  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />
      <Hero />
      <Stats />
      <InvestmentCards />
      <Testimonials />
    </main>
  );
}

// ============================================================
// LOGIN & SIGNUP
// ============================================================
function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    const { error } = await api.login(form.email.trim(), form.password);
    setLoading(false);
    if (error) return setError("Incorrect email or password.");
    navigate("/home");
  }

  async function handleForgotPassword() {
    if (!form.email) return alert("Please type your email address first, then click Forgot Password.");
    const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), { redirectTo: `${window.location.origin}/settings` });
    if (error) alert(error.message);
    else alert("Password reset link sent to your email!");
  }

  async function signInWith(provider) {
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/home` } });
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 p-10 lg:flex">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10"><ShieldCheck size={27} /></div>
            <span className="text-2xl font-bold">Prime<span className="text-blue-200">Vest</span></span>
          </Link>
          <div className="mt-24"><div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><TrendingUp size={30} /></div><h1 className="text-4xl font-bold leading-tight">Welcome back to your dashboard.</h1></div>
        </section>
        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mt-8 lg:mt-10"><p className="text-sm font-medium text-blue-400">WELCOME BACK</p><h2 className="mt-2 text-3xl font-bold">Log in</h2></div>
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4"><Mail size={19} className="text-slate-500" /><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="flex-1 bg-transparent py-3.5 text-sm outline-none" placeholder="you@example.com" /></div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4">
                <Lock size={19} className="text-slate-500" />
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="flex-1 bg-transparent py-3.5 text-sm outline-none" placeholder="Your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-white">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button type="button" onClick={handleForgotPassword} className="text-xs text-blue-400 hover:text-blue-300">Forgot Password?</button>
            </div>
            {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold disabled:opacity-60">{loading ? "Logging in..." : "Log In"}</button>
          </form>
          <div className="mt-6 space-y-3">
             <button onClick={() => signInWith("google")} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">Continue with Google</button>
             <button onClick={() => signInWith("github")} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#24292F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1b1f23]">Continue with GitHub</button>
          </div>
          <div className="mt-8 flex flex-col items-center gap-3 text-sm text-slate-400">
            <p>Don't have an account? <Link to="/signup" className="font-semibold text-blue-400">Create one</Link></p>
            <Link to="/terms" className="text-xs text-slate-500 hover:text-slate-300">Terms & Conditions</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const referral = params.get("ref") || "";
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError("");
    if (!agreeTerms) return setError("You must agree to the Terms & Conditions.");
    if (form.name.trim().length < 2) return setError("Enter your full name.");
    if (form.password.length < 8) return setError("Password must be 8+ characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords don't match.");
    setLoading(true);
    const { error } = await api.signup(form.name.trim(), form.email.trim().toLowerCase(), form.password, referral);
    setLoading(false);
    if (error) return setError(error.message);
    navigate("/home");
  }

  async function signInWith(provider) {
    if (!agreeTerms) return setError("You must agree to the Terms & Conditions first.");
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/home` } });
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 p-10 lg:flex">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10"><ShieldCheck size={27} /></div>
            <span className="text-2xl font-bold">Prime<span className="text-blue-200">Vest</span></span>
          </Link>
          <div className="my-16">
            <h1 className="text-4xl font-bold leading-tight">Create your PrimeVest account.</h1>
            <div className="mt-8 space-y-4">
              {["Access dashboard","Explore pages","Manage account"].map((i) => (
                <div key={i} className="flex items-center gap-3"><CheckCircle2 size={19} className="text-blue-200" /><span className="text-sm text-blue-50">{i}</span></div>
              ))}
            </div>
          </div>
        </section>
        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mt-8 lg:mt-3"><p className="text-sm font-medium text-blue-400">GET STARTED</p><h2 className="mt-2 text-3xl font-bold">Create account</h2></div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Full name</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4"><UserRound size={19} className="text-slate-500" /><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="flex-1 bg-transparent py-3.5 text-sm outline-none" placeholder="Your name" /></div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4"><Mail size={19} className="text-slate-500" /><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="flex-1 bg-transparent py-3.5 text-sm outline-none" placeholder="you@example.com" /></div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4"><Lock size={19} className="text-slate-500" /><input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} className="flex-1 bg-transparent py-3.5 text-sm outline-none" placeholder="8+ characters" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-white">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Confirm password</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4"><Lock size={19} className="text-slate-500" /><input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required className="flex-1 bg-transparent py-3.5 text-sm outline-none" placeholder="Again" /></div>
            </div>
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold disabled:opacity-60">{loading ? "Creating..." : "Create Account"}</button>
          </form>
          <div className="mt-6 space-y-3">
             <button onClick={() => signInWith("google")} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">Sign up with Google</button>
             <button onClick={() => signInWith("github")} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#24292F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1b1f23]">Sign up with GitHub</button>
          </div>
          <div className="mt-8 flex flex-col items-center gap-3 text-sm text-slate-400">
            <p>Already have an account? <Link to="/login" className="font-semibold text-blue-400">Log in</Link></p>
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="terms" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="terms" className="text-xs text-slate-400">I agree to the <Link to="/terms" className="text-blue-400 hover:underline">Terms & Conditions</Link></label>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// ============================================================
// HOME PAGE (Active Dashboard)
// ============================================================
function HomePage() {
  const navigate = useNavigate();
  const [isUsd, setIsUsd] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [wallet, setWallet] = useState({ available: 0, invested: 0, earnings: 0, total: 0 });
  const [profile, setProfile] = useState({ name: "User", role: "Investor", referral_code: "", avatar_url: "", last_login_claim: null, vip_tier: "None" });
  const [investments, setInvestments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  
  // TOAST STATE ADDED HERE
  const [toastMsg, setToastMsg] = useState("");

  const [showReferral, setShowReferral] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  const [messages, setMessages] = useState([
    { id: 1, user: "PrimeVest Bot", text: "Welcome to the Global Chat! 🚀", time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 2, user: "Chinedu O.", text: "Just claimed my daily ₦300! PrimeVest is paying 🔥", time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
  ]);
  const [newMsg, setNewMsg] = useState("");

  const formatMoney = (amount) => {
    if (!amount) return isUsd ? "$0.00" : "₦0.00";
    if (isUsd) return `$${(amount / 1500).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const loadData = useCallback(async () => {
    const [w, p, i, n] = await Promise.all([api.wallet(), api.profile(), api.portfolio(), api.notifications()]);
    if (w.data) setWallet(w.data);
    if (p.data) setProfile(p.data);
    if (i.data) setInvestments(i.data);
    if (n.data) setNotifications(n.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const chatTimer = setInterval(() => {
      const bots = ["David K.", "Blessing U.", "Femi A.", "Tunde B.", "Amaka J."];
      const replies = ["I just reinvested my profit.", "PrimeVest is the best.", "The daily claims are so smooth.", "Just hit my 7-day streak!", "Withdrawals are instant wow."];
      const randomBot = bots[Math.floor(Math.random() * bots.length)];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      setMessages((prev) => [...prev, { id: Date.now(), user: randomBot, text: randomReply, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
    }, 3600000);
    return () => clearInterval(chatTimer);
  }, []);

  const affiliateInv = investments.find(i => i.plans?.name === "Affiliate Marketing" && i.status === "active");
  let liveAccrual = 0;
  if (affiliateInv) {
    const secondsElapsed = Math.max(0, (new Date() - new Date(affiliateInv.started_at)) / 1000);
    const returnRate = affiliateInv.plans.expected_return / 100;
    const perSecond = (affiliateInv.amount * returnRate) / (365 * 24 * 60 * 60);
    liveAccrual = perSecond * secondsElapsed;
  }

  const now = new Date();
  const canClaimDaily = !profile.last_login_claim || (now - new Date(profile.last_login_claim)) / 1000 >= 86400;

  async function handleClaimDaily() {
    if (!canClaimDaily) return;
    const r = await api.claimDailyLogin();
    if (r.error) return alert("You can only claim once every 24 hours.");
    
    setToastMsg("You have claimed your bonus of ₦100! It will reflect on your dashboard.");
    loadData();
  }

  async function handleShare() {
    const link = `${window.location.origin}/signup?ref=${profile.referral_code || ""}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    const res = await api.rewardReferral();
    if (res.amount) {
      setShareMessage(`Link copied! You earned ₦${res.amount.toLocaleString()} for sharing.`);
      loadData();
    }
    setTimeout(() => { setCopied(false); setShareMessage(""); }, 4000);
  }

  function sendMessage(e) {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), user: profile.name, text: newMsg, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
    setNewMsg("");
  }

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#070D1A] pb-28 text-white relative">
      
      {/* ADDED TOAST HERE */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}

      <button onClick={() => setShowSupport(true)} className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-xl shadow-blue-900/50 hover:bg-blue-500 transition">
        <Headphones className="h-6 w-6" />
      </button>

      {showSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setShowSupport(false)}>
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0D1526] p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10"><Headphones className="h-8 w-8 text-blue-400" /></div>
            <h3 className="mt-4 text-xl font-bold">Customer Care</h3>
            <p className="mt-2 text-sm text-slate-400">Welcome! Please contact us using the details below if you need assistance.</p>
            <div className="mt-6 space-y-3">
              <a href="mailto:primeinvestors265@gmail.com" className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-medium hover:bg-slate-800"><Mail className="h-4 w-4 text-blue-400" /> primeinvestors265@gmail.com</a>
            </div>
            <button onClick={() => setShowSupport(false)} className="mt-6 w-full rounded-xl border border-white/10 py-3 text-sm font-semibold">Close</button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-white/6 bg-[#070D1A]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Prime<span className="text-blue-400">Vest</span></h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsUsd(!isUsd)} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
              <Globe2 size={14} className="text-blue-400" /> {isUsd ? "USD" : "NGN"}
            </button>
            <button onClick={() => setShowNotifs(!showNotifs)} className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <Bell size={18} />
              {notifications.filter(n => !n.read).length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{notifications.filter(n => !n.read).length}</span>}
            </button>
            <div className="h-8 w-8 rounded-full border border-blue-400/30 overflow-hidden flex items-center justify-center bg-blue-500/20 ml-2">
              {profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" /> : <User size={16} className="text-blue-300" />}
            </div>
          </div>
        </div>
      </header>

      {showNotifs && (
        <div className="fixed top-20 right-4 z-50 w-80 max-h-96 overflow-y-auto rounded-2xl border border-white/10 bg-[#0D1526] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h3 className="font-bold">Notifications</h3>
            <button onClick={async () => { await api.markAllRead(); loadData(); }} className="text-xs text-blue-400">Mark all read</button>
          </div>
          <div className="p-2">
            {notifications.length === 0 ? <p className="p-4 text-sm text-slate-500 text-center">No notifications yet.</p> : notifications.map(n => (
              <div key={n.id} className={`p-3 border-b border-white/5 last:border-0 ${n.read ? 'opacity-50' : ''}`}>
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-slate-400 mt-1">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-7">
        <section className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Welcome back,</p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{profile.name}</h2>
          </div>
          {canClaimDaily && (
            <button onClick={handleClaimDaily} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold shadow-lg shadow-emerald-900/40 hover:bg-emerald-500">
              <Gift size={18} /> Claim ₦100
            </button>
          )}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-blue-100"><Wallet size={19} />Total Balance</div>
              <button onClick={() => setBalanceVisible(!balanceVisible)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition">
                {balanceVisible ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <h3 className="mt-6 text-3xl font-bold sm:text-4xl">{balanceVisible ? formatMoney(wallet.total + liveAccrual) : (isUsd ? "$ ••••" : "₦ ••••")}</h3>
            <p className="mt-3 text-sm text-blue-100/80">Available: {balanceVisible ? formatMoney(wallet.available) : (isUsd ? "$ •••" : "₦ •••")}</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <a href="/deposit" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-900"><ArrowDownToLine size={18} />Deposit</a>
              <a href="/withdraw" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold"><ArrowUpFromLine size={18} />Withdraw</a>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/8 bg-[#0D1526] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10"><TrendingUp size={22} className="text-blue-400" /></div>
              <p className="mt-5 text-sm text-slate-400">Invested</p>
              <h3 className="mt-2 text-2xl font-bold">{balanceVisible ? formatMoney(wallet.invested) : (isUsd ? "$ •••" : "₦ •••")}</h3>
            </div>
            <div className="rounded-2xl border border-white/8 bg-[#0D1526] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10"><CircleDollarSign size={22} className="text-emerald-400" /></div>
              <p className="mt-5 text-sm text-slate-400">Earnings {affiliateInv && <span className="text-emerald-400 text-xs ml-2 animate-pulse">● Live</span>}</p>
              <h3 className="mt-2 text-2xl font-bold text-emerald-400">{balanceVisible ? formatMoney(wallet.earnings + liveAccrual) : (isUsd ? "$ •••" : "₦ •••")}</h3>
            </div>
          </div>
        </section>

        <section className="mt-9">
          <h3 className="mb-5 text-lg font-semibold">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <a href="/deposit" className="rounded-2xl border border-white/8 bg-[#0D1526] p-5 hover:border-blue-500/40"><Wallet size={23} className="text-blue-400 mb-2" /><h4 className="font-semibold">Deposit</h4></a>
            
            {profile.vip_tier === "None" ? (
              <a href="/vip" className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 hover:border-red-500/40">
                <LockIcon size={23} className="text-red-400 mb-2" />
                <h4 className="font-semibold">Invest (Locked)</h4>
              </a>
            ) : (
              <a href="/invest" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 hover:border-emerald-500/40">
                <Unlock size={23} className="text-emerald-400 mb-2" />
                <h4 className="font-semibold">Invest (Active)</h4>
              </a>
            )}

            <a href="/bonus" className="rounded-2xl border border-white/8 bg-[#0D1526] p-5 hover:border-emerald-500/40"><Gamepad2 size={23} className="text-emerald-400 mb-2" /><h4 className="font-semibold">Bonus Game</h4></a>
            <button onClick={() => setShowReferral(true)} className="rounded-2xl border border-white/8 bg-[#0D1526] p-5 text-left hover:border-emerald-500/40"><Users size={23} className="text-emerald-400 mb-2" /><h4 className="font-semibold">Refer & Earn</h4></button>
          </div>
        </section>

        <section className="mt-9">
          <div className="rounded-2xl border border-white/10 bg-[#0D1526] p-6">
            <div className="flex items-center gap-3 mb-4"><MessageSquare className="h-6 w-6 text-blue-400" /><h3 className="text-lg font-bold">Global Chat</h3></div>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {messages.map(m => (
                <div key={m.id} className={`flex gap-3 text-sm ${m.user === profile.name ? 'justify-end' : 'justify-start'}`}>
                  {m.user !== profile.name && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold">{m.user[0]}</div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${m.user === profile.name ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'}`}>
                    {m.user !== profile.name && <p className="text-xs font-bold text-blue-400 mb-1">{m.user}</p>}
                    <p>{m.text}</p>
                    <p className="text-[10px] text-right mt-1 opacity-70">{m.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="mt-4 flex gap-2">
              <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm outline-none" />
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold"><Send size={18} /></button>
            </form>
          </div>
        </section>
      </main>

      {showReferral && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => e.target === e.currentTarget && setShowReferral(false)}>
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0D1526] p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10"><Gift size={24} className="text-emerald-400" /></div>
                <div><h3 className="text-xl font-bold">Invite & Earn</h3><p className="text-sm text-slate-400">Share your link to earn.</p></div>
              </div>
              <button onClick={() => setShowReferral(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"><X size={20} /></button>
            </div>
            {shareMessage ? (
              <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center"><p className="font-bold text-emerald-400">{shareMessage}</p></div>
            ) : (
              <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/6 p-5">
                <p className="text-sm text-emerald-200">Reward for sharing your link</p>
                <p className="mt-2 text-3xl font-bold text-emerald-300">{formatMoney(1000)} <span className="text-sm font-normal text-emerald-500/70">(First time)</span></p>
                <p className="mt-1 text-sm font-bold text-emerald-300">{formatMoney(200)} <span className="text-xs font-normal text-emerald-500/70">(Subsequent shares)</span></p>
              </div>
            )}
            <div className="mt-6">
              <input readOnly value={`${window.location.origin}/signup?ref=${profile.referral_code || ""}`} onFocus={(e) => e.target.select()} className="w-full rounded-xl border border-white/10 bg-[#070D1A] px-4 py-3 text-sm" />
              <button onClick={handleShare} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-500 transition">
                {copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Link Copied!" : "Share & Copy Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.07] bg-[#070D1A]/95 px-2 py-2 backdrop-blur-xl">
        <div className="mx-auto grid max-w-lg grid-cols-6">
          <a href="/home" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-blue-500/10 text-xs font-semibold text-blue-400"><HomeIcon size={20} />Home</a>
          <a href="/invest" className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-slate-500"><TrendingUp size={20} />Invest</a>
          <a href="/vip" className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-slate-500"><Crown size={20} />VIP</a>
          <a href="/bonus" className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-slate-500"><Gamepad2 size={20} />Bonus</a>
          <a href="/withdraw" className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-slate-500"><ArrowUpFromLine size={20} />Withdraw</a>
          <a href="/settings" className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-slate-500"><SettingsIcon size={20} />Settings</a>
        </div>
      </nav>
    </div>
  );
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
function AdminDashboard() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const loadWithdrawals = async () => {
    const { data } = await api.getAdminWithdrawals();
    setWithdrawals(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const handleApprove = async (w) => {
    if (!window.confirm(`Approve ₦${w.amount.toLocaleString()} to ${w.account_name} (${w.bank_name})?`)) return;
    setProcessing(w.id);
    await api.approveWithdrawal(w.id, w.user_id, w.amount);
    await loadWithdrawals();
    setProcessing(null);
  };

  const handleReject = async (w) => {
    if (!window.confirm(`Reject withdrawal and refund ₦${w.amount.toLocaleString()}?`)) return;
    setProcessing(w.id);
    await api.rejectWithdrawal(w.id, w.user_id, w.amount);
    await loadWithdrawals();
    setProcessing(null);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#070D1A] p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-slate-400 mt-1">Manage pending withdrawals</p>
          </div>
          <button onClick={() => window.location.href = "/home"} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">Back to App</button>
        </div>

        {withdrawals.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0D1526] p-10 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold">All caught up!</h2>
            <p className="text-slate-400">No pending withdrawals at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((w) => (
              <div key={w.id} className="rounded-2xl border border-white/10 bg-[#0D1526] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-1 rounded">PENDING</span>
                    <span className="text-sm text-slate-400">{new Date(w.created_at).toLocaleString()}</span>
                  </div>
                  <p className="font-bold text-lg">₦{w.amount.toLocaleString()}</p>
                  <p className="text-sm text-slate-300 mt-1">{w.account_name} - {w.account_number} ({w.bank_name})</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => handleApprove(w)} disabled={processing === w.id} className="flex-1 md:flex-none rounded-xl bg-emerald-600 px-6 py-3 font-semibold hover:bg-emerald-500 disabled:opacity-50 text-sm">
                    {processing === w.id ? "..." : "Approve"}
                  </button>
                  <button onClick={() => handleReject(w)} disabled={processing === w.id} className="flex-1 md:flex-none rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 px-6 py-3 font-semibold hover:bg-red-600/20 disabled:opacity-50 text-sm">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ROUTES
// ============================================================
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/terms" element={<Terms />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/vip" element={<VIP />} />
        <Route path="/vip/checkout" element={<VIPCheckout />} />
        <Route path="/invest" element={<Invest />} />
        <Route path="/bonus" element={<BonusGame />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/deposit/payment" element={<DepositPayment />} />
        <Route path="/deposit/card" element={<DepositCard />} />
        <Route path="/deposit/bitcoin" element={<DepositBitcoin />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/withdraw/account" element={<WithdrawAccount />} />
        <Route path="/withdraw/success" element={<WithdrawSuccess />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
        
        {/* SECRET ADMIN ROUTE */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;