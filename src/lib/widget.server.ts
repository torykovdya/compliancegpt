// Server-only: widget entry point. Uses service_role, never shipped to client.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { processMessageCore } from "./messages.functions";

export const sendWidgetMessage = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({
      content: z.string().min(1).max(8000),
      widgetKey: z.string().uuid(),
      assistantId: z.string().uuid().optional(),
    }).parse(d),
  )
  .handler(async ({ data: input }) => {
    // Validate widget
    const { data: assistant, error: assistErr } = await supabaseAdmin
      .from("assistants")
      .select("id")
      .eq("widget_key", input.widgetKey)
      .single();

    if (assistErr || !assistant) {
      throw new Error("Invalid widget configuration.");
    }

    const userId = `widget:${input.widgetKey}`;
    return processMessageCore(supabaseAdmin, userId, input);
  });
