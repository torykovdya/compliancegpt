# ComplianceGPT — Product Roadmap

## Legend

| Status | Description |
|---|---|
| ✅ | Done (in MVP) |
| 🚧 | In progress / planned for v1.1 |
| 📋 | Planned for v2.0+ |

---

## v1.0 — MVP (Current)

**Goal:** Prove the core concept — upload documents, get AI answers with citations.

| # | Feature | Status | Priority |
|---|---|---|---|
| 1 | Landing page (hero, features, CTA) | ✅ | Must |
| 2 | Auth (email/password via Supabase) | ✅ | Must |
| 3 | Document upload (TXT, MD, PDF) | ✅ | Must |
| 4 | Text extraction + chunking | ✅ | Must |
| 5 | Embeddings + pgvector storage | ✅ | Must |
| 6 | RAG chat (vector search + LLM) | ✅ | Must |
| 7 | Source citations in responses | ✅ | Must |
| 8 | Confidence scores (🟢🟡🔴) | ✅ | Must |
| 9 | Generative UI (policy cards, checklists) | ✅ | Must |
| 10 | AI Action (training request form) | ✅ | Must |
| 11 | Embeddable widget (iframe + script) | ✅ | Must |
| 12 | Pricing page (3 tiers) | ✅ | Must |

**Key decision:** Used DeepSeek API for cost optimization and OpenAI-compatible API.

---

## v1.1 — Polish & Reliability

**Goal:** Make the product production-ready for real users.

| # | Feature | Status | Priority |
|---|---|---|---|
| 1 | Demo mode (fallback when AI is unavailable) | 🚧 | High |
| 2 | Real vector search (replace hardcoded citations) | 🚧 | High |
| 3 | Human escalation button (contact compliance team) | 🚧 | High |
| 4 | Document management (list, delete, re-upload) | 🚧 | Medium |
| 5 | Loading states + error handling polish | 🚧 | Medium |
| 6 | Email notifications (training requests, etc.) | 📋 | Medium |
| 7 | Conversation history persistence | 📋 | Medium |
| 8 | Multi-language support (EN, RU, DE, FR) | 📋 | Medium |

---

## v2.0 — Scale

**Goal:** Turn MVP into a sellable SaaS product.

| # | Feature | Status | Priority |
|---|---|---|---|
| 1 | Stripe billing integration | 📋 | High |
| 2 | Multi-assistant per organization | 📋 | High |
| 3 | Knowledge Health Dashboard | 📋 | Medium |
| 4 | Document auto-sync (Notion, Confluence, Google Drive, SharePoint) | 📋 | Medium |
| 5 | Advanced analytics (usage, popular questions, gaps) | 📋 | Medium |
| 6 | Custom AI actions (workflow automation) | 📋 | Medium |

---

## v3.0 — Enterprise

**Goal:** Serve large organizations with compliance requirements.

| # | Feature | Status | Priority |
|---|---|---|---|
| 1 | SSO (SAML, OAuth) | 📋 | High |
| 2 | Audit logs (who asked what, when) | 📋 | High |
| 3 | Role-based access control | 📋 | Medium |
| 4 | On-premise deployment option | 📋 | Low |
| 5 | Custom model fine-tuning | 📋 | Low |

---

## Technical Debt

| Item | Description | Priority |
|---|---|---|
| Replace hardcoded citations with real RAG | Currently citations are simulated — need to implement actual vector search pipeline | High |
| Semantic chunking | Current chunking is paragraph-based — upgrade to semantic chunking for better retrieval | Medium |
| TypeScript strict mode | Currently disabled for build — need to fix type issues | Medium |
| Rate limiting | No rate limiting on API routes — needed for production | Medium |
| PDF parsing robustness | pdf-parse works for text PDFs — need fallback for scanned docs | Low |

---

## Timeline Estimate

| Phase | Duration | Target |
|---|---|---|
| v1.0 MVP | ✅ Done | June 2026 |
| v1.1 Polish | ~1 week | June 2026 |
| v2.0 Scale | ~2-3 weeks | July 2026 |
| v3.0 Enterprise | ~4-6 weeks | TBD |
