// app/api/dual-agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const MODEL = "gpt-4o-mini";

function assertEnv() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }
}

interface AgentMessage {
  role: "system" | "user" | "assistant";
  content: string;
  agent?: "ego" | "superego" | "user";
}

function isBracketOutputValid(text: string): boolean {
  if (!text) return false;
  const toAndContent = /\[\s*To\s*:\s*(Ego|Superego|User)\s*\]\s*\[\s*Content\s*:\s*[\s\S]*?\]/i;
  return toAndContent.test(text);
}

function withAgentTag(msg: AgentMessage): string {
  if (msg.role === "assistant" && msg.agent && msg.agent !== "user") {
    const tag = `[AGENT:${msg.agent.toUpperCase()}]`;
    // Also surface [To: ...] if present so downstream agents and the router can see target quickly
    const toMatch = msg.content.match(/\[\s*To\s*:\s*(Ego|Superego|User)\s*\]/i);
    const toTag = toMatch ? `[TO:${(toMatch[1] || '').toUpperCase()}]` : '';
    return `${tag}${toTag ? ` ${toTag}` : ''}\n${msg.content}`;
  }
  return msg.content;
}
function extractToTarget(text: string): "ego" | "superego" | "user" | undefined {
  const m = text.match(/\[\s*To\s*:\s*(Ego|Superego|User)\s*\]/i);
  if (!m) return undefined;
  const val = (m[1] || '').toLowerCase();
  if (val === 'ego' || val === 'superego' || val === 'user') return val as any;
  return undefined;
}

function getLastAssistantAddressed(
  messages: AgentMessage[]
): "ego" | "superego" | "user" | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "assistant" && m.content) {
      const t = extractToTarget(m.content);
      if (t) return t;
    }
  }
  return undefined;
}

function getAgentReplyCounts(messages: AgentMessage[]): { ego: number; superego: number } {
  let ego = 0;
  let superego = 0;
  for (const m of messages) {
    if (m.role === "assistant") {
      if (m.agent === "ego") ego++;
      if (m.agent === "superego") superego++;
    }
  }
  return { ego, superego };
}

function getSilentAssistantTurns(messages: AgentMessage[]): { ego: number; superego: number } {
  let count = 0;
  let lastEgo = -1;
  let lastSuperego = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === 'assistant') {
      count++;
      if (lastEgo === -1 && m.agent === 'ego') lastEgo = count;
      if (lastSuperego === -1 && m.agent === 'superego') lastSuperego = count;
      if (lastEgo !== -1 && lastSuperego !== -1) break;
    }
  }
  return {
    ego: lastEgo === -1 ? count : lastEgo,
    superego: lastSuperego === -1 ? count : lastSuperego,
  };
}

function getLastSpeaker(messages: AgentMessage[]): "user" | "ego" | "superego" | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.agent === "user" || m.agent === "ego" || m.agent === "superego") return m.agent;
    if (m.role === "user") return "user";
  }
  return undefined;
}

function coerceToWhenUser(content: string, lastSpeaker?: "user" | "ego" | "superego" | undefined): string {
  if (!content) return content;
  const onlyContent = /^\s*\[\s*Content\s*:\s*[\s\S]*?\]\s*$/i;
  if (onlyContent.test(content) && lastSpeaker === "user") {
    // Prepend [To: User] in a safe way
    return content.replace(/^\s*/i, "[To: User] ");
  }
  return content;
}

