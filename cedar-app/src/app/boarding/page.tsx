"use client";

import React from "react";
import { useRouter } from "next/navigation";
import TriadBackground from "@/cedar/components/backgrounds/Background";
import GlassButton from "@/components/glassButton"; // ✅ adjust path if needed
import { useAuth } from "../FirebaseAuthProvider";


export default function BoardingIntroPage() {
  const router = useRouter();

  const goNext = () => {
    router.push("/boarding/mbti");
  };

  return (
    <TriadBackground className="min-h-dvh overflow-hidden" showCross showFrame>
      <main className="relative z-10 min-h-dvh flex items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-8">
          <h1 className="text-4xl md:text-5xl text-white drop-shadow">
            Welcome to Triad
          </h1>
          <p className="text-white/85 leading-relaxed">
            Triad helps you understand yourself and tailor your experience across the app.
            We’ll start with a quick preference setup. If you don’t know your MBTI type,
            you can take a short external test first—totally optional.
          </p>

          <div className="pt-2 flex flex-col items-center gap-4">
            <GlassButton onClick={goNext}>
              Continue
            </GlassButton>
          </div>
        </div>
      </main>
    </TriadBackground>
  );
}
