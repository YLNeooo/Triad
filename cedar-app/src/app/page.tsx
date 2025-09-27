// src/app/page.tsx
"use client";
import { FloatingCedarChat } from "../cedar/components/chatComponents/FloatingCedarChat";

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Cedar + OpenAI test</h1>
      <FloatingCedarChat />
    </main>
  );
}
