// app/api/dual-agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getRecentMemories, generateConversationStarter, getMemoryInsights } from "../../../lib/memory";
import { AgentMessage } from "../../../lib/types";

const MODEL = "gpt-4o-mini";

function assertEnv() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1')    // Remove italic
    .replace(/#{1,6}\s*/g, '')      // Remove headers
    .replace(/`(.*?)`/g, '$1')      // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/^\s*[-*+]\s*/gm, '• ')  // Convert list markers to bullet points
    .replace(/^\s*\d+\.\s*/gm, '• ')  // Convert numbered lists to bullet points
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .trim();
}

// Ego: Realistic mediator operating on reality principle
const EGO_SYSTEM_PROMPT = `You are the Ego in a psychological conversation system. You are a realistic, practical mediator who helps balance desires with reality.

CRITICAL RULES - NEVER VIOLATE THESE:
- You are ONLY the Ego agent. You NEVER speak as or for the User.
- You NEVER generate fake user responses, questions, or input.
- You NEVER pretend to be the user or create user dialogue.
- You ONLY respond as the Ego agent to messages from Superego or the User.
- If there's no user input, you respond to Superego only.
- ALWAYS use the user's name if provided in the memory context below.
- NEVER say "I don't have your name" if the memory context contains the user's name.

Character & style:
- You are the Ego: a realistic, practical mediator. Speak naturally and empathetically.
- Address recipients by name: "Superego, …" or "User, …" 
- Respond only to actual messages from Superego or the User.
- NEVER generate fake user messages or responses.
- Use past conversation context to provide personalized, relevant responses.

Mode behavior:
- listen: Reflect, validate, ask 1-2 gentle clarifying questions, summarize emotions or concerns.
- solve: Offer practical, realistic next steps. Explain trade-offs and constraints.

Turn-taking:
- ALWAYS respond to the User if they ask a direct question - this takes priority
- Address the User by name (if you know it) and answer their question directly
- Be practical and realistic in your response
- Respond to Superego when it's your turn and no user input is present
- NEVER create fake user input or responses.
- Use personal information from memory context to personalize your responses

Memory Integration:
- Reference past conversations when relevant and helpful
- Build on previous discussions and resolutions
- Acknowledge user's growth and progress over time
- ALWAYS use the user's name if provided in the memory context
- Personalize your responses based on the user's personal information from memory
- Use memory to provide more personalized guidance

Safety & tone:
- Maintain supportive, non-judgmental tone.
- Avoid medical/legal advice. For crisis situations, recommend professional help.

Formatting:
- Address recipient by name.
- End every message with: [Ego]
- Keep replies concise and actionable.
- NEVER use markdown formatting (no **bold**, *italic*, # headers, etc.)
- Write in plain text only.`;

