// src/app/VoiceTest.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";

type VoiceTestProps = {
  onDone?: (data: { userText: string; replyText: string }) => void;
};

export default function VoiceTest({ onDone }: VoiceTestProps) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const [busy, setBusy] = useState(false);
  const [userText, setUserText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (!rec) return;
      try { if (rec.state !== "inactive") rec.stop(); } catch {}
      try { rec.stream?.getTracks?.().forEach((t) => t.stop()); } catch {}
    };
  }, [rec]);

  async function start() {
    setError(null); setUserText(""); setReplyText(""); setAudioUrl(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    mr.onstop = async () => {
      setBusy(true);
      try {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        chunks.current = [];
        const file = new File([blob], "input.webm", { type: "audio/webm" });
        const form = new FormData();
        form.append("audio", file);

        const res = await fetch("/api/voice", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

        const u = data?.userText ?? "";
        const r = data?.replyText ?? "";
        setUserText(u);
        setReplyText(r);

        if (data?.audioBase64) {
          const url = `data:${data.mime || "audio/mpeg"};base64,${data.audioBase64}`;
          setAudioUrl(url);
          try { await new Audio(url).play(); } catch {}
        }

        // Call the callback so page.tsx can use it
        onDone?.({ userText: u, replyText: r });
      } catch (e: any) {
        setError(e?.message || "Unknown error");
      } finally {
        setBusy(false);
      }
    };
    mr.start();
    setRec(mr);
  }

  function stop() {
    try {
      rec?.stop();
      rec?.stream?.getTracks?.().forEach((t) => t.stop());
    } finally {
      setRec(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <button disabled={!!rec || busy} onClick={start} className="border px-3 py-1 rounded">🎙️ Start</button>
        <button disabled={!rec} onClick={stop} className="border px-3 py-1 rounded">⏹ Stop &amp; Send</button>
        {busy && <span>Processing…</span>}
      </div>

      {error && <div className="text-red-500 text-sm">Error: {error}</div>}
      {(userText || replyText || audioUrl) && (
        <div className="rounded border p-3 text-sm space-y-2">
          {userText && <p><strong>User (transcribed):</strong> {userText}</p>}
          {replyText && <p><strong>Assistant:</strong> {replyText}</p>}
          {audioUrl && <audio controls src={audioUrl} className="w-full" />}
        </div>
      )}
    </div>
  );
}
