-- ===============================================================
-- SMKN 46 DIGITAL GUESTBOOK - SUPABASE BACKEND SETUP
-- ===============================================================

-- 1. CLEANUP (Optional: Uncomment if you want to reset)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP TABLE IF EXISTS public.titipan_barang;
-- DROP TABLE IF EXISTS public.janji_temu;
-- DROP TABLE IF EXISTS public.tamu;
-- DROP TABLE IF EXISTS public.profiles;
-- DROP TYPE IF EXISTS user_role;

-- 2. CUSTOM TYPES
CREATE TYPE user_role AS ENUM ('admin', 'receptionist', 'teacher', 'staff', 'student', 'guest');

-- 3. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role user_role DEFAULT 'teacher',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TAMU (GUESTS) TABLE
CREATE TABLE public.guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  organization TEXT,
  phone TEXT,
  purpose TEXT NOT NULL,
  receptionist_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Backward compatibility or alias (optional)
-- CREATE OR REPLACE VIEW public.tamu AS SELECT * FROM public.guests;

-- 5. APPOINTMENTS (JANJI TEMU) TABLE
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name TEXT NOT NULL,
  phone TEXT, -- added to match app
  organization TEXT, -- added to match app
  teacher_id UUID REFERENCES public.profiles(id), -- can be null if target is manual
  date DATE NOT NULL,
  time TIME NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'rescheduled', 'completed')),
  receptionist_id UUID REFERENCES public.profiles(id), -- This stores the creator (can be null for public)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PACKAGES (TITIPAN BARANG) TABLE
CREATE TABLE public.packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_name TEXT NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id), -- Allow manual entries (null)
  recipient_class TEXT, -- Added to match app
  description TEXT,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'taken')),
  receptionist_id UUID REFERENCES public.profiles(id) NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE
);

-- 7. STUDENT DISPENSATIONS TABLE
CREATE TABLE public.student_dispensations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  reason TEXT NOT NULL,
  granting_teacher TEXT NOT NULL,
  dispensation_type TEXT CHECK (dispensation_type IN ('back_to_school', 'go_home')),
  status TEXT DEFAULT 'out' CHECK (status IN ('out', 'returned', 'home')),
  receptionist_id UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 8. SYSTEM REPORTS TABLE
-- (Keep as is, but ensure it's protected)

-- 8. TEACHER SCHEDULE TABLE
-- (Keep as is)

-- 9. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_dispensations ENABLE ROW LEVEL SECURITY;

-- 10. RLS POLICIES

-- PUBLIC ACCESS POLICIES (Landing Page)
-- ==========================================

-- PROFILES: Everyone can see profiles (to select teachers)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- APPOINTMENTS: Public can insert, and everyone can view (for status tracking perhaps)
DROP POLICY IF EXISTS "Appointments are viewable by everyone" ON public.appointments;
CREATE POLICY "Appointments are viewable by everyone" ON public.appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create appointments (Public & Private)" ON public.appointments;
CREATE POLICY "Anyone can create appointments" ON public.appointments FOR INSERT WITH CHECK (true);

-- GUESTS: Public can insert
DROP POLICY IF EXISTS "Everyone can view guests" ON public.guests;
CREATE POLICY "Everyone can view guests" ON public.guests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create guest entries" ON public.guests;
CREATE POLICY "Anyone can create guest entries" ON public.guests FOR INSERT WITH CHECK (true);

-- ADMIN & STAFF POLICIES (Authenticated)
-- ==========================================

-- PROFILES: Users can update their own
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- GUESTS: Management
DROP POLICY IF EXISTS "Admins and Receptionists can manage guests" ON public.guests;
CREATE POLICY "Admins and Receptionists can manage guests" ON public.guests FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'receptionist'))
);

-- APPOINTMENTS: Management
DROP POLICY IF EXISTS "Teachers and Admins can update appointments" ON public.appointments;
CREATE POLICY "Teachers and Admins can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (
  auth.uid() = teacher_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'receptionist'))
);

DROP POLICY IF EXISTS "Admins and Receptionists can delete appointments" ON public.appointments;
CREATE POLICY "Admins and Receptionists can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'receptionist'))
);

-- PACKAGES POLICIES
CREATE POLICY "Authenticated users can view packages" 
ON public.packages FOR SELECT USING (
  auth.uid() = recipient_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'receptionist'))
);

CREATE POLICY "Receptionists can manage packages" 
ON public.packages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'receptionist'))
);

CREATE POLICY "Recipient can mark as taken" 
ON public.packages FOR UPDATE USING (auth.uid() = recipient_id);

-- SYSTEM REPORTS POLICIES
CREATE POLICY "Users can create their own reports" 
ON public.system_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports or admins can view all" 
ON public.system_reports FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update reports" 
ON public.system_reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- TEACHER SCHEDULE POLICIES
CREATE POLICY "Teacher schedules are viewable by everyone" 
ON public.teacher_schedules FOR SELECT USING (true);

CREATE POLICY "Teachers, Admins, and Receptionists can manage teacher schedules" 
ON public.teacher_schedules FOR ALL USING (
  teacher_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'receptionist'))
);

-- STUDENT DISPENSATIONS POLICIES
CREATE POLICY "Everyone authenticated can view student dispensations" 
ON public.student_dispensations FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and Receptionists can manage student dispensations" 
ON public.student_dispensations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'receptionist'))
);

-- 10. HELPER: SET SPECIFIC ADMIN (Optional)
-- Run this manually if you already have a user and want to promote them:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'projectrifaazharr@gmail.com';

-- 11. RPC to delete a user from auth.users (requires admin status)
CREATE OR REPLACE FUNCTION public.delete_user_admin(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Check if the requester is an admin
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    -- Delete from auth.users (cascades to public.profiles due to ON DELETE CASCADE)
    DELETE FROM auth.users WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. MIGRATION HELPER
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'student';
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'guest';

-- 13. EXPLICIT GRANTS
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
