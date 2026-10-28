import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = new URL(req.url);
  const path = url.pathname.replace(/\/$/, "").split("/").pop(); 

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ---------- BANKS ----------
  if (path === "banks") {
    const res = await fetch("https://api.paystack.co/bank?country=nigeria", {
      headers: { Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET")}` },
    });
    const data = await res.json();
    return json(data.data || []);
  }

  // ---------- RESOLVE ACCOUNT ----------
  if (path === "resolve-account") {
    const { account_number, bank_code } = await req.json();
    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      { headers: { Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET")}` } }
    );
    const data = await res.json();
    return json(data);
  }

  // ---------- DEPOSIT INIT ----------
  if (path === "deposit-init") {
    const { amount, method, email, vip } = await req.json();
    
    // We removed the 7500 minimum here so VIP plans can be purchased
    if (!amount || amount < 0) return json({ error: "Invalid amount" }, 400);

    const auth = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
    const { data: { user } } = await supabase.auth.getUser(auth);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const ref = `PV-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

    if (method === "card") {
      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100),
          reference: ref,
          callback_url: Deno.env.get("FRONTEND_URL") + "/home",
          metadata: { vip: vip || false }
        }),
      });
      const data = await res.json();
      await supabase.from("transactions").insert({
        user_id: user.id, type: "deposit", amount, status: "pending",
        reference: ref, meta: { method: "card", vip: vip || false },
      });
      return json({ url: data.data.authorization_url, reference: ref });
    }

    if (method === "bitcoin") {
      const res = await fetch("https://api.nowpayments.io/v1/payment", {
        method: "POST",
        headers: {
          "x-api-key": Deno.env.get("NOWPAYMENTS_KEY")!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: amount, price_currency: "ngn",
          pay_currency: "btc", order_id: ref,
        }),
      });
      const data = await res.json();
      await supabase.from("transactions").insert({
        user_id: user.id, type: "deposit", amount, status: "pending",
        reference: ref, meta: { method: "bitcoin", btc_address: data.pay_address },
      });
      return json({ btc_address: data.pay_address, reference: ref });
    }

    return json({ error: "Unknown method" }, 400);
  }

  // ---------- WITHDRAW REQUEST ----------
  if (path === "withdraw-request") {
    const auth = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
    const { data: { user } } = await supabase.auth.getUser(auth);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { amount, bank_name, bank_code, account_number, account_name } = await req.json();
    if (!amount || amount < 1) return json({ error: "Invalid amount" }, 400);

    const { data: wallet } = await supabase.from("wallets").select("available").eq("user_id", user.id).single();
    if (!wallet || wallet.available < amount) return json({ error: "Insufficient balance" }, 400);

    const ref = `WD-${Date.now()}`;
    await supabase.from("withdrawals").insert({
      user_id: user.id, amount, bank_name, bank_code,
      account_number, account_name, reference: ref, status: "pending",
    });

    await supabase.from("wallets").update({ available: wallet.available - amount }).eq("user_id", user.id);
    await supabase.from("transactions").insert({
      user_id: user.id, type: "withdrawal", amount, status: "pending", reference: ref,
    });

    await supabase.from("notifications").insert({
      user_id: user.id, title: "Withdrawal requested",
      message: `Your withdrawal of ₦${amount.toLocaleString()} is being processed.`,
      type: "withdrawal",
    });

    return json({ success: true, reference: ref });
  }

  // ---------- INVEST ----------
  if (path === "invest") {
    const auth = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
    const { data: { user } } = await supabase.auth.getUser(auth);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { plan_id, amount, daily_profit, matured_at } = await req.json();
    const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
    if (!wallet || wallet.available < amount) return json({ error: "Insufficient balance" }, 400);

    await supabase.from("investments").insert({ 
      user_id: user.id, 
      plan_id, 
      amount,
      daily_profit: daily_profit || 0,
      matured_at: matured_at || null
    });
    
    await supabase.from("wallets").update({
      available: wallet.available - amount,
      invested: wallet.invested + amount,
    }).eq("user_id", user.id);

    await supabase.from("transactions").insert({
      user_id: user.id, type: "invest", amount, status: "success",
      reference: `INV-${Date.now()}`,
    });

    return json({ success: true });
  }

  return json({ error: "Unknown function", path }, 404);
});