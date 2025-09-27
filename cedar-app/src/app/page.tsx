// src/app/page.tsx
"use client";
import React from "react";
import Link from "next/link";
import { FloatingCedarChat } from "../cedar/components/chatComponents/FloatingCedarChat";

export default function Page() {
  return (
    <main className="relative min-h-[100dvh] text-white overflow-hidden">
      {/* Background gradient + vignette */}
      <div className="absolute inset-0 -z-10">
        {/* base diagonal gradient */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#3b1ff4_0%,#5b29f0_35%,#6f33f2_60%,#2D1B69_100%)]" />
        {/* soft center glow */}
        <div className="absolute inset-0 bg-[radial-gradient(60vw_40vw_at_50%_50%,rgba(255,255,255,0.10),rgba(255,255,255,0)_60%)]" />
        {/* corner vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(70vw_70vw_at_-10%_-10%,rgba(0,0,0,0.35),transparent_55%),radial-gradient(70vw_70vw_at_110%_-10%,rgba(0,0,0,0.35),transparent_55%),radial-gradient(70vw_70vw_at_-10%_110%,rgba(0,0,0,0.35),transparent_55%),radial-gradient(70vw_70vw_at_110%_110%,rgba(0,0,0,0.35),transparent_55%)]" />
        subtle rotating gradient cross
          <div className="pointer-events-none absolute left-1/2 top-1/2 
                          -translate-x-1/2 -translate-y-1/2 animate-spin-slow">
            {/* vertical line */}
            <div className="absolute left-1/2 top-1/2 h-[100vmin] w-px 
                            -translate-x-1/2 -translate-y-1/2 
                            bg-gradient-to-b from-transparent via-white/30 to-transparent blur-[0.5px]" />
            {/* horizontal line */}
            <div className="absolute left-1/2 top-1/2 w-[110vmin] h-px 
                            -translate-x-1/2 -translate-y-1/2 
                            bg-gradient-to-r from-transparent via-white/30 to-transparent blur-[0.5px]" />
          </div>
          
        {/* thin neon frame like the mock */}
        <div className="absolute inset-0 ring-1 ring-cyan-300/40" />
      </div>

      {/* Centered hero */}
      <section className="relative grid place-items-center h-[100dvh]">
        <div className="text-center">
          <h1 className="font-serif tracking-[0.06em] drop-shadow-sm text-6xl md:text-8xl">
            TRIAD
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-200/80">
            Fuck GT!!!! 
          </p>

          <div className="mt-14 flex justify-center">
            <Link
              href="/sign-in"
              className="rounded-2xl border-4 px-10 py-3 text-lg tracking-wide
                         border-white/70 hover:border-white/90
                         bg-white/0 hover:bg-white/5
                         shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]
                         transition-colors"
            >
              LOGIN
            </Link>
          </div>
        </div>
      </section>

      {/* Floating chat widget (kept) */}
      <FloatingCedarChat />
    </main>
  );
}
