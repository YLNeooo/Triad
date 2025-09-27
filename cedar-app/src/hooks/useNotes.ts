"use client";
import { useEffect, useMemo, useState } from "react";
import type { Note, NoteCreateData } from "@/lib/firebase/notes";
import {
  createNote as _create,
  updateNote as _update,
  deleteNote as _delete,
  listenNotes,
  searchNotesClient,
} from "@/lib/firebase/notes";

export function useNotes({ uid, includeArchived = false }: { uid: string; includeArchived?: boolean }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) { setNotes([]); setLoading(false); return; }
    setLoading(true);
    setError(null);

    const unsub = listenNotes(
      uid,
      (list) => {
        const filtered = includeArchived ? list : list.filter((n) => !n.isArchived);
        setNotes(filtered);
        setLoading(false);
      },
      (err) => {
        console.error("listenNotes error:", err);
        setError(err?.message || "Failed to load notes");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid, includeArchived]);

  const api = useMemo(
    () => ({
      createNote: (data: Omit<NoteCreateData, "uid">) => _create(uid, { uid, ...data }),
      updateNote: (id: string, updates: Partial<Note>) => _update(uid, id, updates),
      deleteNote: (id: string) => _delete(uid, id),
      searchNotes: (term: string) => searchNotesClient(uid, term),
    }),
    [uid]
  );

  return { notes, loading, error, ...api };
}

export type { Note, NoteCreateData };
