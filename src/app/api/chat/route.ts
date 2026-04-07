import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { skills } from "@/lib/skills";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Compact skill list for the router
const SKILL_LIST = skills
  .map((s) => `- ${s.slug}: ${s.description.slice(0, 120)}`)
  .join("\n");

const ROUTER_SYSTEM = `Bạn là router cho ứng dụng affiliate marketing AI.
Nhiệm vụ: phân tích yêu cầu của người dùng và chọn skill phù hợp nhất.

Danh sách skills:
${SKILL_LIST}

Trả về JSON (không markdown, không giải thích):
{
  "slug": "<skill-slug>",
  "userMessage": "<tóm tắt ngắn gọn yêu cầu bằng tiếng Anh, kèm các thông tin cụ thể người dùng đã cung cấp>"
}

Nếu không rõ skill nào phù hợp, dùng "skill-finder".`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY chưa được cấu hình." },
      { status: 500 }
    );
  }

  let userInput: string;
  try {
    const body = await req.json();
    userInput = body.userInput?.trim();
  } catch {
    return NextResponse.json({ error: "Request không hợp lệ." }, { status: 400 });
  }

  if (!userInput) {
    return NextResponse.json({ error: "Vui lòng nhập yêu cầu." }, { status: 400 });
  }

  // Step 1: Route — identify which skill to use
  let slug: string;
  let userMessage: string;

  try {
    const routerRes = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: ROUTER_SYSTEM,
      messages: [{ role: "user", content: userInput }],
    });

    const raw = routerRes.content[0].type === "text" ? routerRes.content[0].text : "{}";
    // Strip possible markdown code fences
    const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    slug = parsed.slug || "skill-finder";
    userMessage = parsed.userMessage || userInput;
  } catch {
    // Fallback: use skill-finder with original input
    slug = "skill-finder";
    userMessage = userInput;
  }

  const skill = skills.find((s) => s.slug === slug) || skills.find((s) => s.slug === "skill-finder")!;

  // Step 2: Run the skill with Vietnamese instruction
  const systemPrompt = skill.systemPrompt +
    "\n\n---\nQUAN TRỌNG: Luôn trả lời bằng tiếng Việt. Mọi nội dung, phân tích, gợi ý đều phải bằng tiếng Việt.";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // First, send which skill was selected
      const meta = JSON.stringify({ skill: { slug: skill.slug, title: skill.title } });
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ meta: JSON.parse(meta) })}\n\n`));

      try {
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
        const message = err instanceof Error ? err.message : "Lỗi Anthropic API";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
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
