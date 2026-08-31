import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Images, CalendarPlus, Menu, X, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/galleria", label: "Galleria", icon: Images },
  { to: "/prenota", label: "Prenota", icon: CalendarPlus },
  { to: "/login", label: "Login", icon: LockKeyhole, adminOnly: true },
] as const;

export function FloatingNav() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <nav className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="glass pointer-events-auto w-full max-w-md rounded-2xl px-3 py-2 shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="display px-2 text-xl tracking-widest text-primary">
            GISIBARBER
          </Link>

          <div className="flex items-center gap-1">
            {items
              .filter((i) => !i.adminOnly)
              .map((item) => {
                const Icon = item.icon;
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-label={item.label}
                    className={`grid size-9 place-items-center rounded-xl transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                  </Link>
                );
              })}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Chiudi menu" : "Apri menu"}
              aria-expanded={open}
              className="grid size-9 place-items-center rounded-xl text-foreground transition-colors hover:bg-secondary"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        <div
          className={`grid overflow-hidden transition-all duration-300 ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <ul className="mt-2 space-y-1 border-t border-border pt-2">
              {items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.to;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm uppercase tracking-widest transition-colors ${
                        active
                          ? "bg-secondary text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
