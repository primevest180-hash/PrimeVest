import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CreditCard, Bitcoin, Building2, Wallet, Check, Copy, LockKeyhole, 
  ChevronDown, Search, Loader2, CheckCircle2, Headphones, Mail, Crown, ArrowRight,
  TrendingUp, Timer, Rocket, Zap, HelpCircle, LogOut, User, Gamepad2, Home as HomeIcon, 
  Settings as SettingsIcon, ArrowUpFromLine, ShieldCheck, Lock as LockIcon
} from "lucide-react";
import { api, supabase } from "./app";

// ============================================================
// GLOBAL TOAST (FLOATING NOTIFICATION)
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
// DEPOSIT PAGES
// ============================================================
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
          {/* REMOVED BANK TRANSFER HERE */}
          <a href={`/deposit/card?amount=${amount}`} className="flex items-center gap-4 rounded-2xl border border-blue-400/10 bg-slate-900 p-5 hover:border-blue-500"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10"><CreditCard className="h-7 w-7 text-blue-400" /></div><div><h3 className="font-semibold">Card (Paystack)</h3></div></a>
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
    if (r?.url) window.location.href = r.url;
    else setError(r?.error || "Failed.");
  }
  return (
    <div className="min-h-screen bg-[#070D1A] pb-24 text-white">
      <header className="border-b border-white/5 bg-[#070D1A]/95"><div className="mx-auto flex h-20 max-w-5xl items-center gap-4 px-5"><a href={`/deposit/payment?amount=${amount}`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"><ArrowLeft size={19} /></a><h1 className="text-lg font-semibold">Card Payment</h1></div></header>
      <main className="mx-auto max-w-xl px-5 py-10">
        <div className="rounded-2xl border border-white/8 bg-[#0D1526] p-6">
          {error && <div className="mt-4 rounded-xl bg-red-500/5 p-4 text-sm text-red-300">{error}</div>}
          <button onClick={pay} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold disabled:opacity-60"><LockKeyhole size={17} />{loading ? "Redirecting..." : `Pay ₦${fmt}`}</button>
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

// ============================================================
// WITHDRAW PAGES
// ============================================================
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
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankSearch, setBankSearch] = useState("");
  const [showBanks, setShowBanks] = useState(false);
  const [status, setStatus] = useState("idle");
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const amount = Number(params.get("amount") || 0);
  const fmt = amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });

  useEffect(() => { api.banks().then((d) => setBanks(Array.isArray(d) ? d : [])); }, []);
  const filtered = banks.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase()));

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
            <label className="mb-2 block text-sm font-medium">Select Bank</label>
            <div className="relative">
              <button onClick={() => setShowBanks(!showBanks)} className="flex w-full items-center justify-between rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 text-left">{selectedBank ? <span className="text-sm">{selectedBank.name}</span> : <span className="text-sm text-slate-500">Choose bank</span>}<ChevronDown className="h-5 w-5" /></button>
              {showBanks && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-60 overflow-hidden rounded-2xl border border-blue-400/10 bg-slate-900 shadow-2xl">
                  <div className="border-b border-slate-800 p-3"><input value={bankSearch} onChange={(e) => setBankSearch(e.target.value)} placeholder="Search bank..." className="w-full rounded-xl bg-slate-950 px-3 py-2 text-sm outline-none" /></div>
                  <div className="overflow-y-auto h-48 p-2">{filtered.map((b) => (<button key={b.code + b.name} onClick={() => { setSelectedBank(b); setShowBanks(false); setStatus("idle"); setAccountName(""); }} className="w-full rounded-xl p-3 text-left text-sm hover:bg-blue-950/50">{b.name}</button>))}</div>
                </div>
              )}
            </div>
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">Account Number</label>
            <input value={accountNumber} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 10) { setAccountNumber(v); setStatus("idle"); setAccountName(""); } }} placeholder="Enter 10-digit number" maxLength={10} className="w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 text-lg tracking-widest outline-none focus:border-blue-500" />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">Account Name</label>
            <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Verify to auto-fill or type here" className={`w-full rounded-xl border px-4 py-4 text-sm outline-none ${status === "found" ? "border-green-500/50 bg-green-500/5 text-green-400" : "border-blue-400/10 bg-slate-950"}`} />
          </div>
          <button onClick={check} disabled={checking} className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 py-3 text-sm font-semibold text-blue-400 hover:bg-blue-500/20 disabled:opacity-60 mb-4">{checking ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}{checking ? "Verifying..." : "Auto-Verify Account Name"}</button>
          <button onClick={proceed} disabled={submitting || !accountName || !selectedBank || accountNumber.length !== 10} className="w-full rounded-xl bg-blue-600 py-4 font-semibold disabled:opacity-40">{submitting ? "Processing..." : "Confirm Withdrawal"}</button>
        </div>
      </main>
    </div>
  );
}

