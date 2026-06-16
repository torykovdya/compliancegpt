# ComplianceGPT — Technical Architecture

## System Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│  Vercel CDN  │────▶│  TanStack   │
│  (React)    │     │  (SSR/SSG)   │     │   Start     │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                          ┌─────────────────────┼─────────────────────┐
                          │                     │                     │
                   ┌──────▼──────┐       ┌──────▼──────┐      ┌──────▼──────┐
                   │   Supabase  │       │   DeepSeek  │      │   Widget    │
                   │   (Auth +   │       │   (AI API)  │      │   (iframe)  │
                   │    DB)      │       │             │      │             │
                   └─────────────┘       └─────────────┘      └─────────────┘
```

---

## Frontend

### Framework: TanStack Start
- Server-side rendering with React
- File-based routing (`src/routes/`)
- Server functions for backend logic (no separate API layer)

### Key Routes
| Route | Description |
|---|---|
| `/` | Landing page |
| `/auth` | Sign up / Sign in |
| `/pricing` | Pricing plans |
| `/_authenticated/dashboard` | Main app (protected) |
| `/widget/:widgetKey` | Embeddable widget (iframe) |

### UI Components
- **shadcn/ui** — Radix UI primitives with Tailwind styling
- **lucide-react** — Icon library
- **sonner** — Toast notifications
- **Tailwind CSS** — Utility-first styling

---

## Backend

### Server Functions (TanStack Start)
Server functions replace traditional API routes — they run on the server but can be called from the client.

| Function | Location | Purpose |
|---|---|---|
| `sendMessage` | `src/lib/messages.functions.ts` | Chat endpoint — receives question, calls DeepSeek, returns answer |
| `uploadDocument` | `src/lib/documents.functions.ts` | File upload — extracts text, chunks, embeds, stores |
| `deleteDocument` | `src/lib/documents.functions.ts` | Delete document + chunks |
| `listDocuments` | `src/lib/documents.functions.ts` | List documents for assistant |

### Auth Middleware
```typescript
// src/routes/_authenticated/route.tsx
beforeLoad: async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw redirect({ to: "/auth" });
  return { user: data.user };
}
```

---

## Database (Supabase)

### Tables
| Table | Purpose |
|---|---|
| `organizations` | Companies (each user = one org in MVP) |
| `assistants` | AI Compliance Employees (one per org) |
| `documents` | Uploaded files (metadata + status) |
| `messages` | Chat messages (user + assistant) |

### Key Columns (messages table)
```sql
citations JSONB          -- [{ filename, section, confidence }]
confidence_score FLOAT   -- 0-100
ui_type TEXT             -- 'text', 'policy_card', 'checklist', 'action_form'
ui_data JSONB            -- structured data for generative UI
```

---

## AI Layer

### DeepSeek API
- **Model:** `deepseek-chat`
- **Embeddings:** deterministic hash-based vectors (1536 dim), no external API needed
- **Endpoint:** `https://api.deepseek.com/v1/chat/completions`

### Why direct fetch instead of AI SDK?
DeepSeek's API is OpenAI-compatible. Direct `fetch()` keeps the integration simple and avoids SDK version mismatches.

### Reasoning Model Handling
The LLM response is extracted and cleaned. If the model returns reasoning blocks, only the final answer is shown to the user.

---

## Generative UI

Instead of plain text, the AI can return structured UI components:

### Policy Card
```json
{
  "ui_type": "policy_card",
  "ui_data": {
    "title": "Security Requirements",
    "items": [
      { "label": "MFA Required", "checked": true },
      { "label": "VPN Required", "checked": true }
    ]
  }
}
```

### Checklist
```json
{
  "ui_type": "checklist",
  "ui_data": {
    "title": "Access Prerequisites",
    "items": [
      { "label": "Security Training", "checked": true },
      { "label": "Manager Approval", "checked": false }
    ]
  }
}
```

### Action Form
```json
{
  "ui_type": "action_form",
  "ui_data": {
    "action_type": "training_request",
    "fields": [
      { "name": "name", "label": "Full Name", "type": "text" },
      { "name": "department", "label": "Department", "type": "text" },
      { "name": "reason", "label": "Reason", "type": "textarea" }
    ]
  }
}
```

---

## Embeddable Widget

### How It Works
```html
<!-- Client embeds this on their site -->
<script src="https://your-app.com/widget.js" data-widget-key="UUID"></script>
```

The widget script:
1. Creates a floating chat button (bottom-right corner)
2. Opens an iframe pointing to `/widget/:widgetKey`
3. Uses `postMessage` for parent-iframe communication
4. Supports customization (color, position, greeting)

### Widget Features
- Floating launcher button (customizable position + color)
- Full chat interface inside iframe
- postMessage events for parent integration
- Isolated from host page styles (iframe sandbox)

---

## Deployment

### Vercel Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "functions": {
    "dist/server/server.js": {
      "runtime": "nodejs20.x",
      "maxDuration": 30
    }
  }
}
```

### Environment Variables
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-anon-key
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

---

## Key Files Reference

| File | Lines | Purpose |
|---|---|---|
| `src/routes/index.tsx` | ~250 | Landing page |
| `src/routes/_authenticated/dashboard.tsx` | ~350 | Main dashboard (chat + upload) |
| `src/lib/messages.functions.ts` | ~130 | Chat handler with DeepSeek |
| `src/lib/documents.functions.ts` | ~100 | Document upload pipeline |
| `public/widget.js` | ~140 | Embeddable widget loader |
| `src/integrations/supabase/client.ts` | ~10 | Supabase browser client |

---

## Known Limitations

1. **TypeScript** — strict mode disabled due to SDK version mismatches
2. **PDF parsing** — works for text-based PDFs, not scanned images
3. **No rate limiting** — API routes are unprotected
4. **Single assistant per org** — multi-assistant support planned for v2.0
5. **Mock billing** — pricing page exists but no Stripe integration yet
