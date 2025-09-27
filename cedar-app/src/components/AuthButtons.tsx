// src/components/AuthButtons.tsx
"use client";

import { auth, googleProvider } from "@/lib/firebase/client";
import { signInWithPopup, signOut } from "firebase/auth";
import { useAuth } from "@/app/FirebaseAuthProvider";

export default function AuthButtons() {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-sm">Checking auth…</div>;

  if (!user) {
    return (
      <button
        onClick={() => signInWithPopup(auth, googleProvider)}
        className="border px-3 py-1 rounded"
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">Hi, {user.displayName || user.email}</span>
      <button onClick={() => signOut(auth)} className="border px-3 py-1 rounded">
        Sign out
      </button>
    </div>
  );
}
