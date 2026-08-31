// Supabase Edge Function: chargily-webhook
// Secure Webhook Receiver for ChargilyPay (Edahabia & CIB)
// Deploy with: supabase functions deploy chargily-webhook
// Set secret: supabase secrets set CHARGILY_SECRET_KEY=test_sk_xxx
/// <reference path="../deno.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, signature, Signature',
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const CHARGILY_SECRET_KEY = Deno.env.get('CHARGILY_SECRET_KEY')
    if (!CHARGILY_SECRET_KEY) {
      console.error('[chargily-webhook] Server misconfiguration: CHARGILY_SECRET_KEY missing')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[chargily-webhook] Server misconfiguration: Supabase credentials missing')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Mandatory Webhook Signature Verification
    const rawBody = await req.text()
    const signature = req.headers.get('signature') || req.headers.get('Signature')

    if (!signature) {
      console.warn('[chargily-webhook] Security Violation: Request rejected due to missing signature header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing webhook signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Compute HMAC-SHA256 of the raw body
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

    if (!timingSafeEqual(computedSignature.toLowerCase(), signature.toLowerCase())) {
      console.warn('[chargily-webhook] Security Violation: Request rejected due to invalid signature mismatch')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Parse & Validate Payload
    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const eventType = payload?.type
    const checkoutData = payload?.data

    if (!eventType || !checkoutData?.id) {
      return new Response(
        JSON.stringify({ error: 'Invalid event payload structure' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[chargily-webhook] Verified Event: ${eventType} for checkout: ${checkoutData.id}`)

    // 3. Idempotency Check: Fetch existing transaction
    const { data: existingTx, error: fetchErr } = await supabase
      .from('transactions')
      .select('id, status, brand_id, creator_id, amount_dzd')
      .eq('chargily_checkout_id', checkoutData.id)
      .maybeSingle()

    if (fetchErr) {
      console.error('[chargily-webhook] DB fetch error:', fetchErr)
      throw fetchErr
    }

    if (!existingTx) {
      console.warn(`[chargily-webhook] Transaction not found for checkout: ${checkoutData.id}`)
      return new Response(
        JSON.stringify({ received: true, warning: 'Transaction not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Handle Specific Event Types Idempotently
    if (eventType === 'checkout.paid') {
      if (existingTx.status === 'escrow_funded' || existingTx.status === 'released') {
        console.log(`[chargily-webhook] Idempotent skip: Transaction ${existingTx.id} is already ${existingTx.status}`)
        return new Response(
          JSON.stringify({ received: true, status: 'already_processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: updateErr } = await supabase
        .from('transactions')
        .update({
          status: 'escrow_funded',
          payment_method: checkoutData.payment_method || 'edahabia',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTx.id)

      if (updateErr) throw updateErr

      // Create in-app notifications for both Brand and Creator
      if (existingTx.brand_id) {
        await supabase.from('notifications').insert({
          user_id: existingTx.brand_id,
          title: 'تم تأمين مبلغ الصفقة بنجاح 🔒',
          message: `تم دفع وتأمين مبلغ ${existingTx.amount_dzd} د.ج في حساب الضمان (Escrow). المبدع جاهز لبدء العمل.`
        })
      }

      if (existingTx.creator_id) {
        await supabase.from('notifications').insert({
          user_id: existingTx.creator_id,
          title: 'تم تأمين مستحقاتك المالية! 💰',
          message: `قام الراعي بتأمين مبلغ ${existingTx.amount_dzd} د.ج في منصة الضمان. يمكنك الآن البدء في تنفيذ المحتوى المطلوب بثقة.`
        })
      }

      console.log(`[chargily-webhook] Transaction ${existingTx.id} marked as escrow_funded`)
    } else if (eventType === 'checkout.failed' || eventType === 'checkout.expired') {
      if (existingTx.status === 'pending') {
        await supabase
          .from('transactions')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingTx.id)
        console.log(`[chargily-webhook] Transaction ${existingTx.id} marked as failed/expired`)
      }
    }

    return new Response(
      JSON.stringify({ received: true, event: eventType }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[chargily-webhook] Fatal error:', error?.message || error)
    return new Response(
      JSON.stringify({ error: 'Internal server error processing webhook' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
