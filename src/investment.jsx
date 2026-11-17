import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Upload, CheckCircle2 } from "lucide-react";
import { api, supabase } from "./app";

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
  const [durationId, setDurationId] = useState("quick");
  const durations = [
    { id: "quick", label: "Quick trade", multiplier: 2 },
    { id: "2d", label: "2 days", multiplier: 2.5 },
    { id: "6d", label: "6 days", multiplier: 3 },
    { id: "10d", label: "1 week 3 days", multiplier: 5 },
    { id: "3w", label: "3 weeks", multiplier: 7 },
    { id: "4w", label: "1 month 4 weeks", multiplier: 10 },
    { id: "4m", label: "4 months", multiplier: 16 },
    { id: "1y", label: "1 year", multiplier: 21 },
  ];
  const selectedDuration = durations.find((item) => item.id === durationId) || durations[0];

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
      const grossPayout = amount * selectedDuration.multiplier;
      const nextBalance = won ? demoBalance - amount + grossPayout : demoBalance - amount;
      setDemoBalance(nextBalance);
      setResult(won
        ? `Demo ${type.toUpperCase()} won (${selectedDuration.label}). Gross demo payout: ₦${grossPayout.toLocaleString()}. This includes your demo stake.`
        : `Demo ${type.toUpperCase()} lost (${selectedDuration.label}). ₦${amount.toLocaleString()} demo funds deducted.`);
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
          <label className="mb-2 block text-left text-sm text-slate-300">Trade duration</label>
          <select value={durationId} onChange={(event) => setDurationId(event.target.value)} className="mb-4 w-full rounded-xl border border-white/10 bg-slate-950 p-4 text-white">
            {durations.map((duration) => <option key={duration.id} value={duration.id}>{duration.label} — {duration.multiplier}× total demo payout</option>)}
          </select>
          <input type="number" min="1" value={tradeAmount}
            onChange={(event) => setTradeAmount(event.target.value)}
            placeholder="Demo amount (e.g. 5000)"
            className="w-full bg-slate-950 p-4 rounded-xl outline-none border border-white/10 mb-2 text-center text-xl" />
          <p className="mb-4 text-xs text-slate-400">Potential gross demo payout: ₦{(Math.max(0, Number(tradeAmount) || 0) * selectedDuration.multiplier).toLocaleString()} (stake included). Losses deduct the demo stake only.</p>
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

// Affiliate proof upload. Rewards are credited only after admin review via a protected database RPC.
export function AffiliateDashboard() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [affBalance, setAffBalance] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [message, setMessage] = useState("");

  async function loadAffiliateData() {
    const [{ data: profile }, { data: { user } }] = await Promise.all([api.profile(), supabase.auth.getUser()]);
    if (profile) setAffBalance(Number(profile.affiliate_balance) || 0);
    if (!user) return;
    const { data, error } = await supabase.from("affiliate_submissions").select("id,status,reward_amount,admin_note,created_at").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) throw error;
    setSubmissions(data || []);
  }

  useEffect(() => { loadAffiliateData().catch((err) => setMessage(err.message)); }, []);

  async function handleUpload() {
    if (!file) return setMessage("Choose an image first.");
    if (!file.type.startsWith("image/")) return setMessage("Only image files are accepted.");
    if (file.size > 8 * 1024 * 1024) return setMessage("Image must be 8 MB or smaller.");
    setUploading(true); setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${user.id}/${crypto.randomUUID()}.${ext || "jpg"}`;
      const { error: uploadError } = await supabase.storage.from("affiliate-proofs").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from("affiliate_submissions").insert({ user_id: user.id, proof_path: path, status: "pending" });
      if (insertError) {
        await supabase.storage.from("affiliate-proofs").remove([path]);
        throw insertError;
      }
      setFile(null);
      const input = document.getElementById("affiliate-proof-file");
      if (input) input.value = "";
      setMessage("Proof submitted. It is now waiting for administrator review; no reward has been credited yet.");
      await loadAffiliateData();
    } catch (err) { setMessage(err.message || "Upload failed."); }
    finally { setUploading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24">
      <header className="border-b border-white/10 p-4 flex justify-between items-center"><a href="/invest" className="inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft size={18}/> Back</a><p className="text-sm font-bold text-emerald-400">Approved Affiliate Balance: ₦{affBalance.toLocaleString()}</p></header>
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-[#0D1526] rounded-2xl p-6 border border-white/10">
          <h1 className="text-2xl font-black mb-2 text-purple-400">Affiliate Marketing</h1>
          <p className="text-sm text-slate-400 mb-5">Upload an image showing your affiliate activity. An administrator will review it and enter any verified reward. Uploading alone does not earn or credit money.</p>
          <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center">
            <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3"/><label htmlFor="affiliate-proof-file" className="block text-sm text-slate-300 mb-3">Choose proof image (max 8 MB)</label>
            <input id="affiliate-proof-file" type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-300" />
            {file && <p className="text-xs text-amber-300 mt-3">Selected: {file.name}</p>}
            <button onClick={handleUpload} disabled={!file || uploading} className="mt-4 w-full bg-blue-600 px-6 py-3 rounded-xl font-bold disabled:opacity-50">{uploading ? "Uploading..." : "Submit Proof for Review"}</button>
          </div>
          {message && <p role="status" className="mt-4 text-sm text-amber-200">{message}</p>}
        </div>
        <section className="bg-[#0D1526] rounded-2xl p-6 border border-white/10">
          <h2 className="text-lg font-bold mb-4">Your submissions</h2>
          {submissions.length === 0 ? <p className="text-sm text-slate-400">No submissions yet.</p> : <div className="space-y-3">{submissions.map(item => <div key={item.id} className="rounded-xl bg-slate-950 p-4 flex justify-between gap-3"><div><p className="text-sm font-semibold">{new Date(item.created_at).toLocaleString()}</p>{item.admin_note && <p className="text-xs text-slate-400 mt-1">{item.admin_note}</p>}</div><div className="text-right"><p className={`text-sm font-bold ${item.status === "approved" ? "text-emerald-400" : item.status === "rejected" ? "text-red-400" : "text-amber-300"}`}>{item.status}</p>{Number(item.reward_amount) > 0 && <p className="text-xs text-emerald-300">₦{Number(item.reward_amount).toLocaleString()}</p>}</div></div>)}</div>}
        </section>
      </main>
    </div>
  );
}
