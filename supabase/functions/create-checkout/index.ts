// Supabase Edge Function: create-checkout
// Secure Checkout Creator for ChargilyPay (Edahabia & CIB)
// Deploy with: supabase functions deploy create-checkout
// Set secret: supabase secrets set CHARGILY_SECRET_KEY=test_sk_xxx
/// <reference path="../deno.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function cleanUUID(val: any): string | null {
  if (!val || typeof val !== 'string') return null
  const trimmed = val.trim()
  return UUID_REGEX.test(trimmed) ? trimmed : null
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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const CHARGILY_SECRET_KEY = Deno.env.get('CHARGILY_SECRET_KEY')
    const CHARGILY_MODE = Deno.env.get('CHARGILY_MODE') || 'test'

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CHARGILY_SECRET_KEY) {
      console.error('[create-checkout] Server configuration error: Missing environment secrets')
      return new Response(JSON.stringify({ error: 'Server payment configuration is incomplete' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Mandatory Endpoint Security: Verify User Authentication Token
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Missing Authorization token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired authentication session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1.5 Rate Limiting Check (Option A: DB Query)
    // Prevent abuse by limiting a user to 5 checkout requests per minute
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
    const { count, error: rateError } = await adminSupabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', user.id)
      .gte('created_at', oneMinuteAgo)

    if (rateError) {
      console.warn('[create-checkout] Rate limit check failed:', rateError)
    } else if (count !== null && count >= 5) {
      console.warn(`[create-checkout] Rate limit exceeded for user ${user.id}`)
      return new Response(
        JSON.stringify({ error: 'Too many checkout requests. Please try again in a minute.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Parse & Sanitize Input Body
    let body: any
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON request payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { amount, currency = 'dzd', deal_id, creator_id, brand_id, description, success_url, failure_url } = body

    // 3. Validation: Amount & Required fields
    const parsedAmount = Number(amount)
    if (isNaN(parsedAmount) || parsedAmount < 100 || parsedAmount > 5000000) {
      return new Response(
        JSON.stringify({ error: 'Amount must be a valid number between 100 DZD and 5,000,000 DZD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Authorization & Impersonation Prevention
    const ADMIN_EMAILS = ['madjedalirachedi291@gmail.com', 'madjedar@gmail.com']
    const isAdmin = ADMIN_EMAILS.includes((user.email || '').toLowerCase().trim()) || user.user_metadata?.role === 'admin'
    
    if (brand_id && brand_id !== user.id && !isAdmin) {
      console.warn(`[create-checkout] Impersonation blocked: User ${user.id} tried to create transaction for brand ${brand_id}`)
      return new Response(
        JSON.stringify({ error: 'Forbidden: You cannot create transactions for another account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const validBrandId = cleanUUID(brand_id) || user.id
    const validCreatorId = cleanUUID(creator_id)
    const validDealId = cleanUUID(deal_id)

    const platformFee = Math.round(parsedAmount * 0.05) // 5% platform fee

    const sanitizedDescription = description 
      ? String(description).replace(/[\r\n\x00-\x1F\x7F]+/g, ' ').trim().slice(0, 200) 
      : 'Créateur DZ — صفقة رعاية'

    // 5. Insert pending transaction in Supabase
    const { data: transaction, error: txError } = await adminSupabase
      .from('transactions')
      .insert({
        deal_id: validDealId,
        brand_id: validBrandId,
        creator_id: validCreatorId,
        amount_dzd: parsedAmount,
        platform_fee_dzd: platformFee,
        status: 'pending',
        description: sanitizedDescription,
      })
      .select()
      .single()

    if (txError) {
      console.error('[create-checkout] DB Transaction error:', txError)
      throw txError
    }

    // 6. Call ChargilyPay API v2 securely from server side
    const CHARGILY_BASE_URL = `https://pay.chargily.net/${CHARGILY_MODE}/api/v2`
    const webhookUrl = `${SUPABASE_URL}/functions/v1/chargily-webhook`

    const callerOrigin = req.headers.get('origin') || req.headers.get('referer') || 'https://createur.dz'
    const cleanOrigin = callerOrigin.replace(/\/$/, '')

    const chargilyResponse = await fetch(`${CHARGILY_BASE_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHARGILY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: parsedAmount,
        currency: (currency || 'dzd').toLowerCase(),
        description: sanitizedDescription,
        success_url: success_url || `${cleanOrigin}?payment=success&tx=${transaction.id}`,
        failure_url: failure_url || `${cleanOrigin}?payment=failed&tx=${transaction.id}`,
        webhook_endpoint: webhookUrl,
        metadata: {
          transaction_id: transaction.id,
          deal_id: validDealId,
          creator_id: validCreatorId,
          brand_id: validBrandId,
        },
      }),
    })

    if (!chargilyResponse.ok) {
      const errText = await chargilyResponse.text()
      console.error('[create-checkout] Chargily API error response:', errText)
      throw new Error('Payment gateway error. Please try again later.')
    }

    const chargilyData = await chargilyResponse.json()

    // 7. Update transaction with checkout ID
    await adminSupabase
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
  } catch (error: any) {
    // SECURITY: Log the actual error to the server console, but DO NOT send error.message to the client.
    // Database errors often contain sensitive information (table names, SQL structures).
    console.error('[create-checkout] Execution error:', error?.message || error)
    return new Response(
      JSON.stringify({ error: 'Failed to initialize payment checkout. Please try again later.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
