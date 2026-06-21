import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { brunoToolDefinitions, eseguiBrunoTool } from "@/lib/bruno-tools";

const SYSTEM_PROMPT = `Sei BRUNO, l'assistente AI integrato nel gestionale forniture sportive Errea/Solo.
Aiuti l'utente a trovare informazioni su clienti, ordini, lavorazioni, pagamenti e documenti usando gli strumenti a disposizione.
Rispondi sempre in italiano, in modo breve e diretto. Se non trovi un'informazione, dillo chiaramente invece di inventarla.
Quando ha senso, indica all'utente che può aprire la pagina corrispondente nel gestionale per maggiori dettagli.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "not_configured" },
      { status: 503 }
    );
  }

  const { messages } = (await req.json()) as { messages: ChatMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const conversation: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let finalText = "";

  for (let turn = 0; turn < 5; turn++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: brunoToolDefinitions,
      messages: conversation,
    });

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    const textBlocks = response.content.filter(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    finalText = textBlocks.map((b) => b.text).join("\n").trim();

    if (response.stop_reason !== "tool_use" || toolUseBlocks.length === 0) {
      break;
    }

    conversation.push({ role: "assistant", content: response.content });

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        const result = await eseguiBrunoTool(
          block.name,
          block.input as Record<string, unknown>
        );
        return {
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: JSON.stringify(result),
        };
      })
    );

    conversation.push({ role: "user", content: toolResults });
  }

  return Response.json({ reply: finalText || "Non sono riuscito a generare una risposta." });
}
