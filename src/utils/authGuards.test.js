import { describe, it, expect } from 'vitest';
import {
  isAdmin,
  isBrand,
  isCreator,
  canApplyToCampaign,
  canHireCreator,
  canAccessAdmin,
  canAccessBrandDashboard,
  canAccessCreatorDashboard
} from './authGuards';

describe('Role & Authorization Guards', () => {
  describe('isAdmin', () => {
    it('identifies admin by role property', () => {
      expect(isAdmin({ role: 'admin' })).toBe(true);
      expect(isAdmin({ user_metadata: { role: 'admin' } })).toBe(true);
      expect(isAdmin({ profile: { role: 'admin' } })).toBe(true);
    });

    it('identifies admin by hardcoded admin email', () => {
      expect(isAdmin({ email: 'madjedalirachedi291@gmail.com' })).toBe(true);
      expect(isAdmin({ email: 'madjedar@gmail.com' })).toBe(true);
    });

    it('returns false for non-admin users or null', () => {
      expect(isAdmin(null)).toBe(false);
      expect(isAdmin({ role: 'creator', email: 'creator@example.com' })).toBe(false);
      expect(isAdmin({ role: 'brand', email: 'brand@example.com' })).toBe(false);
    });
  });

  describe('isBrand', () => {
    it('returns true for brand roles', () => {
      expect(isBrand({ role: 'brand' })).toBe(true);
      expect(isBrand({ profile: { role: 'brand' } })).toBe(true);
    });

    it('returns false for creator or null', () => {
      expect(isBrand(null)).toBe(false);
      expect(isBrand({ role: 'creator' })).toBe(false);
    });
  });

  describe('isCreator', () => {
    it('returns true for creator roles', () => {
      expect(isCreator({ role: 'creator' })).toBe(true);
      expect(isCreator({ profile: { role: 'creator' } })).toBe(true);
    });

    it('returns false for brand or null', () => {
      expect(isCreator(null)).toBe(false);
      expect(isCreator({ role: 'brand' })).toBe(false);
    });
  });

  describe('canApplyToCampaign', () => {
    it('allows creators to apply to campaigns', () => {
      const creator = { role: 'creator', email: 'regular_creator@example.com' };
      expect(canApplyToCampaign(creator)).toBe(true);
    });

    it('disallows brands and unauthenticated users', () => {
      expect(canApplyToCampaign(null)).toBe(false);
      expect(canApplyToCampaign({ role: 'brand' })).toBe(false);
    });
  });

  describe('canHireCreator', () => {
    it('allows brands to hire creators', () => {
      expect(canHireCreator({ role: 'brand' })).toBe(true);
    });

    it('disallows creators and unauthenticated users', () => {
      expect(canHireCreator(null)).toBe(false);
      expect(canHireCreator({ role: 'creator' })).toBe(false);
    });
  });
});
