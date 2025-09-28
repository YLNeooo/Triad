"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { Brain, Shield, User, Play, Square, RotateCcw } from 'lucide-react';
import Container3D from '@/cedar/components/containers/Container3D';
import Flat3dContainer from '@/cedar/components/containers/Flat3dContainer';
import { TriadBackground } from '@/cedar/components/backgrounds/TriadBackground';
import { cn, useCedarStore } from 'cedar-os';
import { HumanInTheLoopIndicator } from '@/cedar/components/chatInput/HumanInTheLoopIndicator';
import { useAuth } from '../FirebaseAuthProvider';
import { createNote } from '@/lib/firebase/notes';
import { getUserProfile } from '@/lib/userProfile';
import { getTopNotes } from '@/lib/firebase/notes';
import GlassyPaneContainer from '@/cedar/components/containers/GlassyPaneContainer';
// Cedar side panel and voice removed per requirements
import {
  AgentMessage,
  AgentRole,
  continueDualAgents,
  sendUserToDualAgents,
  startDualAgents,
  summarizeConversation,
} from '@/lib/dualAgentsClient';

interface TriadInterfaceProps {
  className?: string;
}

export default function TriadInterface({ className }: TriadInterfaceProps) {
  const [activeNode, setActiveNode] = useState<number>(0); 
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>("");
  const [hitlState, setHitlState] = useState<"suspended" | "resumed" | "cancelled" | "timeout" | null>(null);
  const continueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const rotation = useMotionValue(0);
  // Track the node currently at the bottom independently of React state
  const bottomNodeRef = useRef<number>(0);

  useEffect(() => {
    // Avoid hydration mismatches by deferring client-only visuals
    setMounted(true);
  }, []);

  interface ConversationState {
    messages: AgentMessage[];
    currentAgent: Exclude<AgentRole, "user">;
    turnCount: number;
    maxTurns: number;
    isRunning: boolean;
    conversationComplete: boolean;
  }

  const [conversation, setConversation] = useState<ConversationState>({
    messages: [],
    currentAgent: "ego",
    turnCount: 0,
    maxTurns: 100,
    isRunning: false,
    conversationComplete: false,
  });

  // Keep latest conversation in a ref to avoid stale closures in timers/async fns
  const conversationRef = useRef<ConversationState>(
    {
      messages: [],
      currentAgent: "ego",
      turnCount: 0,
      maxTurns: 100,
      isRunning: false,
      conversationComplete: false,
    }
  );
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Cedar store integration for messages and human-in-the-loop markers
  const store = useCedarStore((state) => state);
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [mbti, setMbti] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState<{ title: string; content: string; createdAt: string }[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!user?.uid) { if (mounted) setDisplayName(null); return; }
        const prof = await getUserProfile(user.uid);
        if (mounted) {
          setDisplayName(prof?.displayName ?? user.displayName ?? null);
          setMbti((prof as any)?.mbti ?? null);
        }
      } catch {
        if (mounted) setDisplayName(user?.displayName ?? null);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [user?.uid]);

  // Load top 10 recent notes to provide context to agents
  useEffect(() => {
    let cancelled = false;
    const fetchNotes = async () => {
      if (!user?.uid) { setUserNotes([]); return; }
      try {
        const list = await getTopNotes(user.uid, 10);
        if (cancelled) return;
        const brief = list.map((n) => {
          const createdAtISO = (() => {
            try {
              // Firestore Timestamp has toDate(); otherwise assume ISO/string
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const ts: any = n.createdAt;
              if (ts?.toDate) return ts.toDate().toISOString();
              if (typeof ts === 'string') return new Date(ts).toISOString();
              return new Date().toISOString();
            } catch {
              return new Date().toISOString();
            }
          })();
          return {
            title: n.title ?? '',
            content: n.content ?? '',
            createdAt: createdAtISO,
          };
        });
        setUserNotes(brief);
      } catch {
        setUserNotes([]);
      }
    };
    void fetchNotes();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const nodes = [
    {
      id: 0,
      name: 'User',
      icon: <User className="w-8 h-8" />,
    },
    {
      id: 1,
      name: 'Ego',
      icon: <Brain className="w-8 h-8" />,
    },
    {
      id: 2,
      name: 'Superego',
      icon: <Shield className="w-8 h-8" />,
    },
  ];

  const rotateToNodeId = (targetId: number) => {
    console.log('[Triad][rotateToNodeId] request', { targetId, activeNode, isAnimating, bottomNode: bottomNodeRef.current });
    if (isAnimating) {
      console.log('[Triad][rotateToNodeId] skipped (animating)');
      return;
    }

    const currentIndex = nodes.findIndex((node) => node.id === bottomNodeRef.current);
    const targetIndex = nodes.findIndex((node) => node.id === targetId);
    // Choose shortest path (clockwise or counterclockwise)
    const cwSteps = (targetIndex - currentIndex + 3) % 3; // 0..2
    const ccwSteps = cwSteps === 0 ? 0 : cwSteps - 3; // 0, -1, -2
    const steps = Math.abs(ccwSteps) < Math.abs(cwSteps) ? ccwSteps : cwSteps; // prefer shorter travel
    const rotationIncrement = steps * 120;

    setActiveNode(targetId);
    setIsAnimating(true);

    const currentRotation = rotation.get();
    animate(rotation, currentRotation + rotationIncrement, {
      duration: 1.2,
      ease: "easeInOut",
      onComplete: () => {
        bottomNodeRef.current = targetId;
        console.log('[Triad][rotateToNodeId] complete', { targetId, bottomNode: bottomNodeRef.current });
        setIsAnimating(false);
      },
    });
  };

  const handleNodeClick = (nodeId: number) => rotateToNodeId(nodeId);


  const getNodeColor = (nodeId: number) => {
    if (activeNode === nodeId) {
      return '#D4AF37';
    }
    return '#8E9AAF';
  };

  const agentToNodeId = useMemo<Record<AgentRole, number>>(
    () => ({ user: 0, ego: 1, superego: 2 }),
    []
  );

  // Helper: count trailing assistant turns since last user message
  const assistantStreakSinceLastUser = (msgs: AgentMessage[]): number => {
    let count = 0;
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (m.role === 'user' || m.agent === 'user') break;
      if (m.role === 'assistant') count++;
    }
    return count;
  };

  // Decide if we should pause for user instead of auto-continuing
  const shouldPauseForUser = (to: AgentRole | undefined, msgsAfter: AgentMessage[]): boolean => {
    if (to === 'user') return true;
    return false;
  };

  // Occasionally allow a single interjection after [To: User]
  const chooseInterjectionAgent = (
    lastAssistant: Exclude<AgentRole, 'user'> | undefined,
    to: AgentRole | undefined,
    streakSinceUser: number
  ): Exclude<AgentRole, 'user'> | undefined => {
    if (!lastAssistant) return undefined;
    // Only consider interjection when the last message targeted the user
    if (to !== 'user') return undefined;
    // Allow at most one EXTRA assistant reply after the user-targeted message (so streak < 2)
    if (streakSinceUser >= 2) return undefined;
    const rand = Math.random();
    const pick = rand < 0.35 ? (lastAssistant === 'ego' ? 'superego' : 'ego') : undefined;
    console.log('[Triad][interject][decision]', { to, streakSinceUser, lastAssistant, rand: rand.toFixed(2), pick });
    if (pick) return pick;
    return undefined;
  };

  // Parse designated output format anywhere in the string: [To: ...] + [Content: ...]
  const parseDesignatedFormat = (raw: string): { to?: AgentRole; content: string } => {
    if (!raw) return { content: '' };
    let to: AgentRole | undefined;
    let content = raw.trim();
    const toMatch = raw.match(/\[\s*To\s*:\s*(Ego|Superego|User)\s*\]/i);
    if (toMatch) {
      const val = (toMatch[1] || '').toLowerCase();
      if (val === 'ego' || val === 'superego' || val === 'user') to = val as AgentRole;
    }
    const contentMatch = raw.match(/\[\s*Content\s*:\s*([\s\S]*?)\]/i);
    if (contentMatch) {
      content = (contentMatch[1] || '').trim();
    } else {
      // Fallback: strip any leading bracket tokens like [AGENT:...] and keep remainder text
      content = raw.replace(/^(?:\s*\[[^\]]+\])+\s*/, '').trim();
    }
    return { to, content };
  };

  // Conversation controls (reuse dual-agents API)
  const startConversation = async () => {
    setIsLoading(true);
    try {
      const data = await startDualAgents({ maxTurns: conversation.maxTurns, userName: displayName ?? 'User', userMbti: mbti ?? 'INFJ', userNotes });
      if ((data as any)?.error) return;

      const { to, content } = parseDesignatedFormat(data.content ?? '');
      console.log('[Triad][start] parsed', {
        raw: data.content,
        agent: data.agent,
        to,
        content,
      });
      const normalized = { ...data, content } as AgentMessage;

      setConversation((prev) => ({
        ...prev,
        messages: [normalized],
        currentAgent: (data.currentAgent as ConversationState['currentAgent']) ?? prev.currentAgent,
        turnCount: data.turnCount ?? 1,
        isRunning: true,
        conversationComplete: !!data.conversationComplete,
      }));

      // Mirror to Cedar store (normalized content)
      store.addMessage?.({ role: 'assistant', type: 'text', content });

      // 1) Rotate to current speaker first
      if (data.agent) rotateToNodeId(agentToNodeId[data.agent]);
      // 2) After 2s, rotate to addressed target if present
      await new Promise((r) => setTimeout(r, 2000));
      if (to) {
        console.log('[Triad][start] rotating to target', to);
        // If animating still settling, wait a bit
        if (isAnimating) {
          await new Promise((r) => setTimeout(r, 400));
        }
        rotateToNodeId(agentToNodeId[to]);
      }
      // 3) After initial message, decide whether to pause for user or continue (allow possible interjection)
      if (!data.conversationComplete) {
        const msgsAfter = [normalized];
        const streak = assistantStreakSinceLastUser(msgsAfter);
        const interject = chooseInterjectionAgent(data.agent as any, to, streak);
        if (shouldPauseForUser(to, msgsAfter) && !interject) {
          setConversation((prev) => ({ ...prev, isRunning: false }));
        } else {
          await new Promise((r) => setTimeout(r, 3000));
          const nextOverride = interject ?? ((to === 'ego' || to === 'superego') ? (to as Exclude<AgentRole, 'user'>) : undefined);
          if (interject) console.log('[Triad][interject] allowing', interject);
          if (nextOverride) console.log('[Triad][thinking][schedule] next agent:', nextOverride);
          await continueConversation(nextOverride);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const continueConversation = async (overrideAgent?: Exclude<AgentRole, 'user'>) => {
    const snapshot = conversationRef.current;
    if (snapshot.conversationComplete || !snapshot.isRunning) return;
    const thinking = overrideAgent ?? snapshot.currentAgent;
    console.log('[Triad][thinking] agent:', thinking);
    setIsLoading(true);
    try {
      const data = await continueDualAgents({
        messages: snapshot.messages,
        currentAgent: overrideAgent ?? snapshot.currentAgent,
        turnCount: snapshot.turnCount,
        maxTurns: snapshot.maxTurns,
        userName: displayName ?? 'User',
        userMbti: mbti ?? 'INFJ',
        userNotes,
      });
      if ((data as any)?.error) return;
      // Decide next speaker based on [To] or alternate if missing; store normalized content
      const { to, content } = parseDesignatedFormat(data.content ?? '');
      console.log('[Triad][continue] parsed', { raw: data.content, agent: data.agent, to, content });
      const normalized = { ...data, content } as AgentMessage;
      setConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, normalized],
        currentAgent: to && (to === 'ego' || to === 'superego') ? to : prev.currentAgent === 'ego' ? 'superego' : 'ego',
        turnCount: data.turnCount ?? prev.turnCount + 1,
        conversationComplete: !!data.conversationComplete,
      }));
      store.addMessage?.({ role: 'assistant', type: 'text', content });
      if (to) rotateToNodeId(agentToNodeId[to]);
      else if (data.agent) rotateToNodeId(agentToNodeId[data.agent]);
      if (!data.conversationComplete && conversationRef.current.isRunning) {
        const msgsAfter = [...snapshot.messages, normalized];
        const streak = assistantStreakSinceLastUser(msgsAfter);
        const interject = chooseInterjectionAgent(data.agent as any, to, streak);
        if (shouldPauseForUser(to, msgsAfter) && !interject) {
          setConversation((prev) => ({ ...prev, isRunning: false }));
        } else {
          await new Promise((r) => setTimeout(r, 3000));
          const nextTarget: AgentRole | undefined = interject ?? to;
          if (nextTarget === 'ego' || nextTarget === 'superego' || !nextTarget) {
            if (interject) console.log('[Triad][interject] allowing', interject);
            if (nextTarget) console.log('[Triad][thinking][schedule] next agent:', nextTarget);
            await continueConversation(nextTarget as Exclude<AgentRole, 'user'> | undefined);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendUser = async () => {
    const text = userInput.trim();
    if (!text || isLoading) return;
    setIsLoading(true);
    try {
      const data = await sendUserToDualAgents({
        messages: conversation.messages,
        currentAgent: conversation.currentAgent,
        turnCount: conversation.turnCount,
        maxTurns: conversation.maxTurns,
        userInput: text,
        userName: displayName ?? 'User',
        userMbti: mbti ?? 'INFJ',
        userNotes,
      });
      if ((data as any)?.error) return;
      // Log router decision if present
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rc = (data as any)?.routerChoice; // ego|superego|undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rr = (data as any)?.routerRaw as string | undefined;
      if (rc || rr) {
        console.log('[Router][client] choice:', rc, 'raw:', rr);
      }

      // Local user message
      const userMsg: AgentMessage = { role: 'user', content: text, agent: 'user' };
      const { to, content } = parseDesignatedFormat(data.content ?? '');
      console.log('[Triad][sendUser] parsed', {
        raw: data.content,
        agent: data.agent,
        to,
        content,
      });
      const normalized = { ...data, content } as AgentMessage;

      setConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, userMsg, normalized],
        currentAgent: prev.currentAgent, // keep current until we parse response
        turnCount: data.turnCount ?? prev.turnCount + 1,
        conversationComplete: !!data.conversationComplete,
        isRunning: true,
      }));

      // Mirror to Cedar store
      store.addMessage?.({ role: 'user', type: 'text', content: text });

      // 1) Rotate to current speaker (agent), else user
      if (data.agent) rotateToNodeId(agentToNodeId[data.agent!]);
      else rotateToNodeId(agentToNodeId['user']);
      // 2) After 2s, rotate to addressed target if any
      await new Promise((r) => setTimeout(r, 2000));
      if (to) {
        console.log('[Triad][sendUser] rotating to target', to);
        if (isAnimating) {
          await new Promise((r) => setTimeout(r, 400));
        }
        rotateToNodeId(agentToNodeId[to]);
      }

      store.addMessage?.({ role: 'assistant', type: 'text', content });

      if (!data.conversationComplete && conversationRef.current.isRunning) {
        const msgsAfter = [...conversation.messages, userMsg, normalized];
        const streak = assistantStreakSinceLastUser(msgsAfter);
        const interject = chooseInterjectionAgent(data.agent as any, to, streak);
        if (shouldPauseForUser(to, msgsAfter) && !interject) {
          setConversation((prev) => ({ ...prev, isRunning: false }));
        } else {
          if (continueTimerRef.current) clearTimeout(continueTimerRef.current);
          const nextOverride = interject ?? ((to === 'ego' || to === 'superego') ? (to as Exclude<AgentRole, 'user'>) : undefined);
          continueTimerRef.current = setTimeout(() => {
            if (!conversationRef.current.isRunning) return;
            if (interject) console.log('[Triad][interject] allowing', interject);
            console.log('[Triad][thinking][schedule] next agent:', nextOverride ?? conversationRef.current.currentAgent);
            void continueConversation(nextOverride);
          }, 3000);
        }
      }
      setUserInput("");
    } finally {
      setIsLoading(false);
    }
  };

  const stopConversation = () => {
    setConversation((prev) => ({ ...prev, isRunning: false }));
    setHitlState('suspended');
    if (continueTimerRef.current) {
      clearTimeout(continueTimerRef.current);
      continueTimerRef.current = null;
    }
    // Add HITL marker to Cedar store
    store.addMessage?.({ role: 'assistant', type: 'humanInTheLoop', state: 'suspended' as any });
  };

  const resumeConversation = () => {
    setHitlState('resumed');
    setConversation((prev) => ({ ...prev, isRunning: true }));
    // Nudge the loop
    continueTimerRef.current = setTimeout(() => continueConversation(), 100);
  };

  const endAndSave = async () => {
    // Summarize current messages (excluding system-only fields if any)
    try {
      const result = await summarizeConversation({ messages: conversation.messages });
      const titleRaw = (result as any)?.title as string | undefined;
      const summaryRaw = (result as any)?.summary as string | undefined;
      const tagsRaw = (result as any)?.tags as string[] | undefined;

      const title = (titleRaw ?? '').split(/\s+/).slice(0, 10).join(' ').trim() || 'Conversation Summary';
      const content = (summaryRaw ?? '').split(/\s+/).slice(0, 50).join(' ').trim() || 'No summary available.';
      const tags = (tagsRaw && tagsRaw.length ? tagsRaw : ['conversation']).slice(0, 7);

      // Save to Firestore if signed in
      let saved = false;
      if (user?.uid) {
        try {
          await createNote(user.uid, {
            uid: user.uid,
            title,
            content,
            tags,
            category: 'conversation',
            priority: 'medium',
            isPinned: false,
            isArchived: false,
          });
          saved = true;
        } catch {
          saved = false;
        }
      }

      // Also surface to user
      alert(user?.uid && saved ? 'Saved!' : 'Something went wrong');
    } catch (e) {
      // Best-effort; still reset
      console.warn('Summarize failed', e);
    }

    if (continueTimerRef.current) {
      clearTimeout(continueTimerRef.current);
      continueTimerRef.current = null;
    }
    setConversation({
      messages: [],
      currentAgent: 'ego',
      turnCount: 0,
      maxTurns: 100,
      isRunning: false,
      conversationComplete: false,
    });
    setUserInput("");
    setIsLoading(false);
    setHitlState(null);
    store.addMessage?.({ role: 'assistant', type: 'humanInTheLoop', state: 'cancelled' as any });
    // Reset rotation to put User at bottom
    setActiveNode(0);
    bottomNodeRef.current = 0;
    animate(rotation, 0, { duration: 0.6, ease: 'easeInOut' });
  };

  // Removed auto-continue effect in favor of sequential chaining after each response/TTS

  return (
    <TriadBackground className={cn("w-full h-screen", className)}>
        <div className="relative w-full h-full overflow-hidden">
          {/* Controls overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <Container3D className="px-3 py-2 flex items-center gap-2">
              {!conversation.isRunning && conversation.messages.length === 0 && (
                <button
                  onClick={startConversation}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  {isLoading ? 'Starting…' : 'Start'}
                </button>
              )}
              {conversation.isRunning && !conversation.conversationComplete && (
                <button
                  onClick={stopConversation}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              )}
              {!conversation.isRunning && conversation.messages.length > 0 && !conversation.conversationComplete && (
                <button
                  onClick={resumeConversation}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              )}
              <button
                onClick={endAndSave}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                title="Summarize conversation, then reset"
              >
                <RotateCcw className="w-4 h-4" />
                End & Save
              </button>
              {/* Turn counter removed per requirement */}
            </Container3D>
          </div>

          {/* Greeting badge */}
          {displayName && (
            <div className="absolute top-4 left-4 z-20">
          <GlassyPaneContainer className="px-4 py-2 text-white/90 backdrop-blur-md">
            <span className="font-semibold">Hello, {displayName}{mbti ? ` · ${mbti}` : ''}</span>
              </GlassyPaneContainer>
            </div>
          )}

          {/* Human-in-the-loop indicator */}
          {hitlState && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
              <HumanInTheLoopIndicator state={hitlState} />
            </div>
          )}

          {/* User input overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4">
            <Container3D className="w-full p-3">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendUser()}
                  placeholder="Speak as User…"
                  className="flex-1 px-3 py-2 rounded-md bg-white/90 text-gray-900 focus:outline-none"
                  disabled={isLoading}
                />
                {conversation.isRunning && (
                  <button
                    onClick={stopConversation}
                    className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
                    title="Stop agents so you can talk"
                  >
                    Stop
                  </button>
                )}
                <button
                  onClick={sendUser}
                  disabled={!userInput.trim() || isLoading}
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </Container3D>
          </div>

          <div className="absolute inset-0 flex items-center justify-center" suppressHydrationWarning>
            <div className="relative w-[80vh] h-[80vh] aspect-square">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                <motion.circle
                  cx="200"
                  cy="200"
                  r="120"
                fill="none"
                stroke="#F7F5F3"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            </svg>

            {nodes.map((node) => {
              const nodeIndex = nodes.findIndex(n => n.id === node.id);
              
                const x = useTransform(rotation, (r) => {
                  const angle = (nodeIndex * 120 - r) * (Math.PI / 180);
                  return 200 + 120 * Math.sin(angle);
                });
                
                const y = useTransform(rotation, (r) => {
                  const angle = (nodeIndex * 120 - r) * (Math.PI / 180);
                  return 200 + 120 * Math.cos(angle);
                });

              
              return (
                <motion.div
                  key={node.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: useTransform(x, (val) => `${(val / 400) * 100}%`),
                    top: useTransform(y, (val) => `${(val / 400) * 100}%`),
                    scale: activeNode === node.id ? 1.1 : 1,
                  }}
                >
                  <Flat3dContainer
                    primaryColor={getNodeColor(node.id)}
                    className={cn(
                      "w-32 h-32 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-1000",
                      activeNode === node.id && "ring-4 ring-white/30"
                    )}
                    onClick={() => handleNodeClick(node.id)}
                  >
                    <div className="text-white mb-2">
                      {node.icon}
                    </div>
                    <div className="text-sm font-semibold text-white text-center">
                      {node.name}
                    </div>
                  </Flat3dContainer>

                {/* Speech bubble for latest message of this node */}
                {/* Bubbles hidden per requirement: conversation is shown only in the sidebar */}
                </motion.div>
              );
            })}
          </div>
        </div>
        {/* Outer message rail */}
        <div className="pointer-events-none absolute inset-0">
          {/* top rail for bubbles to avoid overlapping the circle */}
          <div className="absolute top-8 left-0 right-0 flex justify-center gap-12">
            {/* latest assistant message centered above */}
          </div>
        </div>
        {/* Sidebar transcript */}
        <div className="absolute right-8 top-24 bottom-6 w-[20rem] pointer-events-auto">
          <Container3D className="h-full p-3 text-sm flex flex-col">
            <div className="font-semibold mb-2 flex-shrink-0">Conversation</div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
              {conversation.messages.map((m, idx) => (
                <div key={idx} className="grid grid-cols-[5rem_1fr] items-start gap-2">
                  <div className={cn(
                    'text-right pr-2 font-semibold',
                    m.agent === 'user' ? 'text-green-700' : m.agent === 'ego' ? 'text-blue-700' : 'text-purple-700'
                  )}>
                    {m.agent === 'user' ? 'User' : m.agent === 'ego' ? 'Ego' : 'Superego'}:
                  </div>
                  <div className="text-gray-900 dark:text-gray-100 leading-relaxed">
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          </Container3D>
        </div>
      </div>
    </TriadBackground>
  );
}
