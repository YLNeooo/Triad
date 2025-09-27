// src/app/page.tsx
"use client";

import React from "react";
import VoiceTest from "./../VoiceTest";
import { FloatingCedarChat } from "../../cedar/components/chatComponents/FloatingCedarChat";

export default function Page() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Voice ↔ Speech demo</h1>

      {}
      <VoiceTest
        onDone={({ userText, replyText }) => {
          console.log("Voice result:", { userText, replyText });
        }}
      />

      {}
      <FloatingCedarChat
        title="Cedar Chat"
        side="right"
        showThreadController={false}
        resizable
        stream={false}
      />
    </main>
  );
}
