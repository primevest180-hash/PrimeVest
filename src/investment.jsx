import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Upload, CheckCircle2 } from "lucide-react";
import { api } from "./app";

export function Invest() {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState(null);
  const [profile, setProfile] = useState({ vip_tier: "None" });
  const [wallet, setWallet] = useState({ available: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    // These are the new plans and prices
    setPlans([
      { id: "growth", name: "Growth Portfolio", type: "Stocks & ETFs", min_amount: 3000, expected_return: "12.5%", desc: "Choose 1 of 4 websites" },
      { id: "real_estate", name: "Real Estate", type: "Property Funds", min_amount: 5500, expected_return: "13%", desc: "Choose 1 of 4 estates" },
      { id: "trading", name: "Trading Index", type: "Simulator", min_amount: 16500, expected_return: "Variable", desc: "Trade live with our simulator" },
      { id: "affiliate", name: "Affiliate Marketing", type: "Digital Commerce", min_amount: 11500, expected_return: "Fixed", desc: "Share links & earn" },
      { id: "crypto", name: "Crypto Index", type: "Digital Assets", min_amount: 14500, expected_return: "22%", desc: "Standard plan" },
    ]);
    let active = true;
    Promise.all([api.profile(), api.wallet()]).then(([profileResult, walletResult]) => {
      if (!active) return;
      if (profileResult?.data) setProfile(profileResult.data);
      if (walletResult?.data) setWallet(walletResult.data);
    }).catch((err) => {
      console.error("Unable to load investment account:", err);
      if (active) setError("Unable to load your account. Please refresh and try again.");
    });
    return () => { active = false; };
  }, []);

  async function submit() {
    setError("");
    if (profile.vip_tier === "None") return setError("Upgrade to VIP first.");
    const n = Number(amount);
    const min = selected?.min_amount || 3000;
    if (!n || n < min) return setError(`Min ₦${min.toLocaleString()}`);
    if (n > wallet.available) return setError(`Insufficient. Balance ₦${wallet.available.toLocaleString()}`);

    // Simulator and affiliate tools are separate workflows, not investment products.
    if (selected.id === "trading") {
      navigate(`/trading-simulator?amount=${encodeURIComponent(n)}`);
      return;
    }
    if (selected.id === "affiliate") {
      navigate("/affiliate");
      return;
    }

    setSubmitting(true);
    try {
      const r = await api.invest(selected.id, n, 0, null);
      if (r?.success) {
        setPopup("Investment request submitted successfully.");
        window.setTimeout(() => navigate("/portfolio"), 2000);
      } else {
        setError(r?.error || "Investment request failed. Please try again.");
      }
    } catch (err) {
      console.error("Investment request failed:", err);
      setError("Unable to submit your investment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const locked = profile.vip_tier === "None";

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

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {plans.map(p => (
            <div key={p.id} className={`rounded-2xl border border-blue-400/10 bg-slate-900 p-6 relative ${locked ? "opacity-60" : ""}`}>
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{p.type}</p>
              <p className="text-sm mt-3">Return: <span className="font-semibold text-blue-400">{p.expected_return}</span></p>
              <p className="text-xs text-slate-500 mt-1">Min: ₦{Number(p.min_amount).toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-2 italic">{p.desc}</p>
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
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-400">Success!</h3>
            <p className="mt-2 text-sm text-slate-300">{popup}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Demo-only trading simulator. It intentionally does not change real wallet funds.
export function TradingSimulator() {
  const [searchParams] = useSearchParams();
  const [tradeAmount, setTradeAmount] = useState(searchParams.get("amount") || "");
  const [price, setPrice] = useState(100);
  const [isTrading, setIsTrading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [demoBalance, setDemoBalance] = useState(100000);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPrice((prev) => {
        const next = Math.max(10, prev + (Math.random() - 0.5) * 2);
        setHistory((items) => [...items.slice(-49), next]);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  async function executeTrade(type) {
    const amount = Number(tradeAmount);
    if (!Number.isFinite(amount) || amount <= 0) return setResult("Enter a valid demo amount.");
    if (amount > demoBalance) return setResult("Insufficient demo balance.");
    if (isTrading) return;

    setIsTrading(true);
    setResult(null);
    window.setTimeout(() => {
      const won = Math.random() > 0.5;
      const nextBalance = won ? demoBalance + 1000 : demoBalance - amount;
      setDemoBalance(nextBalance);
      setResult(won
        ? `Demo ${type.toUpperCase()} won. ₦1,000 demo profit added.`
        : `Demo ${type.toUpperCase()} lost. ₦${amount.toLocaleString()} demo funds deducted.`);
      setIsTrading(false);
      setTradeAmount("");
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24">
      <header className="border-b border-white/10 p-4 flex justify-between items-center">
        <a href="/invest" className="inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft size={18} /> Back</a>
        <p className="text-sm font-bold text-emerald-400">Demo balance: ₦{demoBalance.toLocaleString()}</p>
      </header>
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-[#0D1526] rounded-2xl p-6 border border-white/10 text-center">
          <h1 className="text-2xl font-black mb-2 text-blue-400">Trading Simulator</h1>
          <p className="text-sm text-amber-300 mb-5">Practice mode only — no real money or wallet balance is used.</p>
          <div className="my-8 h-40 bg-black/40 rounded-xl relative overflow-hidden flex items-end">
            {history.map((value, index) => (
              <div key={index} className="flex-1 h-full flex flex-col justify-end px-[1px]">
                <div className="w-full bg-emerald-500/50" style={{ height: `${Math.min(100, value)}%` }} />
              </div>
            ))}
          </div>
          <div className="text-4xl font-black text-white mb-6">₦{price.toFixed(2)}</div>
          <input type="number" min="1" value={tradeAmount}
            onChange={(event) => setTradeAmount(event.target.value)}
            placeholder="Demo amount (e.g. 5000)"
            className="w-full bg-slate-950 p-4 rounded-xl outline-none border border-white/10 mb-4 text-center text-xl" />
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => executeTrade("buy")} disabled={isTrading}
              className="bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold text-lg disabled:opacity-50">BUY</button>
            <button onClick={() => executeTrade("sell")} disabled={isTrading}
              className="bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold text-lg disabled:opacity-50">SELL</button>
          </div>
          {isTrading && <p className="mt-4 text-yellow-400 font-bold animate-pulse">Running demo trade...</p>}
          {result && <p role="status" className="mt-4 font-bold text-slate-200">{result}</p>}
        </div>
      </main>
    </div>
  );
}

// 🚨 AFFILIATE MARKETING PAGE
export function AffiliateDashboard() {
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [affBalance, setAffBalance] = useState(0);
  useEffect(() => {
    let active = true;
    api.profile().then(({ data }) => {
      if (active && data) setAffBalance(Number(data.affiliate_balance) || 0);
    }).catch((err) => console.error("Unable to load affiliate balance:", err));
    return () => { active = false; };
  }, []);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 🚨 Security Check: Verify it's an image
    if (!file.type.startsWith('image/')) return alert("Please upload an image file.");
    
    // Selecting an image is not proof of a verified referral. Do not credit
    // funds in the browser; verification and rewards must be handled server-side.
    setUploading(true);
    setScreenshot(file.name);
    setUploading(false);
    alert("Proof selected. No reward has been credited; an administrator must verify it first.");
  }

  async function transferToMain() {
    if (affBalance <= 0) return alert("No approved affiliate funds are available to transfer.");
    alert("Affiliate transfers must be processed by a secure server-side transaction. Please contact support; your balance has not been changed.");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24">
      <header className="border-b border-white/10 p-4 flex justify-between items-center">
        <a href="/invest" className="inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft size={18} /> Back</a>
        <p className="text-sm font-bold text-emerald-400">Affiliate Balance: ₦{affBalance.toLocaleString()}</p>
      </header>
      
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-[#0D1526] rounded-2xl p-6 border border-white/10 text-center">
          <h1 className="text-2xl font-black mb-2 text-purple-400">Affiliate Marketing</h1>
          <p className="text-sm text-slate-400 mb-6">Choose a screenshot as a local reference. Proof upload, administrator verification, and reward crediting are not connected yet; no reward is issued by selecting a file.</p>

          <div className="border-2 border-dashed border-white/20 rounded-xl p-8 mb-6">
            <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-300">Upload Screenshot Proof</p>
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="mt-4 inline-block bg-blue-600 px-6 py-2 rounded-xl font-bold cursor-pointer hover:bg-blue-500">
              Choose File
            </label>
            {uploading && <p className="mt-3 text-yellow-400 text-sm animate-pulse">Preparing proof...</p>}
            {screenshot && !uploading && <p className="mt-3 text-amber-300 text-sm">Selected: {screenshot} — awaiting administrator verification.</p>}
          </div>

          <button onClick={transferToMain} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold text-lg">Transfer to Main Wallet</button>
        </div>
      </main>
    </div>
  );
}