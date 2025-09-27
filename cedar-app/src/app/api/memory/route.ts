// app/api/memory/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

interface ConversationMemory {
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

interface MemorySearchResult {
  memories: ConversationMemory[];
  totalCount: number;
  searchQuery?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = searchParams.get("sortBy") || "timestamp";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const storageDir = path.join(process.cwd(), 'LINK_TO_STORAGE');
    
    if (!fs.existsSync(storageDir)) {
      return NextResponse.json({ 
        success: true, 
        memories: [], 
        totalCount: 0 
      });
    }

    const files = fs.readdirSync(storageDir).filter(file => file.endsWith('.json'));
    let memories: ConversationMemory[] = [];

    // Load all memories
    for (const file of files) {
      try {
        const filePath = path.join(storageDir, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const memory = JSON.parse(data);
        memories.push(memory);
      } catch (error) {
        console.error(`Error reading memory file ${file}:`, error);
      }
    }

    // Search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      memories = memories.filter(memory => 
        memory.summary.toLowerCase().includes(query) ||
        memory.keyTopics.some(topic => topic.toLowerCase().includes(query)) ||
        memory.memoryTags.some(tag => tag.toLowerCase().includes(query)) ||
        memory.userConcerns.some(concern => concern.toLowerCase().includes(query)) ||
        memory.psychologicalThemes.some(theme => theme.toLowerCase().includes(query))
      );
    }

    // Sorting
    memories.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'topics':
          aValue = a.keyTopics.length;
          bValue = b.keyTopics.length;
          break;
        case 'length':
          aValue = a.conversationLength;
          bValue = b.conversationLength;
          break;
        default:
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    // Pagination
    const totalCount = memories.length;
    const paginatedMemories = memories.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      memories: paginatedMemories,
      totalCount,
      searchQuery,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (err: any) {
    console.error('Memory retrieval error:', err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error retrieving memories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, memoryId, searchQuery } = body;

    const storageDir = path.join(process.cwd(), 'LINK_TO_STORAGE');
    
    if (!fs.existsSync(storageDir)) {
      return NextResponse.json({ 
        success: true, 
        memories: [], 
        totalCount: 0 
      });
    }

    switch (action) {
      case 'search':
        const searchResult = await searchMemories(storageDir, searchQuery);
        return NextResponse.json(searchResult);
      
      case 'get_recent':
        const recentResult = await getRecentMemories(storageDir, body.limit || 5);
        return NextResponse.json(recentResult);
      
      case 'get_by_id':
        const memoryResult = await getMemoryById(storageDir, memoryId);
        return NextResponse.json(memoryResult);
      
      case 'get_context':
        const contextResult = await getContextualMemories(storageDir, body.topics || []);
        return NextResponse.json(contextResult);
      
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

  } catch (err: any) {
    console.error('Memory operation error:', err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

async function searchMemories(storageDir: string, searchQuery: string) {
  const files = fs.readdirSync(storageDir).filter(file => file.endsWith('.json'));
  const memories: ConversationMemory[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(storageDir, file);
      const data = fs.readFileSync(filePath, 'utf8');
      const memory = JSON.parse(data);
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = 
          memory.summary.toLowerCase().includes(query) ||
          memory.keyTopics.some((topic: string) => topic.toLowerCase().includes(query)) ||
          memory.memoryTags.some((tag: string) => tag.toLowerCase().includes(query));
        
        if (matches) {
          memories.push(memory);
        }
      } else {
        memories.push(memory);
      }
    } catch (error) {
      console.error(`Error reading memory file ${file}:`, error);
    }
  }

  return {
    success: true,
    memories,
    totalCount: memories.length
  };
}

async function getRecentMemories(storageDir: string, limit: number) {
  const files = fs.readdirSync(storageDir).filter(file => file.endsWith('.json'));
  const memories: ConversationMemory[] = [];

  for (const file of files) {
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
  const recentMemories = memories.slice(0, limit);

  return {
    success: true,
    memories: recentMemories,
    totalCount: recentMemories.length
  };
}

async function getMemoryById(storageDir: string, memoryId: string) {
  const filePath = path.join(storageDir, `${memoryId}.json`);
  
  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      error: "Memory not found"
    };
  }

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const memory = JSON.parse(data);
    
    return {
      success: true,
      memory
    };
  } catch (error) {
    return {
      success: false,
      error: "Error reading memory file"
    };
  }
}

async function getContextualMemories(storageDir: string, topics: string[]) {
  const files = fs.readdirSync(storageDir).filter(file => file.endsWith('.json'));
  const memories: ConversationMemory[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(storageDir, file);
      const data = fs.readFileSync(filePath, 'utf8');
      const memory = JSON.parse(data);
      
      // Check if memory has any of the specified topics
      const hasMatchingTopic = topics.some(topic => 
        memory.keyTopics.some((keyTopic: string) => 
          keyTopic.toLowerCase().includes(topic.toLowerCase())
        ) ||
        memory.psychologicalThemes.some((theme: string) => 
          theme.toLowerCase().includes(topic.toLowerCase())
        )
      );
      
      if (hasMatchingTopic) {
        memories.push(memory);
      }
    } catch (error) {
      console.error(`Error reading memory file ${file}:`, error);
    }
  }

  return {
    success: true,
    memories,
    totalCount: memories.length
  };
}
