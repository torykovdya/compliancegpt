import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — ComplianceGPT" },
      {
        name: "description",
        content: "What we're building next at ComplianceGPT — transparency on our product roadmap.",
      },
    ],
  }),
  component: Roadmap,
});

const milestones = [
  {
    quarter: "Q2 2026",
    status: "completed",
    items: [
      "MVP launch — chat + document upload",
      "pgvector RAG pipeline with DeepSeek",
      "Cited answers with confidence scoring",
      "Human escalation workflow",
      "Embeddable widget (script tag + iframe)",
      "Supabase auth + row-level security",
      "Railway deployment (Nitro node-server)",
      "Glassmorphism redesign v2",
    ],
  },
  {
    quarter: "Q3 2026",
    status: "in-progress",
    items: [
      "Stripe billing integration (test mode)",
      "10+ compliance frameworks fine-tuning",
      "Multi-language support (EN, DE, FR, ES)",
      "Conversation history export (PDF, JSON)",
      "Admin dashboard — usage analytics",
      "Team collaboration (shared workspaces)",
    ],
  },
  {
    quarter: "Q4 2026",
    status: "planned",
    items: [
      "Custom framework upload (train on proprietary standards)",
      "API access for programmatic document ingestion",
      "Slack / Teams integration",
      "On-premise deployment option (Docker)",
      "SOC 2 Type II certification",
      "Custom model fine-tuning per organization",
    ],
  },
];

function Roadmap() {
  return (
    <div className="min-h-screen sky-gradient">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 pt-28 pb-20 md:pt-36 md:pb-28">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Product roadmap
          </h1>
          <p className="mt-5 text-lg text-foreground-muted leading-relaxed">
            We're building ComplianceGPT in public. Here's what shipped, what's coming next,
            and where we're headed long-term.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <span className="flex items-center gap-2 text-foreground-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Completed
            </span>
            <span className="flex items-center gap-2 text-foreground-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" /> In progress
            </span>
            <span className="flex items-center gap-2 text-foreground-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Planned
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-foreground/10 md:-translate-x-px" />

          {milestones.map((milestone, mi) => (
            <div key={milestone.quarter} className="relative mb-16 last:mb-0">
              {/* Quarter label */}
              <div className={`flex items-center gap-4 mb-8 ${mi % 2 === 0 ? "md:justify-start" : "md:justify-end"}`}>
                <div className="md:w-1/2" />
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2">
                  <div className={`h-4 w-4 rounded-full border-2 ${
                    milestone.status === "completed"
                      ? "bg-green-500 border-green-500"
                      : milestone.status === "in-progress"
                        ? "bg-blue-500 border-blue-500"
                        : "bg-white border-slate-300"
                  }`}>
                    {milestone.status === "completed" && (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    )}
                    {milestone.status === "in-progress" && (
                      <Loader2 className="h-3 w-3 text-white animate-spin" />
                    )}
                  </div>
                </div>
              </div>

              {/* Card */}
              <div className={`glass-card rounded-3xl p-8 md:w-1/2 ${mi % 2 === 0 ? "md:mr-auto md:pr-12" : "md:ml-auto md:pl-12"}`}>
                <div className="flex items-center gap-3 mb-5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    milestone.status === "completed"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : milestone.status === "in-progress"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}>
                    {milestone.quarter}
                  </span>
                  <span className="text-xs text-foreground-faint capitalize">
                    {milestone.status === "in-progress" ? "In progress" : milestone.status}
                  </span>
                </div>

                <ul className="space-y-3">
                  {milestone.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      {milestone.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500 mt-0.5" />
                      ) : milestone.status === "in-progress" ? (
                        <Loader2 className="h-4 w-4 flex-shrink-0 text-blue-500 mt-0.5 animate-spin" />
                      ) : (
                        <Circle className="h-4 w-4 flex-shrink-0 text-slate-300 mt-0.5" />
                      )}
                      <span className={milestone.status === "completed" ? "text-foreground" : "text-foreground-muted"}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mx-auto max-w-2xl text-center mt-20">
          <div className="glass-card rounded-3xl px-8 py-12">
            <h2 className="text-2xl font-bold text-foreground">
              Want to influence the roadmap?
            </h2>
            <p className="mt-3 text-sm text-foreground-muted">
              We prioritize features based on user feedback. Drop us a line with your use case.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="btn-lift rounded-full px-6 h-11 text-sm font-semibold">
                <Link to="/auth">Try the product</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="btn-lift rounded-full px-6 h-11 text-sm font-semibold glass-strong">
                <a href="mailto:hello@compliancegpt.com">Contact us</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="section-divider pb-10 pt-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Link to="/" className="flex items-center gap-2.5 font-semibold text-sm tracking-tight text-foreground">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span>ComplianceGPT</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link to="/" className="text-sm text-foreground-muted hover:text-foreground transition-colors">Home</Link>
              <Link to="/pricing" className="text-sm text-foreground-muted hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/roadmap" className="text-sm text-foreground hover:text-foreground transition-colors">Roadmap</Link>
              <Link to="/auth" className="text-sm text-foreground-muted hover:text-foreground transition-colors">Sign in</Link>
            </div>
            <p className="text-xs text-foreground-faint">
              © {new Date().getFullYear()} ComplianceGPT
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
