// app/api/summarizer/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from 'fs';
import path from 'path';
import { AgentMessage, ConversationMemory } from '../../lib/types';

const MODEL = "gpt-4o-mini";

function assertEnv() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }
}

// Use shared types from lib/types.ts
type ConversationSummary = ConversationMemory;

const SUMMARIZER_SYSTEM_PROMPT = `You are an AI Summarizer Agent specialized in analyzing conversations between psychological agents (Ego and Superego) and users. Your role is to:

1. **Analyze Conversation Flow**: Understand the dynamics between Ego (realistic mediator), Superego (moral compass), and the user
2. **Extract Key Insights**: Identify main topics, emotional patterns, and psychological themes
3. **Create Comprehensive Summaries**: Provide clear, structured summaries that capture the essence of the conversation
4. **Identify Patterns**: Note recurring themes, conflicts, resolutions, and growth areas
5. **Generate Memory Tags**: Create searchable tags for future reference
6. **Assess Emotional Tone**: Determine the overall emotional state and concerns
7. **Track Resolutions**: Note any solutions or progress made

Your analysis should be:
- Objective and non-judgmental
- Focused on psychological insights
- Structured and easy to read
- Helpful for understanding the user's psychological journey
- Rich in metadata for memory storage
- Capture personal details like user names, preferences, and specific information shared

Format your response as a JSON object with the following structure:
{
  "summary": "A comprehensive 2-3 paragraph summary of the conversation with rich detail about what was discussed, how the user felt, and what insights emerged",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "insights": ["insight1", "insight2", "insight3"],
  "psychologicalThemes": ["theme1", "theme2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "memoryTags": ["tag1", "tag2", "tag3"],
  "emotionalTone": "overall emotional state description",
  "userConcerns": ["concern1", "concern2"],
  "resolutions": ["resolution1", "resolution2"]
}`;

export async function POST(req: NextRequest) {
  try {
    assertEnv();
    const body = await req.json();
    
    const {
      messages = [],
      conversationId = null,
      generateSummary = true
    } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No conversation messages provided" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Prepare conversation context for summarization
    const conversationText = messages.map((msg: AgentMessage) => {
      const agentName = msg.agent === "ego" ? "Ego" : 
                       msg.agent === "superego" ? "Superego" : 
                       "User";
      return `[${agentName}]: ${msg.content}`;
    }).join('\n\n');

    const summarizationPrompt = `Please analyze the following conversation between psychological agents and a user:

${conversationText}

Provide a comprehensive analysis following the specified JSON format.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SUMMARIZER_SYSTEM_PROMPT },
        { role: "user", content: summarizationPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    const analysisContent = response.choices?.[0]?.message?.content ?? "{}";
    
    let analysis;
    try {
      analysis = JSON.parse(analysisContent);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      analysis = {
        summary: analysisContent,
        keyTopics: ["conversation analysis"],
        insights: ["AI-generated insights"],
        psychologicalThemes: ["psychological exploration"],
        recommendations: ["continue the conversation"],
        memoryTags: ["conversation"],
        emotionalTone: "neutral",
        userConcerns: ["general discussion"],
        resolutions: ["ongoing exploration"]
      };
    }

    // Ensure all required fields exist with defaults
    analysis = {
      summary: analysis.summary || "No summary available",
      keyTopics: analysis.keyTopics || [],
      insights: analysis.insights || [],
      psychologicalThemes: analysis.psychologicalThemes || [],
      recommendations: analysis.recommendations || [],
      memoryTags: analysis.memoryTags || [],
      emotionalTone: analysis.emotionalTone || "neutral",
      userConcerns: analysis.userConcerns || [],
      resolutions: analysis.resolutions || []
    };

    // Generate unique ID and timestamp
    const summaryId = conversationId || `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const timestamp = now.toISOString();
    const date = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const time = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // Count agent interactions
    const agentInteractions = {
      ego: messages.filter((msg: AgentMessage) => msg.agent === "ego").length,
      superego: messages.filter((msg: AgentMessage) => msg.agent === "superego").length,
      user: messages.filter((msg: AgentMessage) => msg.agent === "user").length
    };

    // Create storage directory if it doesn't exist
    const storageDir = path.join(process.cwd(), 'LINK_TO_STORAGE');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Create summary object with enhanced memory data
    const summary: ConversationSummary = {
      id: summaryId,
      timestamp,
      date,
      time,
      summary: analysis.summary || "No summary available",
      keyTopics: analysis.keyTopics || [],
      insights: analysis.insights || [],
      psychologicalThemes: analysis.psychologicalThemes || [],
      recommendations: analysis.recommendations || [],
      agentInteractions,
      conversationLength: messages.length,
      storagePath: `cedar-app/LINK_TO_STORAGE/${summaryId}.json`,
      memoryTags: analysis.memoryTags || [],
      emotionalTone: analysis.emotionalTone || "neutral",
      userConcerns: analysis.userConcerns || [],
      resolutions: analysis.resolutions || []
    };

    // Save summary to file
    const filePath = path.join(storageDir, `${summaryId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2));

    return NextResponse.json({
      success: true,
      summary,
      analysis,
      storagePath: summary.storagePath
    });

  } catch (err: any) {
    console.error('Summarizer error:', err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error in summarization" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const summaryId = searchParams.get("id");

    if (summaryId) {
      // Get specific summary
      const storageDir = path.join(process.cwd(), 'LINK_TO_STORAGE');
      const filePath = path.join(storageDir, `${summaryId}.json`);
      
      if (fs.existsSync(filePath)) {
        const summaryData = fs.readFileSync(filePath, 'utf8');
        const summary = JSON.parse(summaryData);
        return NextResponse.json({ success: true, summary });
      } else {
        return NextResponse.json(
          { error: "Summary not found" },
          { status: 404 }
        );
      }
    } else {
      // List all summaries
      const storageDir = path.join(process.cwd(), 'LINK_TO_STORAGE');
      
      if (!fs.existsSync(storageDir)) {
        return NextResponse.json({ success: true, summaries: [] });
      }

      const files = fs.readdirSync(storageDir).filter(file => file.endsWith('.json'));
      const summaries = files.map(file => {
        const filePath = path.join(storageDir, file);
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      });

      return NextResponse.json({ success: true, summaries });
    }
  } catch (err: any) {
    console.error('Error retrieving summaries:', err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
