-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- SITE IMAGES
CREATE TABLE public.site_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('home','gallery')),
  title TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_images TO authenticated;
GRANT ALL ON public.site_images TO service_role;
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "images public read" ON public.site_images FOR SELECT USING (true);
CREATE POLICY "images admin write" ON public.site_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews public insert" ON public.reviews FOR INSERT WITH CHECK (char_length(author) BETWEEN 1 AND 60 AND char_length(body) BETWEEN 1 AND 800);
CREATE POLICY "reviews admin delete" ON public.reviews FOR DELETE TO authenticated USING (true);

-- WORK HOURS
CREATE TABLE public.work_hours (
  weekday INT PRIMARY KEY CHECK (weekday BETWEEN 0 AND 6),
  is_open BOOLEAN NOT NULL DEFAULT true,
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '19:00',
  slot_minutes INT NOT NULL DEFAULT 30
);
GRANT SELECT ON public.work_hours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_hours TO authenticated;
GRANT ALL ON public.work_hours TO service_role;
ALTER TABLE public.work_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hours public read" ON public.work_hours FOR SELECT USING (true);
CREATE POLICY "hours admin write" ON public.work_hours FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.work_hours (weekday, is_open, open_time, close_time, slot_minutes) VALUES
  (0, false, '09:00', '19:00', 30),
  (1, false, '09:00', '19:00', 30),
  (2, true, '09:00', '19:00', 30),
  (3, true, '09:00', '19:00', 30),
  (4, true, '09:00', '20:00', 30),
  (5, true, '09:00', '20:00', 30),
  (6, true, '09:00', '18:00', 30);

-- CLOSED DAYS
CREATE TABLE public.closed_days (
  day DATE PRIMARY KEY,
  reason TEXT
);
GRANT SELECT ON public.closed_days TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.closed_days TO authenticated;
GRANT ALL ON public.closed_days TO service_role;
ALTER TABLE public.closed_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "closed public read" ON public.closed_days FOR SELECT USING (true);
CREATE POLICY "closed admin write" ON public.closed_days FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- BOOKINGS
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_date, booking_time)
);
GRANT INSERT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings public insert" ON public.bookings FOR INSERT WITH CHECK (
  char_length(customer_name) BETWEEN 2 AND 80
  AND char_length(phone) BETWEEN 5 AND 30
  AND booking_date >= (now() AT TIME ZONE 'Europe/Rome')::date
);
CREATE POLICY "bookings admin read" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "bookings admin update" ON public.bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "bookings admin delete" ON public.bookings FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.taken_slots(d DATE)
RETURNS SETOF TIME
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT booking_time FROM public.bookings WHERE booking_date = d;
$$;
GRANT EXECUTE ON FUNCTION public.taken_slots(DATE) TO anon, authenticated;