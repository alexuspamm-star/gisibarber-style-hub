ALTER TABLE public.site_settings
  ADD COLUMN hero_focus_x integer NOT NULL DEFAULT 50,
  ADD COLUMN hero_focus_y integer NOT NULL DEFAULT 50;

COMMENT ON COLUMN public.site_settings.hero_focus_x IS 'Posizione orizzontale dello sfondo home su mobile (0=sinistra, 100=destra)';
COMMENT ON COLUMN public.site_settings.hero_focus_y IS 'Posizione verticale dello sfondo home su mobile (0=alto, 100=basso)';