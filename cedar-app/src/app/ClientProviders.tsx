"use client";

import React from "react";
import { CedarCopilot } from "cedar-os";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("Missing NEXT_PUBLIC_OPENAI_API_KEY");
  }

  return (
    <CedarCopilot
      // This makes Cedar talk directly to OpenAI from the client
      llmProvider={{
        provider: "openai",
        apiKey: apiKey as string,
      }}
    >
      {children}
    </CedarCopilot>
  );
}
