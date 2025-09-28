"use client";

import React from "react";
import styles from "./page.module.css";
import TriadBackground from "@/cedar/components/backgrounds/Background";
import { useAuth } from "../../FirebaseAuthProvider";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

/** ---------- Data Types ---------- */
type Side = {
  key: string;     // "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P"
  title: string;   // e.g., "Extraversion"
  desc: string;    // short description
  color: string;   // primary color
  accent: string;  // accent color
  rotate: number;  // small tilt for the paper
};

type NotePair = { sides: [Side, Side] };

/** ---------- Content: 4 MBTI Pairs in canonical order EI, SN, TF, JP ---------- */
const MBTI_NOTES: NotePair[] = [
  {
    sides: [
      {
        key: "E",
        title: "Extraversion",
        desc: "Energized by interaction; thinks out loud; seeks breadth of interests.",
        color: "#ff5fa3",
        accent: "#ffa3c8",
        rotate: -3,
      },
      {
        key: "I",
        title: "Introversion",
        desc: "Energized by solitude; reflects before speaking; seeks depth of interests.",
        color: "#ff5fa3",
        accent: "#ffd1e7",
        rotate: 3,
      },
    ],
  },
  {
    sides: [
      {
        key: "S",
        title: "Sensing",
        desc: "Trusts concrete facts and experiences; detail-oriented and practical.",
        color: "#4cc2ff",
        accent: "#97ddff",
        rotate: 2,
      },
      {
        key: "N",
        title: "Intuition",
        desc: "Looks for patterns and possibilities; big-picture and future-oriented.",
        color: "#4cc2ff",
        accent: "#c9ecff",
        rotate: -2,
      },
    ],
  },
  {
    sides: [
      {
        key: "T",
        title: "Thinking",
        desc: "Decides with logic and consistency; values fairness and principles.",
        color: "#ffd257",
        accent: "#ffe08c",
        rotate: -1,
      },
      {
        key: "F",
        title: "Feeling",
        desc: "Decides with empathy and impact; values harmony and people.",
        color: "#ffd257",
        accent: "#fff0b8",
        rotate: 1,
      },
    ],
  },
  {
    sides: [
      {
        key: "J",
        title: "Judging",
        desc: "Prefers structure and closure; plans ahead and likes clarity.",
        color: "#b28bff",
        accent: "#d1c1ff",
        rotate: 1,
      },
      {
        key: "P",
        title: "Perceiving",
        desc: "Prefers flexibility and spontaneity; keeps options open.",
        color: "#b28bff",
        accent: "#e5dcff",
        rotate: -1,
      },
    ],
  },
];

