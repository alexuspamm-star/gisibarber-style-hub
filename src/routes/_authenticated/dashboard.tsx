import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, LogOut, Trash2, Upload } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/media";
import { updateCredentials } from "@/lib/admin.functions";
import { WEEKDAYS, normalizeTime, type WorkHour } from "@/lib/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getVideoDuration, MAX_VIDEO_SECONDS } from "@/lib/media";
import { formatItalianDate, settingsQueryKey, useSiteSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Gisilbarber" },
      { name: "description", content: "Gestione immagini, orari, recensioni e prenotazioni di Gisilbarber." },
      { property: "og:title", content: "Dashboard — Gisilbarber" },
      { property: "og:description", content: "Gestione immagini, orari, recensioni e prenotazioni di Gisilbarber." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="display mb-4 text-2xl tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pt-28 pb-24">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {profile.data?.avatar_url ? (
            <img
              src={profile.data.avatar_url}
              alt="Foto profilo admin"
              className="size-12 rounded-full object-cover"
            />
          ) : (
            <div className="size-12 rounded-full bg-muted" />
          )}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Admin</p>
            <p className="display text-2xl">{profile.data?.username ?? "…"}</p>
          </div>
        </div>
        <Button variant="outline" onClick={signOut}>
          <LogOut className="size-4" /> Esci
        </Button>
      </header>

      <Tabs defaultValue="prenotazioni">
        <TabsList className="flex h-auto flex-wrap items-stretch justify-start gap-1">
          <TabsTrigger value="prenotazioni">Prenotazioni</TabsTrigger>
          <TabsTrigger value="orari">Orari</TabsTrigger>
          <TabsTrigger value="home">Foto home</TabsTrigger>
          <TabsTrigger value="galleria">Galleria</TabsTrigger>
          <TabsTrigger value="prodotti">Prodotti</TabsTrigger>
          <TabsTrigger value="recensioni">Recensioni</TabsTrigger>
          <TabsTrigger value="contatti">Contatti</TabsTrigger>
          <TabsTrigger value="personalizzazione">Personalizzazione</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="prenotazioni" className="mt-6">
          <BookingsPanel />
        </TabsContent>
        <TabsContent value="orari" className="mt-6 space-y-6">
          <HoursPanel />
          <BlockedSlotsPanel />
          <ClosedDaysPanel />
        </TabsContent>
        <TabsContent value="home" className="mt-6">
          <ImagesPanel section="home" title="Foto e video della pagina principale" />
        </TabsContent>
        <TabsContent value="galleria" className="mt-6">
          <ImagesPanel section="gallery" title="Foto e video della galleria" />
        </TabsContent>
        <TabsContent value="prodotti" className="mt-6">
          <ProductsPanel />
        </TabsContent>
        <TabsContent value="recensioni" className="mt-6">
          <ReviewsPanel />
        </TabsContent>
        <TabsContent value="contatti" className="mt-6">
          <ContactsPanel />
        </TabsContent>
        <TabsContent value="personalizzazione" className="mt-6">
          <AppearancePanel />
        </TabsContent>
        <TabsContent value="account" className="mt-6 space-y-6">
          <AvatarPanel
            avatarUrl={profile.data?.avatar_url ?? null}
            onDone={() => qc.invalidateQueries({ queryKey: ["profile"] })}
          />
          <CredentialsPanel
            username={profile.data?.username ?? ""}
            onDone={() => qc.invalidateQueries({ queryKey: ["profile"] })}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}

/* ---------- Prenotazioni ---------- */

function BookingsPanel() {
  const qc = useQueryClient();
  const bookings = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async (v: { id: string; booking_date: string; booking_time: string }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ booking_date: v.booking_date, booking_time: v.booking_time })
        .eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Prenotazione aggiornata");
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: () => toast.error("Impossibile aggiornare la prenotazione"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Prenotazione cancellata");
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: () => toast.error("Impossibile cancellare la prenotazione"),
  });

  const todayRome = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Rome" });
  const all = bookings.data ?? [];
  const upcoming = all.filter((b) => b.booking_date >= todayRome);
  const expired = all
    .filter((b) => b.booking_date < todayRome)
    .sort((a, b) =>
      b.booking_date === a.booking_date
        ? b.booking_time.localeCompare(a.booking_time)
        : b.booking_date.localeCompare(a.booking_date),
    );

  function renderBooking(b: (typeof all)[number]) {
    return (
      <li key={b.id} className="rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="display text-xl">{b.customer_name}</p>
            <p className="text-sm text-muted-foreground">{b.phone}</p>
            {b.description && <p className="mt-2 text-sm">{b.description}</p>}
            {b.image_url && (
              <a href={b.image_url} target="_blank" rel="noreferrer">
                <img
                  src={b.image_url}
                  alt={`Riferimento taglio di ${b.customer_name}`}
                  className="mt-3 size-24 rounded-lg object-cover"
                />
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              className="w-40"
              defaultValue={b.booking_date}
              onChange={(e) =>
                update.mutate({
                  id: b.id,
                  booking_date: e.target.value,
                  booking_time: normalizeTime(b.booking_time),
                })
              }
            />
            <Input
              type="time"
              className="w-32"
              defaultValue={normalizeTime(b.booking_time)}
              onChange={(e) =>
                update.mutate({
                  id: b.id,
                  booking_date: b.booking_date,
                  booking_time: e.target.value,
                })
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" aria-label="Cancella prenotazione">
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancellare la prenotazione?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Stai per cancellare la prenotazione di {b.customer_name} del{" "}
                    {formatItalianDate(b.booking_date)} alle {normalizeTime(b.booking_time)}.
                    L'operazione non può essere annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={() => remove.mutate(b.id)}>
                    Sì, cancella
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </li>
    );
  }

  return (
    <Section title="Prenotazioni">
      {bookings.isLoading && <Loader2 className="size-5 animate-spin text-primary" />}
      {all.length === 0 && !bookings.isLoading && (
        <p className="text-muted-foreground">Nessuna prenotazione al momento.</p>
      )}

      {upcoming.length > 0 && (
        <div>
          <h3 className="display text-2xl text-primary">In programma</h3>
          <ul className="mt-4 space-y-4">{upcoming.map(renderBooking)}</ul>
        </div>
      )}

      {expired.length > 0 && (
        <div className="mt-8">
          <h3 className="display text-2xl text-muted-foreground">Scadute</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Prenotazioni con data già passata.
          </p>
          <ul className="mt-4 space-y-4 opacity-70">{expired.map(renderBooking)}</ul>
        </div>
      )}
    </Section>
  );
}

/* ---------- Orari ---------- */

function HoursPanel() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<WorkHour[]>([]);

  const hours = useQuery({
    queryKey: ["work_hours"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_hours").select("*").order("weekday");
      if (error) throw error;
      return data as WorkHour[];
    },
  });

  useEffect(() => {
    if (hours.data) {
      setRows(hours.data.map((h) => ({ ...h, open_time: normalizeTime(h.open_time), close_time: normalizeTime(h.close_time) })));
    }
  }, [hours.data]);

  const save = useMutation({
    mutationFn: async () => {
      for (const r of rows) {
        const { error } = await supabase
          .from("work_hours")
          .update({
            is_open: r.is_open,
            open_time: r.open_time,
            close_time: r.close_time,
            slot_minutes: r.slot_minutes,
          })
          .eq("weekday", r.weekday);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Orari aggiornati");
      qc.invalidateQueries({ queryKey: ["work_hours"] });
    },
    onError: () => toast.error("Impossibile salvare gli orari"),
  });

  function patch(weekday: number, values: Partial<WorkHour>) {
    setRows((prev) => prev.map((r) => (r.weekday === weekday ? { ...r, ...values } : r)));
  }

  return (
    <Section title="Giorni e orari di lavoro">
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.weekday} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
            <span className="w-28 font-medium">{WEEKDAYS[r.weekday]}</span>
            <Switch
              checked={r.is_open}
              onCheckedChange={(v) => patch(r.weekday, { is_open: v })}
              aria-label={`Apertura ${WEEKDAYS[r.weekday]}`}
            />
            <Input
              type="time"
              className="w-32"
              value={r.open_time}
              disabled={!r.is_open}
              onChange={(e) => patch(r.weekday, { open_time: e.target.value })}
            />
            <Input
              type="time"
              className="w-32"
              value={r.close_time}
              disabled={!r.is_open}
              onChange={(e) => patch(r.weekday, { close_time: e.target.value })}
            />
            <Input
              type="number"
              min={10}
              step={5}
              className="w-24"
              value={r.slot_minutes}
              onChange={(e) => patch(r.weekday, { slot_minutes: Number(e.target.value) })}
              aria-label="Durata slot in minuti"
            />
          </div>
        ))}
      </div>
      <Button className="mt-4" onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending && <Loader2 className="size-4 animate-spin" />} Salva orari
      </Button>
    </Section>
  );
}