export function WithdrawSuccess() {
  const p = new URLSearchParams(window.location.search);
  const amount = p.get("amount") || "0";
  const accountNumber = p.get("accountNumber") || "";
  const bank = p.get("bank") || "Bank";
  const accountName = p.get("accountName") || "";
  const fmt = Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 });
  const [showCare, setShowCare] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <main className="mx-auto max-w-xl px-4 py-12 relative">
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-950/40 to-[#0D1526] p-10 text-center shadow-2xl shadow-amber-900/20">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 shadow-lg"><CheckCircle2 className="h-10 w-10 text-white" /></div></div>
          <p className="mt-6 text-sm font-bold uppercase tracking-widest text-amber-400">Withdrawal Successful</p>
          <h1 className="mt-3 text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">₦{fmt}</h1>
          <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/80"><p>{bank} · {accountNumber.slice(-4)}</p><p className="mt-1 font-semibold text-amber-200">{accountName}</p></div>
          <p className="mt-6 text-sm leading-relaxed text-slate-400">If you have not received your money, please contact customer care.</p>
          <a href="/home" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 text-sm font-semibold hover:bg-slate-700">Back to Dashboard <ArrowRight className="h-4 w-4" /></a>
        </div>
        <button onClick={() => setShowCare(true)} className="fixed bottom-24 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-900/50 hover:bg-blue-500 transition"><Headphones className="h-6 w-6" /></button>
        {showCare && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setShowCare(false)}>
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0D1526] p-6 text-center shadow-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10"><Headphones className="h-8 w-8 text-blue-400" /></div>
              <h3 className="mt-4 text-xl font-bold">Customer Care</h3>
              <p className="mt-2 text-sm text-slate-400">Welcome! Please contact us using the details below if you need assistance.</p>
              <div className="mt-6 space-y-3">
                <a href="mailto:primeinvestors265@gmail.com" className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-medium hover:bg-slate-800"><Mail className="h-4 w-4 text-blue-400" /> primeinvestors265@gmail.com</a>
              </div>
              <button onClick={() => setShowCare(false)} className="mt-6 w-full rounded-xl border border-white/10 py-3 text-sm font-semibold">Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================
