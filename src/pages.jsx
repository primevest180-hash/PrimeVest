import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CreditCard, Bitcoin, Wallet, Check, Copy, LockKeyhole,
  Loader2, CheckCircle2, Crown, ArrowRight, TrendingUp, Timer, Rocket, Zap,
  HelpCircle, LogOut, User, Gamepad2, ArrowUpFromLine, Clock, Gift,
  MessageSquare, UserPlus, Send, Clock3,
} from "lucide-react";
import { api, supabase } from "./app";

const ADMIN_UUID = "00000000-0000-0000-0000-000000000000";

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

/* =========================== DEPOSIT =========================== */
export function Deposit() {
  const [amount, setAmount] = useState("");
  const [region, setRegion] = useState("Nigeria");
  const [error, setError] = useState("");

  const go = () => {
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
          <h2 className="mt-2 text-4xl font-bold">₦7,500.00</h2>
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
              placeholder="7,500" className="w-full bg-transparent px-2 py-4 outline-none" />
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
    const r = await api.depositInit(amount, "card", user.email);
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
          <a href="/deposit" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </a>
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
          {loading ? <p className="text-sm text-slate-400">Generating...</p>
            : address && <>
                <p className="text-xs text-slate-500">BTC Address</p>
                <p className="mt-2 break-all font-mono text-sm">{address}</p>
                <button onClick={async () => {
                  await navigator.clipboard.writeText(address);
                  setCopied(true); setTimeout(() => setCopied(false), 2000);
                }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold">
                  {copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy Address"}
                </button>
              </>}
        </div>
      </main>
    </div>
  );
}

/* =========================== WITHDRAW =========================== */
export function Withdraw() {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(0);

  useEffect(() => { api.wallet().then(({ data }) => data && setBalance(data.available)); }, []);

  const next = () => {
    const n = Number(amount);
    if (!n || n < 14500) return setError("Min ₦14,500.");
    if (n > 50000) return setError("Max ₦50,000.");
    if (n > balance) return setError(`Insufficient. Available ₦${balance.toLocaleString()}`);
    window.location.href = `/withdraw/account?amount=${n}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95">
        <div className="mx-auto flex h-20 max-w-2xl items-center gap-4 px-4">
          <a href="/home" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </a>
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
            <input value={amount}
              onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) { setAmount(e.target.value); setError(""); } }}
              placeholder="14,500" className="w-full bg-transparent px-2 py-4 outline-none" />
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-500/5 p-3 text-sm text-red-300">{error}</p>}
          <button onClick={next} className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-semibold">Continue</button>
        </div>
      </main>
    </div>
  );
}

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
    if (!bankName || !accountNumber || !accountName) return setError("Fill all fields.");
    if (accountNumber.length !== 10) return setError("Account number must be 10 digits.");
    setSubmitting(true); setError("");
    const r = await api.withdraw({ amount, bank_name: bankName, account_number: accountNumber, account_name: accountName });
    setSubmitting(false);
    if (r?.success) setShowPopup(true);
    else setError(r?.error || "Failed.");
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95">
        <div className="mx-auto flex h-20 max-w-2xl items-center gap-4 px-4">
          <a href="/withdraw" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <h1 className="text-xl font-bold">Withdrawal Details</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-3xl bg-gradient-to-br from-blue-950 to-blue-700 p-6 text-center">
          <p className="text-sm text-blue-200">Amount</p>
          <h2 className="mt-2 text-4xl font-bold">₦{fmt}</h2>
        </div>
        <div className="mt-6 rounded-3xl border border-blue-400/10 bg-slate-900 p-6">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Bank Name</label>
            <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. GTBank"
              className="w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 text-sm outline-none" />
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Account Number</label>
            <input value={accountNumber}
              onChange={e => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10 digits"
              className="w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 text-sm outline-none" />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">Account Name</label>
            <input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Full name"
              className="w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 text-sm outline-none" />
          </div>
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
          <button onClick={proceed} disabled={submitting}
            className="w-full rounded-xl bg-emerald-600 py-4 font-bold disabled:opacity-40">
            {submitting ? "Processing..." : "Confirm Withdrawal"}
          </button>
        </div>
      </main>

      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-[#0D1526] p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Request Submitted</h3>
            <p className="text-sm text-slate-300 mb-6">Processed within 3 hours.</p>
            <button onClick={() => window.location.href = `/withdraw/success?amount=${amount}&bank=${encodeURIComponent(bankName)}&accountName=${encodeURIComponent(accountName)}`}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold">
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
    const end = Date.now() + 3 * 60 * 60 * 1000;
    const tick = () => {
      const diff = end - Date.now();
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
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#2A1D00] to-[#0A0A0A] p-8 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10 mb-6">
          <Clock className="h-12 w-12 text-amber-400" />
        </div>
        <p className="text-sm font-bold uppercase text-amber-400">Transfer Pending</p>
        <h1 className="mt-2 text-4xl font-extrabold">{`₦${fmt}`}</h1>
        <div className="mt-6 rounded-xl bg-black/40 p-4 text-sm">
          <p className="text-slate-400">To: <span className="text-white">{accountName}</span></p>
          <p className="text-slate-400">Bank: <span className="text-white">{bank}</span></p>
        </div>
        <div className="mt-8 rounded-xl bg-amber-500/10 p-4">
          <p className="text-xs text-amber-200">Time Remaining</p>
          <p className="text-2xl font-mono font-bold text-amber-400">{timeLeft}</p>
        </div>
        <a href="/home" className="mt-8 inline-flex rounded-xl bg-white text-black px-6 py-3 font-bold">Back</a>
      </div>
    </div>
  );
}

/* =========================== VIP / INVEST =========================== */
export function VIP() {
  const navigate = useNavigate();
  const tiers = [
    { tier: "VIP 1", price: 4500, bonus: 5000 },
    { tier: "VIP 2", price: 8500, bonus: 10000 },
    { tier: "VIP 3", price: 15000, bonus: 17000 },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1500] to-black pb-24 text-white">
      <header className="border-b border-amber-500/20 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex h-20 items-center gap-4 px-4 max-w-2xl">
          <a href="/home" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <h1 className="text-xl font-bold text-amber-400">VIP Membership</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="text-center mb-8">
          <Crown size={40} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-amber-400">Upgrade to VIP</h2>
        </div>
        <div className="space-y-4">
          {tiers.map(t => (
            <button key={t.tier}
              onClick={() => navigate(`/vip/checkout?tier=${t.tier}&price=${t.price}`)}
              className="w-full rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500 to-yellow-600 p-6 text-left hover:scale-[1.02]">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xl font-black text-black">{t.tier}</p>
                <p className="text-xl font-black text-black">₦{t.price.toLocaleString()}</p>
              </div>
              <p className="text-sm font-bold text-black/80">+₦{t.bonus.toLocaleString()} Bonus</p>
            </button>
          ))}
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
    const url = r?.authorization_url || r?.url;
    if (url) {
      localStorage.setItem("pending_vip_tier", tier);
      localStorage.setItem("pending_vip_price", price);
      window.location.href = url;
    } else {
      setError(r?.error || "Failed.");
    }
  }

  return (
    <div className="min-h-screen bg-[#070D1A] pb-24 text-white">
      <header className="border-b border-amber-500/20 bg-[#070D1A]/95">
        <div className="mx-auto flex h-20 max-w-xl items-center gap-4 px-4">
          <a href="/vip" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <ArrowLeft size={19} />
          </a>
          <h1 className="text-xl font-bold text-amber-400">VIP Checkout</h1>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-amber-900 to-black border border-amber-500/30 p-6 text-center">
          <Crown className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <p className="text-sm text-amber-200 uppercase">Upgrading To</p>
          <h2 className="mt-2 text-4xl font-black text-amber-300">{tier}</h2>
          <p className="mt-4 text-3xl font-bold">₦{price.toLocaleString()}</p>
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#0D1526] p-6">
          {error && <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          <button onClick={pay} disabled={loading}
            className="flex w-full items-center justify-between rounded-xl bg-amber-600 px-5 py-4 font-bold text-black hover:bg-amber-500 disabled:opacity-60">
            <div className="flex items-center gap-3"><CreditCard size={22} /><span>Pay with Paystack</span></div>
            {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
          </button>
        </div>
      </main>
    </div>
  );
}

export function Invest() {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState(null);
  const [profile, setProfile] = useState({ vip_tier: "None" });
  const [wallet, setWallet] = useState({ available: 0 });
  const [recent, setRecent] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    api.plans().then(({ data }) => setPlans(data || []));
    api.profile().then(({ data }) => data && setProfile(data));
    api.wallet().then(({ data }) => data && setWallet(data));
    api.portfolio().then(({ data }) => {
      if (data?.length) {
        const r = data.find(i => Date.now() - new Date(i.started_at).getTime() < 86400000);
        if (r) setRecent(r);
      }
    });
  }, []);

  useEffect(() => {
    if (!recent) return;
    const tick = () => {
      const next = new Date(recent.started_at).getTime() + 86400000;
      const diff = next - Date.now();
      if (diff <= 0) { setRecent(null); setTimeLeft(""); }
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
  }, [recent]);

  async function submit() {
    setError("");
    if (profile.vip_tier === "None") return setError("Upgrade to VIP first.");
    if (recent) return setError("Only one investment per day.");
    const n = Number(amount);
    const min = selected?.min_amount || 3000;
    if (!n || n < min) return setError(`Min ₦${min.toLocaleString()}`);
    if (n > wallet.available) return setError(`Insufficient. Balance ₦${wallet.available.toLocaleString()}`);
    setSubmitting(true);
    const r = await api.invest(selected.id, n, 0, null);
    setSubmitting(false);
    if (r?.success) {
      if (selected.name === "Real Estate") setPopup("Your money will grow in the next 4 weeks");
      else window.location.href = "/portfolio";
    } else setError(r?.error || "Failed.");
  }

  const locked = profile.vip_tier === "None" || !!recent;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95 p-4 flex justify-between items-center">
        <a href="/home" className="inline-flex items-center gap-2"><ArrowLeft size={18} /> Back</a>
        <p className="text-sm font-bold text-emerald-400">₦{wallet.available.toLocaleString()}</p>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Choose an investment</h2>
        {profile.vip_tier === "None" && (
          <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 flex items-center justify-between">
            <span>Upgrade to VIP first.</span>
            <Link to="/vip" className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm">Go VIP</Link>
          </div>
        )}
        {recent && (
          <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-300">
            <p className="font-bold">Daily limit reached</p>
            <p className="text-sm">Time left: <strong>{timeLeft}</strong></p>
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          {plans.map(p => (
            <div key={p.id} className={`rounded-2xl border border-blue-400/10 bg-slate-900 p-6 relative ${locked ? "opacity-60" : ""}`}>
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{p.type}</p>
              <p className="text-sm mt-3">Return: <span className="font-semibold text-blue-400">{p.expected_return}%</span></p>
              <p className="text-xs text-slate-500 mt-1">Min: ₦{Number(p.min_amount).toLocaleString()}</p>
              <button onClick={() => { if (!locked) { setSelected(p); setAmount(""); setError(""); } }}
                disabled={locked}
                className="mt-6 rounded-xl bg-blue-600 py-3 text-sm font-semibold w-full disabled:bg-slate-800">
                Select Plan
              </button>
            </div>
          ))}
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0D1526] p-6">
            <h3 className="text-xl font-bold">Invest in {selected.name}</h3>
            <label className="text-sm mb-1 mt-4 block">Amount</label>
            <input value={amount} onChange={e => setAmount(e.target.value)}
              placeholder={`Min ${selected.min_amount}`}
              className="w-full rounded-xl bg-slate-950 px-4 py-3 outline-none" />
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 rounded-xl border border-white/10 py-3">Cancel</button>
              <button onClick={submit} disabled={submitting}
                className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold disabled:opacity-60">
                {submitting ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {popup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 text-center">
            <h3 className="text-xl font-bold text-green-400">Success!</h3>
            <p className="mt-2 text-sm text-slate-300">{popup}</p>
            <button onClick={() => { setPopup(null); window.location.href = "/portfolio"; }}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold">OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================== BONUS / SCRATCH / MYSTERY =========================== */
export function BonusGame() {
  const [points, setPoints] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [toastMsg, setToastMsg] = useState("");
  const [emojis, setEmojis] = useState([]);
  const clicks = useRef([]);
  const money = Math.floor(points / 2);
  const goal = 1000;

  const tap = (e) => {
    setPoints(p => p + 1);
    const now = Date.now();
    clicks.current.push(now);
    clicks.current = clicks.current.filter(t => now - t < 1000);
    const s = clicks.current.length;
    setSpeed(s);
    if (s >= 4 && Math.random() > 0.3) {
      const list = ["💨", "😮", "🔥"];
      const emoji = list[Math.floor(Math.random() * list.length)];
      const rect = e.target.getBoundingClientRect();
      const item = { id: Date.now() + Math.random(), emoji,
        x: rect.left + Math.random() * rect.width,
        y: rect.top + Math.random() * rect.height,
        size: 40 + Math.random() * 40 };
      setEmojis(p => [...p, item]);
      setTimeout(() => setEmojis(p => p.filter(i => i.id !== item.id)), 1500);
    }
  };

  const claim = async () => {
    if (points < goal) return;
    setClaiming(true);
    await api.claimBonus(money);
    setClaiming(false);
    setToastMsg(`Claimed ₦${money}!`);
    setPoints(0);
  };

  const rotation = -85 + Math.min(speed / 15, 1) * 170;

  return (
    <div className="min-h-screen bg-[#070D1A] pb-24 text-white flex flex-col items-center justify-center px-4 relative select-none overflow-hidden">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
      <div className="fixed inset-0 pointer-events-none z-50">
        {emojis.map(e => (
          <span key={e.id} className="absolute"
            style={{ left: e.x, top: e.y, fontSize: e.size, animation: "floatUp 1.5s ease-out forwards" }}>
            {e.emoji}
          </span>
        ))}
      </div>
      <h1 className="text-2xl font-bold mb-2">Tap to Earn</h1>
      <p className="text-sm text-slate-400 mb-6">2 points = ₦1</p>
      <div className="w-64 h-32 relative overflow-hidden mb-6 flex justify-center items-end">
        <div className="absolute bottom-0 w-1 h-28 bg-white origin-bottom rounded-t-full"
          style={{ transform: `rotate(${rotation}deg)` }} />
        <div className="absolute bottom-0 w-4 h-4 bg-white rounded-full" />
        <div className="absolute bottom-4 flex flex-col items-center">
          <span className="text-2xl font-black">{speed}</span>
          <span className="text-[10px] text-slate-400 uppercase">Clicks/sec</span>
        </div>
      </div>
      <div className="mb-6 flex items-baseline gap-2">
        <span className="text-5xl font-extrabold text-blue-400">{points}</span>
        <span className="text-lg text-slate-400">/ {goal}</span>
      </div>
      <button onClick={tap}
        className="group relative flex h-60 w-60 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 active:scale-90 transition-transform">
        <Wallet className="h-24 w-24 opacity-40" />
      </button>
      <button onClick={claim} disabled={points < goal || claiming}
        className="mt-8 w-full max-w-sm rounded-2xl bg-emerald-500 py-4 font-bold disabled:opacity-40">
        {claiming ? "Claiming..." : points < goal ? `Need ${goal - points} more` : `Claim ₦${money}`}
      </button>
      <style>{`@keyframes floatUp{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-150px) scale(1.5);opacity:0}}`}</style>
    </div>
  );
}

export function ScratchCard() {
  const [loading, setLoading] = useState(false);
  async function buy() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const r = await api.depositInit(1000, "card", user.email, false, "scratch");
    setLoading(false);
    const url = r?.authorization_url || r?.url;
    if (url) window.location.href = url;
  }
  return (
    <div className="min-h-screen bg-[#070D1A] p-6 text-white flex flex-col items-center justify-center">
      <div className="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-[#0D1526] p-8 text-center">
        <Gift className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Scratch & Win</h1>
        <p className="text-slate-400 text-sm mb-6">Pay ₦1,000 for a guaranteed ₦500!</p>
        <button onClick={buy} disabled={loading}
          className="w-full rounded-xl bg-emerald-600 py-4 font-bold disabled:opacity-50">
          {loading ? "Redirecting..." : "Buy for ₦1,000"}
        </button>
        <a href="/home" className="mt-6 block text-sm text-slate-400">Back</a>
      </div>
    </div>
  );
}

export function MysteryBox() {
  const [loading, setLoading] = useState(false);
  async function buy() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const r = await api.depositInit(5000, "card", user.email, false, "mystery");
    setLoading(false);
    const url = r?.authorization_url || r?.url;
    if (url) window.location.href = url;
  }
  return (
    <div className="min-h-screen bg-[#070D1A] p-6 text-white flex flex-col items-center justify-center">
      <div className="w-full max-w-sm rounded-3xl border border-purple-500/30 bg-[#0D1526] p-8 text-center">
        <Zap className="h-16 w-16 text-purple-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Mystery Box</h1>
        <p className="text-slate-400 text-sm mb-6">Pay ₦5,000 for VIP or cash!</p>
        <button onClick={buy} disabled={loading}
          className="w-full rounded-xl bg-purple-600 py-4 font-bold disabled:opacity-50">
          {loading ? "Redirecting..." : "Buy for ₦5,000"}
        </button>
        <a href="/home" className="mt-6 block text-sm text-slate-400">Back</a>
      </div>
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

/* =========================== SETTINGS (friend requests) =========================== */
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
    supabase.from("withdrawals").select("*").eq("status", "pending")
      .order("created_at", { ascending: false }).limit(1)
      .then(({ data }) => { if (data?.length) setPendingWD(data[0]); });
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

  async function setUsername() {
    if (usernameInput.length < 3) return alert("Min 3 chars.");
    const r = await api.setUsername(usernameInput);
    if (r.error) return alert(r.error);
    alert("Username set!");
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
          </div>
        </div>

        {!profile.username && (
          <div className="rounded-2xl border border-amber-500/30 bg-[#1A1500] p-5">
            <h3 className="font-bold text-amber-500 mb-2">Set Your Username</h3>
            <div className="flex gap-2">
              <input value={usernameInput} onChange={e => setUsernameInput(e.target.value.replace(/\s/g, ""))}
                placeholder="john_doe"
                className="flex-1 rounded-xl bg-slate-950 px-4 py-2" />
              <button onClick={setUsername} className="bg-amber-500 text-black px-4 py-2 rounded-xl font-bold">Save</button>
            </div>
          </div>
        )}

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

/* =========================== CHAT (WhatsApp-style) =========================== */
export function Chat() {
  const params = new URLSearchParams(window.location.search);
  const paramId = params.get("id");
  const pathId = window.location.pathname.split("/chat/")[1];
  const startWith = paramId || pathId || "admin";

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [profile, setProfile] = useState({});
  const [chatMode, setChatMode] = useState(startWith === "admin" ? "admin" : "friend");
  const [targetId, setTargetId] = useState(startWith === "admin" ? "admin" : startWith);
  const [targetName, setTargetName] = useState(startWith === "admin" ? "Admin Support" : "Friend");
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.profile().then(({ data }) => data && setProfile(data));
    api.getFriends().then(({ data }) => setFriends(data || []));
  }, []);

  useEffect(() => {
    if (chatMode === "friend" && targetId !== "admin") {
      const f = friends.find(x => x.friend_id === targetId);
      if (f?.profiles?.name) setTargetName(f.profiles.name);
    }
  }, [friends, targetId, chatMode]);

  const load = async (target) => {
    if (!target) return;
    setLoading(true);
    const { data, error } = await api.getMessages(target);
    if (error) console.error("Load messages:", error);
    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => { load(targetId); }, [targetId]);

  async function send(e) {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setSending(true);
    const r = await api.sendMessage(targetId, newMsg.trim());
    setSending(false);
    if (r?.error) return alert("Send failed: " + r.error);
    setNewMsg("");
    await load(targetId);
  }

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col">
      <header className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0D1526]">
        <a href="/home" className="flex items-center gap-2 text-white"><ArrowLeft size={20} /> Back</a>
        <div className="text-center">
          <h1 className="text-lg font-bold text-white">{targetName}</h1>
          <p className="text-xs text-slate-400">{chatMode === "admin" ? "Support" : "Friend"}</p>
        </div>
        <div className="w-8" />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 max-w-xs border-r border-white/10 bg-[#0D1526] flex flex-col">
          <button
            onClick={() => { setChatMode("admin"); setTargetId("admin"); setTargetName("Admin Support"); }}
            className={`p-4 flex items-center gap-3 ${chatMode === "admin" ? "bg-blue-600/20 border-l-4 border-blue-500" : "hover:bg-white/5"}`}>
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <Send size={18} className="text-white" />
            </div>
            <div className="text-left text-white">
              <p className="font-bold text-sm">Admin</p>
              <p className="text-xs text-slate-400">Support</p>
            </div>
          </button>

          <div className="p-4 border-t border-white/10 flex-1 overflow-y-auto">
            <p className="text-xs font-bold text-slate-400 mb-3 uppercase">Friends ({friends.length})</p>
            {friends.length === 0
              ? <p className="text-xs text-slate-500">No friends yet. Add in Settings.</p>
              : friends.map(f => (
                  <button key={f.id}
                    onClick={() => { setChatMode("friend"); setTargetId(f.friend_id); setTargetName(f.profiles?.name || "Friend"); }}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg mb-1 ${targetId === f.friend_id ? "bg-slate-800" : "hover:bg-white/5"}`}>
                    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                      {(f.profiles?.name || "?")[0]}
                    </div>
                    <p className="text-sm text-white truncate">{f.profiles?.name || "Unknown"}</p>
                  </button>
                ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#070D1A]">
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {loading
              ? <p className="text-center text-slate-500 text-sm">Loading...</p>
              : messages.length === 0
                ? <p className="text-center text-slate-500 text-sm mt-10">No messages yet. Say hi 👋</p>
                : messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender_id === profile.id ? "justify-end" : "justify-start"}`}>
                      <div className={`p-3 rounded-2xl max-w-[80%] ${m.sender_id === profile.id ? "bg-blue-600 text-white rounded-tr-sm" : "bg-[#0D1526] border border-white/10 text-slate-200 rounded-tl-sm"}`}>
                        <p className="text-sm break-words">{m.message}</p>
                        <p className="text-[10px] opacity-60 mt-1 text-right">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
          </div>
          <form onSubmit={send} className="p-4 border-t border-white/10 bg-[#0D1526] flex gap-2">
            <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
              placeholder={`Message ${targetName}...`}
              className="flex-1 bg-[#070D1A] text-white rounded-xl px-4 py-3 outline-none border border-white/10" />
            <button disabled={sending}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500 disabled:opacity-50">
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}