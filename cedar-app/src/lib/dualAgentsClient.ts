export type AgentRole = 'ego' | 'superego' | 'user';

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  agent?: AgentRole;
  turnCount?: number;
  currentAgent?: Exclude<AgentRole, 'user'>;
  conversationComplete?: boolean;
}

export type DualAgentsResponse = AgentMessage & { userMessage?: AgentMessage; error?: string };

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as T;
  return data;
}

export async function startDualAgents(params: { maxTurns: number }): Promise<DualAgentsResponse> {
  return postJSON<DualAgentsResponse>('/api/dual-agents', {
    startConversation: true,
    maxTurns: params.maxTurns,
  });
}

export async function continueDualAgents(params: {
  messages: AgentMessage[];
  currentAgent: Exclude<AgentRole, 'user'>;
  turnCount: number;
  maxTurns: number;
}): Promise<DualAgentsResponse> {
  return postJSON<DualAgentsResponse>('/api/dual-agents', params);
}

export async function sendUserToDualAgents(params: {
  messages: AgentMessage[];
  currentAgent: Exclude<AgentRole, 'user'>;
  turnCount: number;
  maxTurns: number;
  userInput: string;
}): Promise<DualAgentsResponse> {
  return postJSON<DualAgentsResponse>('/api/dual-agents', params);
}

export async function summarizeConversation(params: {
  messages: AgentMessage[];
}): Promise<{ ok: boolean; summary?: string; error?: string }> {
  return postJSON('/api/dual-agents', { summarize: true, messages: params.messages });
}


