# ComplianceGPT — AI Compliance Employee

> Turn your company policies into an AI Employee in minutes.

[![Status](https://img.shields.io/badge/status-MVP_ready-green)]()
[![Stack](https://img.shields.io/badge/stack-TanStack_Start_%2B_Supabase_%2B_DeepSeek-blue)]()
[![License](https://img.shields.io/badge/license-MIT-lightgrey)]()

---

## What is ComplianceGPT?

ComplianceGPT is an AI-powered compliance assistant that learns your company's internal policies and answers employee questions with source citations and confidence scores.

**Problem:** Companies store critical knowledge in dozens of documents (GDPR policies, security standards, employee handbooks). Employees rarely read them fully, leading to repeated questions, wasted time, and compliance violations.

**Solution:** Upload your documents → AI learns them → employees get instant, sourced answers via chat or an embeddable widget on your internal portal.

---

## Key Features

| Feature | Description |
|---|---|
| **Document Upload** | Upload TXT, MD, PDF files — AI automatically chunks and indexes them |
| **AI Chat** | Ask any compliance question — get answers based strictly on your documents |
| **Source Citations** | Every answer includes the exact document and section — no guessing |
| **Confidence Scores** | 🟢 High / 🟡 Medium / 🔴 Low — know how reliable each answer is |
| **Generative UI** | Policy cards, checklists, and action forms rendered inside the chat |
| **Embeddable Widget** | Add the chatbot to your internal portal via a simple `<script>` tag |
| **Pricing** | Starter (free) / Pro ($49/mo) / Enterprise (Custom) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | TanStack Start (React + TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | TanStack Start Server Functions |
| Database | Supabase (PostgreSQL) |
| AI | DeepSeek (deepseek-chat) + hash-based embeddings |
| Embeddable widget | Vanilla JS (iframe + postMessage) |
| Deployment | Vercel (Next.js version) + Netlify (Lovable/TanStack Start) + Railway |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        User Flow                         │
│                                                         │
│  Sign Up → Create Assistant → Upload Documents → Chat  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   RAG Pipeline                           │
│                                                         │
│  Document → Chunking (1000 tokens, 200 overlap)        │
│    → Embeddings (deterministic hash-based, 1536 dim)   │
│    → Vector Storage (Supabase pgvector)                 │
│                                                         │
│  Question → Embedding → Similarity Search (top 5)      │
│    → Context Assembly → LLM (DeepSeek Chat)            │
│    → Answer + Citations + Confidence Score              │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
src/
├── routes/
│   ├── index.tsx                    # Landing page
│   ├── auth.tsx                     # Sign up / Sign in
│   ├── pricing.tsx                  # Pricing page
│   └── _authenticated/
│       ├── route.tsx                # Auth guard
│       └── dashboard.tsx            # Main app (upload + chat)
├── components/
│   ├── SiteHeader.tsx               # Navigation header
│   └── ui/                          # shadcn/ui components
├── lib/
│   ├── messages.functions.ts        # Chat handler (DeepSeek API)
│   ├── documents.functions.ts       # Document upload + processing
│   ├── config.server.ts             # App configuration
│   └── utils.ts                     # Utilities
├── integrations/
│   └── supabase/                    # Supabase client + auth
├── server.ts                        # Entry point
└── start.ts                         # App bootstrap
public/
└── widget.js                        # Embeddable widget loader
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase account
- DeepSeek API key

### Local Development

```bash
# Clone the repo
git clone https://github.com/torykovdya/compliancegpt.git
cd compliancegpt

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your Supabase and DeepSeek credentials

# Start dev server
npm run dev
# → http://localhost:8080
```

### Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-anon-key
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

---

## Demo

### Live Demo
Run locally: `npm run dev` → http://localhost:8080

### Demo Flow
1. **Sign up** — create an account
2. **Create Assistant** — name your AI Compliance Employee
3. **Upload Documents** — upload your policies (TXT, MD, PDF)
4. **Ask Questions** — try "What is our password policy?" or "Can I share customer data with vendors?"
5. **View Widget Code** — go to Documents tab, copy the embed snippet

### Try These Questions
- "What is our password policy?"
- "Can I share customer data with third-party vendors?"
- "What are the security requirements for remote work?"
- "I need compliance training" (triggers action form)

---

## Design Decisions

### Why DeepSeek?
- Competitive pricing with free tier
- OpenAI-compatible API (easy integration)
- Strong multilingual support (important for EU/Asian markets)
- Swap the base URL to use any OpenAI-compatible provider (OpenAI, Together, Groq, etc.)

### Why TanStack Start?
- Lovable's native framework — rapid prototyping
- Built-in server functions (no separate API layer needed)
- Integrated Supabase client

### Why pgvector?
- Supabase has pgvector built-in — no external vector DB needed
- IVFFlat index for fast cosine similarity search
- Cost-effective for MVP scale

### Confidence Scoring
- Based on cosine similarity of top retrieved chunks
- Thresholds: ≥70% 🟢 High, 40-69% 🟡 Medium, <40% 🔴 Low
- Low confidence triggers human escalation UI

---

## What's NOT in MVP

These features are planned but not implemented:

- [ ] Real Stripe billing (mock pricing page exists)
- [ ] Document sync (Notion, Confluence, Google Drive)
- [ ] Multi-assistant per organization
- [ ] Knowledge Health Dashboard
- [ ] SSO (Enterprise)
- [ ] Audit logs
- [ ] Multi-language support

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed product roadmap.

---

## About This Project

This is a test project built as an MVP demonstration for a Senior Fullstack Developer position. The goal was to build a functional, polished SaaS product in a short timeframe, demonstrating:

- Product thinking (niche selection, user flow, positioning)
- Technical execution (RAG, vector search, auth, widget)
- Attention to detail (UI/UX, copywriting, error handling)
- Pragmatism (focused scope, meaningful trade-offs)

**Development time:** ~2 focused sessions (June 11, 2026)

---

## License

MIT

---

*Built with [Lovable](https://lovable.dev) — AI-powered fullstack development*