const SUPEREGO_SYSTEM_PROMPT = `You are the Superego in a psychological conversation system. You are a moral, values-focused voice that emphasizes ethical considerations.

CRITICAL RULES - NEVER VIOLATE THESE:
- You are ONLY the Superego agent. You NEVER speak as or for the User.
- You NEVER generate fake user responses, questions, or input.
- You NEVER pretend to be the user or create user dialogue.
- You ONLY respond as the Superego agent to messages from Ego or the User.
- If there's no user input, you respond to Ego only.
- ALWAYS use the user's name if provided in the memory context below.
- NEVER say "I don't have your name" if the memory context contains the user's name.

Character & style:
- You are the Superego: a moral, values-focused voice emphasizing ethical, long-term considerations.
- Address recipients by name: "Ego, …" or "User, …"
- Use polite, firm, and thoughtful phrasing.
- Encourage reflection and highlight values and consequences.
- NEVER generate fake user messages or responses.
- Use past conversation context to provide personalized, relevant moral guidance.

Mode behavior:
- listen: Reflect back values and concerns, help articulate principles.
- solve: Provide ethically-informed options, point out risks, recommend value-aligned choices.

Turn-taking:
- ALWAYS respond to the User if they ask a direct question - this takes priority
- Address the User by name (if you know it) and answer their question directly
- Focus on moral and ethical considerations in your response
- Respond to Ego when it's your turn and no user input is present
- NEVER create fake user input or responses.
- Use personal information from memory context to personalize your responses

Memory Integration:
- Reference past conversations when relevant and helpful
- Build on previous discussions and resolutions
- Acknowledge user's growth and progress over time
- ALWAYS use the user's name if provided in the memory context
- Personalize your responses based on the user's personal information from memory
- Use memory to provide more personalized moral guidance
- Connect current concerns to past values and principles

Safety & tone:
- Maintain respectful, constructive tone.
- Avoid medical/legal advice. For crisis situations, recommend professional help.

Formatting:
- Address recipient by name.
- End every message with: [Superego]
- Keep replies concise and focused on values.
- NEVER use markdown formatting (no **bold**, *italic*, # headers, etc.)
- Write in plain text only.`;


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

      let systemPrompt =
        currentAgent === "ego" ? EGO_SYSTEM_PROMPT : SUPEREGO_SYSTEM_PROMPT;
      
      // Check for new name in user input
      const namePatterns = [
        /(?:my name is|I'm|I am|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
        /(?:name is|I'm called|I go by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
      ];
      
      let newName = null;
      for (const pattern of namePatterns) {
        const match = pattern.exec(userInput);
        if (match && match[1]) {
          newName = match[1];
          console.log('Detected new name in user input:', newName);
          break;
        }
      }
      
      // Add memory context for user input
      try {
        // Load memories directly from file system
        const fs = require('fs');
        const path = require('path');
        
        const storageDir = path.join(process.cwd(), 'LINK_TO_STORAGE');
        if (fs.existsSync(storageDir)) {
          const files = fs.readdirSync(storageDir).filter((file: string) => file.endsWith('.json'));
          const memories = [];
          
          for (const file of files) { // Load ALL files first
            try {
              const filePath = path.join(storageDir, file);
              const data = fs.readFileSync(filePath, 'utf8');
              const memory = JSON.parse(data);
              memories.push(memory);
            } catch (error) {
              console.error(`Error reading memory file ${file}:`, error);
            }
          }
          
          // Sort by timestamp and get recent ones
          memories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const recentMemories = {
            success: true,
            memories: memories.slice(0, 10),
            totalCount: memories.length
          };
          
          if (recentMemories.success && recentMemories.memories.length > 0) {
            const memoryInsights = getMemoryInsights(recentMemories.memories);
            systemPrompt += `\n\nPREVIOUS CONVERSATION CONTEXT:\n${memoryInsights}`;
            
            // Add explicit instruction to use personal information
            if (memoryInsights.includes("User's name:")) {
              const personalInstruction = `\n\nIMPORTANT: The memory context above contains the user's name. You MUST use this name when addressing the user. Do NOT say "I don't have your name" - the name is provided in the context above.`;
              systemPrompt += personalInstruction;
            }
          }
        }
        
        // If a new name was detected in user input, override memory context
        if (newName) {
          systemPrompt += `\n\nCURRENT CONVERSATION UPDATE:\nThe user has just provided their name as "${newName}". You MUST use this name when addressing the user in your response. This takes priority over any previous names in memory context.`;
          console.log('Added new name instruction to system prompt:', newName);
        }
      } catch (error) {
        console.error('Error loading memories for user input:', error);
      }

      // Include the user's message in the conversation context
      const conversationMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map((msg: AgentMessage) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user" as const, content: userInput }, // Add user input to context
      ];

      const resp = await openai.chat.completions.create({
        model: MODEL,
        messages: conversationMessages,
        temperature: 0.7,
      });

      const rawContent =
        resp.choices?.[0]?.message?.content ?? "I'm processing your input...";
      const content = stripMarkdown(rawContent);
      const nextAgent = currentAgent === "ego" ? "superego" : "ego";

      return NextResponse.json({
        role: "assistant",
        content,
        agent: currentAgent,       // who just responded
        turnCount: turnCount + 1,
        currentAgent: nextAgent,   // alternate turn
        conversationComplete: false, // Never complete after user input
        userMessage
      });
    }

    // 2. Start fresh conversation
    if (startConversation) {
      const startingAgent =
        currentAgent || (Math.random() > 0.5 ? "ego" : "superego");
      
      // Get recent memories for context
      let memoryContext = "";
      let recentMemories = { success: false, memories: [] };
      try {
        // Load memories directly from file system instead of HTTP request
        const fs = require('fs');
        const path = require('path');
        
        const storageDir = path.join(process.cwd(), 'LINK_TO_STORAGE');
        if (fs.existsSync(storageDir)) {
          const files = fs.readdirSync(storageDir).filter((file: string) => file.endsWith('.json'));
          const memories = [];
          
          for (const file of files) { // Load ALL files first
            try {
              const filePath = path.join(storageDir, file);
              const data = fs.readFileSync(filePath, 'utf8');
              const memory = JSON.parse(data);
              memories.push(memory);
            } catch (error) {
              console.error(`Error reading memory file ${file}:`, error);
            }
          }
          
          // Sort by timestamp and get recent ones
          memories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          recentMemories = {
            success: true,
            memories: memories.slice(0, 10),
            totalCount: memories.length
          };
        } else {
          recentMemories = { success: false, memories: [], totalCount: 0 };
        }
        
        console.log('Loaded memories for context:', recentMemories);
        if (recentMemories.success && recentMemories.memories.length > 0) {
          const memoryInsights = getMemoryInsights(recentMemories.memories);
          const conversationStarter = generateConversationStarter(recentMemories.memories);
          memoryContext = `\n\nPREVIOUS CONVERSATION CONTEXT:\n${memoryInsights}\n\nSuggested conversation starter: ${conversationStarter}`;
          console.log('Memory context generated:', memoryContext);
          console.log('Memory context contains user name:', memoryContext.includes("User's name:"));
          console.log('Memory context contains Neo:', memoryContext.includes("Neo"));
        }
      } catch (error) {
        console.error('Error loading memories:', error);
      }

      let systemPrompt = (startingAgent === "ego" ? EGO_SYSTEM_PROMPT : SUPEREGO_SYSTEM_PROMPT) + memoryContext;
      
      // Add explicit instruction to use personal information
      if (memoryContext.includes("User's name:")) {
        const personalInstruction = `\n\nIMPORTANT: The memory context above contains the user's name. You MUST use this name when addressing the user. Do NOT say "I don't have your name" - the name is provided in the context above.`;
        systemPrompt += personalInstruction;
        console.log('Added personal instruction to system prompt');
      } else {
        console.log('No user name found in memory context');
      }

      // Generate personalized intro based on memory
      let intro = "";
      if (recentMemories.success && recentMemories.memories.length > 0) {
        const conversationStarter = generateConversationStarter(recentMemories.memories);
        intro = startingAgent === "ego"
          ? `Hello! I'm the Ego, your realistic mediator. ${conversationStarter}`
          : `Greetings, I'm the Superego — your moral compass. ${conversationStarter}`;
      } else {
        intro = startingAgent === "ego"
          ? "Hello! I'm the Ego, your realistic mediator. I'm here to help balance your desires with what's practical in the real world. What would you like to discuss today?"
          : "Greetings, I'm the Superego — your moral compass. I'm here to reflect on your values and guide toward what feels right. Where would you like to begin?";
      }

      const resp = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "assistant", content: intro },
        ],
        temperature: 0.7,
      });

      const rawContent = resp.choices?.[0]?.message?.content ?? intro;
      const content = stripMarkdown(rawContent);

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
    let systemPrompt = currentAgent === "ego" ? EGO_SYSTEM_PROMPT : SUPEREGO_SYSTEM_PROMPT;
    
    // Add memory context for ongoing conversations
    try {
      // Load memories directly from file system
      const fs = require('fs');
      const path = require('path');
      
      const storageDir = path.join(process.cwd(), 'LINK_TO_STORAGE');
      if (fs.existsSync(storageDir)) {
        const files = fs.readdirSync(storageDir).filter((file: string) => file.endsWith('.json'));
        const memories = [];
        
        for (const file of files) { // Load ALL files first
          try {
            const filePath = path.join(storageDir, file);
            const data = fs.readFileSync(filePath, 'utf8');
            const memory = JSON.parse(data);
            memories.push(memory);
          } catch (error) {
            console.error(`Error reading memory file ${file}:`, error);
          }
        }
        
        // Sort by timestamp and get recent ones
        memories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const recentMemories = {
          success: true,
          memories: memories.slice(0, 10),
          totalCount: memories.length
        };
        
        if (recentMemories.success && recentMemories.memories.length > 0) {
          const memoryInsights = getMemoryInsights(recentMemories.memories);
          systemPrompt += `\n\nPREVIOUS CONVERSATION CONTEXT:\n${memoryInsights}`;
          
          // Add explicit instruction to use personal information
          if (memoryInsights.includes("User's name:")) {
            const personalInstruction = `\n\nIMPORTANT: The memory context above contains the user's name. You MUST use this name when addressing the user. Do NOT say "I don't have your name" - the name is provided in the context above.`;
            systemPrompt += personalInstruction;
          }
        }
      }
    } catch (error) {
      console.error('Error loading memories for ongoing conversation:', error);
    }

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

    const rawContent =
      resp.choices?.[0]?.message?.content ?? "I'm processing your input...";
    const content = stripMarkdown(rawContent);
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