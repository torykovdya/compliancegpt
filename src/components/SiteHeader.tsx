import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, LogOut, Github, Linkedin, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setAuthed(!!session),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
      <nav
        className="flex items-center gap-1 rounded-full border border-border/80 bg-background/85 px-1.5 py-1.5 shadow-sm backdrop-blur-md"
        aria-label="Main navigation"
      >
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 rounded-full px-3 py-1.5 font-semibold text-sm tracking-tight text-foreground transition-colors hover:bg-muted"
        >
          <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
          <span>ComplianceGPT</span>
        </Link>

        {/* Divider */}
        <div className="h-4 w-px bg-border mx-1" />

        {/* Links */}
        <Link
          to="/"
          className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
          activeOptions={{ exact: true }}
        >
          Home
        </Link>
        <Link
          to="/pricing"
          className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
        >
          Pricing
        </Link>
        <Link
          to="/roadmap"
          className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
        >
          Roadmap
        </Link>

        {/* Divider */}
        <div className="h-4 w-px bg-border mx-1" />

        {/* Social icons (desktop) */}
        <a
          href="https://github.com/torykovdya"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
          aria-label="GitHub"
        >
          <Github className="h-3.5 w-3.5" />
        </a>
        <a
          href="https://linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
          aria-label="LinkedIn"
        >
          <Linkedin className="h-3.5 w-3.5" />
        </a>
        <a
          href="https://x.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
          aria-label="X / Twitter"
        >
          <Twitter className="h-3.5 w-3.5" />
        </a>

        {/* Auth buttons */}
        {authed ? (
          <>
            <Button asChild size="sm" variant="ghost" className="rounded-full h-8 text-xs">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={signOut}>
              <LogOut className="mr-1.5 h-3 w-3" />
              Sign out
            </Button>
          </>
        ) : (
          <>
            <Button asChild size="sm" variant="ghost" className="rounded-full h-8 text-xs">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full h-8 text-xs btn-lift">
              <Link to="/auth">Get started</Link>
            </Button>
          </>
        )}
      </nav>
    </header>
  );
}
