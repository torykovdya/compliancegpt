import { createServerFn } from "@tanstack/react-start";
import { getEmbeddings } from "@/lib/embeddings";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ─── User-facing error (never leaks internal details) ─────────────

function safeError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    // Map internal errors to safe messages
    if (msg.includes("timeout") || msg.includes("timed out")) return "The request took too long. Please try again.";
    if (msg.includes("network") || msg.includes("fetch") || msg.includes("econnreset"))
      return "Network error. Please check your connection and retry.";
    if (msg.includes("429") || msg.includes("rate limit"))
      return "Too many requests. Please wait a moment and try again.";
    if (msg.includes("401") || msg.includes("403") || msg.includes("api key"))
      return "AI service configuration error. Please contact support.";
    if (msg.includes("500") || msg.includes("502") || msg.includes("503"))
      return "AI service temporarily unavailable. Please try again in a moment.";
    // For everything else, return a generic message — never expose raw DB/API errors
    return fallback;
  }
  return fallback;
}

// ─── Demo mode response (when LLM is unavailable) ──────────────────

function generateDemoResponse(
  question: string,
  chunks: any[],
  citations: any[],
  confidence: number,
): string {
  const q = question.toLowerCase();

  // Extract most relevant chunk content
  const topChunk = chunks[0];
  const relevantText = topChunk?.content?.slice(0, 600) || "";

  // Keyword-based answer templates
  const templates: Record<string, string> = {
    remote: "Based on the company's Remote Work Policy:\n\n${text}",
    password: "According to the Information Security Policy:\n\n${text}",
    security: "Per the Information Security Policy:\n\n${text}",
    data: "The Data Classification Policy states:\n\n${text}",
    incident: "Regarding incident reporting:\n\n${text}",
    training: "Based on available documents:\n\n${text}",
    policy: "From the uploaded policies:\n\n${text}",
    leave: "The uploaded documents don't contain information about leave policies. Please contact HR directly for this question.",
    parent: "The uploaded documents don't contain information about parental leave. Please contact HR directly.",
    ai_tools: "The uploaded documents don't specify a policy on AI tools. Please contact the compliance team for clarification.",
  };

  // Find matching template
  let answer = "";
  for (const [keyword, template] of Object.entries(templates)) {
    if (q.includes(keyword)) {
      answer = template.replace("${text}", relevantText);
      break;
    }
  }

  // Default: show top relevant excerpt
  if (!answer) {
    answer = `Based on the uploaded documents, here's what I found relevant to your question:\n\n${relevantText}\n\nFor more details, please refer to the full document or contact the compliance team.`;
  }

  // Add disclaimer
  answer += "\n\n---\n*Note: This is a demo response. Full AI-powered answers require a configured LLM API.*";

  return answer;
}

// ─── List messages ────────────────────────────────────────────────

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("messages")
      .select("id, role, content, created_at, citations, confidence_score, ui_type, ui_data")
      .order("created_at", { ascending: true });

    if (error) throw new Error("Failed to load conversation.");
    return data ?? [];
  });

// ─── Clear messages ───────────────────────────────────────────────

export const clearMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("messages")
      .delete()
      .eq("user_id", context.userId);

    if (error) throw new Error("Failed to clear conversation.");
    return { ok: true };
  });

// ─── Core RAG logic (used by both sendMessage and widget) ──────────

export async function processMessageCore(
  supabaseClient: any,
  userId: string,
  input: { content: string; assistantId?: string; widgetKey?: string },
): Promise<{ content: string; citations: any[]; confidenceScore: number }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseURL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

  if (!apiKey) {
    throw new Error("AI service not configured. Please contact support.");
  }

  // Save user message
  const { error: userErr } = await supabaseClient.from("messages").insert({
    user_id: userId,
    role: "user",
    content: input.content,
  });
  if (userErr) throw new Error("Failed to save message.");

  // Load history
  const { data: history } = await supabaseClient
    .from("messages")
    .select("role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(50);

  // Embed
  let queryEmbedding: number[] = [];
  try {
    queryEmbedding = await getEmbeddings([input.content]);
    queryEmbedding = queryEmbedding[0] ?? [];
  } catch { /* fallback */ }

  // Vector search
  let chunks: any[] = [];
  if (queryEmbedding.length > 0) {
    const { data: searchResults } = await supabaseClient.rpc(
      "match_document_chunks",
      {
        query_embedding: queryEmbedding,
        match_user_id: input.widgetKey ? null : userId,
        match_threshold: 0.25,
        match_count: 5,
        match_widget_key: input.widgetKey || null,
      },
    );
    chunks = searchResults ?? [];
  }

  // Build context
  let confidenceScore = 0;
  let citations: any[] = [];
  let contextText = "";

  if (chunks.length > 0) {
    const top3 = chunks.slice(0, 3);
    confidenceScore = Math.round(
      (top3.reduce((s: number, c: any) => s + c.similarity, 0) / top3.length) * 100,
    );
    contextText = chunks
      .filter((c: any) => c.similarity > 0.25)
      .map((c: any) => `[Source: ${c.metadata?.filename || "Unknown"}]\n${c.content}`)
      .join("\n\n---\n\n");
    citations = chunks
      .filter((c: any) => c.similarity > 0.25)
      .slice(0, 3)
      .map((c: any) => ({
        filename: c.metadata?.filename || "Unknown",
        section: c.metadata?.chunk_index ? `Chunk ${c.metadata.chunk_index}` : undefined,
        confidence: Math.round(c.similarity * 100),
      }));
  }

  // Build prompt
  const systemPrompt = chunks.length > 0
    ? `You are ComplianceGPT, an AI Compliance Employee. Answer the user's question based STRICTLY on the provided company documents below.

DOCUMENT CONTEXT:
${contextText}`
    : "You are ComplianceGPT. No documents uploaded yet. Tell the user to upload policies.";

  // Call LLM
  let assistantText: string;
  try {
    const chatResp = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          ...(history ?? []).map((m) => ({
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
          })),
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!chatResp.ok) {
      const status = chatResp.status;
      if (status === 429) throw new Error("rate limit");
      if (status >= 500) throw new Error("server error");
      throw new Error(`AI service error ${status}`);
    }

    const rawText = await chatResp.text();
    const data = JSON.parse(rawText);
    const message = data.choices?.[0]?.message;
    assistantText = message?.content?.trim() || "";

    if (!assistantText) throw new Error("Empty response");
  } catch (err: any) {
    console.error("LLM failed:", err.message);
    assistantText = contextText
      ? generateDemoResponse(input.content, chunks, citations, confidenceScore)
      : "I don't have access to your company documents yet. Please upload your policies.";
  }

  // Save assistant message
  await supabaseClient.from("messages").insert({
    user_id: userId,
    role: "assistant",
    content: assistantText,
    citations,
    confidence_score: confidenceScore,
  });

  return { content: assistantText, citations, confidenceScore };
}


// ─── Send message (authenticated, RAG pipeline) ─────────────────────

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({
      content: z.string().min(1).max(8000),
      userId: z.string().optional(),
      assistantId: z.string().uuid().optional(),
      history: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
      widgetKey: z.string().uuid().optional(),
    }).parse(d),
  )
  .handler(async ({ data: input, context }) => {
    const userId = input.userId || context.userId;
    return processMessageCore(context.supabase, userId, input);
  });

