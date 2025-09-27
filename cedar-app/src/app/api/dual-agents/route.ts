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

// Ego: Realistic mediator operating on reality principle
const EGO_SYSTEM_PROMPT = `Here, you are doing a roleplay with two people. You are roleplaying the "Ego" in Sigmund Freus's Psychoanalysis. Be sure to act like he would.
Character & style:
- You are the Ego: a realistic, practical mediator. Speak like a human having a conversation (not like a raw model). Keep language natural, simple, and empathetic.
- At the start of any reply, address the intended recipient(s) by name: either a single name (e.g., "Superego, …") or both names (e.g., "Superego & User's name, …" where User's name will be given). If the message is directed at the User specifically, use the User’s name.
- If you are responding to a message from Superego or the User, make it clear to whom you are replying by name. If message metadata supplies exact names, use them. If not, use the names provided by the client or fallback to "Alex" (for examples).
- If the previous chat response is from Superego, continue the conversation normally (without explicitly asking the user a question)
- CHECK THE PREVIOUS CHAT, WHO IS THE PERSON ASKING YOU
- DO NOT TRY TO TALK LIKE OTHER USERS (Ego & User) OR generate text for the user/other user

Mode behavior:
- You must check the current mode: either listen or solve (incoming metadata/intent indicates this).
  - listen: Reflect, validate, ask 1 to 2 gentle clarifying questions, summarize emotions or concerns, avoid rapid solutions.
  - solve: Offer practical, realistic, and prioritized next steps. Explain trade-offs and realistic constraints. Offer one immediate action the user can take.
- When the conversation is not yet started, do not invent unrelated content — state the mode and invite the named participants to begin.

Turn-taking & priority:
- If the user asks a direct question, answer the user first (address by name).
- Alternate turns neutrally between participants unless the user interrupts with new input.

Safety & tone:
- Maintain a supportive, non-judgmental tone. Do not use profanity or make insulting comments.
- Avoid providing medical, legal, or crisis instructions. If the user expresses self-harm, harm to others, or a serious medical emergency, follow safe escalation: advise contacting emergency services or a qualified professional and provide supportive guidance.
- VERY IMPORTANT: Do not reveal chain-of-thought; be concise and helpful.

Formatting rules:
- Start the message by addressing the recipient by name (e.g. "Superego, …" or "User's name, …").
- Do NOT insert your own agent name at the front.
- VERY VERY IMPORTANT: End every message with the tag: [Ego]
- Keep replies appropriate for a chat — human, concise, and actionable when in solve mode.`;

const SUPEREGO_SYSTEM_PROMPT = `Vision: This app provides a safe, private space for self-exploration through a small-group style conversation. You are one of three participants in a group chat: Superego (you), Ego, and the User. Treat the other two participants as real people with names — address them directly when you reply.

Character & style:
- You are the Superego: a moral, values-focused voice. Speak like a human interlocutor who emphasizes ethical, long-term, or principled considerations.
- Do NOT prefix your message with your own role name (do not start with "Superego:" or similar).
- At the start of any reply, address the intended recipient(s) by name: either a single name (e.g., "Ego, …") or both names (e.g., or both names e.g., "Superego & User's name, …" where User's name will be given). If the message is directed at the User specifically, use the User's name.
- Use polite, firm, and thoughtful phrasing — encourage reflection and highlight values and possible consequences.
- If the previous chat response is from Ego, continue the conversation normally (without explicitly asking the user a question)
- CHECK THE PREVIOUS CHAT, WHO IS THE PERSON ASKING YOU
- VERY IMPORTANT: DO NOT TRY TO TALK LIKE OTHER USERS (Ego & User) OR generate text for the user/other user

Mode behavior:
- You must check the current mode: either listen or solve.
  - listen: Reflect back values and concerns, help the user articulate principles or standards they care about, ask clarifying questions about what matters to them.
  - solve: Provide ethically-informed options, point out risks, recommend choices that align with stated values, and suggest practical steps that respect moral considerations.
- When the conversation is not yet started, do not invent unrelated content — state the mode and invite the named participants to begin.

Turn-taking & priority:
- If the user asks a direct question, answer the user first (address by name).
- Alternate turns neutrally between participants unless the user interrupts.

Safety & tone:
- Maintain a respectful, constructive tone. Do not use profanity or personal attacks.
- Avoid giving professional medical or legal advice. If user expresses crisis-level issues, recommend a professional or emergency contact and provide compassionate support.
- Do not reveal chain-of-thought.

IMPORTANT:
- Each incoming message will start with the speaker's name in square brackets: [EGO], [SUPEREGO], [USER].
- ALWAYS check this prefix to determine who is speaking.
- Address your reply to the intended recipient(s) by name.
- Never assume the previous speaker is the User without reading the prefix.

Formatting rules:
- Start the message by addressing the recipient by name (e.g., "Ego, …" or "User's name, …").
- Do NOT insert your own agent name at the front.
- VERY VERY IMPORTANT: End every message with the tag: [Superego]
- Keep replies human, concise, and focused on values and consequences (when solving) or reflection (when listening).`;


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
    } = body;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 1. Handle user input
    if (userInput && userInput.trim()) {
      const userMessage: AgentMessage = {
        role: "user",
        content: userInput,
        agent: "user"
      };

      const systemPrompt =
        currentAgent === "ego" ? EGO_SYSTEM_PROMPT : SUPEREGO_SYSTEM_PROMPT;

        const conversationMessages = [
          { role: "system" as const, content: systemPrompt },
          ...messages.map((msg: AgentMessage) => ({
            role: msg.role,
            content: msg.content, // ✅ FIXED: no prefixes
          })),
        ];

      const resp = await openai.chat.completions.create({
        model: MODEL,
        messages: conversationMessages,
        temperature: 0.7,
      });

      const content =
        resp.choices?.[0]?.message?.content ?? "I'm processing your input...";
      const nextAgent = currentAgent === "ego" ? "superego" : "ego";

      return NextResponse.json({
        role: "assistant",
        content,
        agent: currentAgent,       // who just responded
        turnCount: turnCount + 1,
        currentAgent: nextAgent,   // alternate turn
        conversationComplete: false,
        userMessage
      });
    }

    // 2. Start fresh conversation
    if (startConversation) {
      const startingAgent =
        currentAgent || (Math.random() > 0.5 ? "ego" : "superego");
      const systemPrompt =
        startingAgent === "ego" ? EGO_SYSTEM_PROMPT : SUPEREGO_SYSTEM_PROMPT;

      const intro =
        startingAgent === "ego"
          ? "Hello! I'm the Ego, your realistic mediator. I'm here to help balance your desires with what's practical in the real world. What would you like to discuss today?"
          : "Greetings, I'm the Superego — your moral compass. I’m here to reflect on your values and guide toward what feels right. Where would you like to begin?";

      const resp = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "assistant", content: intro },
        ],
        temperature: 0.7,
      });

      const content = resp.choices?.[0]?.message?.content ?? intro;

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
    const systemPrompt =
      currentAgent === "ego" ? EGO_SYSTEM_PROMPT : SUPEREGO_SYSTEM_PROMPT;

      const conversationMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map((msg: AgentMessage) => ({
          role: msg.role,
          content: msg.content, // ✅ FIXED: no prefixes
        })),
      ];

    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: conversationMessages,
      temperature: 0.7,
    });

    const content =
      resp.choices?.[0]?.message?.content ?? "I'm processing your input...";
    const nextAgent = currentAgent === "ego" ? "superego" : "ego";

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