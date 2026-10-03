CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2),
  image_url text,
  available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
INSERT INTO public.products (name, description, sort_order) VALUES
('Fiber Gum Texture','Pasta fibrosa per texture definita e tenuta flessibile.',1),
('Raw Matte Clay','Argilla opaca a tenuta forte, effetto naturale.',2),
('Whipped Mousse','Mousse leggera per volume e corpo.',3),
('GSP Gel','Gel a tenuta decisa con finish lucido.',4),
('Polvere Volumizzante','Polvere per volume istantaneo alla radice.',5),
('Spray al Sale Marino','Spray texturizzante effetto mare.',6);