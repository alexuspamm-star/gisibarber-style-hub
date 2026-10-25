import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/prodotti")({
  head: () => ({
    meta: [
      { title: "Prodotti — Gisilbarber" },
      { name: "description", content: "Cere, clay, gel e spray per lo styling: i prodotti disponibili in negozio da Gisilbarber." },
      { property: "og:title", content: "Prodotti — Gisilbarber" },
      { property: "og:description", content: "Scopri i prodotti per lo styling disponibili in negozio da Gisilbarber." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Prodotti,
});

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

function Prodotti() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, image_url, available")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <main className="px-6 pb-24 pt-32">
      <h1 className="display text-5xl sm:text-7xl">Prodotti</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Lo styling che usiamo in poltrona, disponibile in negozio. Chiedi pure consiglio al tuo barbiere.
      </p>

      {isLoading ? (
        <p className="mt-12 text-muted-foreground">Caricamento…</p>
      ) : !products?.length ? (
        <p className="mt-12 text-muted-foreground">Nessun prodotto al momento.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <article
              key={p.id}
              className={`overflow-hidden rounded-2xl border border-border bg-card ${p.available ? "" : "opacity-60"}`}
            >
              <div className="grid aspect-square place-items-center bg-secondary">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} loading="lazy" className="size-full object-cover" />
                ) : (
                  <ShoppingBag className="size-12 text-muted-foreground" />
                )}
              </div>
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="display text-2xl tracking-wide">{p.name}</h2>
                  {p.price != null && <span className="font-semibold text-primary">{euro.format(Number(p.price))}</span>}
                </div>
                {p.description && <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>}
                <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
                  {p.available ? "Disponibile in negozio" : "Esaurito"}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
