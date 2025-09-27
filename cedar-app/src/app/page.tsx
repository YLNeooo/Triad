// src/app/page.tsx
"use client";
import { FloatingCedarChat } from "../cedar/components/chatComponents/FloatingCedarChat";
import Link from "next/link";
import { Bot, MessageSquare } from "lucide-react";

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Cedar + OpenAI Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Single Agent Chat</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Traditional chat interface with a single AI agent
          </p>
          <FloatingCedarChat />
        </div>

        <div className="p-6 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Ego-Superego Conversation</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Interact with your psychological agents - Ego (realistic mediator) and Superego (moral compass)
          </p>
          <Link 
            href="/dual-agents"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Bot className="w-4 h-4" />
            Try Ego-Superego
          </Link>
        </div>
      </div>
    </main>
  );
}
