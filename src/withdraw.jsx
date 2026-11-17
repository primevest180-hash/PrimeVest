
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { api } from "./app";

/* =========================== WITHDRAW =========================== */
export function Withdraw() {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    api.wallet().then(({ data }) => {
      if (data) setBalance(data.available);
    });
  }, []);

  const next = () => {
    const n = Number(amount);

    if (!Number.isFinite(n) || !amount || n <= 0) {
      return setError("Enter a valid amount.");
    }

    if (n < 50000) {
      return setError("Minimum withdrawal is ₦50,000.");
    }

    if (n > 120000) {
      return setError("Maximum withdrawal is ₦120,000.");
    }

    if (n > balance) {
      return setError(
        `Insufficient. Available ₦${balance.toLocaleString()}`
      );
    }

    window.location.href = `/withdraw/account?amount=${n}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95">
        <div className="mx-auto flex h-20 max-w-2xl items-center gap-4 px-4">
          <a
            href="/home"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </a>
          <h1 className="text-xl font-bold">Withdraw</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-blue-400/10 bg-blue-950/30 p-5">
          <p className="text-sm text-slate-400">Available</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">
            ₦{balance.toLocaleString()}
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-blue-400/10 bg-slate-900 p-6">
          <label className="mb-2 block text-sm">Amount</label>

          <div className="flex rounded-xl border border-blue-400/10 bg-slate-950">
            <span className="flex items-center px-4 text-slate-400">₦</span>

            <input
              value={amount}
              onChange={(e) => {
                if (/^\d*\.?\d*$/.test(e.target.value)) {
                  setAmount(e.target.value);
                  setError("");
                }
              }}
              placeholder="Enter amount (50,000 - 120,000)"
              inputMode="decimal"
              className="w-full bg-transparent px-2 py-4 outline-none"
            />
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Minimum: ₦50,000 | Maximum: ₦120,000
          </p>

          {error && (
            <p className="mt-4 rounded-xl bg-red-500/5 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            onClick={next}
            className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-semibold"
          >
            Continue
          </button>
        </div>
      </main>
    </div>
  );
}

/* =========================== WITHDRAW ACCOUNT =========================== */
export function WithdrawAccount() {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState("");

  const params = new URLSearchParams(window.location.search);
  const amount = Number(params.get("amount") || 0);

  const fmt = amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
  });

  async function proceed() {
    if (!Number.isFinite(amount) || amount < 50000 || amount > 120000) {
      return setError(
        "Withdrawal must be between ₦50,000 and ₦120,000."
      );
    }

    if (!bankName.trim() || !accountNumber || !accountName.trim()) {
      return setError("Fill all fields.");
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return setError("Account number must be 10 digits.");
    }

    setSubmitting(true);
    setError("");

    try {
      const r = await api.withdraw({
        amount,
        bank_name: bankName.trim(),
        account_number: accountNumber,
        account_name: accountName.trim(),
      });

      if (r?.success) {
        setShowPopup(true);
      } else {
        setError(r?.error || "Failed.");
      }
    } catch (err) {
      setError(err?.message || "Withdrawal failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-blue-400/10 bg-slate-950/95">
        <div className="mx-auto flex h-20 max-w-2xl items-center gap-4 px-4">
          <a
            href="/withdraw"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900"
          >
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
            <label className="mb-2 block text-sm font-medium">
              Bank Name
            </label>
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. GTBank"
              className="w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 text-sm outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">
              Account Number
            </label>
            <input
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(
                  e.target.value.replace(/\D/g, "").slice(0, 10)
                )
              }
              placeholder="10 digits"
              inputMode="numeric"
              className="w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 text-sm outline-none"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Account Name
            </label>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-blue-400/10 bg-slate-950 px-4 py-4 text-sm outline-none"
            />
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-400">{error}</p>
          )}

          <button
            onClick={proceed}
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-600 py-4 font-bold disabled:opacity-40"
          >
            {submitting ? "Processing..." : "Confirm Withdrawal"}
          </button>
        </div>
      </main>

      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-[#0D1526] p-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-400" />

            <h3 className="mb-2 text-2xl font-bold">
              Request Submitted
            </h3>

            <p className="mb-6 text-sm text-slate-300">
              Processed within 3 hours.
            </p>

            <button
              onClick={() =>
                (window.location.href =
                  `/withdraw/success?amount=${amount}&bank=${encodeURIComponent(bankName)}&accountName=${encodeURIComponent(accountName)}`)
              }
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold"
            >
              View Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================== WITHDRAW SUCCESS =========================== */
export function WithdrawSuccess() {
  const p = new URLSearchParams(window.location.search);

  const amount = p.get("amount") || "0";
  const bank = p.get("bank") || "Bank";
  const accountName = p.get("accountName") || "";

  const fmt = Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
  });

  const [timeLeft, setTimeLeft] = useState("3h 0m 0s");

  useEffect(() => {
    const end = Date.now() + 3 * 60 * 60 * 1000;

    const tick = () => {
      const diff = end - Date.now();

      if (diff <= 0) {
        setTimeLeft("Processing...");
      } else {
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
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10">
          <Clock className="h-12 w-12 text-amber-400" />
        </div>

        <p className="text-sm font-bold uppercase text-amber-400">
          Transfer Pending
        </p>

        <h1 className="mt-2 text-4xl font-extrabold">
          ₦{fmt}
        </h1>

        <div className="mt-6 rounded-xl bg-black/40 p-4 text-sm">
          <p className="text-slate-400">
            To: <span className="text-white">{accountName}</span>
          </p>
          <p className="text-slate-400">
            Bank: <span className="text-white">{bank}</span>
          </p>
        </div>

        <div className="mt-8 rounded-xl bg-amber-500/10 p-4">
          <p className="text-xs text-amber-200">Time Remaining</p>
          <p className="text-2xl font-mono font-bold text-amber-400">
            {timeLeft}
          </p>
        </div>

        <a
          href="/home"
          className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 font-bold text-black"
        >
          Back
        </a>
      </div>
    </div>
  );
}
