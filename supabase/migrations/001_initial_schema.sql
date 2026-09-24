-- ====================================================================
-- KDC Support — Supabase PostgreSQL Schema Migration
-- Migration: 001_initial_schema.sql
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. Profiles Table (Linked to auth.users)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Index profiles for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- ====================================================================
-- 3. Devices Table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_identifier TEXT UNIQUE NOT NULL,
  device_name TEXT NOT NULL,
  device_model TEXT NOT NULL,
  platform TEXT DEFAULT 'Android',
  browser TEXT,
  os_version TEXT,
  app_version TEXT DEFAULT '2.4.0',
  battery_level INTEGER DEFAULT 88,
  is_charging BOOLEAN DEFAULT false,
  connection_status TEXT DEFAULT 'connected' CHECK (connection_status IN ('connected', 'offline', 'busy')),
  last_seen_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  permission_status JSONB DEFAULT '{
    "photos": "not_requested",
    "camera": "not_requested",
    "microphone": "not_requested",
    "files": "not_requested",
    "device_information": "granted"
  }'::jsonb,
  permissions_state JSONB DEFAULT '{
    "photos_videos": { "status": "not_allowed", "scope": "none", "count": 0 },
    "camera": { "status": "not_allowed" },
    "microphone": { "status": "not_allowed" },
    "files": { "status": "not_allowed", "scope": "none", "selectedFilesCount": 0 },
    "device_info": { "status": "allowed" }
  }'::jsonb,
  active_session JSONB DEFAULT NULL,
  pending_consent_request JSONB DEFAULT NULL,
  submitted_details JSONB DEFAULT NULL,
  user_name TEXT,
  user_phone TEXT,
  user_email TEXT
);

-- Index devices for admin dashboard queries & user lookups
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_identifier ON public.devices(device_identifier);
CREATE INDEX IF NOT EXISTS idx_devices_connection_status ON public.devices(connection_status);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON public.devices(last_seen_at DESC);

-- ====================================================================
-- 4. Audit Logs Table (Optional persistent logging)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  actor TEXT NOT NULL CHECK (actor IN ('User', 'Authorized Support Agent', 'Android System')),
  action TEXT NOT NULL,
  details TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'security', 'warning')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ====================================================================
-- 5. Helper Functions & Triggers
-- ====================================================================

-- Function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR email = 'nayemchow000@gmail.com')
  );
$$;

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_devices_updated_at ON public.devices;
CREATE TRIGGER trg_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile trigger on auth.users INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    phone,
    display_name,
    role,
    avatar_url,
    created_at,
    updated_at,
    last_login_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'Customer'),
    CASE 
      WHEN NEW.email = 'nayemchow000@gmail.com' THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    END,
    NEW.raw_user_meta_data->>'avatar_url',
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    last_login_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 6. Row Level Security (RLS) Policies
-- ====================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- PROFILES POLICIES
-- --------------------------------------------------------------------
-- 1. Customers can read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Customers can update their own profile (cannot change role)
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- 3. Customers can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Admins can select all profiles
CREATE POLICY "profiles_admin_select"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- 5. Admins can update profiles
CREATE POLICY "profiles_admin_update"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- DEVICES POLICIES
-- --------------------------------------------------------------------
-- 1. Customers can select their own devices
CREATE POLICY "devices_select_own"
  ON public.devices
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Customers can insert their own devices
CREATE POLICY "devices_insert_own"
  ON public.devices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Customers can update their own devices (heartbeat, permissions, etc.)
CREATE POLICY "devices_update_own"
  ON public.devices
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Admins can select all devices
CREATE POLICY "devices_admin_select"
  ON public.devices
  FOR SELECT
  USING (public.is_admin());

-- 5. Admins can update devices (e.g., send remote access consent requests)
CREATE POLICY "devices_admin_update"
  ON public.devices
  FOR UPDATE
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- AUDIT LOGS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "audit_logs_insert"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "audit_logs_admin_select"
  ON public.audit_logs
  FOR SELECT
  USING (public.is_admin());

-- ====================================================================
-- 7. Supabase Realtime Setup
-- ====================================================================
-- Enable publication for realtime streaming to the Admin Dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
