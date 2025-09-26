// app/api/agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const MODEL = "gpt-4o-mini"; // can change

function assertEnv() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "Missing OPENAI_API_KEY"
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    assertEnv();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "Say hello in one short sentence.";

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a concise test agent." },
        { role: "user", content: q },
      ],
      temperature: 0.7,
    });

    const content = resp.choices?.[0]?.message?.content ?? "(no content)";
    return NextResponse.json({ ok: true, content });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    assertEnv();
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: messages.length
        ? messages
        : [
            { role: "system", content: "You are a concise test agent." },
            { role: "user", content: "Give me a 1-line test response." },
          ],
      temperature: 0.7,
    });

    const content = resp.choices?.[0]?.message?.content ?? "(no content)";
    // Minimal shape many Cedar chat setups can consume:
    return NextResponse.json({ role: "assistant", content });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
