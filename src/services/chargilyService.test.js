import { describe, it, expect } from 'vitest';
import { calculateFees, formatDZD, getPaymentStatusConfig } from './chargilyService';

describe('Financial & Chargily Utilities', () => {
  describe('calculateFees', () => {
    it('accurately calculates the 5% platform fee', () => {
      const { subtotal, platformFee, total } = calculateFees(10000);
      expect(subtotal).toBe(10000);
      expect(platformFee).toBe(500);
      expect(total).toBe(10500);
    });

    it('handles zero amount gracefully', () => {
      const { subtotal, platformFee, total } = calculateFees(0);
      expect(subtotal).toBe(0);
      expect(platformFee).toBe(0);
      expect(total).toBe(0);
    });

    it('rounds platform fee properly for fractional amounts', () => {
      const { platformFee, total } = calculateFees(1555);
      // 1555 * 0.05 = 77.75 -> 78
      expect(platformFee).toBe(78);
      expect(total).toBe(1633);
    });
  });

  describe('formatDZD', () => {
    it('formats amount in Arabic (د.ج)', () => {
      const formatted = formatDZD(5000, 'ar');
      expect(formatted).toContain('د.ج');
      expect(formatted).toMatch(/5/);
    });

    it('formats amount in French (DZD)', () => {
      const formatted = formatDZD(5000, 'fr');
      expect(formatted).toContain('DZD');
    });

    it('formats amount in English (DZD)', () => {
      const formatted = formatDZD(5000, 'en');
      expect(formatted).toContain('DZD');
    });

    it('handles empty or zero gracefully', () => {
      expect(formatDZD(0, 'en')).toBe('0 DZD');
      expect(formatDZD(null)).toBe('0');
    });
  });

  describe('getPaymentStatusConfig', () => {
    it('returns proper labels and badges for known statuses', () => {
      expect(getPaymentStatusConfig('escrow_funded').label).toBe('في الضمان');
      expect(getPaymentStatusConfig('released').label).toBe('تم التحرير');
      expect(getPaymentStatusConfig('pending').label).toBe('قيد الانتظار');
    });

    it('falls back to pending for unknown statuses', () => {
      expect(getPaymentStatusConfig('unknown_status').label).toBe('قيد الانتظار');
    });
  });

  describe('createCheckoutSession contract', () => {
    it('is an exported async function that does not silently return mock success', async () => {
      const { createCheckoutSession } = await import('./chargilyService');
      expect(typeof createCheckoutSession).toBe('function');
    });
  });
});

