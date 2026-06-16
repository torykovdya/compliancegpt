import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  FileSearch,
  MessageSquare,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Github,
  Linkedin,
  Twitter,
  Mail,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ComplianceGPT — Your AI Compliance Employee" },
      {
        name: "description",
        content:
          "ComplianceGPT is an AI compliance employee that answers questions on GDPR, HIPAA, SOC 2, and ISO 27001, and reviews your policy documents in seconds.",
      },
      { property: "og:title", content: "ComplianceGPT — Your AI Compliance Employee" },
      {
        property: "og:description",
        content:
          "Upload policies and chat with an AI that knows GDPR, HIPAA, SOC 2, and ISO 27001.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen sky-gradient">
      <SiteHeader />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          {/* Badge */}
          <div className="mx-auto inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-foreground mb-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Now with pgvector RAG — upload any policy, get instant answers
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-balance text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl leading-[1.1]">
            Your AI compliance
            <br />
            employee, working 24/7
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground-muted leading-relaxed">
            Upload your company policies, train an AI assistant on your knowledge base,
            and get instant, cited answers — across GDPR, HIPAA, SOC 2, ISO 27001 and more.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="btn-lift rounded-full px-8 h-12 text-sm font-semibold">
              <Link to="/auth">
                Start free <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="btn-lift rounded-full px-8 h-12 text-sm font-semibold glass-strong">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-foreground-faint">
            No credit card required · Free tier available · Setup in 60 seconds
          </p>
        </div>

        {/* ── Demo Preview ─────────────────────────────────────────── */}
        <div className="mx-auto max-w-5xl px-6 mt-16">
          <div className="glass-card rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/5">
            {/* Browser chrome */}
            <div className="flex items-center gap-3 border-b border-white/40 px-5 py-3">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400/70" />
                <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                <div className="h-3 w-3 rounded-full bg-green-400/70" />
              </div>
              <div className="mx-auto flex-1 max-w-lg">
                <div className="rounded-lg bg-white/60 border border-white/60 px-4 py-1.5 text-xs text-foreground-muted text-center">
                  app.compliancegpt.com/dashboard
                </div>
              </div>
            </div>

            {/* App mockup */}
            <div className="grid md:grid-cols-[260px_1fr] bg-white/30">
              {/* Sidebar */}
              <div className="border-r border-white/40 p-4 hidden md:block">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-semibold">ComplianceGPT</span>
                </div>
                <div className="space-y-1">
                  {["remote_work_policy.txt", "security_policy.txt", "employee_handbook.md", "data_retention_policy.md"].map(
                    (doc) => (
                      <div key={doc} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs hover:bg-white/40 transition-colors">
                        <FileSearch className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
                        <span className="truncate text-foreground">{doc}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Chat area */}
              <div className="p-6 md:p-8 space-y-5 min-h-[380px]">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-5 py-3 text-sm font-medium shadow-lg shadow-primary/20">
                    How many days per week can I work remotely?
                  </div>
                </div>

                {/* AI response */}
                <div className="flex justify-start">
                  <div className="max-w-[88%] space-y-3">
                    <div className="glass-card rounded-2xl rounded-bl-md px-5 py-4 text-sm text-foreground">
                      Based on the <strong>ACME Corporation Remote Work Policy</strong>, eligible employees
                      may work remotely <strong>up to 3 days per week</strong>.
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50/80 border border-red-200/60 px-2.5 py-1 text-xs font-medium text-red-700 backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        29% confidence
                      </span>
                    </div>
                    <div className="space-y-1.5 border-t border-foreground/5 pt-3">
                      <p className="text-xs font-medium text-foreground-muted">Sources:</p>
                      <div className="flex items-center gap-2 text-xs text-foreground-muted">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>remote_work_policy.txt</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 rounded-full glass-strong border-white/60">
                      Escalate to human
                    </Button>
                  </div>
                </div>

                {/* Input bar */}
                <div className="flex items-center gap-3 pt-3">
                  <div className="flex-1 rounded-2xl glass px-5 py-3 text-xs text-foreground-muted">
                    Ask about compliance, policies, security…
                  </div>
                  <Button size="sm" className="rounded-full btn-lift h-10 w-10 p-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Landscape spacer ──────────────────────────────────────── */}
      <div className="relative h-16 md:h-24">
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
          <path d="M0 80 C 300 40, 600 60, 900 45 C 1200 30, 1350 55, 1440 40 L1440 100 L0 100 Z" fill="rgba(168,190,122,0.2)" />
          <path d="M0 90 C 200 70, 500 85, 800 75 C 1100 65, 1300 80, 1440 70 L1440 100 L0 100 Z" fill="rgba(143,169,100,0.25)" />
        </svg>
      </div>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Everything your compliance team needs
            </h2>
            <p className="mt-4 text-lg text-foreground-muted leading-relaxed">
              From document ingestion to instant cited answers — one workspace, every framework.
            </p>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileSearch,
                title: "Document ingestion",
                desc: "Upload PDFs, Word docs, Markdown. Automatic chunking and pgvector embedding — your knowledge base is ready in minutes.",
              },
              {
                icon: MessageSquare,
                title: "Cited AI answers",
                desc: "Every response references the exact policy section. Confidence score tells you when to trust the answer and when to escalate.",
              },
              {
                icon: ShieldCheck,
                title: "10+ frameworks",
                desc: "GDPR, HIPAA, SOC 2, ISO 27001, PCI-DSS, CCPA, NIST, FedRAMP — the model is trained on the full regulatory landscape.",
              },
              {
                icon: Lock,
                title: "Private by default",
                desc: "Row-level security via Supabase. Documents and conversations are isolated per organization. SOC 2 Type II ready.",
              },
              {
                icon: Sparkles,
                title: "Frontier AI models",
                desc: "Powered by DeepSeek. Fast, accurate, and cost-efficient — no latency you'd notice.",
              },
              {
                icon: CheckCircle2,
                title: "Action-oriented",
                desc: "Flags risks, suggests remediations, and escalates to your compliance team when confidence is low.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="glass-card glass-card-hover rounded-2xl p-7"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed text-foreground-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────── */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="glass-card rounded-3xl px-8 py-12 md:px-12">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                { value: "10+", label: "Compliance frameworks" },
                { value: "< 3s", label: "Average response time" },
                { value: "3,800+", label: "Policy chunks indexed" },
                { value: "99.9%", label: "Uptime SLA (Pro+)" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl font-bold tracking-tight text-foreground">{stat.value}</div>
                  <div className="mt-1.5 text-sm text-foreground-muted">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Trusted by compliance-first teams
            </h2>
            <p className="mt-4 text-lg text-foreground-muted leading-relaxed">
              From startups to enterprises — teams that can't afford to get compliance wrong.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                quote:
                  "ComplianceGPT cut our policy review time from 2 weeks to 2 hours. The cited answers give our legal team confidence to move fast.",
                author: "Sarah Chen",
                role: "Head of Compliance, Series B fintech",
                avatar: "SC",
              },
              {
                quote:
                  "We embedded the widget on our internal wiki. Now employees ask the AI instead of pinging the compliance team for the same 20 questions every week.",
                author: "Marcus Weber",
                role: "VP Engineering, 200-person SaaS",
                avatar: "MW",
              },
              {
                quote:
                  "The confidence scoring is the feature that sold us. When it drops below 40%, we know to pull in a human reviewer — no more guessing.",
                author: "Diana Patel",
                role: "CISO, healthcare startup",
                avatar: "DP",
              },
            ].map((t) => (
              <div
                key={t.author}
                className="glass-card glass-card-hover rounded-2xl p-7"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.author}</p>
                    <p className="text-xs text-foreground-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ───────────────────────────────────────── */}
      <section className="pb-20 md:pb-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-foreground-muted leading-relaxed">
              Start free. Upgrade when your team outgrows the basics.
            </p>
          </div>

          <div className="mx-auto max-w-5xl grid gap-5 md:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "$0",
                cadence: "forever",
                features: ["5 documents", "100 messages/month", "Core frameworks", "Email support"],
                cta: "Get started",
                href: "/auth",
                highlight: false,
              },
              {
                name: "Pro",
                price: "$49",
                cadence: "/month",
                features: ["Unlimited docs", "Unlimited messages", "All frameworks", "Priority support", "Export history"],
                cta: "Start Pro trial",
                href: "/auth",
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                cadence: "",
                features: ["SSO & SAML", "Custom data residency", "Dedicated reviewer", "SLA & DPA"],
                cta: "Contact sales",
                href: "/pricing",
                highlight: false,
              },
            ].map((t) => (
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
                <h3 className="text-base font-semibold text-foreground">{t.name}</h3>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight text-foreground">{t.price}</span>
                  {t.cadence && <span className="text-sm text-foreground-muted">{t.cadence}</span>}
                </div>
                <ul className="mt-7 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`mt-8 w-full rounded-full h-11 text-sm font-semibold btn-lift ${
                    t.highlight
                      ? ""
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  <Link to={t.href}>{t.cta}</Link>
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to="/pricing" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors">
              View full pricing details <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <section className="pb-20 md:pb-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="glass-card rounded-3xl px-8 py-16 md:px-16 text-center relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-primary/5 rounded-full blur-3xl" />

            <div className="relative">
              <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Ready to hire your AI compliance employee?
              </h2>
              <p className="mt-4 text-lg text-foreground-muted leading-relaxed max-w-xl mx-auto">
                Upload your first document and get answers in under a minute. No credit card required.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="btn-lift rounded-full px-8 h-12 text-sm font-semibold">
                  <Link to="/auth">
                    Get started free <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="btn-lift rounded-full px-8 h-12 text-sm font-semibold glass-strong">
                  <Link to="/pricing">View pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="section-divider pb-10 pt-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr] mb-12">
            {/* Brand */}
            <div>
              <Link to="/" className="flex items-center gap-2.5 font-semibold text-sm tracking-tight text-foreground">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span>ComplianceGPT</span>
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-foreground-muted max-w-xs">
                AI-powered compliance assistant trained on GDPR, HIPAA, SOC 2, ISO 27001 and more.
                Built for teams that move fast without breaking rules.
              </p>
              {/* Social links */}
              <div className="mt-5 flex items-center gap-2.5">
                {[
                  { icon: Github, href: "https://github.com", label: "GitHub" },
                  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
                  { icon: Twitter, href: "https://x.com", label: "X" },
                  { icon: Mail, href: "mailto:hello@compliancegpt.com", label: "Email" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-xl glass text-foreground-muted transition-all hover:text-foreground hover:shadow-md"
                    aria-label={s.label}
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground-faint mb-5">
                Product
              </h4>
              <ul className="space-y-3">
                {[
                  { name: "Features", href: "/" },
                  { name: "Pricing", href: "/pricing" },
                  { name: "Changelog", href: "/" },
                  { name: "Roadmap", href: "/roadmap" },
                ].map((l) => (
                  <li key={l.name}>
                    <Link to={l.href} className="text-sm text-foreground-muted transition-colors hover:text-foreground">
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground-faint mb-5">
                Resources
              </h4>
              <ul className="space-y-3">
                {["Documentation", "API Reference", "Widget Embed", "Status"].map((l) => (
                  <li key={l}>
                    <span className="text-sm text-foreground-muted transition-colors hover:text-foreground cursor-pointer">
                      {l}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground-faint mb-5">
                Company
              </h4>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Contact"].map((l) => (
                  <li key={l}>
                    <span className="text-sm text-foreground-muted transition-colors hover:text-foreground cursor-pointer">
                      {l}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-foreground/5 pt-8 md:flex-row">
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
