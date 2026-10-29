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
  Rocket, Timer, Zap, MessageSquare, Upload, Crown, Unlock, Lock as LockIcon, CheckCircle, RefreshCw
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
    const res = await supabase.auth.signUp({ 
      email, password, options: { data: { name, ref } } 
    });
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
  
  withdraw: async (p) => {
    const { data: { user } } = await supabase.auth.getUser();
    // Deduct immediately to prevent double spending
    const { data: wallet } = await supabase.from("wallets").select("available, total").eq("user_id", user.id).single();
    await supabase.from("wallets").update({ 
      available: (wallet?.available || 0) - p.amount, 
      total: (wallet?.total || 0) - p.amount 
    }).eq("user_id", user.id);
    
    const r = await call("index/withdraw-request", p);
    
    await supabase.from("transactions").insert({ user_id: user.id, type: "withdraw", amount: p.amount, status: "pending", reference: `WD-${Date.now()}` });
    return r;
  },
  
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
    const { data: referrals } = await supabase.from("profiles").select("*").eq("referred_by", user.id);
    if (!referrals || referrals.length === 0) return { error: "No one has used your link yet." };

    const { data: profile } = await supabase.from("profiles").select("referral_earnings").eq("id", user.id).single();
    const expectedEarnings = referrals.length * 1000; 
    const currentEarnings = profile?.referral_earnings || 0;
    if (currentEarnings >= expectedEarnings) return { error: "You have already been rewarded for your referrals." };

    const amountToPay = expectedEarnings - currentEarnings;
    await supabase.from("profiles").update({ referral_earnings: expectedEarnings }).eq("id", user.id);
    const { data: wallet } = await supabase.from("wallets").select("available, total").eq("user_id", user.id).single();
    await supabase.from("wallets").update({ available: (wallet?.available || 0) + amountToPay, total: (wallet?.total || 0) + amountToPay }).eq("user_id", user.id);
    await supabase.from("transactions").insert({ user_id: user.id, type: "referral_bonus", amount: amountToPay, status: "success", reference: `REF-${Date.now()}` });
    await supabase.from("notifications").insert({ user_id: user.id, title: "Referral Bonus", message: `You earned ₦${amountToPay} for your referrals!`, type: "referral" });
    return { amount: amountToPay };
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
// BRANDED LOADING & TOAST
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

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] rounded-2xl border border-emerald-500/30 bg-[#0D1526] px-6 py-4 shadow-2xl backdrop-blur-xl flex items-center gap-3">
      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
      <p className="text-sm font-semibold text-white">{message}</p>
    </div>
  );
};

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
// HOME PAGE (GOLD VIP, FIXED CRASHES)
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
  const [toastMsg, setToastMsg] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [showReferral, setShowReferral] = useState(false);
  const [copied, setCopied] = useState(false);

  const [messages, setMessages] = useState([
    { id: 1, user: "PrimeVest Bot", text: "Welcome to the Global Chat! 🚀", time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { id: 2, user: "Chinedu O.", text: "Just claimed my daily ₦300! PrimeVest is paying 🔥", time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
  ]);
  const [newMsg, setNewMsg] = useState("");

  const isVip = profile.vip_tier && profile.vip_tier !== "None";

  const formatMoney = (amount) => {
    if (!amount) return isUsd ? "$0.00" : "₦0.00";
    if (isUsd) return `$${(amount / 1500).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    let { data: w, error } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
    if (error || !w) {
      await supabase.from("wallets").insert({ user_id: user.id, available: 0, total: 0, invested: 0, earnings: 0 });
      const retry = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
      w = retry.data;
    }

    const pendingTier = localStorage.getItem('pending_vip_tier');
    const pendingPrice = localStorage.getItem('pending_vip_price');
    if (pendingTier && pendingPrice) {
      await api.upgradeVIP(pendingTier, Number(pendingPrice));
      localStorage.removeItem('pending_vip_tier');
      localStorage.removeItem('pending_vip_price');
      setToastMsg(`Success! You are now ${pendingTier}. Bonus added to wallet.`);
      w = (await supabase.from("wallets").select("*").eq("user_id", user.id).single()).data;
    }

    const [p, i, n] = await Promise.all([api.profile(), api.portfolio(), api.notifications()]);
    if (w) setWallet(w);
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
    setToastMsg("You have claimed your bonus of ₦100!");
    loadData();
  }

  async function handleShare() {
    const link = `${window.location.origin}/signup?ref=${profile.referral_code || ""}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    const res = await api.rewardReferral();
    if (res.amount) {
      setShareMessage(`Success! You earned ₦${res.amount.toLocaleString()} for your referrals.`);
      loadData();
    } else if (res.error) {
      setShareMessage(res.error);
    }
    setTimeout(() => { setCopied(false); }, 3000);
  }

  function sendMessage(e) {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), user: profile.name, text: newMsg, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
    setNewMsg("");
  }

  if (loading) return <LoadingScreen />;

  return (
    <div className={`min-h-screen pb-28 text-white relative transition-colors duration-500 ${isVip ? 'bg-[#140F00]' : 'bg-[#070D1A]'}`}>
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

      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-500 ${isVip ? 'border-amber-500/20 bg-[#140F00]/95' : 'border-white/6 bg-[#070D1A]/95'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Prime<span className={isVip ? "text-amber-400" : "text-blue-400"}>Vest</span></h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsUsd(!isUsd)} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
              <Globe2 size={14} className={isVip ? "text-amber-400" : "text-blue-400"} /> {isUsd ? "USD" : "NGN"}
            </button>
            <button onClick={() => setShowNotifs(!showNotifs)} className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <Bell size={18} />
              {notifications.filter(n => !n.read).length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{notifications.filter(n => !n.read).length}</span>}
            </button>
            <div className={`relative h-10 w-10 rounded-full border overflow-hidden flex items-center justify-center ml-2 ${isVip ? 'border-amber-400/50 bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'border-blue-400/30 bg-blue-500/20'}`}>
              {profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" /> : <User size={16} className={isVip ? "text-amber-300" : "text-blue-300"} />}
              
              {/* VIP CROWN ON PROFILE */}
              {isVip && (
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 shadow-sm">
                  <Crown size={12} className="text-black" />
                </div>
              )}
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
          
          {/* MAIN BALANCE CARD - CHANGES TO GOLD IF VIP */}
          <div className={`rounded-2xl border p-6 transition-all duration-500 ${
            isVip 
              ? 'border-amber-400/30 bg-gradient-to-br from-[#2A1D00] via-[#5C4300] to-[#8A6600] shadow-[0_0_30px_rgba(245,158,11,0.15)]' 
              : 'border-blue-400/20 bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 text-sm ${isVip ? 'text-amber-100' : 'text-blue-100'}`}>
                <Wallet size={19} />Total Balance
                {isVip && <Crown size={16} className="text-amber-400" />}
              </div>
              <button onClick={() => setBalanceVisible(!balanceVisible)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition">
                {balanceVisible ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <h3 className={`mt-6 text-3xl font-bold sm:text-4xl ${isVip ? 'text-amber-50' : 'text-white'}`}>
              {balanceVisible ? formatMoney(wallet.total + liveAccrual) : (isUsd ? "$ ••••" : "₦ ••••")}
            </h3>
            <p className={`mt-3 text-sm ${isVip ? 'text-amber-200/80' : 'text-blue-100/80'}`}>
              Available: {balanceVisible ? formatMoney(wallet.available) : (isUsd ? "$ •••" : "₦ •••")}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <a href="/deposit" className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${isVip ? 'bg-amber-100 text-amber-950 hover:bg-white' : 'bg-white text-blue-900 hover:bg-blue-50'}`}><ArrowDownToLine size={18} />Deposit</a>
              <a href="/withdraw" className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${isVip ? 'border-amber-400/30 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30' : 'border-white/30 bg-white/10 hover:bg-white/20'}`}><ArrowUpFromLine size={18} />Withdraw</a>
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className={`rounded-2xl border bg-[#0D1526] p-5 ${isVip ? 'border-amber-500/10' : 'border-white/8'}`}>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isVip ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
                <TrendingUp size={22} className={isVip ? 'text-amber-400' : 'text-blue-400'} />
              </div>
              <p className="mt-5 text-sm text-slate-400">Invested</p>
              <h3 className="mt-2 text-2xl font-bold">{balanceVisible ? formatMoney(wallet.invested) : (isUsd ? "$ •••" : "₦ •••")}</h3>
            </div>
            <div className={`rounded-2xl border bg-[#0D1526] p-5 ${isVip ? 'border-amber-500/10' : 'border-white/8'}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                <CircleDollarSign size={22} className="text-emerald-400" />
              </div>
              <p className="mt-5 text-sm text-slate-400">Earnings {affiliateInv && <span className="text-emerald-400 text-xs ml-2 animate-pulse">● Live</span>}</p>
              <h3 className="mt-2 text-2xl font-bold text-emerald-400">{balanceVisible ? formatMoney(wallet.earnings + liveAccrual) : (isUsd ? "$ •••" : "₦ •••")}</h3>
            </div>
          </div>
        </section>

        <section className="mt-9">
          <h3 className="mb-5 text-lg font-semibold">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <a href="/deposit" className={`rounded-2xl border bg-[#0D1526] p-5 ${isVip ? 'border-amber-500/10 hover:border-amber-500/40' : 'border-white/8 hover:border-blue-500/40'}`}>
              <Wallet size={23} className={`mb-2 ${isVip ? 'text-amber-400' : 'text-blue-400'}`} />
              <h4 className="font-semibold">Deposit</h4>
            </a>
            
            {profile.vip_tier === "None" ? (
              <a href="/vip" className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 hover:border-red-500/40">
                <LockIcon size={23} className="text-red-400 mb-2" />
                <h4 className="font-semibold">Invest (Locked)</h4>
              </a>
            ) : (
              <a href="/invest" className={`rounded-2xl border p-5 ${isVip ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60' : 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40'}`}>
                <Unlock size={23} className={`mb-2 ${isVip ? 'text-amber-400' : 'text-emerald-400'}`} />
                <h4 className="font-semibold">Invest (Active)</h4>
              </a>
            )}

            <a href="/bonus" className={`rounded-2xl border bg-[#0D1526] p-5 ${isVip ? 'border-amber-500/10 hover:border-amber-500/40' : 'border-white/8 hover:border-emerald-500/40'}`}>
              <Gamepad2 size={23} className={`mb-2 ${isVip ? 'text-amber-400' : 'text-emerald-400'}`} />
              <h4 className="font-semibold">Bonus Game</h4>
            </a>
            <button onClick={() => setShowReferral(true)} className={`rounded-2xl border bg-[#0D1526] p-5 text-left ${isVip ? 'border-amber-500/10 hover:border-amber-500/40' : 'border-white/8 hover:border-emerald-500/40'}`}>
              <Users size={23} className={`mb-2 ${isVip ? 'text-amber-400' : 'text-emerald-400'}`} />
              <h4 className="font-semibold">Refer & Earn</h4>
            </button>
          </div>
        </section>

        <section className="mt-9">
          <div className={`rounded-2xl border bg-[#0D1526] p-6 ${isVip ? 'border-amber-500/10' : 'border-white/10'}`}>
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className={`h-6 w-6 ${isVip ? 'text-amber-400' : 'text-blue-400'}`} />
              <h3 className="text-lg font-bold">Global Chat</h3>
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {messages.map(m => (
                <div key={m.id} className={`flex gap-3 text-sm ${m.user === profile.name ? 'justify-end' : 'justify-start'}`}>
                  {m.user !== profile.name && (
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${isVip ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>{m.user[0]}</div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${m.user === profile.name ? (isVip ? 'bg-amber-600 text-white rounded-tr-sm' : 'bg-blue-600 text-white rounded-tr-sm') : 'bg-slate-800 text-slate-200 rounded-tl-sm'}`}>
                    {m.user !== profile.name && <p className={`text-xs font-bold mb-1 ${isVip ? 'text-amber-400' : 'text-blue-400'}`}>{m.user}</p>}
                    <p>{m.text}</p>
                    <p className="text-[10px] text-right mt-1 opacity-70">{m.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="mt-4 flex gap-2">
              <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm outline-none" />
              <button type="submit" className={`rounded-xl px-4 py-3 text-sm font-semibold ${isVip ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'}`}><Send size={18} /></button>
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
            
            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/6 p-5">
              <p className="text-sm text-emerald-200">Reward for sharing your link</p>
              <p className="mt-2 text-3xl font-bold text-emerald-300">{formatMoney(1000)} <span className="text-sm font-normal text-emerald-500/70">(Per person)</span></p>
            </div>

            {shareMessage && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                <p className="font-bold text-emerald-400 text-sm">{shareMessage}</p>
              </div>
            )}

            <div className="mt-6">
              <input readOnly value={`${window.location.origin}/signup?ref=${profile.referral_code || ""}`} onFocus={(e) => e.target.select()} className="w-full rounded-xl border border-white/10 bg-[#070D1A] px-4 py-3 text-sm" />
              <div className="mt-3 flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${profile.referral_code || ""}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800 py-3 font-semibold hover:bg-slate-700 transition">
                  {copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Copied!" : "Copy Link"}
                </button>
                <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold hover:bg-emerald-500 transition">
                  <RefreshCw size={18} /> Check Rewards
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t px-2 py-2 backdrop-blur-xl transition-colors duration-500 ${isVip ? 'border-amber-500/20 bg-[#140F00]/95' : 'border-white/[0.07] bg-[#070D1A]/95'}`}>
        <div className="mx-auto grid max-w-lg grid-cols-6">
          <a href="/home" className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold ${isVip ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}><HomeIcon size={20} />Home</a>
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