import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/galleria")({
  head: () => ({
    meta: [
      { title: "Galleria — Gisilbarber" },
      {
        name: "description",
        content: "Tutto il repertorio di tagli, fade e barbe realizzati da Gisilbarber.",
      },
      { property: "og:title", content: "Galleria — Gisilbarber" },
      {
        property: "og:description",
        content: "Sfoglia il repertorio completo dei tagli firmati Gisilbarber.",
      },
    ],
  }),
  component: Galleria,
});

function Galleria() {
  const [index, setIndex] = useState<number | null>(null);

  const { data: images, isLoading } = useQuery({
    queryKey: ["images", "gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_images")
        .select("id, url, title, media_type")
        .eq("section", "gallery")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const total = images?.length ?? 0;
  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(() => setIndex((i) => (i === null ? i : (i - 1 + total) % total)), [total]);
  const next = useCallback(() => setIndex((i) => (i === null ? i : (i + 1) % total)), [total]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, close, prev, next]);

  return (
    <main className="px-6 pb-24 pt-32">
      <h1 className="display text-5xl sm:text-7xl">Galleria</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Il repertorio completo. Tocca una foto o un video per ingrandirlo.
      </p>

      {isLoading ? (
        <p className="mt-12 text-muted-foreground">Caricamento…</p>
      ) : total === 0 ? (
        <p className="mt-12 text-muted-foreground">Nessuna foto caricata al momento.</p>
      ) : (
        <div className="mt-10 columns-2 gap-4 md:columns-3 lg:columns-4">
          {images!.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setIndex(i)}
              className="mb-4 block w-full overflow-hidden rounded-xl border border-border"
            >
              {img.media_type === "video" ? (
                <video
                  src={img.url}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                  className="w-full"
                />
              ) : (
                <img
                  src={img.url}
                  alt={img.title ?? `Taglio Gisilbarber ${i + 1}`}
                  loading="lazy"
                  className="w-full transition-transform duration-500 hover:scale-105"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {index !== null && images?.[index] && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 p-4">
          <button
            onClick={close}
            aria-label="Chiudi"
            className="absolute right-5 top-5 grid size-11 place-items-center rounded-full border border-border bg-card text-foreground"
          >
            <X className="size-5" />
          </button>
          <button
            onClick={prev}
            aria-label="Foto precedente"
            className="absolute left-3 grid size-11 place-items-center rounded-full border border-border bg-card sm:left-8"
          >
            <ChevronLeft className="size-5" />
          </button>
          {images[index].media_type === "video" ? (
            <video
              src={images[index].url}
              controls
              autoPlay
              loop
              playsInline
              className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
            />
          ) : (
            <img
              src={images[index].url}
              alt={images[index].title ?? "Taglio Gisilbarber"}
              className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
            />
          )}
          <button
            onClick={next}
            aria-label="Foto successiva"
            className="absolute right-3 grid size-11 place-items-center rounded-full border border-border bg-card sm:right-8"
          >
            <ChevronRight className="size-5" />
          </button>
          <span className="absolute bottom-6 text-xs uppercase tracking-widest text-muted-foreground">
            {index + 1} / {total}
          </span>
        </div>
      )}
    </main>
  );
}