// VIP & VIP CHECKOUT
// ============================================================
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
    if (r?.url) {
       localStorage.setItem('pending_vip_tier', tier);
       localStorage.setItem('pending_vip_price', price);
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

// ============================================================
// BONUS GAME (FIXED SPEEDOMETER & TOASTS)
// ============================================================
export function BonusGame() {
  const [points, setPoints] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [clickSpeed, setClickSpeed] = useState(0);
  const [toastMsg, setToastMsg] = useState("");
  
  const clicks = useRef([]);
  const moneyValue = Math.floor(points / 2); 
  const goal = 1000;

  const handleTap = () => {
    setPoints((p) => p + 1); 
    
    const now = Date.now();
    clicks.current.push(now);
    // Keep only clicks in the last 1000ms
    clicks.current = clicks.current.filter(t => now - t < 1000);
    setClickSpeed(clicks.current.length);
  };
  
  const handleClaim = async () => {
    if (points < goal) return;
    setClaiming(true);
    await api.claimBonus(moneyValue);
    setClaiming(false);
    
    // Show toast and reset points instead of redirecting
    setToastMsg(`You have claimed ₦${moneyValue}! It will show on your dashboard shortly.`);
    setPoints(0);
  };

  // Speedometer ticker (decays the speed if you stop clicking)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      clicks.current = clicks.current.filter(t => now - t < 1000);
      setClickSpeed(clicks.current.length);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Calculate needle rotation (0 clicks = -85deg, 15+ clicks = +85deg)
  const maxSpeed = 15;
  const speedPercentage = Math.min(clickSpeed / maxSpeed, 1);
  // -85 degrees is far left, +85 degrees is far right
  const rotation = -85 + (speedPercentage * 170); 

  return (
    <div className="min-h-screen bg-[#070D1A] pb-24 text-white flex flex-col items-center justify-center px-4 relative select-none">
      
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}

      <h1 className="text-2xl font-bold mb-2">Tap to Earn</h1>
      <p className="text-sm text-slate-400 mb-6 text-center px-4">2 points = ₦1</p>
      
      {/* SPEEDOMETER */}
      <div className="w-64 h-32 relative overflow-hidden mb-6 flex justify-center items-end">
        <div className="w-64 h-64 rounded-full border-[12px] border-slate-800 absolute -bottom-32"></div>
        <div className="w-64 h-64 rounded-full border-[12px] border-transparent border-t-emerald-500/50 border-r-amber-500/50 absolute -bottom-32 rotate-[-45deg]"></div>
        <div className="w-64 h-64 rounded-full border-[12px] border-transparent border-r-red-500/50 border-b-red-500/50 absolute -bottom-32 rotate-[45deg]"></div>
        <div 
          className="absolute bottom-0 w-1 h-28 bg-white origin-bottom rounded-t-full transition-transform duration-100 ease-out shadow-[0_0_15px_rgba(255,255,255,0.8)]"
          style={{ transform: `rotate(${rotation}deg)` }}
        ></div>
        <div className="absolute bottom-0 w-4 h-4 bg-white rounded-full shadow-lg"></div>
        <div className="absolute bottom-4 flex flex-col items-center">
          <span className="text-2xl font-black text-white">{clickSpeed}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">Clicks / Sec</span>
        </div>
      </div>

      <div className="mb-6 flex flex-col items-center">
        <div className="flex items-baseline gap-2"><span className="text-5xl font-extrabold text-blue-400">{points}</span><span className="text-lg text-slate-400">/ {goal}</span></div>
        <p className="mt-2 text-sm text-emerald-400">Value: ₦{moneyValue.toLocaleString()}</p>
      </div>
      
      <button onClick={handleTap} className="group relative flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-2xl shadow-blue-900/50 active:scale-90 transition-transform">
        <div className="absolute inset-2 rounded-full border-2 border-white/20 border-dashed animate-spin-slow"></div>
        <Wallet className="h-16 w-16 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
      </button>
      
      <div className="mt-8 w-full max-w-sm">
        <button onClick={handleClaim} disabled={points < goal || claiming} className="w-full rounded-2xl bg-emerald-500 py-4 font-bold text-white shadow-lg shadow-emerald-900/30 disabled:opacity-40 transition-all">
          {claiming ? "Claiming..." : points < goal ? `Claim ₦${moneyValue.toLocaleString()} (Need ${goal - points} more)` : `Claim ₦${moneyValue.toLocaleString()}`}
        </button>
      </div>
      
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.07] bg-[#070D1A]/95 px-2 py-2 backdrop-blur-xl">
        <div className="mx-auto grid max-w-lg grid-cols-6">
          <a href="/home" className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-slate-500"><HomeIcon size={20} />Home</a>
          <a href="/invest" className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-slate-500"><TrendingUp size={20} />Invest</a>
          <a href="/vip" className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-slate-500"><Crown size={20} />VIP</a>
          <a href="/bonus" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-blue-500/10 text-xs font-semibold text-blue-400"><Gamepad2 size={20} />Bonus</a>
          <a href="/withdraw" className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-slate-500"><ArrowUpFromLine size={20} />Withdraw</a>
          <a href="/settings" className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-slate-500"><SettingsIcon size={20} />Settings</a>
        </div>
      </nav>
    </div>
  );
}

