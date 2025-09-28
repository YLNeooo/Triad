import { db } from "@/lib/firebase/client";
import {
  addDoc, collection, deleteDoc, doc, limit, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc, getDocs
} from "firebase/firestore";

export type NotePriority = "low" | "medium" | "high";
export type NoteCategory =
  | "general" | "work" | "personal" | "ideas" | "meetings" | "projects";

export type Note = {
  id?: string;
  uid: string;
  title: string;
  content: string;
  tags: string[];
  category: NoteCategory;
  priority: NotePriority;
  isPinned?: boolean;
  isArchived?: boolean;
  metadata?: {
    wordCount?: number;
    characterCount?: number;
  };
  createdAt?: any;
  updatedAt?: any;
  isConversation?: boolean;
} & Record<string, any>;

export type NoteCreateData = Omit<Note, "id" | "createdAt" | "updatedAt">;

const notesCol = (uid: string) => collection(db, "users", uid, "notes");

export async function createNote(uid: string, data: NoteCreateData) {
  const now = serverTimestamp();
  const payload: Note = {
    uid,
    title: data.title,
    content: data.content,
    tags: data.tags ?? [],
    category: data.category,
    priority: data.priority,
    isPinned: data.isPinned ?? false,       // ✅ default
    isArchived: data.isArchived ?? false,   // ✅ default
    metadata: {
      wordCount:
        data.metadata?.wordCount ??
        (data.content?.trim()?.split(/\s+/).filter(Boolean).length ?? 0),
      characterCount:
        data.metadata?.characterCount ?? (data.content?.length ?? 0),
    },
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(notesCol(uid), payload);
  return { id: ref.id, ...payload };
}

export async function updateNote(uid: string, id: string, updates: Partial<Note>) {
  await updateDoc(doc(db, "users", uid, "notes", id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "notes", id));
}

export function listenNotes(
  uid: string,
  cb: (notes: Note[]) => void,
  onErr?: (e: any) => void
) {
  // ✅ No where() filter — avoids null/undefined issues
  const q = query(notesCol(uid), orderBy("isPinned", "desc"), orderBy("createdAt", "desc"), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Note[];
      cb(list);
    },
    (err) => onErr?.(err)
  );
}

// Simple client-side search over a recent window
export async function searchNotesClient(uid: string, term: string) {
  const q = query(notesCol(uid), orderBy("createdAt", "desc"), limit(500));
  const snap = await getDocs(q);
  const hay = term.toLowerCase();
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }) as Note)
    .filter(
      (n) =>
        n.title?.toLowerCase().includes(hay) ||
        n.content?.toLowerCase().includes(hay) ||
        (n.tags || []).some((t) => t.toLowerCase().includes(hay))
    );
}
