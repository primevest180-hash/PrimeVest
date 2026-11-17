import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, CheckCircle2 } from "lucide-react";
import { api, supabase } from "./app";

export function Invest() {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState("");
  const [profile, setProfile] = useState({ vip_tier: "None" });
  const [wallet, setWallet] = useState({ available: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    Promise.all([api.plans(), api.profile(), api.wallet()]).then(([planResult, profileResult, walletResult]) => {
      if (!active) return;
      if (planResult?.error) throw planResult.error;
      setPlans((planResult?.data || []).filter(p => p.active));
      if (profileResult?.data) setProfile(profileResult.data);
      if (walletResult?.data) setWallet(walletResult.data);
    }).catch((err) => {
      console.error("Unable to load staking account:", err);
      if (active) setError(err.message || "Unable to load plans or account. Refresh and try again.");
    });
    return () => { active = false; };
  }, []);

  async function submit() {
    setError("");
    if (!selected?.id) return setError("Select a valid plan.");
    if (profile.vip_tier === "None") return setError("Upgrade to VIP first.");
    const n = Number(amount);
    const min = Number(selected.min_amount || 0);
    if (!Number.isFinite(n) || n <= 0 || n < min) return setError(`Minimum stake is ₦${min.toLocaleString("en-NG")}.`);
    if (n > Number(wallet.available || 0)) return setError(`Insufficient available balance. Available: ₦${Number(wallet.available || 0).toLocaleString("en-NG")}.`);
    if (!selected.duration_days) return setError("This plan's staking duration has not yet been configured. Please contact support.");

    setSubmitting(true);
    try {
      const result = await api.invest(selected.id, n);
      if (!result?.success) throw new Error(result?.error || "Staking request failed.");
      setSelected(null);
      setAmount("");
      setPopup("Your staking request was submitted. Funds are reserved while an administrator reviews it. The maturity countdown starts only after approval.");
      const walletResult = await api.wallet();
      if (walletResult?.data) setWallet(walletResult.data);
    } catch (err) {
      setError(err.message || "Unable to submit your stake.");
    } finally { setSubmitting(false); }
  }

  const locked = profile.vip_tier === "None";
  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95 p-4 flex justify-between items-center">
        <a href="/home" className="inline-flex items-center gap-2"><ArrowLeft size={18} /> Back</a>
        <p className="text-sm font-bold text-emerald-400">₦{Number(wallet.available || 0).toLocaleString("en-NG")}</p>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="text-3xl font-bold mb-2">Choose a staking plan</h2>
        <p className="text-sm text-slate-400 mb-8">Requests require administrator approval. Funds are reserved while pending; maturity begins after approval.</p>
        {locked && <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 flex items-center justify-between"><span>Upgrade to VIP to stake.</span><Link to="/vip" className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm">Go VIP</Link></div>}
        {error && !selected && <p className="mb-5 text-sm text-red-400">{error}</p>}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {plans.map(p => (
            <div key={p.id} className={`rounded-2xl border border-blue-400/10 bg-slate-900 p-6 ${locked ? "opacity-60" : ""}`}>
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{p.type || "Staking plan"}</p>
              <p className="text-sm mt-3">Expected return: <span className="font-semibold text-blue-400">{Number(p.expected_return || 0)}%</span></p>
              <p className="text-xs text-slate-500 mt-1">Minimum: ₦{Number(p.min_amount || 0).toLocaleString("en-NG")}</p>
              <p className="text-xs text-slate-400 mt-1">{p.duration_days ? `${p.duration_days} days` : "Duration not configured"}</p>
              <button onClick={() => { setSelected(p); setAmount(""); setError(""); }} disabled={locked || !p.duration_days}
                className="mt-6 rounded-xl bg-blue-600 py-3 text-sm font-semibold w-full disabled:bg-slate-800">{p.duration_days ? "Select Plan" : "Unavailable"}</button>
            </div>
          ))}
          {plans.length === 0 && <p className="text-slate-400">No active plans are currently available.</p>}
        </div>
      </main>
      {selected && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0D1526] p-6">
        <h3 className="text-xl font-bold">Stake in {selected.name}</h3>
        <label className="text-sm mb-1 mt-4 block">Amount (NGN)</label>
        <input type="number" min={selected.min_amount} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Minimum ${selected.min_amount}`} className="w-full rounded-xl bg-slate-950 px-4 py-3 outline-none" />
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-5 flex gap-3"><button onClick={() => setSelected(null)} className="flex-1 rounded-xl border border-white/10 py-3">Cancel</button><button onClick={submit} disabled={submitting} className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold disabled:opacity-60">{submitting ? "Submitting..." : "Submit stake"}</button></div>
      </div></div>}
      {popup && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"><div className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 text-center"><CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4"/><h3 className="text-xl font-bold text-green-400">Request submitted</h3><p className="mt-2 text-sm text-slate-300">{popup}</p><button onClick={() => { setPopup(""); navigate("/portfolio"); }} className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-semibold">View my stakes</button></div></div>}
    </div>
  );
}

// The old random-outcome simulator is intentionally retired. All real-money activity
// must use the transparent, admin-reviewed staking workflow above.
export function TradingSimulator() {
  return <Navigate to="/invest" replace />;
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
