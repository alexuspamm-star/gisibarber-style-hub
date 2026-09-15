import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, CheckCircle2, Home } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { uploadMedia } from "@/lib/media";
import { formatItalianDate } from "@/lib/site-settings";
import { buildSlots, normalizeTime, toISODate, WEEKDAYS, type WorkHour } from "@/lib/booking";

export const Route = createFileRoute("/prenota")({
  head: () => ({
    meta: [
      { title: "Prenota un taglio — Gisilbarber" },
      {
        name: "description",
        content:
          "Scegli giorno e orario, descrivi il taglio che vuoi e prenota il tuo posto da Gisilbarber.",
      },
      { property: "og:title", content: "Prenota un taglio — Gisilbarber" },
      {
        property: "og:description",
        content: "Prenotazione online: giorno, orario e il taglio che desideri.",
      },
    ],
  }),
  component: Prenota,
});

function Prenota() {
  const today = toISODate(new Date());
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [done, setDone] = useState(false);

  const { data: hours } = useQuery({
    queryKey: ["work_hours"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_hours").select("*").order("weekday");
      if (error) throw error;
      return data as WorkHour[];
    },
  });

  const { data: closedDays } = useQuery({
    queryKey: ["closed_days"],
    queryFn: async () => {
      const { data, error } = await supabase.from("closed_days").select("day");
      if (error) throw error;
      return data.map((d) => d.day as string);
    },
  });

  const { data: blocked } = useQuery({
    queryKey: ["blocked_slots", date],
    enabled: !!date,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_slots")
        .select("slot")
        .eq("day", date);
      if (error) throw error;
      return data.map((b) => normalizeTime(b.slot as string));
    },
  });

  const { data: taken, isFetching: loadingSlots } = useQuery({
    queryKey: ["taken_slots", date],
    enabled: !!date,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("taken_slots", { d: date });
      if (error) throw error;
      return ((data ?? []) as string[]).map(normalizeTime);
    },
  });

  const weekday = date ? new Date(`${date}T12:00:00`).getDay() : null;
  const dayHour = weekday === null ? undefined : hours?.find((h) => h.weekday === weekday);
  const isClosed = !!date && (!dayHour?.is_open || (closedDays ?? []).includes(date));
  const allSlots = buildSlots(dayHour);
  const nowLabel = new Date().toTimeString().slice(0, 5);

  const isPast = (slot: string) => date === today && slot <= nowLabel;
  const isTaken = (slot: string) =>
    (taken ?? []).includes(slot) || (blocked ?? []).includes(slot);

  const mutation = useMutation({
    mutationFn: async () => {
      let imageUrl: string | null = null;
      if (file) imageUrl = await uploadMedia(file, "bookings");

      const { error } = await supabase.from("bookings").insert({
        booking_date: date,
        booking_time: time,
        customer_name: name.trim(),
        phone: phone.trim(),
        description: description.trim() || null,
        image_url: imageUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => setDone(true),
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate")
          ? "Questo orario è appena stato occupato, scegline un altro."
          : e.message,
      ),
  });

  if (done) {
    return (
      <main className="grid min-h-screen place-items-center px-6 pt-24 text-center">
        <div>
          <CheckCircle2 className="mx-auto size-14 text-primary" />
          <h1 className="display mt-6 text-5xl">Prenotazione inviata</h1>
          <p className="mt-3 text-muted-foreground">
            Ci vediamo {date && WEEKDAYS[new Date(`${date}T12:00:00`).getDay()]}{" "}
            {formatItalianDate(date)} alle {time}.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              className="uppercase tracking-widest"
              onClick={() => {
                setDone(false);
                setDate("");
                setTime("");
                setName("");
                setPhone("");
                setDescription("");
                setFile(null);
              }}
            >
              Nuova prenotazione
            </Button>
            <Button asChild variant="outline" className="uppercase tracking-widest">
              <Link to="/">
                <Home className="size-4" /> Torna alla home
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-32">
      <h1 className="display text-5xl sm:text-7xl">Prenota</h1>
      <p className="mt-3 text-muted-foreground">
        Scegli quando, raccontaci il taglio e ti aspettiamo in poltrona.
      </p>

      <form
        className="mt-10 space-y-6 rounded-2xl border border-border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!date || !time || !name.trim() || !phone.trim()) {
            toast.error("Compila giorno, orario, nome e telefono");
            return;
          }
          mutation.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="date">Giorno</Label>
          <Input
            id="date"
            type="date"
            min={today}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTime("");
            }}
          />
          {isClosed && (
            <p className="text-sm text-destructive">Siamo chiusi in questa data, scegline un'altra.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Orario</Label>
          {!date ? (
            <p className="text-sm text-muted-foreground">Seleziona prima un giorno.</p>
          ) : isClosed ? null : loadingSlots ? (
            <p className="text-sm text-muted-foreground">Verifico disponibilità…</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {allSlots.map((slot) => {
                const disabled = isTaken(slot) || isPast(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={disabled}
                    onClick={() => setTime(slot)}
                    className={`rounded-lg border px-2 py-2 text-sm transition-colors ${
                      time === slot
                        ? "border-primary bg-primary text-primary-foreground"
                        : disabled
                          ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-45"
                          : "border-border hover:border-primary hover:text-primary"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome e cognome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">Descrizione del taglio</Label>
          <Textarea
            id="desc"
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Es. fade basso, sfumatura sfumata sui lati, barba corta…"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="photo">Foto di riferimento (facoltativa)</Label>
          <label
            htmlFor="photo"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted-foreground hover:border-primary"
          >
            <ImagePlus className="size-5 text-primary" />
            {file ? file.name : "Allega un'immagine"}
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full uppercase tracking-widest"
          disabled={mutation.isPending || isClosed}
        >
          {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Conferma prenotazione
        </Button>
      </form>
    </main>
  );
}
