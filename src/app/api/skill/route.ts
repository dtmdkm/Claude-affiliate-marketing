import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { skills } from "@/lib/skills";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured. Add it to your .env.local file." },
      { status: 500 }
    );
  }

  let slug: string;
  let userMessage: string;

  try {
    const body = await req.json();
    slug = body.slug;
    userMessage = body.userMessage;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!slug || !userMessage) {
    return NextResponse.json({ error: "Missing slug or userMessage" }, { status: 400 });
  }

  const skill = skills.find((s) => s.slug === slug);
  if (!skill) {
    return NextResponse.json({ error: `Skill "${slug}" not found` }, { status: 404 });
  }

  // Stream the response using SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const systemPrompt = skill.systemPrompt +
          "\n\n---\nQUAN TRỌNG: Luôn trả lời bằng tiếng Việt. Mọi nội dung, phân tích, gợi ý đều phải bằng tiếng Việt.";

        const anthropicStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const data = JSON.stringify({ text: event.delta.text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Anthropic API error";
        const data = JSON.stringify({ error: message });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
