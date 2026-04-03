-- 1. Add role field to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. Migrate data from is_admin to role
UPDATE public.profiles SET role = 'admin' WHERE is_admin = true;
UPDATE public.profiles SET role = 'user' WHERE is_admin = false OR is_admin IS NULL;

-- 3. Update RLS policies for metrics
-- Enable RLS (just in case)
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- Remove existing broad select policies if any
-- DROP POLICY IF EXISTS "Users can view own metrics" ON public.metrics;

-- Admin-only policy for metrics
CREATE POLICY "Admins can view all metrics"
  ON public.metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Update RLS policies for activities
-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Admin-only policy for activities
CREATE POLICY "Admins can view all activities"
  ON public.activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Optional: Handle inserts
-- Allow authenticated users to insert their own activities (e.g. for tracking)
-- But only admins can read the aggregated feed.
CREATE POLICY "Authenticated users can insert own activities"
  ON public.activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
