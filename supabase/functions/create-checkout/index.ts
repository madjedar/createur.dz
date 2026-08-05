// Supabase Edge Function: create-checkout
// Deploy with: supabase functions deploy create-checkout
// Set secret: supabase secrets set CHARGILY_SECRET_KEY=sk_test_xxx

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const CHARGILY_SECRET_KEY = Deno.env.get('CHARGILY_SECRET_KEY')
    if (!CHARGILY_SECRET_KEY) {
      throw new Error('CHARGILY_SECRET_KEY not configured')
    }

    const CHARGILY_MODE = Deno.env.get('CHARGILY_MODE') || 'test'
    const CHARGILY_BASE_URL = `https://pay.chargily.net/${CHARGILY_MODE}/api/v2`

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { amount, currency, deal_id, creator_id, brand_id, description, success_url, failure_url } = await req.json()

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount')
    }

    // 1. Insert pending transaction in database
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        deal_id,
        brand_id,
        creator_id,
        amount_dzd: amount,
        platform_fee_dzd: Math.round(amount * 0.10),
        status: 'pending',
        description,
      })
      .select()
      .single()

    if (txError) throw txError

    // 2. Create ChargilyPay checkout session
    const webhookUrl = `${SUPABASE_URL}/functions/v1/chargily-webhook`

    const chargilyResponse = await fetch(`${CHARGILY_BASE_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHARGILY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency || 'dzd',
        description: description || 'Créateur DZ — صفقة رعاية',
        success_url,
        failure_url,
        webhook_endpoint: webhookUrl,
        metadata: {
          transaction_id: transaction.id,
          deal_id,
          creator_id,
          brand_id,
        },
      }),
    })

    if (!chargilyResponse.ok) {
      const errData = await chargilyResponse.text()
      throw new Error(`ChargilyPay error: ${errData}`)
    }

    const chargilyData = await chargilyResponse.json()

    // 3. Update transaction with ChargilyPay checkout ID
    await supabase
      .from('transactions')
      .update({ chargily_checkout_id: chargilyData.id })
      .eq('id', transaction.id)

    return new Response(
      JSON.stringify({
        checkout_url: chargilyData.checkout_url,
        checkout_id: chargilyData.id,
        transaction_id: transaction.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
