import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const body = await req.json();
  if (body.payment_status !== "finished" && body.payment_status !== "confirmed") {
    return new Response("ok");
  }

  const ref = body.order_id;
  const { data: txn } = await supabase.from("transactions").select("*").eq("reference", ref).single();
  if (!txn || txn.status === "success") return new Response("ok");

  await supabase.from("transactions").update({ status: "success" }).eq("id", txn.id);

  const { data: wallet } = await supabase.from("wallets").select("available").eq("user_id", txn.user_id).single();
  await supabase.from("wallets").update({ available: (wallet?.available || 0) + Number(txn.amount) }).eq("user_id", txn.user_id);

  await supabase.from("notifications").insert({
    user_id: txn.user_id,
    title: "Bitcoin deposit confirmed",
    message: `₦${Number(txn.amount).toLocaleString()} credited to your wallet.`,
    type: "deposit",
  });

  return new Response("ok");
});