function ClosedDaysPanel() {
  const qc = useQueryClient();
  const [day, setDay] = useState("");
  const [reason, setReason] = useState("");

  const closed = useQuery({
    queryKey: ["closed_days"],
    queryFn: async () => {
      const { data, error } = await supabase.from("closed_days").select("*").order("day");
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("closed_days").insert({ day, reason: reason || null });
      if (error) throw error;
    },
    onSuccess: () => {
      setDay("");
      setReason("");
      toast.success("Giorno di chiusura aggiunto");
      qc.invalidateQueries({ queryKey: ["closed_days"] });
    },
    onError: () => toast.error("Impossibile aggiungere il giorno"),
  });

  const remove = useMutation({
    mutationFn: async (d: string) => {
      const { error } = await supabase.from("closed_days").delete().eq("day", d);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["closed_days"] }),
  });

  return (
    <Section title="Giorni di chiusura straordinaria">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="closed-day">Data</Label>
          <Input id="closed-day" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </div>
        <div className="flex-1">
          <Label htmlFor="closed-reason">Motivo (facoltativo)</Label>
          <Input id="closed-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <Button onClick={() => add.mutate()} disabled={!day || add.isPending}>
          Aggiungi
        </Button>
      </div>
      <ul className="mt-4 space-y-2">
        {closed.data?.map((c) => (
          <li key={c.day} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <span>
              {c.day} {c.reason ? `— ${c.reason}` : ""}
            </span>
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(c.day)}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ---------- Immagini ---------- */

function ImagesPanel({ section, title }: { section: "home" | "gallery"; title: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const images = useQuery({
    queryKey: ["site_images", section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_images")
        .select("*")
        .eq("section", section)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      let order = images.data?.length ?? 0;
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        if (isVideo) {
          const duration = await getVideoDuration(file);
          if (duration > MAX_VIDEO_SECONDS + 0.5) {
            toast.error(`Il video "${file.name}" supera i ${MAX_VIDEO_SECONDS} secondi`);
            continue;
          }
        }
        const url = await uploadMedia(file, section);
        const { error } = await supabase
          .from("site_images")
          .insert({ url, section, sort_order: order++, media_type: isVideo ? "video" : "image" });
        if (error) throw error;
      }
      toast.success("Caricamento completato");
      qc.invalidateQueries({ queryKey: ["site_images", section] });
    } catch {
      toast.error("Caricamento non riuscito");
    } finally {
      setBusy(false);
    }
  }

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site_images", section] }),
  });

  return (
    <Section title={title}>
      <Label
        htmlFor={`upload-${section}`}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        Carica foto o video
      </Label>
      <p className="mt-2 text-xs text-muted-foreground">
        Video brevi ammessi: massimo {MAX_VIDEO_SECONDS} secondi.
      </p>
      <input
        id={`upload-${section}`}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {images.data?.map((img) => (
          <div key={img.id} className="group relative overflow-hidden rounded-xl">
            {img.media_type === "video" ? (
              <video src={img.url} muted loop playsInline controls className="aspect-[3/4] w-full object-cover" />
            ) : (
              <img src={img.url} alt={img.title ?? "Taglio Gisilbarber"} className="aspect-[3/4] w-full object-cover" />
            )}
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => remove.mutate(img.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Prodotti ---------- */

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  available: boolean;
  sort_order: number;
};

function ProductsPanel() {
  const qc = useQueryClient();
  const products = useQuery({
    queryKey: ["products", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("sort_order");
      if (error) throw error;
      return data as Product[];
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  async function add() {
    const order = (products.data?.length ?? 0) + 1;
    const { error } = await supabase.from("products").insert({ name: "Nuovo prodotto", sort_order: order });
    if (error) {
      toast.error("Impossibile aggiungere il prodotto");
      return;
    }
    refresh();
  }

  return (
    <Section title="Prodotti in vetrina">
      <p className="mb-4 text-sm text-muted-foreground">
        I prodotti sono solo in esposizione: i clienti li acquistano in negozio. Il prezzo è facoltativo.
      </p>
      <Button onClick={add}>Aggiungi prodotto</Button>
      <div className="mt-6 space-y-4">
        {products.data?.map((p) => (
          <ProductRow key={p.id} product={p} onChange={refresh} />
        ))}
      </div>
    </Section>
  );
}

function ProductRow({ product, onChange }: { product: Product; onChange: () => void }) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(product.price != null ? String(product.price) : "");
  const [busy, setBusy] = useState(false);

  async function update(values: Partial<Product>) {
    setBusy(true);
    const { error } = await supabase.from("products").update(values).eq("id", product.id);
    setBusy(false);
    if (error) toast.error("Salvataggio non riuscito");
    else {
      toast.success("Prodotto aggiornato");
      onChange();
    }
  }

  function save() {
    const trimmed = price.trim().replace(",", ".");
    const parsed = trimmed === "" ? null : Number(trimmed);
    if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) {
      toast.error("Prezzo non valido");
      return;
    }
    if (!name.trim()) {
      toast.error("Inserisci un nome");
      return;
    }
    update({ name: name.trim(), description: description.trim() || null, price: parsed });
  }

  async function changeImage(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadMedia(file, "products");
      await update({ image_url: url });
    } catch {
      toast.error("Caricamento non riuscito");
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Eliminare "${product.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) toast.error("Eliminazione non riuscita");
    else onChange();
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row">
      <label className="relative grid size-28 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-lg bg-secondary text-xs text-muted-foreground">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1"><Upload className="size-4" />Foto</span>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => changeImage(e.target.files?.[0])} />
      </label>
      <div className="flex-1 space-y-2">
        <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
          <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Prezzo €" inputMode="decimal" />
        </div>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrizione" rows={2} />
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={product.available} onCheckedChange={(v) => update({ available: v })} />
            <span className="text-sm">{product.available ? "Disponibile" : "Esaurito"}</span>
          </div>
          <Button size="sm" onClick={save} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}Salva
          </Button>
          <Button size="sm" variant="destructive" onClick={remove}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Recensioni ---------- */

function ReviewsPanel() {
  const qc = useQueryClient();
  const reviews = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });

  return (
    <Section title="Recensioni dei clienti">
      {reviews.data?.length === 0 && <p className="text-muted-foreground">Nessuna recensione.</p>}
      <ul className="space-y-3">
        {reviews.data?.map((r) => (
          <li key={r.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {r.author} <span className="text-primary">{"★".repeat(r.rating)}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(r.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ---------- Account ---------- */

function AvatarPanel({ avatarUrl, onDone }: { avatarUrl: string | null; onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadMedia(file, "avatars");
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", auth.user!.id);
      if (error) throw error;
      toast.success("Foto profilo aggiornata");
      onDone();
    } catch {
      toast.error("Caricamento non riuscito");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Foto profilo">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Foto profilo admin" className="size-20 rounded-full object-cover" />
        ) : (
          <div className="size-20 rounded-full bg-muted" />
        )}
        <Label
          htmlFor="upload-avatar"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Cambia foto
        </Label>
        <input
          id="upload-avatar"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </Section>
  );
}

function CredentialsPanel({ username, onDone }: { username: string; onDone: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => setNewUsername(username), [username]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateCredentials({
        data: {
          currentPassword,
          ...(newUsername && newUsername !== username ? { username: newUsername } : {}),
          ...(newPassword ? { newPassword } : {}),
        },
      });
      toast.success("Credenziali aggiornate");
      setCurrentPassword("");
      setNewPassword("");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Aggiornamento non riuscito");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section title="Nome utente e password">
      <form onSubmit={submit} className="grid gap-4 sm:max-w-md">
        <div>
          <Label htmlFor="cur-pass">Password attuale</Label>
          <Input
            id="cur-pass"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="new-user">Nuovo nome utente</Label>
          <Input id="new-user" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="new-pass">Nuova password (min. 8 caratteri)</Label>
          <Input
            id="new-pass"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />} Salva credenziali
        </Button>
      </form>
    </Section>
  );
}

/* ---------- Contatti e sede ---------- */

function ContactsPanel() {
  const qc = useQueryClient();
  const { data } = useSiteSettings();
  const [form, setForm] = useState({
    address: "",
    phone: "",
    instagram_handle: "",
    instagram_url: "",
    services: "",
    map_url: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        address: data.address,
        phone: data.phone,
        instagram_handle: data.instagram_handle,
        instagram_url: data.instagram_url,
        services: data.services,
        map_url: data.map_url,
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("Impostazioni non disponibili");
      const { error } = await supabase.from("site_settings").update(form).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contatti aggiornati");
      qc.invalidateQueries({ queryKey: settingsQueryKey });
    },
    onError: () => toast.error("Impossibile salvare i contatti"),
  });

  function field(key: keyof typeof form, label: string) {
    return (
      <div>
        <Label htmlFor={`c-${key}`}>{label}</Label>
        <Input
          id={`c-${key}`}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      </div>
    );
  }

  return (
    <Section title="Contatti e sede della home">
      <div className="grid gap-4 sm:max-w-xl">
        {field("address", "Indirizzo")}
        {field("phone", "Telefono")}
        {field("instagram_handle", "Nome utente Instagram (senza @)")}
        {field("instagram_url", "Link al profilo Instagram")}
        {field("services", "Servizi")}
        <div>
          <Label htmlFor="c-map">Link mappa (embed)</Label>
          <Textarea
            id="c-map"
            rows={3}
            value={form.map_url}
            onChange={(e) => setForm((f) => ({ ...f, map_url: e.target.value }))}
          />
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending && <Loader2 className="size-4 animate-spin" />} Salva contatti
        </Button>
      </div>
    </Section>
  );
}

/* ---------- Personalizzazione ---------- */

const PRESET_COLORS = ["#e3a53f", "#d94f3d", "#3f8ee3", "#43b581", "#b06ce0", "#e0e0e0"];

function AppearancePanel() {
  const qc = useQueryClient();
  const { data } = useSiteSettings();
  const [color, setColor] = useState("#e3a53f");
  const [tagline, setTagline] = useState("");
  const [heroImage, setHeroImage] = useState("/images/hero.jpg");
  const [imageBusy, setImageBusy] = useState(false);

  useEffect(() => {
    if (data?.primary_color) setColor(data.primary_color);
  }, [data?.primary_color]);

  useEffect(() => {
    if (data?.hero_tagline !== undefined) setTagline(data?.hero_tagline ?? "");
  }, [data?.hero_tagline]);

  useEffect(() => {
    if (data?.hero_image_url) setHeroImage(data.hero_image_url);
  }, [data?.hero_image_url]);

  async function changeHeroImage(file: File | undefined) {
    if (!file || !data) return;
    setImageBusy(true);
    try {
      const url = await uploadMedia(file, "hero");
      const { error } = await supabase
        .from("site_settings")
        .update({ hero_image_url: url })
        .eq("id", data.id);
      if (error) throw error;
      setHeroImage(url);
      await qc.invalidateQueries({ queryKey: settingsQueryKey });
      toast.success("Sfondo della home aggiornato");
    } catch {
      toast.error("Caricamento dello sfondo non riuscito");
    } finally {
      setImageBusy(false);
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("Impostazioni non disponibili");
      const { error } = await supabase
        .from("site_settings")
        .update({ primary_color: color, hero_tagline: tagline })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Personalizzazione aggiornata");
      qc.invalidateQueries({ queryKey: settingsQueryKey });
    },
    onError: () => toast.error("Impossibile salvare le modifiche"),
  });

  return (
    <Section title="Aspetto della home">
      <div className="mb-6 sm:max-w-xl">
        <Label htmlFor="hero-background">Sfondo della home</Label>
        <div className="mt-2 overflow-hidden rounded-xl border border-border">
          <img
            src={heroImage}
            alt="Anteprima dello sfondo della home"
            className="aspect-video w-full object-cover"
          />
        </div>
        <Label
          htmlFor="hero-background"
          className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2"
        >
          {imageBusy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Cambia sfondo
        </Label>
        <input
          id="hero-background"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={imageBusy}
          onChange={(e) => changeHeroImage(e.target.files?.[0])}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Per una resa ottimale usa una foto orizzontale da 1920 × 1080 px, almeno 1600 × 900 px,
          in formato JPG o WebP. Mantieni il soggetto principale verso il centro.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          aria-label="Scegli il colore principale"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="size-12 cursor-pointer rounded-lg border border-border bg-transparent"
        />
        <Input value={color} onChange={(e) => setColor(e.target.value)} className="w-36" />
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Colore ${c}`}
            onClick={() => setColor(c)}
            style={{ backgroundColor: c }}
            className="size-8 rounded-full border border-border"
          />
        ))}
      </div>
      <div className="mt-6 sm:max-w-xl">
        <Label htmlFor="hero-tagline">Frase sotto il nome nella home</Label>
        <Textarea
          id="hero-tagline"
          rows={3}
          maxLength={200}
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
      </div>
      <Button className="mt-5" onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending && <Loader2 className="size-4 animate-spin" />} Salva modifiche
      </Button>
    </Section>
  );
}


/* ---------- Orari singoli non disponibili ---------- */

function BlockedSlotsPanel() {
  const qc = useQueryClient();
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");

  const blocked = useQuery({
    queryKey: ["blocked_slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_slots")
        .select("id, day, slot")
        .order("day")
        .order("slot");
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("blocked_slots").insert({ day, slot });
      if (error) throw error;
    },
    onSuccess: () => {
      setSlot("");
      toast.success("Orario rimosso dalle disponibilità");
      qc.invalidateQueries({ queryKey: ["blocked_slots"] });
    },
    onError: () => toast.error("Impossibile bloccare questo orario"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocked_slots"] }),
  });

  return (
    <Section title="Orari singoli non disponibili">
      <p className="mb-4 text-sm text-muted-foreground">
        Togli un orario preciso da un giorno specifico (es. domani alle 16:30): non sarà più
        prenotabile.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="block-day">Giorno</Label>
          <Input id="block-day" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="block-slot">Orario</Label>
          <Input id="block-slot" type="time" value={slot} onChange={(e) => setSlot(e.target.value)} />
        </div>
        <Button onClick={() => add.mutate()} disabled={!day || !slot || add.isPending}>
          Rimuovi orario
        </Button>
      </div>
      <ul className="mt-4 space-y-2">
        {blocked.data?.length === 0 && (
          <li className="text-sm text-muted-foreground">Nessun orario bloccato.</li>
        )}
        {blocked.data?.map((b) => (
          <li
            key={b.id}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
          >
            <span>
              {formatItalianDate(b.day)} — {normalizeTime(b.slot)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Rendi di nuovo disponibile"
              onClick={() => remove.mutate(b.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </Section>
  );
}
