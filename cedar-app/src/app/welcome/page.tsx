// src/app/welcome/page.tsx
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../FirebaseAuthProvider";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { Calendar, Bot } from "lucide-react";

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If not signed in, go to /login
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <main className="p-6">Loading…</main>;

  const name = user.displayName || user.email?.split("@")[0] || "there";

  async function handleSignOut() {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p>hi, <strong>{name}</strong></p>
      
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Bot className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          href="/calendar"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Calendar
        </Link>
      </div>
      
      <button
        onClick={handleSignOut}
        className="border px-3 py-2 rounded"
      >
        Sign out
      </button>
    </main>
  );
}
