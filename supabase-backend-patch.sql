-- ══════════════════════════════════════════════════════════════════════
-- Créateur DZ — Backend Compatibility & Security Migration Patch
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ccrtrgdgaqhvqqxbimdu/sql
-- ══════════════════════════════════════════════════════════════════════

-- 1. Ensure all required columns exist on public.campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS wilaya TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'all';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update campaigns status check constraint to include all app statuses
DO $$
BEGIN
  ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
  ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_status_check 
    CHECK (status IN ('open', 'active', 'in_progress', 'completed', 'paused', 'cancelled', 'closed'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Enhanced is_admin() function (Checks both profiles.role AND JWT email)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    LOWER(COALESCE(auth.jwt() ->> 'email', '')) IN ('madjedalirachedi291@gmail.com', 'madjedar@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Robust Auth Trigger: auto-assign admin role & preserve existing roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role TEXT;
  v_email TEXT;
BEGIN
  v_email := LOWER(COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''));
  
  -- Auto-assign admin role if email matches official admin list
  IF v_email IN ('madjedalirachedi291@gmail.com', 'madjedar@gmail.com') THEN
    v_role := 'admin';
  ELSE
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'creator');
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    v_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), public.profiles.avatar_url),
    role = CASE 
      WHEN v_role = 'admin' THEN 'admin'
      WHEN public.profiles.role IS NOT NULL THEN public.profiles.role
      ELSE v_role
    END,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure official admin accounts have admin role in profiles
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE LOWER(email) IN ('madjedalirachedi291@gmail.com', 'madjedar@gmail.com')
);

-- 4. RLS Policy Updates: Ensure Admin and Brands have full operational access
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Campaigns viewable by all" ON public.campaigns;
CREATE POLICY "Campaigns viewable by all" ON public.campaigns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Brands can create campaigns" ON public.campaigns;
CREATE POLICY "Brands can create campaigns" ON public.campaigns FOR INSERT 
  WITH CHECK (auth.uid() = brand_id OR public.is_admin());

DROP POLICY IF EXISTS "Brands can update own campaigns" ON public.campaigns;
CREATE POLICY "Brands can update own campaigns" ON public.campaigns FOR UPDATE 
  USING (auth.uid() = brand_id OR public.is_admin());

DROP POLICY IF EXISTS "Brands can delete own campaigns" ON public.campaigns;
CREATE POLICY "Brands can delete own campaigns" ON public.campaigns FOR DELETE 
  USING (auth.uid() = brand_id OR public.is_admin());

-- Messages RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id OR public.is_admin());

DROP POLICY IF EXISTS "Receiver can mark message read" ON public.messages;
CREATE POLICY "Receiver can mark message read" ON public.messages FOR UPDATE 
  USING (auth.uid() = receiver_id OR public.is_admin());

-- Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "System/Users can insert notifications" ON public.notifications;
CREATE POLICY "System/Users can insert notifications" ON public.notifications FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id OR public.is_admin());

-- 5. Realtime Subscriptions (Error-safe idempotency)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 6. High-Performance B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON public.messages(receiver_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON public.campaigns(brand_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON public.campaigns(category);
CREATE INDEX IF NOT EXISTS idx_applications_campaign_status ON public.applications(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_creator_status ON public.applications(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_brand ON public.transactions(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_creator ON public.transactions(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_chargily ON public.transactions(chargily_checkout_id);
