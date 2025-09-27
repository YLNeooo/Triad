// lib/types.ts
export interface ConversationMemory {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  summary: string;
  keyTopics: string[];
  insights: string[];
  psychologicalThemes: string[];
  recommendations: string[];
  memoryTags: string[];
  emotionalTone: string;
  userConcerns: string[];
  resolutions: string[];
  agentInteractions: {
    ego: number;
    superego: number;
    user: number;
  };
  conversationLength: number;
  storagePath: string;
}

export interface AgentMessage {
  role: "system" | "user" | "assistant";
  content: string;
  agent?: "ego" | "superego" | "user";
  turnCount?: number;
  currentAgent?: "ego" | "superego";
  conversationComplete?: boolean;
}
