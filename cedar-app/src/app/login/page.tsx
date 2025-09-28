// src/app/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, googleProvider, db } from "@/lib/firebase/client";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useAuth } from "../FirebaseAuthProvider";
import { TriadBackground } from "@/cedar/components/backgrounds/Background";

async function upsertUserDoc(params: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}) {
  const { uid, email, displayName } = params;
  await setDoc(
    doc(db, "users", uid),
    {
      email: email ?? null,
      displayName: displayName ?? null,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// decide where to send the user based on presence of users/{uid}.mbti
async function routeByMbti(uid: string, router: ReturnType<typeof useRouter>) {
  const snap = await getDoc(doc(db, "users", uid));
  const mbti = snap.exists() ? (snap.data() as any)?.mbti : undefined;
  router.replace(mbti ? "/dashboard" : "/boarding");
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If already signed in, check mbti and route accordingly
  useEffect(() => {
    if (!loading && user) {
      routeByMbti(user.uid, router).catch((e) => {
        console.error("MBTI route check failed:", e);
        router.replace("/welcome"); // safe fallback
      });
    }
  }, [loading, user, router]);

  async function onEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const u = cred.user;
      await upsertUserDoc({ uid: u.uid, email: u.email, displayName: u.displayName });
      await routeByMbti(u.uid, router);
    } catch (e: any) {
      setErr(e?.message || "Failed to sign in");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogleLogin() {
    setErr(null);
    setBusy(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const u = cred.user;
      await upsertUserDoc({ uid: u.uid, email: u.email, displayName: u.displayName });
      await routeByMbti(u.uid, router);
    } catch (e: any) {
      setErr(e?.message || "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <TriadBackground className="min-h-screen flex items-center justify-center">
      <main className="w-full max-w-sm mx-auto p-8 space-y-8">
        {/* LOGIN Title */}
        <h1 className="text-center text-4xl text-white tracking-wide">LOGIN</h1>

        {/* Login Form */}
        <form onSubmit={onEmailLogin} className="space-y-6">
          {/* Email Input */}
          <div className="relative">
            <input
              type="email"
              className="w-full h-14 px-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              type="password"
              className="w-full h-14 px-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Error Message */}
          {err && (
            <div className="text-red-300 text-sm text-center bg-red-500/20 rounded-full py-2 px-4 backdrop-blur-sm">
              {err}
            </div>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={busy}
            className="w-full h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="h-px bg-white/30 flex-1" />
          <span className="text-white/60 text-sm">or</span>
          <div className="h-px bg-white/30 flex-1" />
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={onGoogleLogin}
          disabled={busy}
          className="w-full h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Continue with Google
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-white/80 text-sm">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-white hover:text-white/80 underline underline-offset-2 transition-colors duration-200"
          >
            Create one
          </Link>
        </p>
      </main>
    </TriadBackground>
  );
}
