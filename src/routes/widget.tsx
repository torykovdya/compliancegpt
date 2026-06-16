import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Loader2,
  Sparkles,
  ArrowUpCircle,
  FileSearch,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { sendWidgetMessage } from "@/lib/widget.server";

// ─── Types ──────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant" | "action";
  content: string;
  citations?: Array<{ filename: string; section?: string }>;
  confidence_score?: number;
  ui_type?: string;
  ui_data?: any;
  created_at: string;
}

// ─── Component ──────────────────────────────────────────────────────

function WidgetChat() {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get widget_key from URL
  const widgetKey = Route.useSearch<{ key?: string }>().key;
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [assistantName, setAssistantName] = useState("ComplianceGPT");
  const [loading, setLoading] = useState(true);

  // Resolve widget_key → assistant (via RPC to bypass RLS)
  useEffect(() => {
    if (!widgetKey) {
      setLoading(false);
      return;
    }
    supabase
      .rpc("get_assistant_by_widget_key", { p_widget_key: widgetKey })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAssistantId(data[0].id);
          setAssistantName(data[0].name || "ComplianceGPT");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [widgetKey]);

  // Load messages for this assistant (via conversation)
  const { data: messages } = useQuery({
    queryKey: ["widget-messages", assistantId],
    queryFn: async () => {
      if (!assistantId) return [];
      // Get or create conversation for this widget session
      const sessionId = sessionStorage.getItem("widget_session") || crypto.randomUUID();
      sessionStorage.setItem("widget_session", sessionId);

      // Load messages via RPC (bypasses RLS for widget)
      const { data, error } = await supabase
        .rpc("get_widget_messages", { p_user_id: `widget:${widgetKey}` });

      if (error) return [];
      return (data || []) as Message[];
    },
    enabled: !!assistantId,
    refetchInterval: 2000, // Poll for new messages
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!assistantId || !widgetKey) throw new Error("No assistant configured");

      const sendFn = useServerFn(sendWidgetMessage);
      const result = await sendFn({
        data: {
          content,
          widgetKey,
        },
      });

      return result;
    },
    onError: (e: Error) => {
      console.error("Widget send error:", e.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widget-messages", assistantId] });
    },
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Notify parent when opened
  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "widget:opened", name: assistantName }, "*");
    }
  }, [assistantName]);

  const handleSubmit = () => {
    if (!input.trim() || sendMutation.isPending) return;
    const text = input.trim();
    setInput("");
    sendMutation.mutate(text);
  };

  // Handle messages from parent (open/close)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "widget:close") {
        // Parent requested close - could auto-close iframe
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!assistantId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Invalid widget configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {assistantName}
        </h2>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {(!messages || messages.length === 0) && (
          <div className="mx-auto max-w-sm py-8 text-center">
            <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-xs text-muted-foreground">
              Ask about your company policies, procedures, or compliance guidelines.
            </p>
          </div>
        )}

        {messages?.map((m) => {
          const citations = (m.citations ?? []) as Array<{ filename: string; section?: string }>;
          const confidence = m.confidence_score ?? 0;
          const uiData = m.ui_data ?? null;

          return (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="space-y-2">
                    {/* Policy Card */}
                    {m.ui_type === "policy_card" && uiData && (
                      <div className="rounded-lg border border-border bg-background p-2">
                        <h4 className="font-semibold text-xs mb-1">{uiData.title}</h4>
                        <div className="space-y-1">
                          {uiData.items?.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px]">
                              {item.checked ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                              ) : (
                                <XCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                              )}
                              <span className={item.checked ? "text-foreground" : "text-muted-foreground"}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Checklist */}
                    {m.ui_type === "checklist" && uiData && (
                      <div className="rounded-lg border border-border bg-background p-2">
                        <h4 className="font-semibold text-xs mb-1">{uiData.title}</h4>
                        <div className="space-y-1">
                          {uiData.items?.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px]">
                              <div
                                className={`h-3 w-3 rounded border-2 shrink-0 ${
                                  item.checked ? "bg-primary border-primary" : "border-muted-foreground"
                                }`}
                              />
                              <span className={item.checked ? "text-foreground" : "text-muted-foreground"}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Form */}
                    {m.ui_type === "action_form" && uiData && (
                      <div className="rounded-lg border border-border bg-background p-2">
                        <h4 className="font-semibold text-xs mb-1 capitalize">
                          {uiData.action_type?.replace(/_/g, " ") || "Action"}
                        </h4>
                        <div className="space-y-1.5">
                          {uiData.fields?.map((field: any) => (
                            <div key={field.name}>
                              <label className="text-[10px] font-medium text-muted-foreground block mb-0.5">
                                {field.label}
                              </label>
                              {field.type === "textarea" ? (
                                <textarea className="w-full rounded border border-input bg-background px-2 py-1 text-[11px]" rows={2} readOnly />
                              ) : (
                                <input type={field.type} className="w-full rounded border border-input bg-background px-2 py-1 text-[11px]" readOnly />
                              )}
                            </div>
                          ))}
                          <Button size="sm" className="w-full text-[11px] h-7">Submit</Button>
                        </div>
                      </div>
                    )}

                    {/* Escalation badge */}
                    {m.ui_type === "escalated" && (
                      <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        <ArrowUpCircle className="h-3 w-3" />
                        Escalated to compliance team
                      </div>
                    )}

                    {/* Text response */}
                    {(m.ui_type !== "policy_card" && m.ui_type !== "checklist" && m.ui_type !== "action_form" && m.ui_type !== "escalated") && (
                      <div className="prose prose-xs max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1">
                        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Confidence */}
                    {confidence > 0 && (
                      <div
                        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          confidence >= 70
                            ? "bg-green-100 text-green-700"
                            : confidence >= 40
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {confidence >= 70 ? "🟢" : confidence >= 40 ? "🟡" : "🔴"} {confidence}%
                      </div>
                    )}

                    {/* Citations */}
                    {citations.length > 0 && (
                      <div className="mt-1 space-y-0.5 border-t border-border/50 pt-1">
                        {citations.map((c, i) => (
                          <div key={i} className="flex items-start gap-1 text-[10px] text-muted-foreground">
                            <FileSearch className="h-2.5 w-2.5 mt-0.5 text-primary shrink-0" />
                            <span>
                              {c.filename}
                              {c.section && <span className="text-muted-foreground/70"> — {c.section}</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
              </div>
            </div>
          );
        })}

        {sendMutation.isPending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask a question…"
            className="min-h-[40px] max-h-[120px] text-xs resize-none"
            rows={1}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || sendMutation.isPending}
            size="icon"
            className="shrink-0 h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Route ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/widget")({
  component: WidgetChat,
  ssr: false, // Widget is client-side only
});
