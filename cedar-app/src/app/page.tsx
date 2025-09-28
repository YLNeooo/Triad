// src/app/page.tsx
"use client";
import { FloatingCedarChat } from "../cedar/components/chatComponents/FloatingCedarChat";
import Link from "next/link";
import { useAuth } from "@/app/FirebaseAuthProvider";
import React from "react";
import { TriadBackground } from "../cedar/components/backgrounds/Background";

export default function Page() {
  const { user, loading } = useAuth();
  const href = loading ? "#" : (user ? "/dashboard" : "/login");
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
              href={href}
              aria-disabled={loading}
              className="rounded-2xl border-4 px-10 py-3 text-lg tracking-wide
                         border-white/70 hover:border-white/90
                         bg-white/0 hover:bg-white/5
                         shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]
                         transition-colors"
            >
              {loading ? "…" : user ? "Go to Dashboard" : "Get Started Today"}
            </Link>
            <Link
              href="/test-notes"
              className="rounded-2xl border-4 px-10 py-3 text-lg tracking-wide
                         border-white/70 hover:border-white/90
                         bg-white/0 hover:bg-white/5
                         shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]
                         transition-colors"
            >
              View Notes
            </Link>
          </div>
        </div>
      </section>

      {/* Floating chat widget (kept) */}
      <FloatingCedarChat />
    </TriadBackground>
  );
}





        
