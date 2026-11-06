import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CreditCard, Bitcoin, Building2, Wallet, Check, Copy, LockKeyhole, 
  ChevronDown, Search, Loader2, CheckCircle2, Headphones, Mail, Crown, ArrowRight,
  TrendingUp, Timer, Rocket, Zap, HelpCircle, LogOut, User, Gamepad2, Home as HomeIcon, 
  Settings as SettingsIcon, ArrowUpFromLine, ShieldCheck, Lock as LockIcon
} from "lucide-react";
import { api, supabase } from "./app";

export const Toast = ({ message, onClose }) => {
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
      <header className="border-b border-blue-400/10 bg-slate-950/95"><div className="mx-auto flex h-20 max-w-5xl items-center gap-4 px-4"><a href="/home" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"><ArrowLeft className="h-5 w-5" /></a><div><h1 className="text-xl font-bold">Deposit</h1></div></div></header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">Note: If you can't use Paystack, use Bitcoin for faster transactions.</div>
        <div className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 p-6"><Wallet className="h-8 w-8 text-blue-200" /><p className="mt-6 text-sm text-blue-200">Minimum Deposit</p><h2 className="mt-2 text-4xl font-bold">₦7,500.00</h2></div>
        <div className="mt-6 rounded-3xl border border-blue-400/10 bg-slate-900 p-6">
          <label className="mb-2 block text-sm text-slate-300">Select Region</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="mb-6 w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 outline-none">
            <option value="Nigeria">Nigeria (Paystack)</option><option value="USA">USA (Bitcoin)</option><option value="UK">UK (Bitcoin)</option><option value="Europe">Europe (Bitcoin)</option>
          </select>
          <label className="mb-2 block text-sm text-slate-300">Amount (NGN)</label>
          <div className="flex rounded-xl border border-blue-400/10 bg-slate-950"><span className="flex items-center px-4 text-slate-400">₦</span><input value={amount} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) { setAmount(e.target.value); setError(""); } }} placeholder="7,500" className="w-full bg-transparent px-2 py-4 outline-none" /></div>
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
      <header className="border-b border-blue-400/10 bg-slate-950/95"><div className="mx-auto flex h-20 max-w-2xl items-center gap-4 px-4"><a href="/deposit" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"><ArrowLeft className="h-5 w-5" /></a><h1 className="text-xl font-bold">Payment Method</h1></div></header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-blue-950 to-blue-700 p-6"><p className="text-sm text-blue-200">Amount</p><h2 className="mt-2 text-3xl font-bold">₦{fmt}</h2></div>
        <div className="mt-6 space-y-4">
          <a href={`/deposit/card?amount=${amount}`} className="flex items-center gap-4 rounded-2xl border border-blue-400/10 bg-slate-900 p-5 hover:border-blue-500"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10"><CreditCard className="h-7 w-7 text-blue-400" /></div><div><h3 className="font-semibold">Card / Transfer (Paystack)</h3></div></a>
          <a href={`/deposit/bitcoin?amount=${amount}`} className="flex items-center gap-4 rounded-2xl border border-blue-400/10 bg-slate-900 p-5 hover:border-amber-500"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10"><Bitcoin className="h-7 w-7 text-amber-400" /></div><div><h3 className="font-semibold">Bitcoin</h3></div></a>
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
    
    if (r?.authorization_url) {
      window.location.href = r.authorization_url;
    } else if (r?.url) {
      window.location.href = r.url;
    } else {
      setError(r?.error || "Failed to initialize payment.");
    }
  }
  
  return (
    <div className="min-h-screen bg-[#070D1A] pb-24 text-white">
      <header className="border-b border-white/5 bg-[#070D1A]/95"><div className="mx-auto flex h-20 max-w-5xl items-center gap-4 px-5"><a href={`/deposit/payment?amount=${amount}`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"><ArrowLeft size={19} /></a><h1 className="text-lg font-semibold">Card Payment</h1></div></header>
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5">
        <div className="w-full max-w-xl rounded-2xl border border-white/8 bg-[#0D1526] p-6">
          {error && <div className="mt-4 rounded-xl bg-red-500/5 p-4 text-sm text-red-300">{error}</div>}
          <button onClick={pay} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold disabled:opacity-60"><LockKeyhole size={17} />{loading ? "Redirecting..." : `Pay ₦${fmt}`}</button>
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
      <header className="border-b border-blue-400/10 bg-slate-950/95"><div className="mx-auto flex h-20 max-w-2xl items-center gap-4 px-4"><a href={`/deposit`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"><ArrowLeft className="h-5 w-5" /></a><h1 className="text-xl font-bold">Bitcoin Deposit</h1></div></header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-amber-950 to-amber-700 p-6"><Bitcoin className="h-8 w-8 text-amber-200" /><p className="mt-6 text-sm text-amber-200">Amount</p><h2 className="mt-2 text-3xl font-bold">₦{fmt}</h2></div>
        <div className="mt-6 rounded-3xl border border-blue-400/10 bg-slate-900 p-6">
          {error && <p className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
          {loading ? <p className="text-sm text-slate-400">Generating...</p> : address ? (
            <><p className="text-xs text-slate-500">BTC Address</p><p className="mt-2 break-all font-mono text-sm">{address}</p><button onClick={async () => { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold">{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy Address"}</button></>
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
    if (!n || n < 3000) return setError("Minimum withdrawal is ₦3,000.");
    if (n > 20000) return setError("Max ₦20,000.");
    if (n > balance) return setError(`Insufficient. Available ₦${balance.toLocaleString()}`);
    window.location.href = `/withdraw/account?amount=${n}`;
  };
  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95"><div className="mx-auto flex h-20 items-center gap-4 px-4 max-w-2xl"><a href="/home" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"><ArrowLeft className="h-5 w-5" /></a><h1 className="text-xl font-bold">Withdraw</h1></div></header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-blue-400/10 bg-blue-950/30 p-5"><p className="text-sm text-slate-400">Available</p><p className="mt-1 text-2xl font-bold text-blue-400">₦{balance.toLocaleString()}</p></div>
        <div className="mt-6 rounded-3xl border border-blue-400/10 bg-slate-900 p-6">
          <label className="mb-2 block text-sm">Amount (Min ₦3,000)</label>
          <div className="flex rounded-xl border border-blue-400/10 bg-slate-950"><span className="flex items-center px-4 text-slate-400">₦</span><input value={amount} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) { setAmount(e.target.value); setError(""); } }} placeholder="3,000" className="w-full bg-transparent px-2 py-4 outline-none" /></div>
          {error && <p className="mt-4 rounded-xl bg-red-500/5 p-3 text-sm text-red-300">{error}</p>}
          <button onClick={next} className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-semibold">Continue</button>
        </div>
      </main>
    </div>
  );
}

export function WithdrawAccount() {
  const [banks, setBanks] = useState([]);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [typedBank, setTypedBank] = useState("");
  const [selectedBank, setSelectedBank] = useState(null);
  const [status, setStatus] = useState("idle");
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const amount = Number(params.get("amount") || 0);
  const fmt = amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });

  useEffect(() => { 
    api.banks().then((d) => {
      setBanks(Array.isArray(d) ? d : []);
      setLoadingBanks(false);
    }); 
  }, []);

  // Auto-detect bank as user types
  useEffect(() => {
    if (typedBank.length > 2) {
      const match = banks.find(b => b.name.toLowerCase().includes(typedBank.toLowerCase()));
      if (match) setSelectedBank(match);
      else setSelectedBank(null);
    } else {
      setSelectedBank(null);
    }
  }, [typedBank, banks]);

  async function check() {
    if (!selectedBank) return setStatus("bank-required");
    if (accountNumber.length !== 10) return setStatus("invalid-number");
    setChecking(true);
    const r = await api.resolveAccount(accountNumber, selectedBank.code);
    setChecking(false);
    if (r?.status && r?.data?.account_name) { setAccountName(r.data.account_name); setStatus("found"); } else { setStatus("not-found"); }
  }

  async function proceed() {
    if (status !== "found" || !accountName) return;
    setSubmitting(true);
    const r = await api.withdraw({ amount, bank_name: selectedBank.name, bank_code: selectedBank.code, account_number: accountNumber, account_name: accountName });
    setSubmitting(false);
    if (r?.success) window.location.href = `/withdraw/success?amount=${amount}&accountNumber=${accountNumber}&bank=${encodeURIComponent(selectedBank.name)}&accountName=${encodeURIComponent(accountName)}`;
    else setStatus("error");
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95"><div className="mx-auto flex h-20 items-center gap-4 px-4 max-w-2xl"><a href="/withdraw" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"><ArrowLeft className="h-5 w-5" /></a><h1 className="text-xl font-bold">Withdrawal Details</h1></div></header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-3xl bg-gradient-to-br from-blue-950 to-blue-700 p-6 text-center"><p className="text-sm text-blue-200">Amount to Withdraw</p><h2 className="mt-2 text-4xl font-bold">₦{fmt}</h2></div>
        <div className="mt-6 rounded-3xl border border-blue-400/10 bg-slate-900 p-6">
          
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">Type Bank Name</label>
            <input 
              value={typedBank} 
              onChange={(e) => { setTypedBank(e.target.value); setStatus("idle"); setAccountName(""); }} 
              placeholder="e.g. Access Bank, GTBank" 
              className="w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 text-sm outline-none focus:border-blue-500" 
            />
            {selectedBank && (
              <p className="mt-2 text-xs text-green-400">Matched: {selectedBank.name}</p>
            )}
            {typedBank.length > 2 && !selectedBank && (
              <p className="mt-2 text-xs text-red-400">Bank not found in list.</p>
            )}
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">Account Number</label>
            <input value={accountNumber} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 10) { setAccountNumber(v); setStatus("idle"); setAccountName(""); } }} placeholder="Enter 10-digit number" maxLength={10} className="w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 text-lg tracking-widest outline-none focus:border-blue-500" />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">Account Name</label>
            <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Verify to auto-fill or type here" className={`w-full rounded-xl border px-4 py-4 text-sm outline-none ${status === "found" ? "border-green-500/50 bg-green-500/5 text-green-400" : "border-blue-400/10 bg-slate-950"}`} />
          </div>
          
          <button onClick={check} disabled={checking || !selectedBank} className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 py-3 text-sm font-semibold text-blue-400 hover:bg-blue-500/20 disabled:opacity-60 mb-4">{checking ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}{checking ? "Verifying..." : "Auto-Verify Account Name"}</button>
          
          <button onClick={proceed} disabled={submitting || !accountName || !selectedBank || accountNumber.length !== 10} className="w-full rounded-xl bg-blue-600 py-4 font-semibold disabled:opacity-40">{submitting ? "Processing..." : "Confirm Withdrawal"}</button>
        </div>
      </main>
    </div>
  );
}

// ... [Rest of the pages.jsx remains the same: WithdrawSuccess, VIP, VIPCheckout, BonusGame, Invest, Portfolio, Settings, Help] ...