// Ego: Realistic mediator operating on reality principle
const EGO_SYSTEM_PROMPT = `You are roleplaying the Ego in Freud's psychoanalysis.

User context:
- MBTI: INFJ

Character & style:
- You are the Ego: realistic, practical mediator. Friendly, upbeat, and specific. Use approachable, everyday language.
- Focus on concrete steps, constraints, and trade-offs.
- Avoid moral/values framing (leave that to Superego).
- Do not reveal chain-of-thought; answer directly and helpfully.

Grounding & continuity:
- You will receive the prior conversation. Read it carefully, stay on topic, and maintain continuity with facts already stated.
- If the User speaks, respond to the User first; otherwise consider the Superego's last point.

 Turn-taking:
 - One speaker at a time. You MUST specify a target in [To: ...] for every reply.
 - When the other agent addresses you explicitly (their last message contains [To: Ego]), you MUST reply to them next and include [To: Superego|User] appropriately.
- If the User hasn't replied for one full turn and your last message did not address anyone, hand off to the other agent at least every 2 turns by asking them ONE crisp question using [To: Superego].

 Output format (STRICT):
 - Always include an explicit target: [To: Ego|Superego|User] [Content: <NameOfAddressee>: <your reply>]
   - If [To: User], prefix Content with "User: "; if [To: Ego], use "Ego: "; if [To: Superego], use "Superego: ".
 - Do NOT include any greeting lines, role prefixes, or signatures outside the brackets.

Length:
- Keep replies concise: at most 30 words.

Examples (do and don't):
- Good: [To: User] [Content: Let’s focus on one small step you can try today.]
- Good: [To: Superego] [Content: I’m concerned about feasibility—what value trade-offs do you see?]
 - Good: [To: Superego] [Content: Superego: From a practical angle, we might test this idea before deciding.]
- Bad: Ego: Hi there!
- Bad: [Content: What would you like to discuss today?] // too generic; avoid placeholders

Safety:
- Avoid medical/legal instructions; use supportive, non-judgmental tone.`;

const SUPEREGO_SYSTEM_PROMPT = `You are roleplaying the Superego in Freud's psychoanalysis.

User context:
- MBTI: INFJ

Character & style:
- You are the Superego: values-focused, ethical voice. Warm yet firm; emphasize principles, long‑term meaning, and impacts on others.
- Emphasize values, principles, consequences. Avoid purely practical step lists (leave that to Ego).
- Do not reveal chain-of-thought.

Grounding & continuity:
- You will receive the prior conversation. Read it carefully, stay on topic, and maintain continuity with facts already stated.
- If the User speaks, respond to the User first; otherwise consider the Ego's last point.

 Turn-taking:
 - One speaker at a time. You MUST specify a target in [To: ...] for every reply.
 - When the other agent addresses you explicitly (their last message contains [To: Superego]), you MUST reply to them next and include [To: Ego|User] appropriately.
- If the User hasn't replied for one full turn and your last message did not address anyone, hand off to the other agent at least every 2 turns by asking them ONE crisp question using [To: Ego].

 Output format (STRICT):
 - Always include an explicit target: [To: Ego|Superego|User] [Content: <NameOfAddressee>: <your reply>]
   - If [To: User], prefix Content with "User: "; if [To: Ego], use "Ego: "; if [To: Superego], use "Superego: ".
 - Do NOT include any greeting lines, role prefixes, or signatures outside the brackets.

Length:
- Keep replies concise: at most 30 words.

Examples (do and don't):
- Good: [To: User] [Content: Let’s align choices with what matters most to you.]
- Good: [To: Ego] [Content: Values suggest clarity and honesty should guide next actions.]
 - Good: [To: Ego] [Content: Ego: Ethically, transparency with yourself here seems important.]
- Bad: Superego: Hello!
- Bad: [Content: What would you like to discuss today?] // too generic; avoid placeholders

Safety:
- Avoid medical/legal advice; be respectful and supportive.`;

const ROUTER_SYSTEM_PROMPT = `You are a router agent coordinating turns between two agents (Ego, Superego) and the User.

Goal:
- Choose the single best responder (Ego or Superego) to reply to the latest USER message, considering history.
- Balance participation over time so both agents engage.

If the user's instruction mentions both agents (e.g., "Ego ...; Superego ..." or "discuss between yourselves" or "debate"), then the next 1-2 turns should be inter-agent collaboration before returning to the User:
- In that case, set a Collaboration Plan in the reason, like: [Reason: Collaboration — Ego proposes; Superego critiques]. Optionally provide a short guidance directive to the chosen agent in [Guidance: ...], e.g., [Guidance: Ask Superego to add a brief follow-up].

Signal of decision (STRICT):
- Output ONLY ONE LINE in ANY of these accepted formats:
  - AGENT: Ego
  - AGENT: Superego
  - [Responder: Ego]
  - [Responder: Superego]
  - [To: Ego]
  - [To: Superego]
You MAY include optional brackets after the selection:
  - [Guidance: <12-word directive for the chosen agent>]
  - [Reason: <short rationale>]
`;

