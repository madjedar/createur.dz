-- ═══════════════════════════════════════════════════════
-- Créateur DZ — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- ─── 1. Profiles Table ───
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'creator' CHECK (role IN ('creator', 'brand')),
  bio TEXT,
  social_links JSONB DEFAULT '{"youtube": "", "instagram": "", "tiktok": ""}'::jsonb,
  rate_per_post NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. Transactions Table ───
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID,
  brand_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount_dzd NUMERIC NOT NULL CHECK (amount_dzd > 0),
  platform_fee_dzd NUMERIC NOT NULL DEFAULT 0 CHECK (platform_fee_dzd >= 0),
  chargily_checkout_id TEXT,
  payment_method TEXT CHECK (payment_method IN ('edahabia', 'cib')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'escrow_funded', 'released', 'refunded', 'failed')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. Payout Requests Table ───
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_dzd NUMERIC NOT NULL CHECK (amount_dzd > 0),
  rip_number TEXT NOT NULL,
  payout_method TEXT DEFAULT 'baridimob' CHECK (payout_method IN ('baridimob', 'ccp')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. Auto-create Profile on Sign Up ───
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 5. Auto-update updated_at on Transactions ───
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.transactions;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ═══════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════

-- ─── Profiles RLS ───
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── Transactions RLS ───
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = brand_id OR auth.uid() = creator_id);

CREATE POLICY "Service role can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update transactions"
  ON public.transactions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ─── Payout Requests RLS ───
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own payout requests"
  ON public.payout_requests FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can create own payout requests"
  ON public.payout_requests FOR INSERT
  WITH CHECK (auth.uid() = creator_id);
