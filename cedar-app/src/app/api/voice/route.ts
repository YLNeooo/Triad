// src/app/api/voice/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs"; // ensure Node runtime for file handling

const STT_MODEL = "whisper-1";
const LLM_MODEL = "gpt-4o-mini";
const TTS_MODEL = "gpt-4o-mini-tts";
const TTS_VOICE = "alloy";

export async function GET() {
  // quick ping so you can hit /api/voice in a browser and see JSON
  return NextResponse.json({ ok: true, ping: "voice endpoint is alive" });
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get("audio") as File | null;
    if (!file) return NextResponse.json({ error: "No audio" }, { status: 400 });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 1) Speech to text (Whisper)
    const transcription = await openai.audio.transcriptions.create({
      model: STT_MODEL,
      file,
    });
    const userText = transcription.text?.trim() || "(empty)";

    // 2) LLM reply
    const chat = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        { role: "system", content: "You are helpful and concise." },
        { role: "user", content: userText },
      ],
      temperature: 0.7,
    });
    const replyText = chat.choices?.[0]?.message?.content ?? "(no reply)";

    // 3) Text back to speech (MP3 by default)
    const speech = await openai.audio.speech.create({
      model: TTS_MODEL,
      voice: TTS_VOICE,
      input: replyText,
    });
    const arrayBuf = await speech.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuf).toString("base64");

    return NextResponse.json({
      ok: true,
      userText,
      replyText,
      audioBase64,
      mime: "audio/mpeg",
    });
  } catch (err: any) {
    console.error("VOICE ROUTE ERROR:", err);
    // Always return JSON (not HTML) so the client can parse it
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
