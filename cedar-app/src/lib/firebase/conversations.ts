import { db } from "@/lib/firebase/client";
import {
  addDoc, collection, deleteDoc, doc, limit, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc, getDocs, getDoc
} from "firebase/firestore";

export type ConversationRole = "user" | "assistant" | "system";
export type ConversationStatus = "active" | "archived" | "deleted";

export type ConversationMessage = {
  id: string;
  role: ConversationRole;
  content: string;
  timestamp: any;
  metadata?: {
    tokens?: number;
    model?: string;
    temperature?: number;
    [key: string]: any;
  };
};

export type Conversation = {
  id?: string;
  uid: string;
  title: string;
  messages: ConversationMessage[];
  status: ConversationStatus;
  summary?: string;
  tags: string[];
  metadata?: {
    totalMessages: number;
    totalTokens: number;
    lastActivity: any;
    participants?: string[];
    context?: Record<string, any>;
  };
  createdAt?: any;
  updatedAt?: any;
} & Record<string, any>;

export type ConversationCreateData = Omit<Conversation, "id" | "createdAt" | "updatedAt">;

const conversationsCol = (uid: string) => collection(db, "users", uid, "conversations");

export async function createConversation(uid: string, data: ConversationCreateData) {
  const now = serverTimestamp();
  const payload: Conversation = {
    uid,
    title: data.title,
    messages: data.messages ?? [],
    status: data.status ?? "active",
    summary: data.summary,
    tags: data.tags ?? [],
    metadata: {
      totalMessages: data.messages?.length ?? 0,
      totalTokens: data.messages?.reduce((sum: number, msg: ConversationMessage) => sum + (msg.metadata?.tokens ?? 0), 0) ?? 0,
      lastActivity: now,
      participants: data.metadata?.participants ?? [],
      context: data.metadata?.context ?? {},
      ...data.metadata
    },
    createdAt: now,
    updatedAt: now,
    ...data
  };
  const ref = await addDoc(conversationsCol(uid), payload);
  return { id: ref.id, ...payload };
}

export async function updateConversation(uid: string, id: string, updates: Partial<Conversation>) {
  await updateDoc(doc(db, "users", uid, "conversations", id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteConversation(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "conversations", id));
}

export async function addMessageToConversation(
  uid: string, 
  conversationId: string, 
  message: Omit<ConversationMessage, "id" | "timestamp">
) {
  const conversationRef = doc(db, "users", uid, "conversations", conversationId);
  const messageWithId: ConversationMessage = {
    ...message,
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: serverTimestamp()
  };
  
  // Get current conversation to update messages array
  const currentConversation = await getConversation(uid, conversationId);
  if (!currentConversation) {
    throw new Error("Conversation not found");
  }
  
  const updatedMessages = [...(currentConversation.messages ?? []), messageWithId];
  const updatedMetadata = {
    ...currentConversation.metadata,
    totalMessages: updatedMessages.length,
    totalTokens: (currentConversation.metadata?.totalTokens ?? 0) + (message.metadata?.tokens ?? 0),
    lastActivity: serverTimestamp()
  };
  
  await updateDoc(conversationRef, {
    messages: updatedMessages,
    metadata: updatedMetadata,
    updatedAt: serverTimestamp()
  });
  
  return messageWithId;
}

export async function getConversation(uid: string, id: string): Promise<Conversation | null> {
  const docRef = doc(db, "users", uid, "conversations", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Conversation;
}

export function listenConversations(
  uid: string,
  cb: (conversations: Conversation[]) => void,
  onErr?: (e: any) => void
) {
  const q = query(
    conversationsCol(uid), 
    orderBy("updatedAt", "desc"), 
    limit(100)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Conversation[];
      cb(list);
    },
    (err) => onErr?.(err)
  );
}

export async function searchConversations(uid: string, term: string) {
  const q = query(conversationsCol(uid), orderBy("updatedAt", "desc"), limit(500));
  const snap = await getDocs(q);
  const hay = term.toLowerCase();
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }) as Conversation)
    .filter(
      (c) =>
        c.title?.toLowerCase().includes(hay) ||
        c.summary?.toLowerCase().includes(hay) ||
        c.messages?.some((msg) => msg.content?.toLowerCase().includes(hay)) ||
        (c.tags || []).some((t) => t.toLowerCase().includes(hay))
    );
}

export async function archiveConversation(uid: string, id: string) {
  await updateConversation(uid, id, { status: "archived" });
}

export async function restoreConversation(uid: string, id: string) {
  await updateConversation(uid, id, { status: "active" });
}
