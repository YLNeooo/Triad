// src/app/page.tsx
"use client";
import { FloatingCedarChat } from "../cedar/components/chatComponents/FloatingCedarChat";
import Link from "next/link";
import { Bot, MessageSquare } from "lucide-react";
import React from "react";
import { TriadBackground } from "../cedar/components/backgrounds/TriadBackground";

export default function Page() {
  return (
    <TriadBackground className="min-h-[100dvh] text-white overflow-hidden">

      {/* Centered hero */}
      <section className="relative grid place-items-center h-[100dvh]">
        <div className="text-center">
          <h1 className="font-serif tracking-[0.06em] drop-shadow-sm text-6xl md:text-8xl">
            TRIAD
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-200/80">
            Message here
          </p>

          <div className="mt-14 flex justify-center gap-4">
            <Link
              href="/login"
              className="rounded-2xl border-4 px-10 py-3 text-lg tracking-wide
                         border-white/70 hover:border-white/90
                         bg-white/0 hover:bg-white/5
                         shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]
                         transition-colors"
            >
              Get Started Today
            </Link>
            <Link
              href="/test-notes"
              className="rounded-2xl border-4 px-10 py-3 text-lg tracking-wide
                         border-white/70 hover:border-white/90
                         bg-white/0 hover:bg-white/5
                         shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]
                         transition-colors"
            >
              Test Notes
            </Link>
          </div>
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
      </section>

      {/* Floating chat widget (kept) */}
      <FloatingCedarChat />
    </TriadBackground>
  );
}





        
