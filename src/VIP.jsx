// src/VIP.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Crown, ArrowLeft, CreditCard, Loader2, ArrowRight } from "lucide-react";
import { api, supabase } from "./app";

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
          <p className="text-sm text-slate-400 mt-2">VIP unlocks all investment plans and turns your dashboard gold.</p>
        </div>
        <div className="space-y-4">
          {tiers.map(t => (
            <button key={t.tier}
              onClick={() => navigate(`/vip/checkout?tier=${t.tier}&price=${t.price}`)}
              className="w-full rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500 to-yellow-600 p-6 text-left hover:scale-[1.02] transition">
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