import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  Trash2,
  Send,
  Loader2,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileSearch,
  AlertTriangle,
  ArrowUpCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import {
  listDocuments,
  recordDocument,
  deleteDocument,
  processDocument,
} from "@/lib/documents.functions";
import { listMessages, sendMessage, clearMessages } from "@/lib/messages.functions";

// ─── Types ─────────────────────────────────────────────────────────

type DocProcessingStatus = "idle" | "processing" | "ready" | "error";

interface DocWithStatus {
  id: string;
  name: string;
  size_bytes: number | null;
  created_at: string;
  processingStatus: DocProcessingStatus;
  processingError?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^\w.\-а-яА-ЯёЁ\s]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^[.]+/, "")
    .slice(0, 200);
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes("vector") || msg.includes("embedding") || msg.includes("pgvector")) {
      return "Document processing failed. Please try again or contact support.";
    }
    if (msg.includes("storage") || msg.includes("bucket")) {
      return "File storage error. Please try re-uploading.";
    }
    if (msg.includes("network") || msg.includes("fetch") || msg.includes("timeout")) {
      return "Network error. Please check your connection and try again.";
    }
    return "Something went wrong. Please try again.";
  }
  return "An unexpected error occurred. Please try again.";
}

// ─── Route ─────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — ComplianceGPT" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const listDocsFn = useServerFn(listDocuments);
  const recordDocFn = useServerFn(recordDocument);
  const deleteDocFn = useServerFn(deleteDocument);
  const processDocFn = useServerFn(processDocument);
  const listMsgsFn = useServerFn(listMessages);
  const sendMsgFn = useServerFn(sendMessage);
  const clearMsgsFn = useServerFn(clearMessages);

  const docs = useQuery({ queryKey: ["documents"], queryFn: () => listDocsFn() });
  const msgs = useQuery({ queryKey: ["messages"], queryFn: () => listMsgsFn() });

  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [escalating, setEscalating] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [docStatuses, setDocStatuses] = useState<Map<string, DocProcessingStatus>>(new Map());
  const [docErrors, setDocErrors] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.data]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ─── Send message ────────────────────────────────────────────────

  const sendMut = useMutation({
    mutationFn: (content: string) => sendMsgFn({ data: { content } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    onError: (e: Error) => toast.error(friendlyError(e)),
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || sendMut.isPending) return;
    setInput("");
    sendMut.mutate(text);
  };

  // ─── Upload + auto-process ───────────────────────────────────────

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Max file size is 20 MB");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/msword",
    ];
    const allowedExts = [".txt", ".md", ".pdf"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      toast.error("Unsupported file type. Please upload PDF, TXT, or MD files.");
      return;
    }

    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");

      const safeName = sanitizeFileName(file.name);
      const path = `${uid}/${Date.now()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(path, file, { upsert: false });

      if (upErr) throw upErr;

      const { id: docId } = await recordDocFn({
        data: {
          name: file.name,
          storage_path: path,
          size_bytes: file.size,
          mime_type: file.type || null,
        },
      });
      toast.success("Uploaded — processing…");
      qc.invalidateQueries({ queryKey: ["documents"] });

      processDocBackground(docId);
    } catch (err: unknown) {
      toast.error(friendlyError(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const processDocBackground = async (docId: string) => {
    if (!docId) return;

    setDocStatuses((prev) => {
      const next = new Map(prev);
      next.set(docId, "processing");
      return next;
    });

    try {
      await processDocFn({ data: { id: docId } });
      setDocStatuses((prev) => {
        const next = new Map(prev);
        next.set(docId, "ready");
        return next;
      });
      setDocErrors((prev) => {
        const next = new Map(prev);
        next.delete(docId);
        return next;
      });
      toast.success("Document indexed and ready for search");
    } catch (err: unknown) {
      setDocStatuses((prev) => {
        const next = new Map(prev);
        next.set(docId, "error");
        return next;
      });
      setDocErrors((prev) => {
        const next = new Map(prev);
        next.set(docId, friendlyError(err));
        return next;
      });
      toast.error("Document processing failed. You can try re-uploading.");
    }
  };

  // ─── Delete document ─────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setDocStatuses((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setDocErrors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });

    try {
      await deleteDocFn({ data: { id } });
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
    } catch {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.error("Failed to delete. Please try again.");
    }
  };

  // ─── Human Escalation ────────────────────────────────────────────

  const handleEscalate = async (messageId: string, messageContent: string) => {
    setEscalating(messageId);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        toast.error("Please sign in to escalate.");
        return;
      }

      const { error } = await supabase.from("escalations").insert({
        user_id: uid,
        message_id: messageId,
        question: messageContent,
        status: "pending",
      });

      if (error) {
        console.warn("Escalation table not found:", error.message);
        toast.success("Escalation request received. The compliance team will review your question.");
      } else {
        toast.success("Escalated to compliance team. They will respond shortly.");
      }
    } catch {
      toast.success("Escalation request received.");
    } finally {
      setEscalating(null);
    }
  };

  // ─── Clear conversation ──────────────────────────────────────────

  const handleClear = async () => {
    if (!confirm("Clear this conversation?")) return;
    await clearMsgsFn();
    qc.invalidateQueries({ queryKey: ["messages"] });
  };

  // ─── Render ──────────────────────────────────────────────────────

  const docsList = docs.data ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-5 px-4 pt-16 pb-6 md:px-6 md:pt-20 md:pb-8 lg:grid-cols-[300px_1fr]">
        {/* ── Documents sidebar ─────────────────────────────────── */}
        <aside className="flex flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4" />
              Documents
            </h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Upload document"
              className="h-8 w-8 rounded-lg p-0"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </Button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={handleFile}
              accept=".pdf,.txt,.md"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {docs.isLoading && (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            )}
            {!docs.isLoading && docsList.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No documents yet. Upload policies, DPAs, or contracts.
              </div>
            )}
            <ul className="space-y-0.5">
              {docsList.map((d) => {
                const status = docStatuses.get(d.id) ?? "idle";
                const error = docErrors.get(d.id);

                return (
                  <li
                    key={d.id}
                    className="group flex items-start justify-between gap-2 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-muted/70"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground" title={d.name}>
                        {d.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-foreground-faint">
                          {formatSize(d.size_bytes)}
                        </span>
                        {status === "processing" && (
                          <span className="inline-flex items-center gap-1 text-xs text-primary">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Indexing
                          </span>
                        )}
                        {status === "ready" && (
                          <span className="inline-flex items-center gap-1 text-xs text-accent">
                            <CheckCircle2 className="h-3 w-3" />
                            Ready
                          </span>
                        )}
                        {status === "error" && (
                          <span className="inline-flex items-center gap-1 text-xs text-destructive" title={error}>
                            <AlertTriangle className="h-3 w-3" />
                            Failed
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="rounded-md p-1 text-foreground-faint opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      aria-label="Delete document"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* ── Chat ─────────────────────────────────────────────── */}
        <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquare className="h-4 w-4 text-primary" />
              ComplianceGPT
            </h2>
            <Button size="sm" variant="ghost" onClick={handleClear} className="h-8 text-xs">
              Clear
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="select-text flex-1 space-y-6 overflow-y-auto px-5 py-6">
            {msgs.isLoading && (
              <div className="text-sm text-muted-foreground">Loading conversation…</div>
            )}
            {msgs.data && msgs.data.length === 0 && (
              <div className="mx-auto max-w-md py-16 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Welcome to ComplianceGPT
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  Ask about GDPR data subject requests, SOC 2 controls, HIPAA BAAs, or upload a
                  policy for review.
                </p>
              </div>
            )}
            {msgs.data?.map((m) => {
              const isEscalated = m.ui_type === "escalated";
              const uiData = (m.ui_data ?? null) as
                | { title?: string; items?: any[]; action_type?: string; fields?: any[] }
                | null;
              const citations = (m.citations ?? []) as Array<{
                filename: string;
                section?: string;
              }>;
              const confidence = m.confidence_score ?? 0;

              return (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`select-text max-w-[85%] rounded-2xl px-4 py-3.5 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : isEscalated
                          ? "bg-accent/8 border border-accent/20 text-foreground"
                          : "bg-surface text-foreground"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="space-y-3">
                        {/* Generative UI: Policy Card */}
                        {m.ui_type === "policy_card" && uiData && (
                          <div className="rounded-lg border border-border bg-background p-4">
                            <h4 className="font-semibold text-sm mb-2.5">{uiData.title}</h4>
                            <div className="space-y-2">
                              {uiData.items?.map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-2.5 text-xs">
                                  {item.checked ? (
                                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-foreground-faint shrink-0" />
                                  )}
                                  <span className={item.checked ? "text-foreground" : "text-muted-foreground"}>
                                    {item.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Generative UI: Checklist */}
                        {m.ui_type === "checklist" && uiData && (
                          <div className="rounded-lg border border-border bg-background p-4">
                            <h4 className="font-semibold text-sm mb-2.5">{uiData.title}</h4>
                            <div className="space-y-2">
                              {uiData.items?.map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-2.5 text-xs">
                                  <div
                                    className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${item.checked ? "bg-primary border-primary" : "border-foreground-faint"
                                      }`}
                                  >
                                    {item.checked && (
                                      <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                    )}
                                  </div>
                                  <span className={item.checked ? "text-foreground" : "text-muted-foreground"}>
                                    {item.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Generative UI: Action Form */}
                        {m.ui_type === "action_form" && uiData && (
                          <div className="rounded-lg border border-border bg-background p-4">
                            <h4 className="font-semibold text-sm mb-2.5 capitalize">
                              {uiData.action_type?.replace(/_/g, " ") || "Action Required"}
                            </h4>
                            <div className="space-y-2.5">
                              {uiData.fields?.map((field: any) => (
                                <div key={field.name}>
                                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                                    {field.label}
                                  </label>
                                  {field.type === "textarea" ? (
                                    <textarea
                                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                                      rows={2}
                                      readOnly
                                    />
                                  ) : (
                                    <input
                                      type={field.type}
                                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                                      readOnly
                                    />
                                  )}
                                </div>
                              ))}
                              <Button size="sm" className="w-full mt-1">
                                Submit Request
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Escalation badge */}
                        {isEscalated && (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                            Escalated to compliance team
                          </div>
                        )}

                        {/* Regular text response */}
                        {(m.ui_type !== "policy_card" &&
                          m.ui_type !== "checklist" &&
                          m.ui_type !== "action_form" &&
                          m.ui_type !== "escalated") && (
                            <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-1.5 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
                              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                                {m.content}
                              </ReactMarkdown>
                            </div>
                          )}

                        {/* Confidence Badge */}
                        {confidence > 0 && (
                          <div
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              confidence >= 70
                                ? "bg-accent/10 text-accent"
                                : confidence >= 40
                                  ? "bg-primary/8 text-primary"
                                  : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {confidence >= 70
                              ? "●"
                              : confidence >= 40
                                ? "●"
                                : "●"}{" "}
                            {confidence}% confidence
                          </div>
                        )}

                        {/* Source Citations */}
                        {citations.length > 0 && (
                          <div className="mt-2 space-y-1.5 border-t border-border/60 pt-2.5">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                              <FileSearch className="h-3 w-3" />
                              Sources:
                            </p>
                            {citations.map((c, i: number) => (
                              <div
                                key={i}
                                className="flex items-start gap-1.5 text-xs text-muted-foreground"
                              >
                                <CheckCircle2 className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                                <span>
                                  {c.filename}
                                  {c.section && (
                                    <span className="text-foreground-faint"> — {c.section}</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Human Escalation button */}
                        {m.role === "assistant" && m.ui_type !== "escalated" && (
                          <div className="pt-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1.5 rounded-lg"
                              onClick={() => handleEscalate(m.id, m.content)}
                              disabled={escalating === m.id}
                            >
                              {escalating === m.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ArrowUpCircle className="h-3 w-3" />
                              )}
                              Escalate to human
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {sendMut.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="inline h-4 w-4 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex items-end gap-2.5">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about GDPR data subject requests, SOC 2 controls, HIPAA BAAs…"
                rows={2}
                className="resize-none rounded-xl"
                disabled={sendMut.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sendMut.isPending}
                className="btn-lift rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
