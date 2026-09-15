import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star, MapPin, Phone, Clock, Instagram, Scissors } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WEEKDAYS, type WorkHour } from "@/lib/booking";
import { useSiteSettings } from "@/lib/site-settings";

const FALLBACK = ["/images/cut-1.jpg", "/images/cut-2.jpg", "/images/cut-3.jpg"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gisilbarber — Barbershop street & elegante" },
      {
        name: "description",
        content:
          "Gisilbarber: tagli su misura, fade precisi e cura della barba. Guarda i lavori, leggi le recensioni e prenota online.",
      },
      { property: "og:title", content: "Gisilbarber — Barbershop street & elegante" },
      {
        property: "og:description",
        content: "Tagli su misura, fade precisi e cura della barba. Prenota online da Gisilbarber.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

export const DEFAULT_TAGLINE =
  "Fade chirurgici, barba scolpita, attitudine street. Un taglio che parla prima di te.";

function Home() {
  return (
    <main>
      <Hero />
      <Marquee />
      <Reviews />
      <Contatti />
    </main>
  );
}

function Hero() {
  const { data: settings } = useSiteSettings();
  return (
    <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
      <img
        src={settings?.hero_image_url || "/images/hero.jpg"}
        alt="Interno del barbershop Gisilbarber"
        width={1920}
        height={1080}
        className="absolute inset-0 size-full object-cover opacity-55"
      />
      <div className="fade-bottom absolute inset-0" />
      <div className="relative z-10 px-6 text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.5em] text-primary">Barbershop</p>
        <h1 className="display text-[18vw] leading-[0.85] sm:text-[12rem]">GISILBARBER</h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-muted-foreground">
          {settings?.hero_tagline || DEFAULT_TAGLINE}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="glow uppercase tracking-widest">
            <Link to="/prenota">Prenota ora</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="uppercase tracking-widest">
            <Link to="/galleria">Galleria</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const { data: images } = useQuery({
    queryKey: ["images", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_images")
        .select("id, url, title, media_type")
        .eq("section", "home")
        .order("sort_order")
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const media = images?.length
    ? images.map((i) => ({ url: i.url, media_type: i.media_type }))
    : FALLBACK.map((url) => ({ url, media_type: "image" }));
  const loop = [...media, ...media];

  return (
    <section className="border-y border-border bg-card/40 py-16">
      <div className="mb-8 flex items-end justify-between px-6">
        <h2 className="display text-4xl sm:text-5xl">I nostri tagli</h2>
        <Link to="/galleria" className="text-sm uppercase tracking-widest text-primary">
          Vedi tutto
        </Link>
      </div>
      <div className="overflow-hidden">
        <div className="marquee-track flex w-max gap-4">
          {loop.map((item, i) => (
            <figure
              key={`${item.url}-${i}`}
              className="relative h-[22rem] w-[16rem] shrink-0 overflow-hidden rounded-xl border border-border sm:h-[26rem] sm:w-[19rem]"
            >
              {item.media_type === "video" ? (
                <video
                  src={item.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="size-full object-cover"
                />
              ) : (
                <img
                  src={item.url}
                  alt={`Taglio realizzato da Gisilbarber ${(i % media.length) + 1}`}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-700 hover:scale-105"
                />
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  const qc = useQueryClient();
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);

  const { data: reviews } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, author, rating, body, created_at")
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reviews").insert({ author, body, rating });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Grazie per la recensione!");
      setAuthor("");
      setBody("");
      setRating(5);
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="px-6 py-20">
      <h2 className="display mb-10 text-4xl sm:text-5xl">Recensioni</h2>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews?.length ? (
            reviews.map((r) => (
              <article key={r.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-1 text-primary">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{r.body}</p>
                <p className="mt-4 text-xs uppercase tracking-widest">{r.author}</p>
              </article>
            ))
          ) : (
            <p className="text-muted-foreground">Ancora nessuna recensione. Sii il primo!</p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!author.trim() || !body.trim()) {
              toast.error("Compila tutti i campi");
              return;
            }
            mutation.mutate();
          }}
          className="h-fit rounded-xl border border-border bg-card p-5"
        >
          <h3 className="display text-2xl">Lascia la tua</h3>
          <div className="mt-4 space-y-3">
            <Input
              value={author}
              maxLength={60}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Il tuo nome"
            />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stelle`}>
                  <Star
                    className={`size-6 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={body}
              maxLength={800}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Com'è andata?"
              rows={4}
            />
            <Button type="submit" className="w-full uppercase tracking-widest" disabled={mutation.isPending}>
              Invia
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Contatti() {
  const { data: settings } = useSiteSettings();
  const { data: hours } = useQuery({
    queryKey: ["work_hours"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_hours").select("*").order("weekday");
      if (error) throw error;
      return data as WorkHour[];
    },
  });

  const ordered = [1, 2, 3, 4, 5, 6, 0];

  return (
    <footer id="contatti" className="border-t border-border bg-card/40 px-6 py-20">
      <h2 className="display mb-10 text-4xl sm:text-5xl">Contatti & posizione</h2>
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-4 text-sm">
          <p className="flex items-center gap-3">
            <MapPin className="size-4 text-primary" /> {settings?.address ?? "Via Roma 12, Milano"}
          </p>
          <a
            className="flex items-center gap-3 hover:text-primary"
            href={`tel:${(settings?.phone ?? "").replace(/\s/g, "")}`}
          >
            <Phone className="size-4 text-primary" /> {settings?.phone ?? "+39 340 000 0000"}
          </a>
          <a
            className="flex items-center gap-3 hover:text-primary"
            href={settings?.instagram_url ?? "https://instagram.com/gisilbarber"}
            target="_blank"
            rel="noreferrer"
          >
            <Instagram className="size-4 text-primary" /> @{settings?.instagram_handle ?? "gisilbarber"}
          </a>
          <p className="flex items-center gap-3">
            <Scissors className="size-4 text-primary" /> {settings?.services ?? "Taglio, fade, barba, rasatura"}
          </p>
        </div>

        <div>
          <h3 className="mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-primary">
            <Clock className="size-4" /> Orari
          </h3>
          <ul className="space-y-1 text-sm">
            {ordered.map((w) => {
              const h = hours?.find((x) => x.weekday === w);
              return (
                <li key={w} className="flex justify-between border-b border-border/50 py-1">
                  <span>{WEEKDAYS[w]}</span>
                  <span className="text-muted-foreground">
                    {h?.is_open
                      ? `${h.open_time.slice(0, 5)} – ${h.close_time.slice(0, 5)}`
                      : "Chiuso"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <iframe
            title="Posizione di Gisilbarber"
            src={
              settings?.map_url ??
              "https://www.openstreetmap.org/export/embed.html?bbox=9.180%2C45.458%2C9.200%2C45.472&layer=mapnik"
            }
            className="h-64 w-full"
            loading="lazy"
          />
        </div>
      </div>
      <div className="mt-12 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
        <p>© {new Date().getFullYear()} Gisilbarber</p>
        <p className="mt-3">Made by Alexander Marrubbio</p>
        <a
          href="https://www.instagram.com/_alex.mrb_/"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-2 normal-case tracking-normal transition-colors hover:text-primary"
        >
          <Instagram className="size-4" /> @_alex.mrb_
        </a>
      </div>
    </footer>
  );
}