function parseRouterResponder(text: string): "ego" | "superego" | undefined {
  if (!text) return undefined;
  // AGENT: Ego
  const m1 = text.match(/AGENT\s*:\s*(Ego|Superego)/i);
  if (m1) return m1[1].toLowerCase() as "ego" | "superego";
  // [Responder: Ego]
  const m2 = text.match(/\[\s*Responder\s*:\s*(Ego|Superego)\s*\]/i);
  if (m2) return m2[1].toLowerCase() as "ego" | "superego";
  // [To: Ego]
  const m3 = text.match(/\[\s*To\s*:\s*(Ego|Superego)\s*\]/i);
  if (m3) return m3[1].toLowerCase() as "ego" | "superego";
  return undefined;
}

function parseRouterGuidance(text: string): string | undefined {
  const g = text.match(/\[\s*Guidance\s*:\s*([^\]]+)\]/i);
  return g?.[1]?.trim();
}

function parseRouterReason(text: string): string | undefined {
  const r = text.match(/\[\s*Reason\s*:\s*([^\]]+)\]/i);
  return r?.[1]?.trim();
}


export async function POST(req: NextRequest) {
  try {
    assertEnv();
    const body = await req.json().catch(() => ({}));
    
    const {
      messages = [],
      currentAgent = "ego", // default
      turnCount = 0,
      maxTurns = 100,
      startConversation = false,
      userInput = "",
      summarize = false,
    } = body;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 0. Summarize conversation
    if (summarize) {
      const transcript = (messages as AgentMessage[]).map((m) => {
        const speaker = m.agent ? m.agent : m.role;
        return `${speaker.toUpperCase()}: ${m.content}`;
      }).join("\n");

      const SUM_SYSTEM = `You summarize a dialogue between User, Ego, and Superego.
Return STRICT JSON with keys: { "title": string <= 10 words, "summary": string <= 50 words, "tags": string[3..7] }.
No extra text.
Guidance:
- title: a concise 10-word max headline
- summary: <= 50 words, readable
- tags: 3-7 short key takeaways (no punctuation)\n`;

      const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: SUM_SYSTEM },
          { role: "user", content: `Summarize this conversation succinctly as STRICT JSON only:\n\n${transcript}` },
        ],
      });
      const text = completion.choices?.[0]?.message?.content?.trim() ?? "";
      let title: string | undefined;
      let summary: string | undefined;
      let tags: string[] | undefined;
      try {
        const json = JSON.parse(text);
        title = typeof json?.title === 'string' ? json.title : undefined;
        summary = typeof json?.summary === 'string' ? json.summary : undefined;
        tags = Array.isArray(json?.tags) ? json.tags.filter((t: any) => typeof t === 'string') : undefined;
      } catch {
        summary = text; // fallback to raw text
      }
      return NextResponse.json({ ok: true, title, summary, tags });
    }

    // 1. Handle user input
    if (userInput && userInput.trim()) {
      const userMessage: AgentMessage = {
        role: "user",
        content: userInput,
        agent: "user",
      };

      // Router agent to select responding agent (ego or superego)
      const routerMessages = [
        { role: "system" as const, content: ROUTER_SYSTEM_PROMPT },
        ...messages.map((msg: AgentMessage) => ({
          role: msg.role,
          content: withAgentTag(msg),
        })),
        { role: "user" as const, content: userInput },
      ];

      let routerChoice: "ego" | "superego" | undefined;
      let routerText = "";
      try {
        const routerResp = await openai.chat.completions.create({
          model: MODEL,
          messages: routerMessages,
          temperature: 0.2,
        });
        routerText = routerResp.choices?.[0]?.message?.content ?? "";
        console.log('[Router][raw]', routerText);
        routerChoice = parseRouterResponder(routerText);
        console.log('[Router][parsed]', routerChoice);
      } catch {}

      // Bias chosen agent using recent conversation context
      const lastAddressed = getLastAssistantAddressed(messages);
      const counts0 = getAgentReplyCounts(messages);
      let chosenAgent = routerChoice ?? currentAgent ?? (Math.random() > 0.5 ? "ego" : "superego");
      // If last assistant explicitly addressed the other agent, hand off
      if (lastAddressed === "ego" || lastAddressed === "superego") {
        chosenAgent = lastAddressed;
      }
      // Balance heuristic: if one agent has replied 2+ more times, pick the other when router is ambiguous
      if (!routerChoice) {
        if (counts0.ego - counts0.superego >= 2) chosenAgent = "superego";
        if (counts0.superego - counts0.ego >= 2) chosenAgent = "ego";
      }
      // Silence heuristic: prefer the most silent assistant in the last few turns (light touch)
      const sil = getSilentAssistantTurns(messages);
      if (!routerChoice) {
        if (sil.ego >= 6) chosenAgent = "ego";
        if (sil.superego >= 6) chosenAgent = "superego";
      }
      const lastAssistantAddressed2 = getLastAssistantAddressed(messages);
      const counts1 = getAgentReplyCounts(messages);
      const sil1 = getSilentAssistantTurns(messages);
      const guidance = parseRouterGuidance(routerText);
      const reason = parseRouterReason(routerText);
      const systemPrompt = (chosenAgent === "ego" ? EGO_SYSTEM_PROMPT : SUPEREGO_SYSTEM_PROMPT) +
        `\n\nContext hints:\n- Last assistant addressed: ${lastAssistantAddressed2 ?? 'none'}\n- Reply balance — Ego: ${counts1.ego}, Superego: ${counts1.superego}\n- Silent streak — Ego: ${sil1.ego}, Superego: ${sil1.superego}` +
        (guidance ? `\n- Router guidance: ${guidance}` : "") +
        (reason ? `\n- Collaboration plan: ${reason}` : "");

      const conversationMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map((msg: AgentMessage) => ({
          role: msg.role,
          content: withAgentTag(msg),
        })),
        { role: "user" as const, content: userInput },
      ];

      const resp = await openai.chat.completions.create({
        model: MODEL,
        messages: conversationMessages,
        temperature: 0.7,
      });

      let content = resp.choices?.[0]?.message?.content ?? "";
      if (!isBracketOutputValid(content)) {
        const reform = await openai.chat.completions.create({
          model: MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Reformat to STRICT: Always produce [To: Ego|Superego|User] [Content: <AddresseeName>: <reply>] with no extra text. Original: ${content}` },
          ],
          temperature: 0.2,
        });
        content = reform.choices?.[0]?.message?.content ?? content;
      }
      // Ensure [To: User] when replying to a user message
      content = coerceToWhenUser(content, "user");

      const nextAgent = chosenAgent === "ego" ? "superego" : "ego";

      return NextResponse.json({
        role: "assistant",
        content,
        agent: chosenAgent,
        turnCount: turnCount + 1,
        currentAgent: nextAgent,
        conversationComplete: false,
        userMessage,
        routerRaw: routerText,
        routerChoice,
      });
    }

    // 2. Start fresh conversation
    if (startConversation) {
      const startingAgent = currentAgent || (Math.random() > 0.5 ? "ego" : "superego");
      const lastAssistantAddressed = getLastAssistantAddressed(messages);
      const counts2 = getAgentReplyCounts(messages);
      const systemPrompt = (startingAgent === "ego" ? EGO_SYSTEM_PROMPT : SUPEREGO_SYSTEM_PROMPT) +
        `\n\nContext hints:\n- Last assistant addressed: ${lastAssistantAddressed ?? 'none'}\n- Reply balance — Ego: ${counts2.ego}, Superego: ${counts2.superego}`;

      const seed = `SESSION START:\nWrite a single short opener in STRICT brackets. If the User has not spoken yet, begin with a brief greeting and an engaging opener, directed to [To: User]. Avoid generic placeholders. Ask ONE specific, empathetic question OR propose ONE concrete next step. Output ONLY bracket blocks.`;

      let resp = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: seed },
        ],
        temperature: 0.7,
      });

      let content = resp.choices?.[0]?.message?.content ?? "";
      if (!isBracketOutputValid(content)) {
        const reform = await openai.chat.completions.create({
          model: MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Reformat to STRICT: Always produce [To: Ego|Superego|User] [Content: <AddresseeName>: <reply>] with no extra text. Original: ${content}` },
          ],
          temperature: 0.2,
        });
        content = reform.choices?.[0]?.message?.content ?? content;
      }
      // Coerce [To: User] if the last speaker in history was the user and [To] is missing
      const lastSpeaker = getLastSpeaker(messages);
      content = coerceToWhenUser(content, lastSpeaker);

      return NextResponse.json({
        role: "assistant",
        content,
        agent: startingAgent,
        turnCount: 1,
        currentAgent: startingAgent === "ego" ? "superego" : "ego",
        conversationComplete: false
      });
    }

    // 3. End conversation check
    if (turnCount >= maxTurns) {
      return NextResponse.json({
        role: "assistant",
        content:
          "Our conversation has reached its natural conclusion. Thank you for this thoughtful exchange!",
        agent: currentAgent,
        turnCount,
        currentAgent,
        conversationComplete: true
      });
    }

    // 4. Normal turn-taking (no new user input)
    const lastAssistantAddressed = getLastAssistantAddressed(messages);
    const counts4 = getAgentReplyCounts(messages);
    const systemPrompt = (currentAgent === "ego" ? EGO_SYSTEM_PROMPT : SUPEREGO_SYSTEM_PROMPT) +
      `\n\nContext hints:\n- Last assistant addressed: ${lastAssistantAddressed ?? 'none'}\n- Reply balance — Ego: ${counts4.ego}, Superego: ${counts4.superego}`;

    const conversationMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map((msg: AgentMessage) => ({
          role: msg.role,
          content: withAgentTag(msg),
        })),
      ];

    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: conversationMessages,
      temperature: 0.7,
    });

    let content = resp.choices?.[0]?.message?.content ?? "";
    if (!isBracketOutputValid(content)) {
      const reform = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Reformat to STRICT: Always produce [To: Ego|Superego|User] [Content: <AddresseeName>: <reply>] with no extra text. Original: ${content}` },
        ],
        temperature: 0.2,
      });
      content = reform.choices?.[0]?.message?.content ?? content;
    }
    // If agent addressed the other agent explicitly, switch to that as currentAgent; if it addressed itself, hand off to the other agent; else alternate
    const addressed = extractToTarget(content);
    let nextAgent: "ego" | "superego";
    if (addressed === 'ego' || addressed === 'superego') {
      nextAgent = addressed === currentAgent ? (currentAgent === 'ego' ? 'superego' : 'ego') : addressed;
    } else {
      nextAgent = currentAgent === 'ego' ? 'superego' : 'ego';
    }

    return NextResponse.json({
      role: "assistant",
      content,
      agent: currentAgent,
      turnCount: turnCount + 1,
      currentAgent: nextAgent,
      conversationComplete: turnCount + 1 >= maxTurns
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    assertEnv();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") ?? "start";

    if (action === "start") {
      return NextResponse.json({
        message: "Ego-Superego System Ready",
        agents: {
          ego: "Ego - Realistic mediator operating on reality principle",
          superego: "Superego - Moral compass enforcing rules and ideals"
        },
        maxTurns: 100
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}