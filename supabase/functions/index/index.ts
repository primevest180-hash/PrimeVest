import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = requiredEnv("SUPABASE_URL");
    const SERVICE_ROLE_KEY = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const ANON_KEY = requiredEnv("SUPABASE_ANON_KEY");
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

    const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Authentication required" }, 401);

    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Invalid or expired session" }, 401);
    const user = authData.user;

    const body = await req.json();
    const action = String(body.action || "");

    if (action === "invest") {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(Math.round(amount * 100))) {
        return json({ error: "Enter a valid stake amount" }, 400);
      }

      // Accept the UUID from the current UI, or resolve a plan name/legacy slug to its real UUID.
      const suppliedPlan = String(body.plan_id || body.plan_name || "").trim();
      if (!suppliedPlan) return json({ error: "Select a staking plan" }, 400);
      const legacyPlanNames: Record<string, string> = {
        growth: "Growth Portfolio",
        real_estate: "Real Estate",
        realestate: "Real Estate",
        crypto: "Crypto Index",
        affiliate: "Affiliate Marketing",
      };
      const normalizedPlan = legacyPlanNames[suppliedPlan.toLowerCase()] || suppliedPlan.replace(/[_-]+/g, " ");
      let planQuery = service.from("plans").select("id,name,active").limit(1);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(suppliedPlan);
      planQuery = isUuid ? planQuery.eq("id", suppliedPlan) : planQuery.ilike("name", normalizedPlan);
      const { data: plan, error: planError } = await planQuery.maybeSingle();
      if (planError || !plan?.id || !plan.active) return json({ error: "Selected plan was not found or is inactive" }, 400);

      const { data, error } = await service.rpc("primevest_submit_stake", {
        p_user_id: user.id,
        p_plan_id: plan.id,
        p_amount: amount,
      });
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    if (action === "toggle_user_status") {
      const targetUserId = String(body.user_id || "");
      const nextStatus = String(body.status || "");
      if (!targetUserId || !["active", "frozen"].includes(nextStatus)) return json({ error: "Invalid user or account status" }, 400);
      const { data: adminProfile, error: adminProfileError } = await service
        .from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      const adminIds = ["a95d9e9b-00dd-473f-a13b-0ee77eb9ae31", "e644805d-5c81-4402-8e28-f64828a9814e"];
      if (adminProfileError || (!adminProfile?.is_admin && !adminIds.includes(user.id))) return json({ error: "Administrator access required" }, 403);
      const { error } = await service.from("profiles").update({ account_status: nextStatus }).eq("id", targetUserId);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true, account_status: nextStatus });
    }

    if (action === "get_pending_stakes") {
      const { data: profile, error: profileError } = await service
        .from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      const adminIds = [
        "a95d9e9b-00dd-473f-a13b-0ee77eb9ae31",
        "e644805d-5c81-4402-8e28-f64828a9814e",
      ];
      if (profileError || (!profile?.is_admin && !adminIds.includes(user.id))) {
        return json({ error: "Administrator access required" }, 403);
      }
      const { data: rows, error } = await service.from("investments")
        .select("*, plans(name,type)").eq("status", "pending").order("requested_at", { ascending: true });
      if (error) return json({ error: error.message }, 400);
      const userIds = [...new Set((rows || []).map((row: any) => row.user_id).filter(Boolean))];
      const { data: profiles } = userIds.length
        ? await service.from("profiles").select("id,name,email,username").in("id", userIds)
        : { data: [] };
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      return json({ data: (rows || []).map((row: any) => ({ ...row, profile: profileMap.get(row.user_id) || null })) });
    }

    if (action === "review_stake") {
      const investmentId = String(body.investment_id || "");
      const decision = String(body.decision || "");
      if (!investmentId || !["approved", "rejected"].includes(decision)) {
        return json({ error: "Investment ID and valid decision are required" }, 400);
      }
      const { data: profile, error: profileError } = await service
        .from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      const adminIds = [
        "a95d9e9b-00dd-473f-a13b-0ee77eb9ae31",
        "e644805d-5c81-4402-8e28-f64828a9814e",
      ];
      if (profileError || (!profile?.is_admin && !adminIds.includes(user.id))) {
        return json({ error: "Administrator access required" }, 403);
      }
      const { data, error } = await service.rpc("primevest_review_stake", {
        p_admin_id: user.id,
        p_investment_id: investmentId,
        p_decision: decision,
        p_reason: String(body.reason || "").slice(0, 1000),
      });
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    if (action === "settle_matured") {
      const { data, error } = await service.rpc("primevest_settle_matured_stakes", { p_user_id: user.id });
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    if (action === "deposit") {
      if (!PAYSTACK_SECRET_KEY) return json({ error: "Paystack is not configured" }, 503);
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 100 || !Number.isSafeInteger(Math.round(amount * 100))) {
        return json({ error: "Deposit must be at least ₦100 and have no more than two decimal places" }, 400);
      }
      const method = String(body.method || "card").toLowerCase();
      if (method !== "card" && method !== "paystack") {
        return json({ error: "This endpoint supports Paystack card/bank-transfer deposits only" }, 400);
      }
      const { data: profile } = await service.from("profiles").select("account_status").eq("id", user.id).maybeSingle();
      if (profile?.account_status && profile.account_status !== "active") return json({ error: "Account is not active" }, 403);

      const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(amount * 100),
          currency: "NGN",
          callback_url: "https://prime-vest-kitw.vercel.app/home",
          metadata: { user_id: user.id, purpose: "primevest_wallet_deposit" },
        }),
      });
      const paystack = await paystackResponse.json();
      if (!paystackResponse.ok || !paystack.status || !paystack.data?.reference || !paystack.data?.authorization_url) {
        return json({ error: paystack.message || "Paystack could not initialize this payment" }, 502);
      }

      const { error: txError } = await service.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount,
        status: "pending",
        reference: paystack.data.reference,
        meta: { provider: "paystack", currency: "NGN", expected_kobo: Math.round(amount * 100), purpose: "wallet_deposit" },
      });
      if (txError) return json({ error: `Payment initialized but pending reference could not be recorded: ${txError.message}` }, 500);
      return json(paystack.data);
    }

    if (action === "init_hamster_purchase") {
      if (!PAYSTACK_SECRET_KEY) return json({ error: "Paystack is not configured" }, 503);
      const amount = Number(body.amount);
      const item = String(body.item || "").trim().slice(0, 100);
      if (!Number.isSafeInteger(amount) || amount < 100 || !item) return json({ error: "Invalid purchase details" }, 400);
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email, amount: amount * 100, currency: "NGN",
          callback_url: `https://prime-vest-kitw.vercel.app/hamster/checkout?item=${encodeURIComponent(item)}`,
          metadata: { type: "hamster_purchase", item, user_id: user.id },
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.status) return json({ error: result.message || "Unable to initialize purchase" }, 502);
      return json(result.data);
    }

    if (action === "verify_hamster_purchase") {
      if (!PAYSTACK_SECRET_KEY) return json({ error: "Paystack is not configured" }, 503);
      const reference = String(body.reference || "").trim();
      if (!reference || reference.length > 100) return json({ error: "Invalid payment reference" }, 400);
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      });
      const result = await response.json();
      const payment = result.data;
      if (!response.ok || !result.status || payment?.status !== "success"
          || payment?.currency !== "NGN" || payment?.metadata?.user_id !== user.id
          || payment?.metadata?.type !== "hamster_purchase") {
        return json({ success: false, error: "Payment could not be verified for this account" }, 400);
      }
      return json({ success: true, reference, item: payment.metadata.item });
    }

    if (action === "get_banks" || new URL(req.url).pathname.endsWith("/banks")) {
      if (!PAYSTACK_SECRET_KEY) return json({ error: "Paystack is not configured" }, 503);
      const response = await fetch("https://api.paystack.co/bank?currency=NGN", {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      });
      const result = await response.json();
      if (!response.ok || !result.status) return json({ error: result.message || "Unable to retrieve banks" }, 502);
      return json(result.data);
    }

    if (action === "resolve_account") {
      if (!PAYSTACK_SECRET_KEY) return json({ error: "Paystack is not configured" }, 503);
      const accountNumber = String(body.account_number || "").replace(/\D/g, "");
      const bankCode = String(body.bank_code || "").trim();
      if (!/^\d{10}$/.test(accountNumber) || !/^\d{2,10}$/.test(bankCode)) return json({ error: "Invalid account number or bank code" }, 400);
      const url = new URL("https://api.paystack.co/bank/resolve");
      url.searchParams.set("account_number", accountNumber);
      url.searchParams.set("bank_code", bankCode);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } });
      const result = await response.json();
      return json(result, response.ok ? 200 : 502);
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    console.error("PrimeVest Edge Function error:", message);
    return json({ error: message }, 400);
  }
});
