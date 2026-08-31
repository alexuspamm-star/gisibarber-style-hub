import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LockKeyhole } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureAdmin, usernameToEmail } from "@/lib/admin.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Area riservata — Gisibarber" },
      { name: "description", content: "Accesso riservato alla gestione di Gisibarber." },
      { property: "og:title", content: "Area riservata — Gisibarber" },
      { property: "og:description", content: "Accesso riservato alla gestione di Gisibarber." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ensureAdmin().catch(() => undefined);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("Credenziali non valide");
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 pt-24">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8"
      >
        <LockKeyhole className="size-6 text-primary" />
        <h1 className="display mt-4 text-4xl">Area riservata</h1>
        <p className="mt-2 text-sm text-muted-foreground">Solo per la gestione del salone.</p>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Nome utente</Label>
            <Input
              id="username"
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full uppercase tracking-widest" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Entra
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Primo accesso: <span className="text-primary">admin</span> /{" "}
            <span className="text-primary">gisibarber2026</span>
          </p>
        </div>
      </form>
    </main>
  );
}
