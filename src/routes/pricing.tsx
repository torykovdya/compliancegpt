import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ComplianceGPT" },
      {
        name: "description",
        content:
          "Simple, transparent pricing for ComplianceGPT. Start free, scale to team and enterprise plans.",
      },
      { property: "og:title", content: "Pricing — ComplianceGPT" },
      {
        property: "og:description",
        content: "Free, Pro, and Enterprise plans for AI-powered compliance.",
      },
    ],
  }),
  component: Pricing,
});

const tiers = [
  {
    name: "Starter",
    price: "$0",
    cadence: "forever",
    desc: "For individuals exploring compliance workflows.",
    features: ["5 documents", "100 AI messages / month", "GDPR, HIPAA, SOC 2 guidance", "Email support"],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    cadence: "/ month",
    desc: "For growing companies building their compliance program.",
    features: [
      "Unlimited documents",
      "Unlimited AI messages",
      "All frameworks (ISO 27001, PCI-DSS, NIST…)",
      "Priority support",
      "Export conversation history",
    ],
    cta: "Start Pro trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    desc: "For regulated industries with custom requirements.",
    features: ["SSO & SAML", "Custom data residency", "Dedicated compliance reviewer", "SLA & DPA"],
    cta: "Contact sales",
    highlight: false,
  },
];

function Pricing() {
  return (
    <div className="min-h-screen sky-gradient">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Pricing built for compliance teams
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-foreground-muted leading-relaxed">
            Start free. Upgrade when you need unlimited documents and frameworks.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`glass-card glass-card-hover rounded-3xl p-8 relative ${
                t.highlight ? "ring-2 ring-primary/30 shadow-xl shadow-primary/5" : ""
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                  Most popular
                </span>
              )}

              <div>
                <h3 className="text-lg font-semibold text-foreground">{t.name}</h3>
                <p className="mt-2 text-sm text-foreground-muted">{t.desc}</p>
              </div>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight text-foreground">{t.price}</span>
                {t.cadence && <span className="text-sm text-foreground-muted">{t.cadence}</span>}
              </div>

              <ul className="mt-8 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`mt-8 w-full rounded-full h-11 text-sm font-semibold btn-lift ${
                  t.highlight ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                <Link to="/auth">{t.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="section-divider pb-10 pt-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row mb-8">
            <Link to="/" className="flex items-center gap-2.5 font-semibold text-sm tracking-tight text-foreground">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span>ComplianceGPT</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link to="/" className="text-sm text-foreground-muted hover:text-foreground transition-colors">Home</Link>
              <Link to="/pricing" className="text-sm text-foreground-muted hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/roadmap" className="text-sm text-foreground-muted hover:text-foreground transition-colors">Roadmap</Link>
              <Link to="/auth" className="text-sm text-foreground-muted hover:text-foreground transition-colors">Sign in</Link>
            </div>
          </div>
          <div className="border-t border-foreground/5 pt-6 flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-foreground-faint">
              © {new Date().getFullYear()} ComplianceGPT. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy Policy", "Terms of Service", "DPA"].map((l) => (
                <span key={l} className="text-xs text-foreground-faint hover:text-foreground cursor-pointer transition-colors">
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
