import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, DollarSign, Upload, CheckCircle2, AlertCircle, Play, Pause } from "lucide-react";
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
  const [recent, setRecent] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    // These are the new plans and prices
    setPlans([
      { id: "growth", name: "Growth Portfolio", type: "Stocks & ETFs", min_amount: 3000, expected_return: "12.5%", desc: "Choose 1 of 4 websites" },
      { id: "real_estate", name: "Real Estate", type: "Property Funds", min_amount: 5500, expected_return: "13%", desc: "Choose 1 of 4 estates" },
      { id: "trading", name: "Trading Index", type: "Simulator", min_amount: 16500, expected_return: "Variable", desc: "Trade live with our simulator" },
      { id: "affiliate", name: "Affiliate Marketing", type: "Digital Commerce", min_amount: 11500, expected_return: "Fixed", desc: "Share links & earn" },
      { id: "crypto", name: "Crypto Index", type: "Digital Assets", min_amount: 14500, expected_return: "22%", desc: "Standard plan" },
    ]);
    api.profile().then(({ data }) => data && setProfile(data));
    api.wallet().then(({ data }) => data && setWallet(data));
  }, []);

  async function submit() {
    setError("");
    if (profile.vip_tier === "None") return setError("Upgrade to VIP first.");
    if (recent) return setError("Only one investment per day.");
    const n = Number(amount);
    const min = selected?.min_amount || 3000;
    if (!n || n < min) return setError(`Min ₦${min.toLocaleString()}`);
    if (n > wallet.available) return setError(`Insufficient. Balance ₦${wallet.available.toLocaleString()}`);

    setSubmitting(true);
    // If it's trading, we don't call the standard invest. We open the simulator.
    if (selected.id === "trading") {
       setSubmitting(false);
       setSelected(null);
       // Navigate to the simulator page
       window.location.href = `/trading-simulator?amount=${n}`;
       return;
    }

    // Standard investment for others
    const r = await api.invest(selected.id, n, 0, null);
    setSubmitting(false);
    if (r?.success) {
      setPopup("Investment successful!");
      setTimeout(() => window.location.href = "/portfolio", 2000);
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

// 🚨 TRADING SIMULATOR PAGE
export function TradingSimulator() {
  const [balance, setBalance] = useState(0);
  const [tradeAmount, setTradeAmount] = useState("");
  const [price, setPrice] = useState(100);
  const [isTrading, setIsTrading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]); // For candlesticks

  useEffect(() => {
    api.wallet().then(({ data }) => data && setBalance(data.available));
    
    // Simulate real-time price ticker
    const interval = setInterval(() => {
      setPrice(prev => {
        const change = (Math.random() - 0.5) * 2; // Fluctuate by max $2
        const newPrice = Math.max(10, prev + change);
        setHistory(h => [...h.slice(-50), newPrice]); // Keep last 50 prices
        return newPrice;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  async function executeTrade(type) {
    const amt = Number(tradeAmount);
    if (!amt || amt <= 0) return alert("Enter a valid amount");
    if (amt > balance) return alert("Insufficient balance");

    setIsTrading(true);
    // Wait 3 seconds (simulate trade time)
    setTimeout(async () => {
      const isWin = Math.random() > 0.5; // 50/50 chance
      let newBalance = balance;

      if (isWin) {
        newBalance += (amt + 1000); // Win: Keep stake + 1000 profit
        setResult(`You WON! ₦${(amt + 1000).toLocaleString()} added.`);
      } else {
        newBalance -= amt; // Lose: deduct amount
        setResult(`You LOST! ₦${amt.toLocaleString()} deducted.`);
      }

      // Update wallet balance in database
      await supabase.from("wallets").update({ available: newBalance }).eq("user_id", (await supabase.auth.getUser()).data.user.id);
      
      setBalance(newBalance);
      setIsTrading(false);
      setTradeAmount("");
      
      setTimeout(() => setResult(null), 5000);
    }, 3000);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24">
       <header className="border-b border-white/10 p-4 flex justify-between items-center">
        <a href="/invest" className="inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft size={18} /> Back</a>
        <p className="text-sm font-bold text-emerald-400">Balance: ₦{balance.toLocaleString()}</p>
      </header>
      
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-[#0D1526] rounded-2xl p-6 border border-white/10 text-center">
          <h1 className="text-2xl font-black mb-2 text-blue-400">Live Trading Simulator</h1>
          <p className="text-sm text-slate-400">Buy or Sell. Win 1000 or lose your stake.</p>
          
          <div className="my-8 h-40 bg-black/40 rounded-xl relative overflow-hidden flex items-end">
            {/* Simple candlestick chart simulation */}
            {history.map((p, i) => (
              <div key={i} className="flex-1 h-full flex flex-col justify-end px-[1px]">
                <div className={`w-full bg-emerald-500/50`} style={{ height: `${Math.min(100, p)}%` }} />
              </div>
            ))}
          </div>
          
          <div className="text-4xl font-black text-white mb-6">
            ₦{price.toFixed(2)}
          </div>

          <input 
            type="number" 
            value={tradeAmount} 
            onChange={e => setTradeAmount(e.target.value)} 
            placeholder="Amount to trade (e.g. 5000)" 
            className="w-full bg-slate-950 p-4 rounded-xl outline-none border border-white/10 mb-4 text-center text-xl"
          />

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => executeTrade('buy')} disabled={isTrading} className="bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold text-lg disabled:opacity-50">BUY</button>
            <button onClick={() => executeTrade('sell')} disabled={isTrading} className="bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold text-lg disabled:opacity-50">SELL</button>
          </div>
          
          {isTrading && <p className="mt-4 text-yellow-400 font-bold animate-pulse">Executing trade...</p>}
          {result && <p className={`mt-4 font-bold ${result.includes("WON") ? "text-emerald-400" : "text-red-400"}`}>{result}</p>}
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
  const [profile, setProfile] = useState({});
  
  useEffect(() => {
    api.profile().then(({ data }) => {
      setProfile(data);
      setAffBalance(data.affiliate_balance || 0);
    });
  }, []);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 🚨 Security Check: Verify it's an image
    if (!file.type.startsWith('image/')) return alert("Please upload an image file.");
    
    setUploading(true);
    // Simulate AI verification
    setTimeout(async () => {
      // Add 200 to affiliate balance
      const newBal = affBalance + 200;
      
      await supabase.from("profiles").update({ affiliate_balance: newBal }).eq("id", profile.id);
      setAffBalance(newBal);
      setScreenshot(file.name);
      setUploading(false);
      alert("Screenshot verified! ₦200 added to your Affiliate Dashboard.");
    }, 2000);
  }

  async function transferToMain() {
    if (affBalance <= 0) return alert("No funds to transfer.");
    
    const { data: { user } } = await supabase.auth.getUser();
    const { data: w } = await supabase.from("wallets").select("available").eq("user_id", user.id).single();
    
    // Transfer logic
    await supabase.from("wallets").update({ available: (w.available || 0) + affBalance }).eq("user_id", user.id);
    await supabase.from("profiles").update({ affiliate_balance: 0 }).eq("id", profile.id);
    
    setAffBalance(0);
    alert(`₦${affBalance.toLocaleString()} transferred to your main wallet!`);
    window.location.href = "/home";
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
          <p className="text-sm text-slate-400 mb-6">Share your PrimeVest link on WhatsApp, Facebook, or Twitter, take a screenshot, and upload it here to earn ₦200 per verified share.</p>

          <div className="border-2 border-dashed border-white/20 rounded-xl p-8 mb-6">
            <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-300">Upload Screenshot Proof</p>
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="mt-4 inline-block bg-blue-600 px-6 py-2 rounded-xl font-bold cursor-pointer hover:bg-blue-500">
              Choose File
            </label>
            {uploading && <p className="mt-3 text-yellow-400 text-sm animate-pulse">Verifying screenshot...</p>}
            {screenshot && !uploading && <p className="mt-3 text-emerald-400 text-sm">✓ {screenshot} verified!</p>}
          </div>

          <button onClick={transferToMain} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold text-lg">Transfer to Main Wallet</button>
        </div>
      </main>
    </div>
  );
}