/** ---------- Page ---------- */
export default function BoardingPage() {
  const { user } = useAuth();
  const router = useRouter();

  // MBTI card state
  const [isFirst, setIsFirst] = React.useState<boolean[]>(
    () => MBTI_NOTES.map(() => true) // default to E, S, T, J
  );

  // Name inputs
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");

  // Prefill from auth displayName (best-effort)
  React.useEffect(() => {
    if (!user?.displayName) return;
    const parts = user.displayName.trim().split(/\s+/);
    if (!firstName) setFirstName(parts[0] ?? "");
    if (!lastName) setLastName(parts.slice(1).join(" ") ?? "");
  }, [user?.displayName]); // eslint-disable-line react-hooks/exhaustive-deps

  const [saving, setSaving] = React.useState(false);

  const handleFlipToggle = (i: number) => {
    setIsFirst((prev) => {
      const next = prev.slice();
      next[i] = !next[i];
      return next;
    });
  };

  const handleContinue = async () => {
    if (saving) return;

    // basic validation
    if (!firstName.trim() || !lastName.trim()) {
      alert("Please enter your first and last name.");
      return;
    }

    setSaving(true);

    // Build MBTI string in EI-SN-TF-JP order
    const letters = MBTI_NOTES.map((pair, i) =>
      isFirst[i] ? pair.sides[0].key : pair.sides[1].key
    ).join("");

    const detail = MBTI_NOTES.map((pair, i) => {
      const chosen = isFirst[i] ? pair.sides[0] : pair.sides[1];
      const other = isFirst[i] ? pair.sides[1] : pair.sides[0];
      return {
        dimension: `${pair.sides[0].key}/${pair.sides[1].key}`,
        chosen: { key: chosen.key, title: chosen.title },
        other: { key: other.key, title: other.title },
      };
    });

    try {
      // local backup
      localStorage.setItem("firstName", firstName.trim());
      localStorage.setItem("lastName", lastName.trim());
      localStorage.setItem("mbti", letters);
      localStorage.setItem("mbtiDetail", JSON.stringify(detail));

      // must be signed in to write to Firestore
      if (!user) {
        alert("Please sign in to save your profile.");
        router.push("/login");
        return;
      }

      // upsert into users/{uid}
      await setDoc(
        doc(db, "users", user.uid),
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          mbti: letters,
          mbtiDetail: detail, // array of { dimension, chosen, other }
          mbtiUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // notify in-app if anything is listening
      window.dispatchEvent(
        new CustomEvent("mbti:selected", { detail: { mbti: letters, detail } })
      );

      router.push("/dashboard");
    } catch (e) {
      console.error("Failed to save MBTI/profile:", e);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TriadBackground
      className="min-h-dvh overflow-hidden"
      showCross={true}
      showFrame={true}
    >
      <main className={`${styles.main} relative z-10`}>
        <div className={styles.wrap}>
          {/* Name inputs */}
          <div className="w-full max-w-2xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-white/80">First name</span>
              <input
                id="firstName"
                type="text"
                inputMode="text"
                autoComplete="given-name"
                placeholder=""
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl px-4 py-3
                           bg-white/10 backdrop-blur-md
                           border border-white/20
                           text-white placeholder-white/60
                           outline-none
                           focus:border-cyan-300/60
                           transition"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-white/80">Last name</span>
              <input
                id="lastName"
                type="text"
                inputMode="text"
                autoComplete="family-name"
                placeholder=""
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl px-4 py-3
                           bg-white/10 backdrop-blur-md
                           border border-white/20
                           text-white placeholder-white/60
                           outline-none
                           focus:border-cyan-300/60
                           transition"
              />
            </label>
          </div>

          {/* Notes grid */}
          <div className={styles.notesRow}>
            {MBTI_NOTES.map((pair, i) => (
              <NoteCard
                key={i}
                sides={pair.sides}
                frontIsFirst={isFirst[i]}
                onFlip={() => handleFlipToggle(i)}
              />
            ))}
          </div>

          {/* Button section */}
          <div className="mt-8 flex flex-col items-center gap-4">
            {/* Continue button (crystal style) */}
            <button
              onClick={handleContinue}
              disabled={saving || !firstName.trim() || !lastName.trim()}
              className="relative px-6 py-3 rounded-xl 
                         bg-white/10 backdrop-blur-md
                         border border-white/20
                         shadow-[0_0_20px_rgba(173,216,230,0.4)]
                         text-cyan-200
                         transition-all duration-300
                         hover:bg-white/20 hover:scale-105
                         active:scale-95
                         disabled:opacity-60 disabled:pointer-events-none"
            >
              {saving ? "Saving…" : "Continue"}
              <span
                className="absolute inset-0 rounded-xl 
                           bg-gradient-to-r from-cyan-400/20 to-purple-400/20 
                           blur-md -z-10"
              />
            </button>

            {/* Personality test link */}
            <a
              href="https://www.16personalities.com/free-personality-test"
              target="_blank"
              rel="noopener noreferrer"
              className="relative px-6 py-3 rounded-xl 
                         bg-white/10 backdrop-blur-md
                         border border-white/20
                         shadow-[0_0_20px_rgba(173,216,230,0.4)]
                         text-cyan-200
                         transition-all duration-300
                         hover:bg-white/20 hover:scale-105
                         active:scale-95"
            >
              Take the Free Test Here
              <span
                className="absolute inset-0 rounded-xl 
                           bg-gradient-to-r from-cyan-400/20 to-purple-400/20 
                           blur-md -z-10"
              />
            </a>
          </div>
        </div>
      </main>
    </TriadBackground>
  );
}

/** ---------- NoteCard (controlled flip) ---------- */
function NoteCard({
  sides,
  frontIsFirst,
  onFlip,
}: {
  sides: [Side, Side];
  frontIsFirst: boolean;
  onFlip: () => void;
}) {
  const [flipping, setFlipping] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);

  const handleFlip = () => {
    if (flipping || resetting) return;
    setFlipping(true);
  };

  const onFlipEnd = () => {
    if (!flipping) return;
    onFlip();              // swap which side is logically front
    setFlipping(false);
    setResetting(true);    // snap back to 0deg instantly to avoid double spin
  };

  React.useEffect(() => {
    if (!resetting) return;
    const id = requestAnimationFrame(() => setResetting(false));
    return () => cancelAnimationFrame(id);
  }, [resetting]);

  const A = frontIsFirst ? sides[0] : sides[1];
  const B = frontIsFirst ? sides[1] : sides[0];

  return (
    <div
      className={styles.noteStage}
      onClick={handleFlip}
      role="button"
      aria-label={`Flip ${sides[0].key}/${sides[1].key} note (currently ${A.key})`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleFlip();
        }
      }}
    >
      <div className={styles.persp}>
        <div
          className={[
            styles.flipper,
            flipping ? styles.flipping : "",
            resetting ? styles.noAnim : "",
          ].join(" ")}
          onTransitionEnd={onFlipEnd}
        >
          <div className={styles.face}>
            <Paper side={A} />
          </div>
          <div className={`${styles.face} ${styles.back}`}>
            <Paper side={B} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** ---------- Paper face ---------- */
function Paper({ side }: { side: Side }) {
  return (
    <div
      className={styles.paper}
      style={{
        transform: `rotate(${side.rotate}deg)`,
        background: `linear-gradient(155deg, ${side.accent} 0%, ${side.color} 55%, ${side.color} 100%)`,
      }}
    >
      <div className={styles.curl} />
      <div className={styles.paperContent}>
        <div style={{ color: "#1e1444", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", fontWeight: 900, lineHeight: 1 }}>
            {side.key}
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, marginTop: "0.25rem" }}>
            {side.title}
          </h3>
          <p style={{ fontSize: ".9rem", marginTop: ".5rem", maxWidth: 260 }}>
            {side.desc}
          </p>
        </div>
      </div>
    </div>
  );
}
