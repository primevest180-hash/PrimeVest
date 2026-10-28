import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const body = await req.json();
  if (body.event !== "charge.success") return new Response("ok");

  const ref = body.data.reference;
  const amount = body.data.amount / 100; // Convert from Kobo to Naira
  const metadata = body.data.metadata || {};

  const { data: txn } = await supabase.from("transactions").select("*").eq("reference", ref).single();
  if (!txn || txn.status === "success") return new Response("ok");

  // 1. Mark transaction as successful
  await supabase.from("transactions").update({ status: "success" }).eq("id", txn.id);

  // 2. Credit wallet with the base deposit amount
  const { data: wallet } = await supabase.from("wallets").select("available").eq("user_id", txn.user_id).single();
  await supabase.from("wallets").update({ available: (wallet?.available || 0) + amount }).eq("user_id", txn.user_id);

  // 3. Handle VIP Logic
  if (metadata.vip === true) {
    let tier = "VIP 1";
    let bonus = 5000;
    
    // Check the exact amount paid
    if (amount === 8500) { tier = "VIP 2"; bonus = 10000; }
    if (amount === 15000) { tier = "VIP 3"; bonus = 17000; }

    // Upgrade the profile
    await supabase.from("profiles").update({ vip_tier: tier }).eq("id", txn.user_id);
    
    // Add the VIP Bonus on top of the base deposit
    const { data: newWallet } = await supabase.from("wallets").select("available").eq("user_id", txn.user_id).single();
    await supabase.from("wallets").update({ available: (newWallet?.available || 0) + bonus }).eq("user_id", txn.user_id);

    // Send notification
    await supabase.from("notifications").insert({
      user_id: txn.user_id, 
      title: "VIP Activated", 
      message: `You are now a ${tier}. ₦${bonus.toLocaleString()} bonus has been added to your wallet!`,
      type: "system"
    });
  } else {
    // Standard Deposit
    await supabase.from("notifications").insert({
      user_id: txn.user_id,
      title: "Deposit successful",
      message: `₦${amount.toLocaleString()} credited to your wallet.`,
      type: "deposit",
    });
  }

  return new Response("ok");
});