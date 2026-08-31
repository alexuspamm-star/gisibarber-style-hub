import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { uploadMedia } from "@/lib/media";
import { buildSlots, normalizeTime, toISODate, WEEKDAYS, type WorkHour } from "@/lib/booking";

export const Route = createFileRoute("/prenota")({
  head: () => ({
    meta: [
      { title: "Prenota un taglio — Gisibarber" },
      {
        name: "description",
        content:
          "Scegli giorno e orario, descrivi il taglio che vuoi e prenota il tuo posto da Gisibarber.",
      },
      { property: "og:title", content: "Prenota un taglio — Gisibarber" },
      {
        property: "og:description",
        content: "Prenotazione online: giorno, orario e il taglio che desideri.",
      },
    ],
  }),
  component: Prenota;
});

function Prenota() {
  return null;
}
