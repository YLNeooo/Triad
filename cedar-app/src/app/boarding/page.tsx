"use client";
import React from "react";
import styles from "./page.module.css";

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
        title: "iNtuition",
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
  // For each card, track whether the FIRST side is currently shown (true) or the SECOND (false).
  const [isFirst, setIsFirst] = React.useState<boolean[]>(
    () => MBTI_NOTES.map(() => true) // default to E, S, T, J
  );
  const [saving, setSaving] = React.useState(false);

  const handleFlipToggle = (i: number) => {
    setIsFirst((prev) => {
      const next = prev.slice();
      next[i] = !next[i];
      return next;
    });
  };

  const handleContinue = () => {
    if (saving) return;
    setSaving(true);

    // Build MBTI string in EI-SN-TF-JP order
    const letters = MBTI_NOTES.map((pair, i) =>
      isFirst[i] ? pair.sides[0].key : pair.sides[1].key
    ).join("");

    // Also keep a detailed record (which side chosen for each pair)
    const detail = MBTI_NOTES.map((pair, i) => {
      const chosen = isFirst[i] ? pair.sides[0] : pair.sides[1];
      const other  = isFirst[i] ? pair.sides[1] : pair.sides[0];
      return {
        dimension: `${pair.sides[0].key}/${pair.sides[1].key}`, // e.g., "E/I"
        chosen: { key: chosen.key, title: chosen.title },
        other:  { key: other.key,  title: other.title  },
      };
    });

    try {
      // Persist so you can use it later anywhere in the app.
      localStorage.setItem("mbti", letters);
      localStorage.setItem("mbtiDetail", JSON.stringify(detail));

      // Optional: broadcast to the app (listen with window.addEventListener("mbti:selected", ...))
      window.dispatchEvent(
        new CustomEvent("mbti:selected", { detail: { mbti: letters, detail } })
      );

      // (Optional) lightweight feedback
      // eslint-disable-next-line no-alert
      alert(`Saved your MBTI: ${letters}`);
    } finally {
      setSaving(false);
    }
  };

return (
  <main className={styles.main}>
    <div className={styles.wrap}>
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

      <div className={styles.buttonRow}>
        <button
          className={styles.nextBtn}
          onClick={handleContinue}
          disabled={saving}
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  </main>
);


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
    setFlipping(true); // animate 0deg -> 180deg
  };

  const onFlipEnd = () => {
    if (!flipping) return;
    onFlip();              // swap which side is logically front (lifted state)
    setFlipping(false);
    setResetting(true);    // snap back to 0deg instantly; avoids double spin
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
