// src/app/signup/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase/client";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useAuth } from "../FirebaseAuthProvider";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    router.replace("/welcome");
  }

  async function onEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/"); // signed in after create
    } catch (e: any) {
      setErr(e?.message || "Failed to create account");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setErr(null); setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/");
    } catch (e: any) {
      setErr(e?.message || "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Create account</h1>

      <form onSubmit={onEmailSignup} className="space-y-3">
        <input
          type="email"
          className="w-full border rounded px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          autoComplete="new-password"
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button
          type="submit"
          disabled={busy}
          className="w-full border rounded px-3 py-2 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>

      <div className="flex items-center gap-2">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-500">or</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      <button
        onClick={onGoogle}
        disabled={busy}
        className="w-full border rounded px-3 py-2 disabled:opacity-50"
      >
        Continue with Google
      </button>

      <p className="text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
