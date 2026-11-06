import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, method, email, vip, plan_id, daily_profit, matured_at } = await req.json()

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')

    // ==========================================
    // ACTION: INVEST (Fixed)
    // ==========================================
    if (req.url.includes('invest')) {
       const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') || '')
       
       if (!user) throw new Error("User not found")

       const { error } = await supabase.from('investments').insert({
          user_id: user.id,
          plan_id: plan_id,
          amount: amount,
          daily_profit: daily_profit,
          matured_at: matured_at,
          status: 'active'
       })

       if (error) throw new Error(error.message)

       const { data: wallet } = await supabase.from('wallets').select('available, total').eq('user_id', user.id).single()
       await supabase.from('wallets').update({ 
          available: (wallet?.available || 0) - amount,
          total: (wallet?.total || 0) - amount
       }).eq('user_id', user.id)

       return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       })
    }

    // ==========================================
    // ACTION: GET BANKS (This fixes the list)
    // ==========================================
    if (req.url.includes('banks')) {
       const response = await fetch('https://api.paystack.co/bank?currency=NGN', {
         headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
       })
       const data = await response.json()
       return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ==========================================
    // ACTION: RESOLVE ACCOUNT
    // ==========================================
    if (req.url.includes('resolve-account')) {
      const { account_number, bank_code } = await req.json()
      const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      })
      const data = await response.json()
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ==========================================
    // ACTION: DEPOSIT
    // ==========================================
    if (req.url.includes('deposit-init')) {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          amount: amount * 100,
          callback_url: 'https://prime-vest-kitw.vercel.app/home',
        }),
      })
      const data = await response.json()
      return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})