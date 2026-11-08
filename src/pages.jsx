import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CreditCard, Bitcoin, Building2, Wallet, Check, Copy, LockKeyhole,
  ChevronDown, Search, Loader2, CheckCircle2, Headphones, Mail, Crown, ArrowRight,
  TrendingUp, Timer, Rocket, Zap, HelpCircle, LogOut, User, Gamepad2, Home as HomeIcon,
  Settings as SettingsIcon, ArrowUpFromLine, ShieldCheck, Lock as LockIcon, Clock,
  Gift, Download, MessageSquare, UserPlus, Send, Clock3
} from "lucide-react";
import { api, supabase } from "./app";

export const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] rounded-2xl border border-emerald-500/30 bg-[#0D1526] px-6 py-4 shadow-2xl backdrop-blur-xl flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
      </div>
      <p className="text-sm font-semibold text-white">{message}</p>
    </div>
  );
};

/* =========================== DEPOSIT & WITHDRAW =========================== */
export function Deposit() {
  const [amount, setAmount] = useState("");
  const [region, setRegion] = useState("Nigeria");
  const [error, setError] = useState("");
  const handleContinue = () => {
    const n = Number(amount);
    if (!n || n <= 0) return setError("Enter a valid amount.");
    if (n < 7500) return setError("Minimum ₦7,500.");
    if (region !== "Nigeria") window.location.href = `/deposit/bitcoin?amount=${n}`;
    else window.location.href = `/deposit/payment?amount=${n}`;
  };
  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95">
        <div className="mx-auto flex h-20 max-w-5xl items-center gap-4 px-4">
          <a href="/home" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"><ArrowLeft className="h-5 w-5" /></a>
          <div><h1 className="text-xl font-bold">Deposit</h1></div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">Note: If you can't use Paystack, use Bitcoin for faster transactions.</div>
        <div className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 p-6">
          <Wallet className="h-8 w-8 text-blue-200" />
          <p className="mt-6 text-sm text-blue-200">Minimum Deposit</p>
          <h2 className="mt-2 text-4xl font-bold">₦7,500.00</h2>
        </div>
        <div className="mt-6 rounded-3xl border border-blue-400/10 bg-slate-900 p-6">
          <label className="mb-2 block text-sm text-slate-300">Select Region</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="mb-6 w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 outline-none">
            <option value="Nigeria">Nigeria (Paystack)</option>
            <option value="USA">USA (Bitcoin)</option>
            <option value="UK">UK (Bitcoin)</option>
            <option value="Europe">Europe (Bitcoin)</option>
          </select>
          <label className="mb-2 block text-sm text-slate-300">Amount (NGN)</label>
          <div className="flex rounded-xl border border-blue-400/10 bg-slate-950">
            <span className="flex items-center px-4 text-slate-400">₦</span>
            <input value={amount} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) { setAmount(e.target.value); setError(""); } }} placeholder="7,500" className="w-full bg-transparent px-2 py-4 outline-none" />
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-500/5 p-3 text-sm text-red-300">{error}</p>}
          <button onClick={handleContinue} className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-semibold">Continue</button>
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
          <a href="/deposit" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"><ArrowLeft className="h-5 w-5" /></a>
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
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10"><CreditCard className="h-7 w-7 text-blue-400" /></div>
            <div><h3 className="font-semibold">Card / Transfer (Paystack)</h3></div>
          </a>
          <a href={`/deposit/bitcoin?amount=${amount}`} className="flex items-center gap-4 rounded-2xl border border-blue-400/10 bg-slate-900 p-5 hover:border-amber-500">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10"><Bitcoin className="h-7 w-7 text-amber-400" /></div>
            <div><h3 className="font-semibold">Bitcoin</h3></div>
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
    const r = await api.depositInit(amount, "card", user.email);
    setLoading(false);
    if (r?.authorization_url) window.location.href = r.authorization_url;
    else if (r?.url) window.location.href = r.url;
    else setError(r?.error || "Failed to initialize payment.");
  }

  return (
    <div className="min-h-screen bg-[#070D1A] pb-24 text-white">
      <header className="border-b border-white/5 bg-[#070D1A]/95">
        <div className="mx-auto flex h-20 max-w-5xl items-center gap-4 px-5">
          <a href={`/deposit/payment?amount=${amount}`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"><ArrowLeft size={19} /></a>
          <h1 className="text-lg font-semibold">Card Payment</h1>
        </div>
      </header>
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5">
        <div className="w-full max-w-xl rounded-2xl border border-white/8 bg-[#0D1526] p-6">
          {error && <div className="mt-4 rounded-xl bg-red-500/5 p-4 text-sm text-red-300">{error}</div>}
          <button onClick={pay} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold disabled:opacity-60">
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
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const fmt = amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const r = await api.depositInit(amount, "bitcoin", user.email);
      if (r?.btc_address) setAddress(r.btc_address);
      else setError(r?.error || "Failed.");
      setLoading(false);
    })();
  }, [amount]);
  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95">
        <div className="mx-auto flex h-20 max-w-2xl items-center gap-4 px-4">
          <a href={`/deposit`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"><ArrowLeft className="h-5 w-5" /></a>
          <h1 className="text-xl font-bold">Bitcoin Deposit</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-amber-950 to-amber-700 p-6">
          <Bitcoin className="h-8 w-8 text-amber-200" />
          <p className="mt-6 text-sm text-amber-200">Amount</p>
          <h2 className="mt-2 text-3xl font-bold">₦{fmt}</h2>
        </div>
        <div className="mt-6 rounded-3xl border border-blue-400/10 bg-slate-900 p-6">
          {error && <p className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
          {loading ? <p className="text-sm text-slate-400">Generating...</p> : address ? (
            <>
              <p className="text-xs text-slate-500">BTC Address</p>
              <p className="mt-2 break-all font-mono text-sm">{address}</p>
              <button onClick={async () => { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold">
                {copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy Address"}
              </button>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export function Withdraw() {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(0);
  useEffect(() => { api.wallet().then(({ data }) => data && setBalance(data.available)); }, []);

  const next = () => {
    const n = Number(amount);
    if (!n || n < 14500) return setError("Minimum withdrawal is ₦14,500.");
    if (n > 50000) return setError("Maximum withdrawal is ₦50,000.");
    if (n > balance) return setError(`Insufficient. Available ₦${balance.toLocaleString()}`);
    window.location.href = `/withdraw/account?amount=${n}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95">
        <div className="mx-auto flex h-20 items-center gap-4 px-4 max-w-2xl">
          <a href="/home" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"><ArrowLeft className="h-5 w-5" /></a>
          <h1 className="text-xl font-bold">Withdraw</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-blue-400/10 bg-blue-950/30 p-5">
          <p className="text-sm text-slate-400">Available</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">₦{balance.toLocaleString()}</p>
        </div>
        <div className="mt-6 rounded-3xl border border-blue-400/10 bg-slate-900 p-6">
          <label className="mb-2 block text-sm">Amount (Min ₦14,500 - Max ₦50,000)</label>
          <div className="flex rounded-xl border border-blue-400/10 bg-slate-950">
            <span className="flex items-center px-4 text-slate-400">₦</span>
            <input value={amount} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) { setAmount(e.target.value); setError(""); } }} placeholder="14,500" className="w-full bg-transparent px-2 py-4 outline-none" />
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-500/5 p-3 text-sm text-red-300">{error}</p>}
          <button onClick={next} className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-semibold">Continue</button>
        </div>
      </main>
    </div>
  );
}

const NIGERIAN_BANKS = [
  "Access Bank", "Citibank", "Ecobank", "Fidelity Bank", "First Bank", "First City Monument Bank (FCMB)", 
  "Globus Bank", "Guaranty Trust Bank (GTB)", "Heritage Bank", "Jaiz Bank", "Keystone Bank", "Lotus Bank", 
  "Parallex Bank", "Polaris Bank", "Premium Trust Bank", "Providus Bank", "Stanbic IBTC Bank", "Standard Chartered", 
  "Sterling Bank", "SunTrust Bank", "Union Bank", "United Bank for Africa (UBA)", "Unity Bank", "Wema Bank", "Zenith Bank", 
  "Opay", "Palmpay", "Moniepoint", "Kuda", "PocketApp", "Carbon", "VFD Microfinance Bank"
];

export function WithdrawAccount() {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState("");

  const params = new URLSearchParams(window.location.search);
  const amount = Number(params.get("amount") || 0);
  const fmt = amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });

  async function proceed() {
    if (!bankName || !accountNumber || !accountName) return setError("Please fill in all fields.");
    
    const isValidBank = NIGERIAN_BANKS.some(b => b.toLowerCase().includes(bankName.toLowerCase()) || bankName.toLowerCase().includes(b.toLowerCase()));
    if (!isValidBank) return setError("Bank not recognized. Please use a valid Nigerian bank.");
    
    if (accountNumber.length !== 10) return setError("Account number must be exactly 10 digits.");
    
    const nameParts = accountName.trim().split(" ");
    if (nameParts.length < 2 || !/^[a-zA-Z\s]+$/.test(accountName)) {
      return setError("Please enter your full legal name (First and Last name).");
    }

    setSubmitting(true);
    setError("");

    const r = await api.withdraw({
      amount,
      bank_name: bankName,
      bank_code: "manual",
      account_number: accountNumber,
      account_name: accountName,
    });

    setSubmitting(false);
    if (r?.success) setShowPopup(true);
    else setError(r?.error || "Failed to submit request. Please try again.");
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95">
        <div className="mx-auto flex h-20 items-center gap-4 px-4 max-w-2xl">
          <a href="/withdraw" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"><ArrowLeft className="h-5 w-5" /></a>
          <h1 className="text-xl font-bold">Withdrawal Details</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-3xl bg-gradient-to-br from-blue-950 to-blue-700 p-6 text-center">
          <p className="text-sm text-blue-200">Amount to Withdraw</p>
          <h2 className="mt-2 text-4xl font-bold">₦{fmt}</h2>
        </div>
        <div className="mt-6 rounded-3xl border border-blue-400/10 bg-slate-900 p-6">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Bank Name</label>
            <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. GTBank" className="w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Account Number</label>
            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" className="w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">Account Name</label>
            <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Full Name" className="w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 text-sm outline-none focus:border-blue-500" />
          </div>
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
          <button onClick={proceed} disabled={submitting} className="w-full rounded-xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-900/30 disabled:opacity-40 transition-all">
            {submitting ? "Processing..." : "Confirm Withdrawal"}
          </button>
        </div>
      </main>

      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-[#0D1526] p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Request Submitted</h3>
            <p className="text-sm text-slate-300 mb-6">
              Your transaction will be completed within <strong>3 hours</strong>. The admin will verify your VIP plan and investment schedule.
            </p>
            <button onClick={() => window.location.href = `/withdraw/success?amount=${amount}&bank=${encodeURIComponent(bankName)}&accountName=${encodeURIComponent(accountName)}`} className="w-full rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-500 transition">
              View Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function WithdrawSuccess() {
  const p = new URLSearchParams(window.location.search);
  const amount = p.get("amount") || "0";
  const bank = p.get("bank") || "Bank";
  const accountName = p.get("accountName") || "";
  const fmt = Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 });
  const [timeLeft, setTimeLeft] = useState("3h 0m 0s");

  useEffect(() => {
    const endTime = Date.now() + 3 * 60 * 60 * 1000;
    const tick = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) setTimeLeft("Processing...");
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
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#2A1D00] to-[#0A0A0A] p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.15)]">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 shadow-lg">
            <Clock className="h-10 w-10 text-black" />
          </div>
        </div>
        
        <p className="text-sm font-bold uppercase tracking-widest text-amber-400">Transfer Pending</p>
        <h1 className="mt-2 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">₦{fmt}</h1>
        
        <div className="mt-6 rounded-xl border border-amber-500/20 bg-black/40 p-4 text-sm">
          <p className="text-slate-400">To: <span className="font-semibold text-white">{accountName}</span></p>
          <p className="text-slate-400 mt-1">Bank: <span className="font-semibold text-white">{bank}</span></p>
        </div>

        <div className="mt-8 rounded-xl bg-amber-500/10 p-4 border border-amber-500/20">
          <p className="text-xs text-amber-200 uppercase tracking-widest font-bold mb-1">Time Remaining</p>
          <p className="text-2xl font-mono font-bold text-amber-400">{timeLeft}</p>
        </div>

        <p className="mt-6 text-xs text-slate-400">Your funds are being processed and will arrive in your bank account shortly.</p>
        <a href="/home" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white text-black px-6 py-3 text-sm font-bold hover:bg-gray-200">
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}

/* =========================== VIP & INVEST =========================== */

export function VIP() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1500] to-black pb-24 text-white">
      <header className="border-b border-amber-500/20 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex h-20 items-center gap-4 px-4 max-w-2xl">
          <a href="/home" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white"><ArrowLeft className="h-5 w-5" /></a>
          <h1 className="text-xl font-bold text-amber-400">VIP Membership</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 mb-4 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <Crown size={40} className="text-amber-400" />
          </div>
          <h2 className="text-3xl font-bold text-amber-400">Upgrade to VIP</h2>
          <p className="mt-2 text-amber-200/60">Unlock higher returns, faster withdrawals, and an instant investment bonus.</p>
        </div>
        <div className="space-y-4">
          <button onClick={() => navigate(`/vip/checkout?tier=VIP 1&price=4500&bonus=5000`)} className="w-full rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500 to-yellow-600 p-6 text-left transition hover:scale-[1.02] shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xl font-black text-black">VIP 1 (Entry)</p>
              <p className="text-xl font-black text-black">₦4,500</p>
            </div>
            <p className="text-sm font-bold text-black/80">+ ₦5,000 Investment Bonus</p>
          </button>
          <button onClick={() => navigate(`/vip/checkout?tier=VIP 2&price=8500&bonus=10000`)} className="w-full rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-400 to-yellow-500 p-6 text-left transition hover:scale-[1.02] shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xl font-black text-black">VIP 2 (Pro)</p>
              <p className="text-xl font-black text-black">₦8,500</p>
            </div>
            <p className="text-sm font-bold text-black/80">+ ₦10,000 Investment Bonus</p>
          </button>
          <button onClick={() => navigate(`/vip/checkout?tier=VIP 3&price=15000&bonus=17000`)} className="w-full rounded-2xl border border-amber-500/40 bg-gradient-to-r from-yellow-400 to-amber-600 p-6 text-left transition hover:scale-[1.02] shadow-[0_0_20px_rgba(245,158,11,0.5)]">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xl font-black text-black">VIP 3 (Elite)</p>
              <p className="text-xl font-black text-black">₦15,000</p>
            </div>
            <p className="text-sm font-bold text-black/80">+ ₦17,000 Investment Bonus</p>
          </button>
        </div>
      </main>
    </div>
  );
}

export function VIPCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const params = new URLSearchParams(window.location.search);
  const tier = params.get("tier");
  const price = Number(params.get("price"));

  async function pay() {
    setLoading(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const r = await api.depositInit(price, "card", user.email, true);
    setLoading(false);
    if (r?.authorization_url) {
      localStorage.setItem("pending_vip_tier", tier);
      localStorage.setItem("pending_vip_price", price);
      window.location.href = r.authorization_url;
    } else if (r?.url) {
      localStorage.setItem("pending_vip_tier", tier);
      localStorage.setItem("pending_vip_price", price);
      window.location.href = r.url;
    } else {
      setError(r?.error || "Failed to initialize payment.");
    }
  }

  return (
    <div className="min-h-screen bg-[#070D1A] pb-24 text-white">
      <header className="border-b border-amber-500/20 bg-[#070D1A]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-xl items-center gap-4 px-4">
          <a href="/vip" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"><ArrowLeft size={19} /></a>
          <h1 className="text-xl font-bold text-amber-400">VIP Checkout</h1>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-amber-900 to-black border border-amber-500/30 p-6 text-center shadow-2xl">
          <Crown className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <p className="text-sm text-amber-200 uppercase tracking-widest font-bold">Upgrading To</p>
          <h2 className="mt-2 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">{tier}</h2>
          <p className="mt-4 text-3xl font-bold">₦{price.toLocaleString()}</p>
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#0D1526] p-6">
          <h3 className="font-bold mb-4">Payment Method</h3>
          {error && <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          <button onClick={pay} disabled={loading} className="flex w-full items-center justify-between rounded-xl bg-amber-600 px-5 py-4 font-bold text-black transition hover:bg-amber-500 disabled:opacity-60">
            <div className="flex items-center gap-3">
              <CreditCard size={22} />
              <span>Pay with Paystack</span>
            </div>
            {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
          </button>
          <p className="mt-4 text-xs text-center text-slate-500">Secure payment powered by Paystack. Once successful, your VIP status and bonus will be applied instantly.</p>
        </div>
      </main>
    </div>
  );
}

export function Invest() {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [cryptoPeriod, setCryptoPeriod] = useState("30 Days");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState(null);
  const [profile, setProfile] = useState({ vip_tier: "None" });
  const [wallet, setWallet] = useState({ available: 0 });
  const [recentInvestment, setRecentInvestment] = useState(null);

  const estateImages = [
    { name: "Standard Estate", img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=600", rate: 8 },
    { name: "Classic Duplex", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600", rate: 10 },
    { name: "Modern Villa", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600", rate: 12 },
    { name: "Luxury Mansion", img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=600", rate: 15 },
    { name: "Oceanfront Villa", img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=600", rate: 18 },
    { name: "Prime Commercial Tower", img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600", rate: 22 },
  ];

  useEffect(() => {
    api.plans().then(({ data }) => setPlans(data || []));
    api.profile().then(({ data }) => data && setProfile(data));
    api.wallet().then(({ data }) => data && setWallet(data));
    
    api.portfolio().then(({ data }) => {
      if (data && data.length > 0) {
        const recent = data.find(inv => {
          const timeDiff = Date.now() - new Date(inv.started_at).getTime();
          return timeDiff < 86400000; 
        });
        if (recent) setRecentInvestment(recent);
      }
    });
  }, []);

  async function submit() {
    setError("");
    if (profile.vip_tier === "None") return setError("You must upgrade to VIP before investing.");
    if (recentInvestment) return setError(`You can only invest once per day. Your last investment was on ${new Date(recentInvestment.started_at).toLocaleDateString()}.`);

    const n = Number(amount);
    const minAmt = selected?.min_amount || 3000;
    
    if (!n || n < minAmt) return setError(`Minimum investment is ₦${minAmt.toLocaleString()}`);
    if (n > wallet.available) return setError(`Insufficient funds. Your wallet balance is ₦${wallet.available.toLocaleString()}`);

    setSubmitting(true);
    let matured_at = null;
    if (selected.name === "Crypto Index") {
      const days = cryptoPeriod === "30 Days" ? 30 : cryptoPeriod === "3 Months" ? 90 : cryptoPeriod === "6 Months" ? 180 : 365;
      matured_at = new Date(Date.now() + days * 86400000).toISOString();
    }
    const r = await api.invest(selected.id, n, 0, matured_at);
    setSubmitting(false);

    if (r?.success) {
      if (selected.name === "Real Estate") setPopup("Your money will grow in the next 4 weeks");
      else window.location.href = "/portfolio";
    } else {
      setError(r?.error || "Failed to process investment.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95 p-4 flex justify-between items-center">
        <a href="/home" className="inline-flex items-center gap-2"><ArrowLeft size={18} /> Back</a>
        <p className="text-sm font-bold text-emerald-400">Available: ₦{wallet.available.toLocaleString()}</p>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Choose an investment</h2>

        {profile.vip_tier === "None" && (
          <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 flex items-center justify-between">
            <span>You must upgrade to VIP to access these investments.</span>
            <Link to="/vip" className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm">Go VIP</Link>
          </div>
        )}

        {recentInvestment && (
          <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-300">
            <p className="font-bold">Daily Limit Reached</p>
            <p className="text-sm mt-1">You can only invest once per day. You invested on {new Date(recentInvestment.started_at).toLocaleString()}.</p>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {plans.map((p) => (
            <div key={p.id} className={`rounded-2xl border border-blue-400/10 bg-slate-900 p-6 flex flex-col relative overflow-hidden ${profile.vip_tier === "None" || recentInvestment ? "opacity-60" : ""}`}>
              {(profile.vip_tier === "None" || recentInvestment) && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><LockIcon size={16} /> {recentInvestment ? "1 Per Day Limit" : "VIP Required"}</span>
                </div>
              )}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{p.type}</p>
              <p className="text-sm mt-3">Return: <span className="font-semibold text-blue-400">{p.expected_return}%</span></p>
              <p className="text-xs text-slate-500 mt-1">Min: ₦{Number(p.min_amount).toLocaleString()}</p>
              <button onClick={() => { if (profile.vip_tier !== "None" && !recentInvestment) { setSelected(p); setAmount(""); setError(""); } }} disabled={profile.vip_tier === "None" || !!recentInvestment} className="mt-6 rounded-xl bg-blue-600 py-3 text-sm font-semibold w-full disabled:bg-slate-800">Select Plan</button>
            </div>
          ))}
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0D1526] p-6 my-auto">
            <h3 className="text-xl font-bold">Invest in {selected.name}</h3>
            <div className="mt-4">
              <label className="text-sm mb-1 block">Amount</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Min ${selected.min_amount}`} className="w-full rounded-xl bg-slate-950 px-4 py-3 outline-none" />
            </div>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 rounded-xl border border-white/10 py-3">Cancel</button>
              <button onClick={submit} disabled={submitting} className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold disabled:opacity-60">{submitting ? "..." : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}

      {popup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 text-center">
            <h3 className="text-xl font-bold text-green-400">Success!</h3>
            <p className="mt-2 text-sm text-slate-300">{popup}</p>
            <button onClick={() => { setPopup(null); window.location.href = "/portfolio"; }} className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold">OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================== BONUS GAME & SCRATCH & MYSTERY =========================== */

export function BonusGame() {
  const [points, setPoints] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [clickSpeed, setClickSpeed] = useState(0);
  const [toastMsg, setToastMsg] = useState("");
  const [emojis, setEmojis] = useState([]);
  const clicks = useRef([]);
  const moneyValue = Math.floor(points / 2);
  const goal = 1000;

  const handleTap = (e) => {
    setPoints((p) => p + 1);
    const now = Date.now();
    clicks.current.push(now);
    clicks.current = clicks.current.filter((t) => now - t < 1000);
    const currentSpeed = clicks.current.length;
    setClickSpeed(currentSpeed);

    if (currentSpeed >= 4 && Math.random() > 0.3) {
      const emojiList = ["😂", "🤣", "💨", "😮", "🔥"];
      const randomEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
      
      const rect = e.target.getBoundingClientRect();
      const x = rect.left + Math.random() * rect.width;
      const y = rect.top + Math.random() * rect.height;

      const newEmoji = {
        id: Date.now() + Math.random(),
        emoji: randomEmoji,
        x,
        y,
        size: 40 + Math.random() * 40,
      };

      setEmojis((prev) => [...prev, newEmoji]);

      setTimeout(() => {
        setEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
      }, 1500);
    }
  };

  const handleClaim = async () => {
    if (points < goal) return;
    setClaiming(true);
    await api.claimBonus(moneyValue);
    setClaiming(false);
    setToastMsg(`You have claimed ₦${moneyValue}! It will show on your dashboard shortly.`);
    setPoints(0);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      clicks.current = clicks.current.filter((t) => now - t < 1000);
      setClickSpeed(clicks.current.length);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const maxSpeed = 15;
  const speedPercentage = Math.min(clickSpeed / maxSpeed, 1);
  const rotation = -85 + speedPercentage * 170;

  return (
    <div className="min-h-screen bg-[#070D1A] pb-24 text-white flex flex-col items-center justify-center px-4 relative select-none overflow-hidden">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}

      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {emojis.map((e) => (
          <span
            key={e.id}
            className="absolute animate-float-up"
            style={{
              left: e.x,
              top: e.y,
              fontSize: e.size,
              animation: "floatUp 1.5s ease-out forwards",
            }}
          >
            {e.emoji}
          </span>
        ))}
      </div>

      <h1 className="text-2xl font-bold mb-2">Tap to Earn</h1>
      <p className="text-sm text-slate-400 mb-6 text-center px-4">2 points = ₦1</p>

      <div className="w-64 h-32 relative overflow-hidden mb-6 flex justify-center items-end">
        <div className="w-64 h-64 rounded-full border-[12px] border-slate-800 absolute -bottom-32"></div>
        <div className="w-64 h-64 rounded-full border-[12px] border-transparent border-t-emerald-500/50 border-r-amber-500/50 absolute -bottom-32 rotate-[-45deg]"></div>
        <div className="w-64 h-64 rounded-full border-[12px] border-transparent border-r-red-500/50 border-b-red-500/50 absolute -bottom-32 rotate-[45deg]"></div>
        <div className="absolute bottom-0 w-1 h-28 bg-white origin-bottom rounded-t-full transition-transform duration-100 ease-out shadow-[0_0_15px_rgba(255,255,255,0.8)]" style={{ transform: `rotate(${rotation}deg)` }}></div>
        <div className="absolute bottom-0 w-4 h-4 bg-white rounded-full shadow-lg"></div>
        <div className="absolute bottom-4 flex flex-col items-center">
          <span className="text-2xl font-black text-white">{clickSpeed}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">Clicks / Sec</span>
        </div>
      </div>

      <div className="mb-6 flex flex-col items-center">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-extrabold text-blue-400">{points}</span>
          <span className="text-lg text-slate-400">/ {goal}</span>
        </div>
        <p className="mt-2 text-sm text-emerald-400">Value: ₦{moneyValue.toLocaleString()}</p>
      </div>

      <button onClick={handleTap} className="group relative flex h-60 w-60 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-[0_0_50px_rgba(37,99,235,0.5)] active:scale-90 transition-transform z-10">
        <div className="absolute inset-2 rounded-full border-2 border-white/20 border-dashed animate-spin-slow"></div>
        <Wallet className="h-24 w-24 text-white opacity-40 group-hover:opacity-60 transition-opacity" />
      </button>

      <div className="mt-8 w-full max-w-sm z-10">
        <button onClick={handleClaim} disabled={points < goal || claiming} className="w-full rounded-2xl bg-emerald-500 py-4 font-bold text-white shadow-lg shadow-emerald-900/30 disabled:opacity-40 transition-all">
          {claiming ? "Claiming..." : points < goal ? `Claim ₦${moneyValue.toLocaleString()} (Need ${goal - points} more)` : `Claim ₦${moneyValue.toLocaleString()}`}
        </button>
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-150px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function ScratchCard() {
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState(null);
  
  async function buy() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const r = await api.depositInit(1000, "card", user.email, false, "scratch");
    setLoading(false);
    if (r?.authorization_url) window.location.href = r.authorization_url;
  }

  return (
    <div className="min-h-screen bg-[#070D1A] p-6 text-white flex flex-col items-center justify-center">
      <div className="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-[#0D1526] p-8 text-center shadow-2xl">
        <Gift className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Scratch & Win</h1>
        <p className="text-slate-400 text-sm mb-6">Pay ₦1,000 to get a guaranteed ₦500 cash reward instantly!</p>
        
        {reward ? (
          <div className="bg-emerald-500/20 p-4 rounded-xl border border-emerald-500/40 mb-4">
            <p className="text-3xl font-bold text-emerald-400">₦{reward}</p>
            <p className="text-xs text-emerald-200 mt-1">Credited to your wallet!</p>
          </div>
        ) : (
          <button onClick={buy} disabled={loading} className="w-full rounded-xl bg-emerald-600 py-4 font-bold hover:bg-emerald-500 disabled:opacity-50">
            {loading ? "Redirecting..." : "Buy for ₦1,000"}
          </button>
        )}
        <a href="/home" className="mt-6 block text-sm text-slate-400 hover:text-white">Back to Dashboard</a>
      </div>
    </div>
  );
}

export function MysteryBox() {
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState(null);

  async function buy() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const r = await api.depositInit(5000, "card", user.email, false, "mystery");
    setLoading(false);
    if (r?.authorization_url) window.location.href = r.authorization_url;
  }

  return (
    <div className="min-h-screen bg-[#070D1A] p-6 text-white flex flex-col items-center justify-center">
      <div className="w-full max-w-sm rounded-3xl border border-purple-500/30 bg-[#0D1526] p-8 text-center shadow-2xl">
        <Zap className="h-16 w-16 text-purple-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Mystery Box</h1>
        <p className="text-slate-400 text-sm mb-6">Pay ₦5,000 to win a VIP upgrade, an investment plan, or cash!</p>
        
        {reward ? (
          <div className="bg-purple-500/20 p-4 rounded-xl border border-purple-500/40 mb-4">
            <p className="text-xl font-bold text-purple-400">{reward}</p>
          </div>
        ) : (
          <button onClick={buy} disabled={loading} className="w-full rounded-xl bg-purple-600 py-4 font-bold hover:bg-purple-500 disabled:opacity-50">
            {loading ? "Redirecting..." : "Buy for ₦5,000"}
          </button>
        )}
        <a href="/home" className="mt-6 block text-sm text-slate-400 hover:text-white">Back to Dashboard</a>
      </div>
    </div>
  );
}

/* =========================== PORTFOLIO & HISTORY =========================== */

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
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (a) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(a || 0);

  const getTimeLeft = (lastClaim) => {
    if (!lastClaim) return null;
    const next = new Date(lastClaim).getTime() + 86400000;
    const diff = next - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  async function handleClaim(h) {
    if (claimed[h.id]) {
      setToastMsg("You must wait exactly 24 hours between claims.");
      return;
    }

    const canClaim = !h.last_daily_claim || Date.now() - new Date(h.last_daily_claim).getTime() >= 86400000;
    if (!canClaim) { 
      setToastMsg("You must wait exactly 24 hours between claims."); 
      return; 
    }

    setClaimed(prev => ({ ...prev, [h.id]: true }));
    setClaiming(h.id);

    let claimAmount = 0;
    const planName = h.plans?.name || "";
    
    if (planName.includes("Affiliate")) {
      claimAmount = Math.floor(Math.random() * (2000 - 500 + 1) + 500);
    } else {
      const percentage = h.plans.expected_return / 100;
      claimAmount = h.amount * percentage;
    }

    const r = await api.claimInvestment(h.id, claimAmount);
    
    if (r?.success) {
      await load();
      setToastMsg(`You have successfully claimed ${fmt(claimAmount)}!`);
    } else {
      setToastMsg(r?.error || "Failed to claim. Please try again.");
      setClaimed(prev => ({ ...prev, [h.id]: false }));
    }
    setClaiming(null);
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white p-4">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
      <header className="mb-6"><a href="/home" className="inline-flex items-center gap-2"><ArrowLeft size={18} /> Back</a></header>
      <h1 className="text-2xl font-bold mb-4">Active Investments</h1>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {holdings.map((h) => {
          const timeLeft = getTimeLeft(h.last_daily_claim);
          const isLocallyClaimed = claimed[h.id];
          const canClaim = !timeLeft && !isLocallyClaimed;
          
          let displayProfit = 0;
          const planName = h.plans?.name || "";
          if (planName.includes("Affiliate")) {
              displayProfit = 500; 
          } else {
              displayProfit = h.amount * (h.plans.expected_return / 100);
          }

          return (
            <div key={h.id} className="rounded-2xl border border-blue-400/10 bg-slate-900 p-6 flex flex-col justify-between">
              <div>
                <p className="font-bold">{h.plans?.name}</p>
                <p className="text-2xl mt-2">{fmt(h.amount)}</p>
                <p className="text-xs text-slate-500 mt-1">Status: {h.status}</p>
              </div>
              {h.status === "active" && (
                <div className="mt-4">
                  {(!canClaim) && (
                    <p className="text-center text-xs text-amber-400 font-mono mb-2 flex items-center justify-center gap-1">
                      <Timer size={14} /> Next claim in: {timeLeft || "24h 0m 0s"}
                    </p>
                  )}
                  <button 
                    onClick={() => handleClaim(h)} 
                    disabled={!canClaim || claiming === h.id} 
                    className={`w-full rounded-xl py-2 text-sm font-semibold transition-all ${canClaim ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}
                  >
                    {claiming === h.id ? "Claiming..." : canClaim ? `Claim ${planName.includes("Affiliate") ? "Bonus" : fmt(displayProfit)}` : "Wait for timer"}
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
    api.history().then(({ data }) => {
      setHistory(data || []);
      setLoading(false);
    });
  }, []);

  const fmt = (a) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(a || 0);

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white p-4">
      <header className="mb-6 flex items-center gap-4">
        <a href="/settings" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"><ArrowLeft className="h-5 w-5" /></a>
        <h1 className="text-xl font-bold">Transaction History</h1>
      </header>

      <div className="space-y-3">
        {history.length === 0 ? (
          <p className="text-slate-500 text-sm">No transactions yet.</p>
        ) : (
          history.map((tx) => (
            <div key={tx.id} className="rounded-xl border border-white/10 bg-[#0D1526] p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold capitalize">{tx.type.replace("_", " ")}</p>
                <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleString()}</p>
                <p className={`text-xs mt-1 ${tx.status === 'success' ? 'text-emerald-400' : tx.status === 'pending' ? 'text-amber-400' : 'text-red-400'}`}>{tx.status}</p>
              </div>
              <p className={`font-bold ${tx.type === "withdraw" ? "text-red-400" : "text-emerald-400"}`}>
                {tx.type === "withdraw" ? "-" : "+"}{fmt(tx.amount)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* =========================== SETTINGS & CHAT =========================== */

export function Settings() {
  const [profile, setProfile] = useState({ name: "", email: "", avatar_url: "", username: "" });
  const [uploading, setUploading] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [newFriend, setNewFriend] = useState("");
  const [showInstall, setShowInstall] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => { 
    api.profile().then(({ data }) => data && setProfile(data)); 
    api.getFriends().then(({ data }) => setFriends(data || []));
    api.getFriendRequests().then(({ data }) => setRequests(data || []));
    supabase.from("withdrawals").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(1).then(({ data }) => {
      if (data && data.length > 0) setPendingWithdrawal(data[0]);
    });
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!pendingWithdrawal) return;
    const endTime = new Date(pendingWithdrawal.created_at).getTime() + (3 * 60 * 60 * 1000);
    const diff = endTime - Date.now();
    if (diff <= 0) setTimeLeft("Processing...");
    else {
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }
  }, [pendingWithdrawal, timeLeft]);

  async function handleAvatarUpload(e) {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;
      const { data: { user } } = await supabase.auth.getUser();
      const url = await api.uploadAvatar(file, user.id);
      setProfile({ ...profile, avatar_url: url });
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSetUsername() {
    if (usernameInput.length < 3) return alert("Username must be at least 3 characters.");
    const { error } = await api.setUsername(usernameInput);
    if (error) return alert(error);
    alert("Username set successfully!");
    window.location.reload();
  }

  async function handleAddFriend() {
    const { error } = await api.addFriend(newFriend);
    if (error) return alert(error);
    alert("Friend request sent!");
    setNewFriend("");
  }

  async function handleAcceptRequest(reqId) {
    await api.acceptFriendRequest(reqId);
    alert("Friend added!");
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95">
        <div className="mx-auto flex h-20 items-center gap-4 px-4 max-w-2xl">
          <a href="/home" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"><ArrowLeft className="h-5 w-5" /></a>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        
        <button onClick={() => setShowInstall(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg">
          <Download size={20} /> Install PrimeVest App
        </button>

        <div className="rounded-2xl border border-blue-400/10 bg-slate-900 p-5">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-blue-400/30 bg-blue-500/10 flex items-center justify-center">
              {profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" /> : <User className="h-8 w-8 text-blue-400" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{profile.name}</p>
              <p className="text-sm text-slate-500">{profile.email}</p>
              <p className="text-xs text-emerald-400 mt-1">{profile.username ? `@${profile.username}` : "No username set"}</p>
            </div>
            <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold hover:bg-blue-500 transition">
              {uploading ? "Uploading..." : "Upload Photo"}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
        </div>

        {!profile.username && (
          <div className="rounded-2xl border border-amber-500/30 bg-[#1A1500] p-5">
            <h3 className="font-bold text-amber-500 mb-2">Set Your Username</h3>
            <p className="text-sm text-slate-400 mb-4">This is permanent and cannot be changed.</p>
            <div className="flex gap-2">
              <input value={usernameInput} onChange={e => setUsernameInput(e.target.value.replace(/\s/g, ''))} placeholder="john_doe" className="flex-1 rounded-xl bg-slate-950 px-4 py-2 text-white outline-none" />
              <button onClick={handleSetUsername} className="bg-amber-500 text-black px-4 py-2 rounded-xl font-bold">Save</button>
            </div>
          </div>
        )}

        {pendingWithdrawal && (
          <div className="rounded-2xl border border-amber-500/30 bg-[#1A1500] p-5 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-amber-500">Withdrawal Pending</h3>
            </div>
            <p className="text-sm text-slate-300">Your withdrawal of ₦{Number(pendingWithdrawal.amount).toLocaleString()} is being processed.</p>
            <div className="mt-3 flex items-center justify-between bg-black/40 p-3 rounded-xl border border-amber-500/20">
              <span className="text-xs text-slate-400">Completes in:</span>
              <span className="font-mono text-amber-400 font-bold">{timeLeft}</span>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-blue-400/10 bg-slate-900 p-5 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus size={18} /> Friends</h3>
          <div className="flex gap-2">
            <input value={newFriend} onChange={e => setNewFriend(e.target.value.replace("@", ""))} placeholder="Enter username" className="flex-1 rounded-xl bg-slate-950 px-4 py-2 text-white outline-none" />
            <button onClick={handleAddFriend} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold">Add</button>
          </div>
          
          {requests.length > 0 && (
            <div>
              <p className="text-xs text-amber-400 font-bold mb-2">Pending Requests</p>
              {requests.map(r => (
                <div key={r.id} className="flex justify-between items-center bg-slate-950 p-2 rounded-lg mb-1">
                  <span className="text-sm">{r.profiles.name} (@{r.profiles.username})</span>
                  <button onClick={() => handleAcceptRequest(r.id)} className="text-xs bg-emerald-600 px-2 py-1 rounded">Accept</button>
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs text-slate-400 font-bold mb-2">My Friends</p>
            {friends.length === 0 ? <p className="text-xs text-slate-500">No friends added yet.</p> : friends.map(f => (
              <div key={f.id} className="flex justify-between items-center bg-slate-950 p-2 rounded-lg mb-1">
                <span className="text-sm">{f.profiles.name} (@{f.profiles.username})</span>
                <a href={`/chat/${f.friend_id}`} className="text-xs bg-blue-600 px-2 py-1 rounded">Chat</a>
              </div>
            ))}
          </div>
        </div>

        <a href="/history" className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm"><Clock3 size={18} /> Transaction History</a>
        <a href="/help" className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm"><HelpCircle size={18} /> Help Center</a>
        <button onClick={async () => { await api.logout(); window.location.href = "/"; }} className="flex w-full items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-red-400"><LogOut className="h-5 w-5" /> Log Out</button>
      </main>

      {showInstall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#0D1526] p-6 text-center border border-blue-500/30">
            <Download className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Install App</h3>
            <p className="text-sm text-slate-400 mb-6">Tap the share button on your browser and select "Add to Home Screen" to install PrimeVest.</p>
            <button onClick={() => setShowInstall(false)} className="w-full rounded-xl bg-blue-600 py-3 font-semibold">Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Help() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl pb-20">
        <a href="/home" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400"><ArrowLeft size={18} />Back</a>
        <div className="mb-8">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400"><HelpCircle size={28} /></div>
          <h1 className="text-3xl font-bold">Investment Guide</h1>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-indigo-500/20 bg-[#0D1526] p-6">
            <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2"><Zap size={20} /> 1. Growth Portfolio</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">This plan pays you a daily profit. Once you invest, you must go to your Portfolio and tap "Claim Daily". The initial capital is locked for 7 days.</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-[#0D1526] p-6">
            <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2"><TrendingUp size={20} /> 2. Affiliate Marketing</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">Share your referral link on WhatsApp or TikTok. The system will simulate buyers clicking your link, sending you random bonuses between ₦3,000 and ₦20,000.</p>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-[#0D1526] p-6">
            <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><Rocket size={20} /> 3. Real Estate</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">Select from 6 estate tiers. The bigger the estate, the higher the ROI. Your funds are locked for a randomized number of weeks.</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-[#0D1526] p-6">
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2"><Timer size={20} /> 4. Crypto Index</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">Choose how long you want to lock your funds (30 days to 1 year). The longer the lock period, the higher your returns.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [profile, setProfile] = useState({});
  const [targetId, setTargetId] = useState("admin");

  useEffect(() => {
    api.profile().then(({ data }) => setProfile(data));
    loadMessages();
  }, [targetId]);

  async function loadMessages() {
    const { data } = await api.getMessages(targetId);
    setMessages(data || []);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMsg.trim()) return;
    await api.sendMessage(targetId, newMsg);
    setNewMsg("");
    loadMessages();
  }

  return (
    <div className="min-h-screen bg-[#070D1A] p-4 text-white">
      <header className="mb-4">
        <a href="/home" className="inline-flex items-center gap-2"><ArrowLeft size={18} /> Back</a>
        <h1 className="text-2xl font-bold mt-2">Inbox</h1>
      </header>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTargetId("admin")} className={`px-4 py-2 rounded-xl text-sm ${targetId === "admin" ? 'bg-blue-600' : 'bg-slate-800'}`}>Admin</button>
        <button onClick={() => setTargetId("friends")} className={`px-4 py-2 rounded-xl text-sm ${targetId === "friends" ? 'bg-blue-600' : 'bg-slate-800'}`}>Friends</button>
      </div>

      <div className="bg-[#0D1526] rounded-2xl p-4 h-[60vh] overflow-y-auto mb-4 border border-white/10">
        {messages.map(m => (
          <div key={m.id} className={`mb-3 flex ${m.sender_id === profile.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl max-w-[80%] ${m.sender_id === profile.id ? 'bg-blue-600' : 'bg-slate-800'}`}>
              <p className="text-sm">{m.message}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." className="flex-1 bg-slate-900 rounded-xl px-4 py-3 outline-none" />
        <button className="bg-blue-600 px-4 py-3 rounded-xl"><Send size={20} /></button>
      </form>
    </div>
  );
}