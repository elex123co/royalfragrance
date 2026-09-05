import { NextResponse } from "next/server";
import { z } from "zod";
import { askElizabeth } from "@/lib/ai/elizabeth";

const schema = z.object({
  message: z.string().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(10)
    .optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await askElizabeth(parsed.data.message, parsed.data.history ?? []);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Elizabeth assistant error:", err);
    return NextResponse.json(
      {
        message:
          "I'm having a little trouble thinking right now — mind trying again in a moment?",
        products: [],
      },
      { status: 200 }
    );
  }
}
