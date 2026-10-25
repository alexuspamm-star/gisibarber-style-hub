ALTER TABLE public.bookings ADD COLUMN product_name text;
COMMENT ON COLUMN public.bookings.product_name IS 'Prodotto H14 scelto con l''opzione taglio + prodotto (25€), acquisto in sede';