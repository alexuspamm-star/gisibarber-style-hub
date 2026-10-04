import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  id: string;
  primary_color: string;
  address: string;
  phone: string;
  instagram_handle: string;
  instagram_url: string;
  services: string;
  map_url: string;
  hero_tagline: string;
  hero_image_url: string;
};

export const settingsQueryKey = ["site_settings"];

export function useSiteSettings() {
  return useQuery({
    queryKey: settingsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("id, primary_color, address, phone, instagram_handle, instagram_url, services, map_url, hero_tagline, hero_image_url")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SiteSettings | null;
    },
    staleTime: 60_000,
  });
}

/** Dark or light foreground for a given hex background. */
export function foregroundFor(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#171310";
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#171310" : "#ffffff";
}

/** Italian long date, e.g. "26 settembre 2026". */
export function formatItalianDate(iso: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}
