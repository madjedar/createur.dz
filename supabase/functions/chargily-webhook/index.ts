// Supabase Edge Function: chargily-webhook
// Deploy with: supabase functions deploy chargily-webhook
// This function receives webhook callbacks from ChargilyPay

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.208.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const CHARGILY_SECRET_KEY = Deno.env.get('CHARGILY_SECRET_KEY')
    if (!CHARGILY_SECRET_KEY) {
      throw new Error('CHARGILY_SECRET_KEY not configured')
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get raw body for signature verification
    const rawBody = await req.text()
    const signature = req.headers.get('signature') || req.headers.get('Signature')

    // Verify webhook signature (ChargilyPay uses HMAC-SHA256)
    if (signature) {
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(CHARGILY_SECRET_KEY),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
      const computedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      if (computedSignature !== signature) {
        console.error('Invalid webhook signature')
        return new Response('Invalid signature', { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody)
    const eventType = payload.type
    const checkoutData = payload.data

    console.log(`Webhook received: ${eventType}`, checkoutData?.id)

    if (eventType === 'checkout.paid') {
      // Payment successful — update transaction to escrow_funded
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'escrow_funded',
          payment_method: checkoutData?.payment_method || 'edahabia',
        })
        .eq('chargily_checkout_id', checkoutData.id)

      if (error) {
        console.error('Failed to update transaction:', error)
        throw error
      }

      console.log(`Transaction updated to escrow_funded for checkout: ${checkoutData.id}`)
    } else if (eventType === 'checkout.failed') {
      // Payment failed
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('chargily_checkout_id', checkoutData.id)

      if (error) {
        console.error('Failed to update transaction:', error)
        throw error
      }

      console.log(`Transaction marked as failed for checkout: ${checkoutData.id}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