// ============================================================
// INVEST PAGE (Strict VIP)
// ============================================================
export function Invest() {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [cryptoPeriod, setCryptoPeriod] = useState("30 Days");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState(null);
  const [profile, setProfile] = useState({ vip_tier: "None" });

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
  }, []);
  
  async function submit() {
    setError("");
    if (profile.vip_tier === "None") return setError("You must upgrade to VIP before investing.");
    const n = Number(amount);
    if (!n || n < (selected?.min_amount || 3000)) return setError(`Minimum is ₦${(selected?.min_amount || 3000).toLocaleString()}`);
    setSubmitting(true);
    let matured_at = null;
    if (selected.name === "Crypto Index") {
      const days = cryptoPeriod === "30 Days" ? 30 : cryptoPeriod === "3 Months" ? 90 : cryptoPeriod === "6 Months" ? 180 : 365;
      matured_at = new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    }
    const r = await api.invest(selected.id, n, 0, matured_at);
    setSubmitting(false);
    if (r?.success) {
      if (selected.name === "Real Estate") setPopup("Your money will grow in the next 4 weeks");
      else window.location.href = "/portfolio";
    } else setError(r?.error || "Failed");
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95 p-4"><a href="/home" className="inline-flex items-center gap-2"><ArrowLeft size={18} /> Back</a></header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Choose an investment</h2>
        
        {profile.vip_tier === "None" && (
          <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 flex items-center justify-between">
            <span>You must upgrade to VIP to access these investments.</span>
            <Link to="/vip" className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm">Go VIP</Link>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {plans.map((p) => (
            <div key={p.id} className={`rounded-2xl border border-blue-400/10 bg-slate-900 p-6 flex flex-col relative overflow-hidden ${profile.vip_tier === "None" ? "opacity-60" : ""}`}>
              
              {profile.vip_tier === "None" && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                   <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><LockIcon size={16}/> VIP Required</span>
                </div>
              )}

              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{p.type}</p>
              <p className="text-sm mt-3">Return: <span className="font-semibold text-blue-400">{p.expected_return}%</span></p>
              <p className="text-xs text-slate-500 mt-1">Min: ₦{Number(p.min_amount).toLocaleString()}</p>
              <button onClick={() => { if(profile.vip_tier !== "None") { setSelected(p); setAmount(""); setError(""); } }} disabled={profile.vip_tier === "None"} className="mt-6 rounded-xl bg-blue-600 py-3 text-sm font-semibold w-full disabled:bg-slate-800">Select Plan</button>
            </div>
          ))}
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0D1526] p-6 my-auto">
            <h3 className="text-xl font-bold">Invest in {selected.name}</h3>
            {selected.name === "Real Estate" && (
              <div className="mt-4">
                <p className="text-sm mb-2">Choose your estate tier:</p>
                <div className="grid grid-cols-2 gap-2">
                  {estateImages.map(e => (
                    <div key={e.name} onClick={() => setAmount(String(selected.min_amount * (e.rate/10)))} className="cursor-pointer border border-white/10 rounded-xl overflow-hidden hover:border-blue-500">
                      <img src={e.img} alt={e.name} className="h-20 w-full object-cover" />
                      <div className="p-2 text-xs bg-slate-900"><p className="font-bold">{e.name}</p><p className="text-blue-400">{e.rate}% ROI</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selected.name === "Crypto Index" && (
              <div className="mt-4">
                <p className="text-sm mb-2">Choose lock period:</p>
                <select value={cryptoPeriod} onChange={(e) => setCryptoPeriod(e.target.value)} className="w-full rounded-xl bg-slate-950 px-4 py-3 outline-none">
                  <option>30 Days</option><option>3 Months</option><option>6 Months</option><option>1 Year</option>
                </select>
              </div>
            )}
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
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 text-center">
            <h3 className="text-xl font-bold text-green-400">Success!</h3>
            <p className="mt-2 text-sm text-slate-300">{popup}</p>
            <button onClick={() => { setPopup(null); window.location.href="/portfolio"; }} className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold">OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PORTFOLIO (With Investment Toast)
// ============================================================
export function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("portfolio");
  const [claiming, setClaiming] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  const load = async () => { 
    const [p, h] = await Promise.all([api.portfolio(), api.history()]);
    setHoldings(p.data || []); 
    setHistory(h.data || []);
  };
  
  useEffect(() => { load(); }, []);
  
  const fmt = (a) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(a || 0);

  async function handleClaim(h) {
    setClaiming(h.id);
    const dailyProfit = h.amount * (h.plans.expected_return / 100); 
    await api.claimInvestment(h.id, dailyProfit);
    await load(); // Refresh data immediately
    setClaiming(null);
    setToastMsg(`You have claimed your investment! The funds will show on your dashboard.`);
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white p-4">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}

      <header className="mb-6"><a href="/home" className="inline-flex items-center gap-2"><ArrowLeft size={18} /> Back</a></header>
      <h1 className="text-2xl font-bold mb-4">My Portfolio</h1>
      
      <div className="flex gap-4 border-b border-white/10 mb-6">
        <button onClick={() => setActiveTab("portfolio")} className={`pb-2 text-sm font-semibold ${activeTab === "portfolio" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400"}`}>Active Investments</button>
        <button onClick={() => setActiveTab("history")} className={`pb-2 text-sm font-semibold ${activeTab === "history" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400"}`}>Transaction History</button>
      </div>

      {activeTab === "portfolio" ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {holdings.map((h) => {
            const canClaim = !h.last_daily_claim || (new Date() - new Date(h.last_daily_claim)) / 1000 >= 86400;
            const dailyProfit = h.amount * (h.plans.expected_return / 100);
            return (
              <div key={h.id} className="rounded-2xl border border-blue-400/10 bg-slate-900 p-6 flex flex-col justify-between">
                <div>
                  <p className="font-bold">{h.plans?.name}</p>
                  <p className="text-2xl mt-2">{fmt(h.amount)}</p>
                  <p className="text-xs text-slate-500 mt-1">Status: {h.status}</p>
                </div>
                {h.status === "active" && (
                  <button onClick={() => handleClaim(h)} disabled={!canClaim || claiming === h.id} className="mt-4 w-full rounded-xl bg-indigo-600 py-2 text-sm font-semibold disabled:opacity-50">
                    {claiming === h.id ? "Claiming..." : canClaim ? `Claim ${fmt(dailyProfit)}` : "Come back tomorrow"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((tx) => (
            <div key={tx.id} className="rounded-xl border border-white/10 bg-[#0D1526] p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold capitalize">{tx.type.replace('_', ' ')}</p>
                <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleString()}</p>
              </div>
              <p className={`font-bold ${tx.type === "withdraw" ? "text-red-400" : "text-emerald-400"}`}>
                {tx.type === "withdraw" ? "-" : "+"}{fmt(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Settings() {
  const [profile, setProfile] = useState({ name: "", email: "", avatar_url: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { api.profile().then(({ data }) => data && setProfile(data)); }, []);

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

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95"><div className="mx-auto flex h-20 items-center gap-4 px-4 max-w-2xl"><a href="/home" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"><ArrowLeft className="h-5 w-5" /></a><h1 className="text-xl font-bold">Settings</h1></div></header>
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        <div className="rounded-2xl border border-blue-400/10 bg-slate-900 p-5">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-blue-400/30 bg-blue-500/10 flex items-center justify-center">
              {profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" /> : <User className="h-8 w-8 text-blue-400" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{profile.name}</p>
              <p className="text-sm text-slate-500">{profile.email}</p>
            </div>
            <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold hover:bg-blue-500 transition">
              {uploading ? "Uploading..." : "Upload Photo"}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
        </div>
        <a href="/portfolio" className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm">Transaction History</a>
        <a href="/help" className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm">Help Center & Investment Guide</a>
        <button onClick={async () => { await api.logout(); window.location.href = "/"; }} className="flex w-full items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-red-400"><LogOut className="h-5 w-5" /> Log Out</button>
      </main>
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