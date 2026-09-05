ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_tagline text NOT NULL DEFAULT 'Fade chirurgici, barba scolpita, attitudine street. Un taglio che parla prima di te.';

CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day date NOT NULL,
  slot time without time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (day, slot)
);

GRANT SELECT ON public.blocked_slots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_slots TO authenticated;
GRANT ALL ON public.blocked_slots TO service_role;

ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocked slots public read" ON public.blocked_slots FOR SELECT USING (true);
CREATE POLICY "blocked slots admin write" ON public.blocked_slots FOR ALL TO authenticated USING (true) WITH CHECK (true);