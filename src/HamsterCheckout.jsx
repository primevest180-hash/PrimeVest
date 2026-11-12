import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { supabase, api } from "./app";

export function HamsterCheckout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const item = params.get("item");
  const price = Number(params.get("price"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if we are returning from a successful Paystack payment
  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get("reference") 
                   || new URLSearchParams(window.location.search).get("trxref");
    
    if (reference) {
      // 1. Verify the payment with our Edge Function
      verifyPayment(reference);
    }
  }, []);

  async function verifyPayment(ref) {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Call the Supabase Edge Function to verify the Paystack transaction
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/index`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ action: "verify_hamster_purchase", reference: ref, email: user.email, item }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Payment could not be verified.");

      // 2. Grant the prize in the database
      const { data: grantData, error: grantError } = await supabase.rpc("hamster_grant_purchase", { p_item: item });
      
      if (grantError) throw grantError;

      // 3. Show success and go back to game
      alert(grantData.message);
      navigate("/hamster");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function initiatePayment() {
    setLoading(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Call Edge Function to initialize Paystack
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/index`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ action: "init_hamster_purchase", amount: price, email: user.email, item }),
      });

      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.error || "Failed to initialize payment.");
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070D1A] p-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1526] p-8 text-center shadow-2xl">
        <ShieldCheck className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2">Secure Checkout</h1>
        <p className="text-sm text-slate-400 mb-8">
          You are purchasing <strong className="text-white">{item.replace('_', ' ')}</strong> for the Wallet Game.
        </p>
        
        <div className="rounded-2xl bg-slate-950 p-6 mb-6">
          <p className="text-xs text-slate-500 mb-1">Total Amount</p>
          <p className="text-4xl font-black">₦{price.toLocaleString()}</p>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <button onClick={initiatePayment} disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition">
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Pay with Paystack"}
        </button>

        <Link to="/hamster" className="mt-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={16} /> Cancel and return to game
        </Link>
      </div>
    </main>
  );
}