"use client";
import { useEffect, useMemo, useState } from "react";
import type { Conversation, ConversationCreateData } from "@/lib/firebase/conversations";
import {
  createConversation as _create,
  updateConversation as _update,
  deleteConversation as _delete,
  listenConversations,
  searchConversations,
  addMessageToConversation as _addMessage,
  archiveConversation as _archive,
  restoreConversation as _restore
} from "@/lib/firebase/conversations";

export function useConversations({ uid, includeArchived = false }: { uid: string; includeArchived?: boolean }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) { setConversations([]); setLoading(false); return; }
    setLoading(true);
    setError(null);

    const unsub = listenConversations(
      uid,
      (list) => {
        const filtered = includeArchived 
          ? list 
          : list.filter((c) => c.status !== "archived" && c.status !== "deleted");
        setConversations(filtered);
        setLoading(false);
      },
      (err) => {
        console.error("listenConversations error:", err);
        setError(err?.message || "Failed to load conversations");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid, includeArchived]);

  const api = useMemo(
    () => ({
      createConversation: (data: Omit<ConversationCreateData, "uid">) => 
        _create(uid, { uid, ...data }),
      updateConversation: (id: string, updates: Partial<Conversation>) => 
        _update(uid, id, updates),
      deleteConversation: (id: string) => 
        _delete(uid, id),
      searchConversations: (term: string) => 
        searchConversations(uid, term),
      addMessage: (conversationId: string, message: any) =>
        _addMessage(uid, conversationId, message),
      archiveConversation: (id: string) =>
        _archive(uid, id),
      restoreConversation: (id: string) =>
        _restore(uid, id),
    }),
    [uid]
  );

  return { conversations, loading, error, ...api };
}

export type { Conversation, ConversationCreateData };
