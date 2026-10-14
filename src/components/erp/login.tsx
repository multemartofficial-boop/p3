import { useState, type FormEvent } from "react";
import { login } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      window.dispatchEvent(new Event("erp-login"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-workspace px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            GT
          </div>
          <div>
            <h1 className="text-lg font-bold">GarmentTrade</h1>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Accessories ERP
            </p>
          </div>
        </div>
        <label className="grid gap-1.5 text-xs font-semibold">
          Email
          <Input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="h-11 rounded-lg"
          />
        </label>
        <label className="mt-4 grid gap-1.5 text-xs font-semibold">
          Password
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 rounded-lg"
          />
        </label>
        {error && <p className="mt-3 text-xs font-medium text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="mt-6 h-11 w-full rounded-lg">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <div className="mt-5 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3.5 text-[11px]">
          <div className="font-bold uppercase tracking-widest text-primary">Demo accounts</div>
          <p className="mt-1 text-muted-foreground">
            Showcase build — everything runs on fictional local data.
          </p>
          <div className="mt-2 space-y-1 font-mono">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@demo.io");
                setPassword("admin123");
              }}
              className="block w-full text-left hover:text-primary"
            >
              admin@demo.io / admin123 <span className="text-muted-foreground">— admin</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("manager@demo.io");
                setPassword("manager123");
              }}
              className="block w-full text-left hover:text-primary"
            >
              manager@demo.io / manager123 <span className="text-muted-foreground">— manager</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("staff@demo.io");
                setPassword("staff123");
              }}
              className="block w-full text-left hover:text-primary"
            >
              staff@demo.io / staff123 <span className="text-muted-foreground">— staff</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
