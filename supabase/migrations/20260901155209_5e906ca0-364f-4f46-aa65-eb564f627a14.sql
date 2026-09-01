ALTER TABLE public.site_images ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';

CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  primary_color text NOT NULL DEFAULT '#e3a53f',
  address text NOT NULL DEFAULT 'Via Roma 12, Milano',
  phone text NOT NULL DEFAULT '+39 340 000 0000',
  instagram_handle text NOT NULL DEFAULT 'gisibarber',
  instagram_url text NOT NULL DEFAULT 'https://instagram.com/gisibarber',
  services text NOT NULL DEFAULT 'Taglio, fade, barba, rasatura',
  map_url text NOT NULL DEFAULT 'https://www.openstreetmap.org/export/embed.html?bbox=9.180%2C45.458%2C9.200%2C45.472&layer=mapnik',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "settings admin insert" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "settings admin update" ON public.site_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (singleton) VALUES (true) ON CONFLICT (singleton) DO NOTHING;