import { createServerFn } from "@tanstack/react-start";
import { getEmbeddings } from "@/lib/embeddings";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ─── Text extraction ───────────────────────────────────────────────

async function extractTextFromFile(buffer: Buffer, mimeType: string | null): Promise<string> {
  const ext = mimeType?.split("/").pop() || "";

  if (ext === "pdf" || mimeType === "application/pdf") {
    // Server-side PDF extraction
    const pdfParse = await import("pdf-parse");
    const data = await pdfParse.default(buffer);
    if (!data.text || data.text.trim().length === 0) {
      throw new Error("Could not extract text from PDF. The file may be scanned or image-based.");
    }
    return data.text.trim();
  }

  if (ext === "txt" || mimeType === "text/plain") {
    return buffer.toString("utf-8");
  }

  if (ext === "md" || ext === "markdown" || mimeType === "text/markdown") {
    const text = buffer.toString("utf-8");
    return text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ""))
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
      .replace(/^\s*[-*+]\s/gm, "")
      .replace(/^\s*\d+\.\s/gm, "")
      .replace(/^---$/gm, "")
      .replace(/^\s*>/gm, "")
      .trim();
  }

  throw new Error(`Unsupported file type: ${mimeType || ext}. Supported: PDF, TXT, MD`);
}

// ─── Chunking ──────────────────────────────────────────────────────

interface Chunk {
  content: string;
  index: number;
  metadata: {
    chunkSize: number;
    section?: string;
  };
}

function chunkText(text: string, options: { chunkSize?: number; overlap?: number } = {}): Chunk[] {
  const { chunkSize = 1000, overlap = 200 } = options;
  const chunks: Chunk[] = [];

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const testChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;

    if (testChunk.length <= chunkSize) {
      currentChunk = testChunk;
    } else {
      if (currentChunk) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
          metadata: { chunkSize: currentChunk.length },
        });
      }

      if (paragraph.length > chunkSize) {
        // Split large paragraph into smaller pieces
        const subChunks = splitLargeParagraph(paragraph, chunkSize, overlap);
        for (const sub of subChunks) {
          chunks.push({
            content: sub,
            index: chunkIndex++,
            metadata: { chunkSize: sub.length },
          });
        }
        currentChunk = "";
      } else {
        currentChunk = paragraph;
      }
    }
  }

  if (currentChunk) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex++,
      metadata: { chunkSize: currentChunk.length },
    });
  }

  return chunks;
}

function splitLargeParagraph(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);
    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks.filter((c) => c.length > 0);
}

// ─── Embeddings ────────────────────────────────────────────────────
// Uses shared hash-based embedding utility (no external API).


// ─── Server Functions ──────────────────────────────────────────────

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("documents")
      .select("id, name, size_bytes, mime_type, created_at, storage_path")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const recordDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().min(1).max(300),
        storage_path: z.string().min(1).max(500),
        size_bytes: z.number().int().nonnegative().nullable().optional(),
        mime_type: z.string().max(150).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: inserted, error } = await context.supabase
      .from("documents")
      .insert({
        user_id: context.userId,
        name: data.name,
        storage_path: data.storage_path,
        size_bytes: data.size_bytes ?? null,
        mime_type: data.mime_type ?? null,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: doc, error: fetchErr } = await context.supabase
      .from("documents")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);

    // Delete chunks first
    const { error: chunksErr } = await context.supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", data.id);
    if (chunksErr) throw new Error(chunksErr.message);

    // Delete file from storage
    if (doc?.storage_path) {
      await context.supabase.storage.from("documents").remove([doc.storage_path]);
    }

    // Delete document record
    const { error } = await context.supabase.from("documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── RAG: Process document (extract → chunk → embed → store) ──────

export const processDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Get document record
    const { data: doc, error: docErr } = await context.supabase
      .from("documents")
      .select("id, name, storage_path, mime_type")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (docErr || !doc) throw new Error("Document not found");

    // Download file from storage
    const { data: fileData, error: downloadErr } = await context.supabase.storage
      .from("documents")
      .download(doc.storage_path);

    if (downloadErr || !fileData) {
      throw new Error(`Failed to download file: ${downloadErr?.message || "Unknown error"}`);
    }

    // Extract text
    const buffer = Buffer.from(await fileData.arrayBuffer());
    let text: string;
    try {
      text = await extractTextFromFile(buffer, doc.mime_type);
    } catch (err: any) {
      // Mark document as failed
      await context.supabase
        .from("documents")
        .update({ name: `${doc.name} (extraction failed)` })
        .eq("id", doc.id);
      throw new Error(`Text extraction failed: ${err.message}`);
    }

    if (text.trim().length < 10) {
      throw new Error("Document appears to be empty or could not be read.");
    }

    // Chunk text
    const chunks = chunkText(text, { chunkSize: 1000, overlap: 200 });
    if (chunks.length === 0) {
      throw new Error("No text content found after chunking.");
    }

    // Generate embeddings in batches of 50
    const BATCH_SIZE = 50;
    let totalChunks = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => c.content);

      try {
        const embeddings = await getEmbeddings(texts);

        const rows = embeddings.map((embedding, idx) => ({
          document_id: doc.id,
          content: batch[idx].content,
          metadata: {
            filename: doc.name,
            chunk_index: batch[idx].index,
            total_chunks: chunks.length,
            chunk_size: batch[idx].metadata.chunkSize,
          },
          embedding,
        }));

        const { error: insertErr } = await context.supabase
          .from("document_chunks")
          .insert(rows);

        if (insertErr) throw new Error(`Failed to store chunks: ${insertErr.message}`);
        totalChunks += rows.length;
      } catch (err: any) {
        throw new Error(`Embedding failed at batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err.message}`);
      }
    }

    // Update document status
    await context.supabase
      .from("documents")
      .update({ name: doc.name }) // Could add chunk_count column later
      .eq("id", doc.id);

    return { ok: true, chunksIndexed: totalChunks };
  });