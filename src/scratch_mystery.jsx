import { useState } from "react";
import { Gift, Zap, ArrowLeft } from "lucide-react";
import { api, supabase } from "./app";

/* =========================== SCRATCH CARD =========================== */
export function ScratchCard() {
  const [loading, setLoading] = useState(false);
  const [prize, setPrize] = useState(null);

  async function buy() {
    setLoading(true);
    // 10 possible prizes (randomised)
    const prizes = [
      "₦5,000 Cash", "₦2,000 Cash", "5 HC", "₦1,000 Cash", 
      "4 HC", "8 HC", "₦4,000 Cash", "Try Again", "Try Again", "Try Again"
    ];
    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];

    const { data: { user } } = await supabase.auth.getUser();
    // Pay ₦1,000 to play
    const r = await api.depositInit(1000, "card", user.email, false, "scratch");
    setLoading(false);
    
    const url = r?.authorization_url || r?.url;
    if (url) {
      // Store the prize in local storage so we can show it after payment
      localStorage.setItem("scratch_prize", randomPrize);
      window.location.href = url;
    }
  }

  return (
    <div className="min-h-screen bg-[#070D1A] p-6 text-white flex flex-col items-center justify-center">
      <div className="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-[#0D1526] p-8 text-center">
        <Gift className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Scratch & Win</h1>
        <p className="text-slate-400 text-sm mb-6">Pay ₦1,000 for a chance to win up to ₦5,000 or HC!</p>
        
        {prize ? (
          <div className="mb-6 rounded-xl bg-emerald-500/20 p-4 border border-emerald-500/30">
            <p className="text-sm text-emerald-300">You Won:</p>
            <p className="text-2xl font-bold text-white">{prize}</p>
          </div>
        ) : null}

        <button onClick={buy} disabled={loading}
          className="w-full rounded-xl bg-emerald-600 py-4 font-bold disabled:opacity-50">
          {loading ? "Redirecting..." : "Buy for ₦1,000"}
        </button>
        <a href="/home" className="mt-6 block text-sm text-slate-400 flex items-center justify-center gap-2"><ArrowLeft size={16}/> Back</a>
      </div>
    </div>
  );
}

/* =========================== MYSTERY BOX =========================== */
export function MysteryBox() {
  const [loading, setLoading] = useState(false);
  const [prize, setPrize] = useState(null);

  async function buy() {
    setLoading(true);
    // 3 possible prizes
    const prizes = [
      "₦9,000 Cash + VIP 2 Plan", 
      "₦6,000 Cash + Investment Plan", 
      "Better Luck Next Time"
    ];
    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];

    const { data: { user } } = await supabase.auth.getUser();
    // Pay ₦5,000 to play
    const r = await api.depositInit(5000, "card", user.email, false, "mystery");
    setLoading(false);
    
    const url = r?.authorization_url || r?.url;
    if (url) {
      localStorage.setItem("mystery_prize", randomPrize);
      window.location.href = url;
    }
  }

  return (
    <div className="min-h-screen bg-[#070D1A] p-6 text-white flex flex-col items-center justify-center">
      <div className="w-full max-w-sm rounded-3xl border border-purple-500/30 bg-[#0D1526] p-8 text-center">
        <Zap className="h-16 w-16 text-purple-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Mystery Box</h1>
        
        <div className="text-sm text-slate-400 mb-6 space-y-2">
          <p>Stand a chance to win:</p>
          <p className="text-amber-400 font-bold">₦9,000 Cash + VIP 2 Plan</p>
          <p className="text-slate-500">OR</p>
          <p className="text-emerald-400 font-bold">₦6,000 Cash + Investment Plan</p>
        </div>

        {prize ? (
          <div className="mb-6 rounded-xl bg-purple-500/20 p-4 border border-purple-500/30">
            <p className="text-sm text-purple-300">You Won:</p>
            <p className="text-lg font-bold text-white">{prize}</p>
          </div>
        ) : null}

        <button onClick={buy} disabled={loading}
          className="w-full rounded-xl bg-purple-600 py-4 font-bold disabled:opacity-50">
          {loading ? "Redirecting..." : "Buy for ₦5,000"}
        </button>
        <a href="/home" className="mt-6 block text-sm text-slate-400 flex items-center justify-center gap-2"><ArrowLeft size={16}/> Back</a>
      </div>
    </div>
  );
}