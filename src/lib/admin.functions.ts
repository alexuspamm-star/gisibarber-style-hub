import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const EMAIL_DOMAIN = "gisibarber.it";
export const DEFAULT_USERNAME = "admin";
export const DEFAULT_PASSWORD = "gisibarber2026";

export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "")}@${EMAIL_DOMAIN}`;
}

/** Creates the default admin account on first run. Safe to call repeatedly. */
export const ensureAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { count } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) > 0) return { created: false };

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: usernameToEmail(DEFAULT_USERNAME),
    password: DEFAULT_PASSWORD,
    email_confirm: true,
  });
  if (error) {
    if (error.message.toLowerCase().includes("already")) return { created: false };
    throw error;
  }

  if (data.user) {
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: data.user.id, username: DEFAULT_USERNAME }, { onConflict: "id" });
  }

  return { created: true };
});

/** Changes the admin username and/or password after verifying the current password. */
export const updateCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { currentPassword: string; username?: string; newPassword?: string }) => {
    if (!input.currentPassword) throw new Error("Inserisci la password attuale");
    if (input.username !== undefined && input.username.trim().length < 3)
      throw new Error("Il nome utente deve avere almeno 3 caratteri");
    if (input.newPassword !== undefined && input.newPassword.length < 8)
      throw new Error("La password deve avere almeno 8 caratteri");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) throw new Error("Profilo non trovato");

    const verifier = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error: signInError } = await verifier.auth.signInWithPassword({
      email: usernameToEmail(profile.username),
      password: data.currentPassword,
    });
    if (signInError) throw new Error("Password attuale non corretta");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const payload: { email?: string; password?: string; email_confirm?: boolean } = {};
    if (data.username && data.username.trim().toLowerCase() !== profile.username) {
      payload.email = usernameToEmail(data.username);
      payload.email_confirm = true;
    }
    if (data.newPassword) payload.password = data.newPassword;

    if (Object.keys(payload).length === 0) return { ok: true };

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, payload);
    if (updateError) throw updateError;

    if (payload.email) {
      const { error: renameError } = await supabaseAdmin
        .from("profiles")
        .update({ username: data.username!.trim().toLowerCase(), updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (renameError) throw renameError;
    }

    return { ok: true };
  });
