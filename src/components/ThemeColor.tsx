import { foregroundFor, useSiteSettings } from "@/lib/site-settings";

/** Applies the admin-chosen primary color as CSS variables. */
export function ThemeColor() {
  const { data } = useSiteSettings();
  const color = data?.primary_color;
  if (!color) return null;

  const css = `:root{--primary:${color};--ring:${color};--sidebar-primary:${color};--sidebar-ring:${color};--primary-foreground:${foregroundFor(color)};--shadow-glow:0 10px 40px -12px ${color}59;}`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
