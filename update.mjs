import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://amilpnklwhjtosegmnwg.supabase.co",
  "sb_publishable_4mTohFX-qEO8bzfe5_5tlA_gE2FFVAN"
);

async function run() {
  console.log("Deleting old plans...");
  await supabase.from("plans").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  
  console.log("Adding new plans...");
  const { error } = await supabase.from("plans").insert([
    { name: 'Growth Portfolio', type: 'Stocks & ETFs', risk: 'Moderate', min_amount: 2000, expected_return: 12.5 },
    { name: 'Real Estate', type: 'Property Funds', risk: 'Low', min_amount: 5000, expected_return: 8.0 },
    { name: 'Crypto Index', type: 'Digital Assets', risk: 'High', min_amount: 19000, expected_return: 22.0 },
    { name: 'Affiliate Marketing', type: 'Digital Commerce', risk: 'Moderate', min_amount: 11500, expected_return: 15.0 }
  ]);

  if (error) console.error("Error:", error);
  else console.log("Success! Plans updated.");
}
run();