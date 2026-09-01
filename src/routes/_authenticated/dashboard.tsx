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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Gisibarber" },
      { name: "description", content: "Gestione immagini, orari, recensioni e prenotazioni di Gisibarber." },
      { property: "og:title", content: "Dashboard — Gisibarber" },
      { property: "og:description", content: "Gestione immagini, orari, recensioni e prenotazioni di Gisibarber." },
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
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="prenotazioni">Prenotazioni</TabsTrigger>
          <TabsTrigger value="orari">Orari</TabsTrigger>
          <TabsTrigger value="home">Foto home</TabsTrigger>
          <TabsTrigger value="galleria">Galleria</TabsTrigger>
          <TabsTrigger value="recensioni">Recensioni</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="prenotazioni" className="mt-6">
          <BookingsPanel />
        </TabsContent>
        <TabsContent value="orari" className="mt-6 space-y-6">
          <HoursPanel />
          <ClosedDaysPanel />
        </TabsContent>
        <TabsContent value="home" className="mt-6">
          <ImagesPanel section="home" title="Foto della pagina principale" />
        </TabsContent>
        <TabsContent value="galleria" className="mt-6">
          <ImagesPanel section="gallery" title="Foto della galleria" />
        </TabsContent>
        <TabsContent value="recensioni" className="mt-6">
          <ReviewsPanel />
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

  return (
    <Section title="Prenotazioni">
      {bookings.isLoading && <Loader2 className="size-5 animate-spin text-primary" />}
      {bookings.data?.length === 0 && (
        <p className="text-muted-foreground">Nessuna prenotazione al momento.</p>
      )}
      <ul className="space-y-4">
        {bookings.data?.map((b) => (
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
                <Button variant="destructive" size="icon" onClick={() => remove.mutate(b.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
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
        const url = await uploadMedia(file, section);
        const { error } = await supabase
          .from("site_images")
          .insert({ url, section, sort_order: order++ });
        if (error) throw error;
      }
      toast.success("Immagini caricate");
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
        Carica immagini
      </Label>
      <input
        id={`upload-${section}`}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {images.data?.map((img) => (
          <div key={img.id} className="group relative overflow-hidden rounded-xl">
            <img src={img.url} alt={img.title ?? "Taglio Gisibarber"} className="aspect-[3/4] w-full object-cover" />
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
