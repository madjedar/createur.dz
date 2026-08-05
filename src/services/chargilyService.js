import { supabase } from '../lib/supabase'

const PLATFORM_FEE_RATE = 0.10 // 10% platform fee

/**
 * Calculate fee breakdown for a campaign deal
 */
export function calculateFees(subtotal) {
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE)
  const total = subtotal + platformFee
  return { subtotal, platformFee, total }
}

/**
 * Format amount in Algerian Dinar
 */
export function formatDZD(amount) {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' د.ج'
}

/**
 * Create a ChargilyPay checkout session via Supabase Edge Function
 * The secret key stays server-side in the Edge Function
 */
export async function createCheckoutSession({ amount, dealId, creatorId, brandId, description }) {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        amount,
        currency: 'dzd',
        deal_id: dealId,
        creator_id: creatorId,
        brand_id: brandId,
        description: description || 'Créateur DZ — صفقة رعاية',
        success_url: `${window.location.origin}?payment=success&deal_id=${dealId}`,
        failure_url: `${window.location.origin}?payment=failed&deal_id=${dealId}`,
      },
    })

    if (error) throw error
    return { success: true, checkoutUrl: data.checkout_url, checkoutId: data.checkout_id }
  } catch (err) {
    console.error('Checkout creation failed:', err)
    return { success: false, error: err.message || 'فشل إنشاء جلسة الدفع' }
  }
}

/**
 * Get payment status label and color for UI badges
 */
export function getPaymentStatusConfig(status) {
  const configs = {
    pending: { label: 'قيد الانتظار', color: 'amber', bg: 'bg-amber-400/10', text: 'text-amber-400', border: 'border-amber-400/30' },
    escrow_funded: { label: 'في الضمان', color: 'blue', bg: 'bg-blue-400/10', text: 'text-blue-400', border: 'border-blue-400/30' },
    released: { label: 'تم التحرير', color: 'emerald', bg: 'bg-emerald-400/10', text: 'text-emerald-400', border: 'border-emerald-400/30' },
    refunded: { label: 'مسترجع', color: 'red', bg: 'bg-red-400/10', text: 'text-red-400', border: 'border-red-400/30' },
    failed: { label: 'فشل', color: 'red', bg: 'bg-red-400/10', text: 'text-red-400', border: 'border-red-400/30' },
  }
  return configs[status] || configs.pending
}

/**
 * Get payment method display info
 */
export function getPaymentMethodConfig(method) {
  const configs = {
    edahabia: { label: 'بطاقة الذهبية', icon: '💳', gradient: 'from-yellow-600 to-yellow-700' },
    cib: { label: 'بطاقة CIB', icon: '🏦', gradient: 'from-blue-700 to-blue-900' },
  }
  return configs[method] || configs.edahabia
}
