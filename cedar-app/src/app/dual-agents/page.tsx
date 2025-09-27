"use client";

import { DualAgentChat } from "../../cedar/components/chatComponents/DualAgentChat";

export default function DualAgentsPage() {
  return (
    <main className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden">
        <DualAgentChat />
      </div>
    </main>
  );
}
