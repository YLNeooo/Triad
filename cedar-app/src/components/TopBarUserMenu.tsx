"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/app/FirebaseAuthProvider";

export default function TopBarUserMenu() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click / route change
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const hideOn = ["/login", "/signup", ""];
  if (hideOn.includes(pathname || "")) return null;

  const avatar =
    user?.photoURL ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      user?.displayName || user?.email || "U"
    )}`;

  return (
    <div className="fixed top-4 right-4 z-50" ref={ref}>
      <button
        onClick={() => !loading && setOpen((v) => !v)}
        disabled={loading}
        className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-1.5 text-white hover:bg-white/20 disabled:opacity-60"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* avatar */}
        <img
          src={avatar}
          alt="profile"
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="hidden sm:block text-sm">
          {loading ? "…" : user?.displayName || user?.email?.split("@")[0] || "Guest"}
        </span>
      </button>

      {/* dropdown */}
      {open && (
        <div
          role="menu"
          className="mt-2 w-56 rounded-xl border border-white/20 bg-black/60 text-white backdrop-blur-md shadow-lg p-1"
        >
          {user ? (
            <>
              <Link
                href="/welcome"
                className="block rounded-lg px-3 py-2 hover:bg-white/10"
                role="menuitem"
              >
                Home
              </Link>
              <Link
                href="/profile"
                className="block rounded-lg px-3 py-2 hover:bg-white/10"
                role="menuitem"
              >
                Edit profile
              </Link>
              <button
                onClick={async () => {
                  await signOut(auth);
                  router.replace("/login");
                }}
                className="w-full text-left rounded-lg px-3 py-2 hover:bg-white/10"
                role="menuitem"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block rounded-lg px-3 py-2 hover:bg-white/10"
                role="menuitem"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="block rounded-lg px-3 py-2 hover:bg-white/10"
                role="menuitem"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
