// lib/memory.ts
import { ConversationMemory } from './types';

interface MemorySearchOptions {
  searchQuery?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'topics' | 'length';
  sortOrder?: 'asc' | 'desc';
}

interface MemorySearchResult {
  success: boolean;
  memories: ConversationMemory[];
  totalCount: number;
  searchQuery?: string;
  pagination?: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

/**
 * Search through conversation memories
 * @param options - Search and pagination options
 * @returns Promise with search results
 */
export async function searchMemories(options: MemorySearchOptions = {}): Promise<MemorySearchResult> {
  try {
    const params = new URLSearchParams();
    
    if (options.searchQuery) params.append('search', options.searchQuery);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const response = await fetch(`/api/memory?${params.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to search memories');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching memories:', error);
    return {
      success: false,
      memories: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get recent conversation memories
 * @param limit - Number of recent memories to retrieve
 * @returns Promise with recent memories
 */
export async function getRecentMemories(limit: number = 5): Promise<MemorySearchResult> {
  try {
    const response = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_recent',
        limit
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get recent memories');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting recent memories:', error);
    return {
      success: false,
      memories: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get a specific memory by ID
 * @param memoryId - The ID of the memory to retrieve
 * @returns Promise with memory data
 */
export async function getMemoryById(memoryId: string): Promise<{ success: boolean; memory?: ConversationMemory; error?: string }> {
  try {
    const response = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_by_id',
        memoryId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get memory');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting memory by ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get contextual memories based on topics
 * @param topics - Array of topics to search for
 * @returns Promise with contextual memories
 */
export async function getContextualMemories(topics: string[]): Promise<MemorySearchResult> {
  try {
    const response = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_context',
        topics
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get contextual memories');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting contextual memories:', error);
    return {
      success: false,
      memories: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Format memory for display in agent prompts
 * @param memory - The memory object to format
 * @returns Formatted string for agent consumption
 */
export function formatMemoryForAgent(memory: ConversationMemory): string {
  return `Previous Conversation (${memory.date} at ${memory.time}):
Summary: ${memory.summary}

Key Topics: ${memory.keyTopics.join(', ')}
Psychological Themes: ${memory.psychologicalThemes.join(', ')}
User Concerns: ${memory.userConcerns.join(', ')}
Resolutions: ${memory.resolutions.join(', ')}
Emotional Tone: ${memory.emotionalTone}

Memory Tags: ${memory.memoryTags.join(', ')}`;
}

/**
 * Generate conversation starter based on recent memories
 * @param memories - Array of recent memories
 * @returns Suggested conversation starter
 */
export function generateConversationStarter(memories: ConversationMemory[]): string {
  if (memories.length === 0) {
    return "Hello! I'm here to help you explore your thoughts and feelings. What's on your mind today?";
  }

  const recentMemory = memories[0];
  const topics = recentMemory.keyTopics.slice(0, 2);
  const concerns = recentMemory.userConcerns.slice(0, 1);
  const allSummaries = memories.map(m => m.summary);
  
  // Extract user's name from summaries
  const personalInfo = extractPersonalInfo(allSummaries);
  const userName = personalInfo.name;
  
  let starter = userName 
    ? `Hello ${userName}! I remember our previous conversation`
    : "Hello! I remember our previous conversation";
  
  if (recentMemory.date) {
    starter += ` from ${recentMemory.date}`;
  }
  
  if (topics.length > 0) {
    starter += ` where we discussed ${topics.join(' and ')}`;
  }
  
  if (concerns.length > 0) {
    starter += `. You mentioned being concerned about ${concerns[0]}`;
  }
  
  starter += ". How are you feeling about that now? Has anything changed since we last talked?";
  
  return starter;
}

/**
 * Get memory insights for agent context
 * @param memories - Array of memories to analyze
 * @returns Insights about user patterns and preferences
 */
export function getMemoryInsights(memories: ConversationMemory[]): string {
  if (memories.length === 0) {
    return "No previous conversation history available.";
  }

  console.log('getMemoryInsights called with', memories.length, 'memories');

  const allTopics = memories.flatMap(m => m.keyTopics);
  const allThemes = memories.flatMap(m => m.psychologicalThemes);
  const allConcerns = memories.flatMap(m => m.userConcerns);
  const allTones = memories.map(m => m.emotionalTone);
  const allSummaries = memories.map(m => m.summary);

  console.log('Summaries being processed:', allSummaries.map(s => s.substring(0, 100) + '...'));

  // Extract personal information from summaries
  const personalInfo = extractPersonalInfo(allSummaries);
  console.log('Personal info extracted:', personalInfo);

  // Count frequency of topics
  const topicCounts = allTopics.reduce((acc, topic) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const frequentTopics = Object.entries(topicCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([topic]) => topic);

  const commonThemes = [...new Set(allThemes)].slice(0, 3);
  const commonConcerns = [...new Set(allConcerns)].slice(0, 3);
  const dominantTone = allTones.reduce((acc, tone) => {
    acc[tone] = (acc[tone] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonTone = Object.entries(dominantTone)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

  let insights = `User Conversation Patterns:
- Frequently discusses: ${frequentTopics.join(', ')}
- Common psychological themes: ${commonThemes.join(', ')}
- Recurring concerns: ${commonConcerns.join(', ')}
- Typical emotional tone: ${mostCommonTone}
- Total conversations: ${memories.length}`;

  if (personalInfo.name || personalInfo.allNames.length > 0) {
    insights += `\n\nPersonal Information:`;
    
    if (personalInfo.name) {
      insights += `\n- User's current name: ${personalInfo.name}`;
    }
    
    if (personalInfo.allNames.length > 1) {
      insights += `\n- All names mentioned: ${personalInfo.allNames.join(', ')}`;
    }
  }

  if (personalInfo.details.length > 0) {
    insights += `\n- Other personal details: ${personalInfo.details.join(', ')}`;
  }

  return insights;
}

function extractPersonalInfo(summaries: string[]): { name?: string; allNames: string[]; details: string[] } {
  const details: string[] = [];
  let name: string | undefined;
  const allNames: string[] = [];

  // Look for common name patterns - prioritize specific patterns
  const namePatterns = [
    /([A-Z][a-z]+),\s+(?:the\s+)?(?:user|person|individual)/gi,
    /(?:introduces|introduced)\s+himself\s+as\s+([A-Z][a-z]+)/gi,
    /(?:introduces|introduced)\s+herself\s+as\s+([A-Z][a-z]+)/gi,
    /(?:user|person|individual)\s+(?:named|called|is)\s+([A-Z][a-z]+)/gi,
    /(?:name\s+is|I'm|I am)\s+([A-Z][a-z]+)/gi,
    /(?:call me|my name is)\s+([A-Z][a-z]+)/gi
  ];
  
  console.log('Extracting personal info from summaries:', summaries.length);

  for (const summary of summaries) {
    console.log('Processing summary:', summary.substring(0, 100) + '...');
    
    // First, look for specific patterns that are more likely to be names
    const specificPatterns = [
      // Patterns for "user, identified as YL" format
      /(?:user|person|individual),\s+(?:identified\s+as|named|called)\s+([A-Z][a-z]+)/gi,
      /(?:providing|provides)\s+(?:their\s+)?(?:actual\s+)?name,\s+([A-Z][a-z]+)/gi,
      /(?:corrects|corrected)\s+(?:this\s+)?(?:by\s+)?(?:providing|provides)\s+(?:their\s+)?(?:actual\s+)?name,\s+([A-Z][a-z]+)/gi,
      /(?:user|person|individual)\s+(?:identified\s+as|named|called)\s+([A-Z][a-z]+)/gi,
      // Patterns for "Neo, the User" and "The User, Neo" formats
      /([A-Z][a-z]+),\s+(?:the\s+)?(?:user|person|individual)/gi,
      /(?:the\s+)?(?:user|person|individual),\s+([A-Z][a-z]+)/gi,
      // Traditional patterns
      /(?:introduces|introduced)\s+himself\s+as\s+([A-Z][a-z]+)/gi,
      /(?:introduces|introduced)\s+herself\s+as\s+([A-Z][a-z]+)/gi,
      /(?:user|person|individual)\s+(?:named|called|is)\s+([A-Z][a-z]+)/gi,
      /(?:name\s+is|I'm|I am)\s+([A-Z][a-z]+)/gi,
      /(?:call me|my name is)\s+([A-Z][a-z]+)/gi
    ];
    
    // Try specific patterns first
    for (const pattern of specificPatterns) {
      const match = pattern.exec(summary);
      if (match && match[1]) {
        const extractedName = match[1];
        console.log('Found potential name:', extractedName, 'from specific pattern:', pattern.source);
        
        // Skip common words that aren't names
        const commonWords = ['conversation', 'user', 'person', 'individual', 'dialogue', 'discussion', 'ego', 'superego', 'agent', 'assistant', 'system', 'however', 'therefore', 'although', 'because', 'before', 'after', 'during', 'while', 'since', 'until', 'unless', 'except', 'besides', 'instead', 'rather', 'indeed', 'certainly', 'obviously', 'clearly', 'apparently', 'evidently', 'supposedly', 'allegedly', 'reportedly', 'accordingly', 'consequently', 'furthermore', 'moreover', 'nevertheless', 'nonetheless', 'meanwhile', 'subsequently', 'previously', 'initially', 'finally', 'ultimately', 'eventually', 'gradually', 'suddenly', 'immediately', 'quickly', 'slowly', 'carefully', 'clearly', 'obviously', 'apparently', 'evidently', 'supposedly', 'allegedly', 'reportedly', 'accordingly', 'consequently', 'furthermore', 'moreover', 'nevertheless', 'nonetheless', 'meanwhile', 'subsequently', 'previously', 'initially', 'finally', 'ultimately', 'eventually', 'gradually', 'suddenly', 'immediately', 'quickly', 'slowly', 'carefully'];
        if (!commonWords.includes(extractedName.toLowerCase())) {
          // Add to all names if not already present
          if (!allNames.includes(extractedName)) {
            allNames.push(extractedName);
          }
          // Set as primary name if we don't have one yet
          if (!name) {
            name = extractedName;
          }
          console.log('Extracted name:', extractedName, 'from pattern:', pattern.source);
        } else {
          console.log('Skipped common word:', extractedName);
        }
      }
    }
  }

  // Look for other personal details
  const personalPatterns = [
    /(?:age|years old)/gi,
    /(?:job|work|profession|career)/gi,
    /(?:location|city|country|live in)/gi,
    /(?:family|parents|siblings|children)/gi,
    /(?:hobbies|interests|passions)/gi
  ];

  for (const summary of summaries) {
    for (const pattern of personalPatterns) {
      if (pattern.test(summary)) {
        const context = summary.match(new RegExp(`.{0,50}${pattern.source}.{0,50}`, 'gi'));
        if (context) {
          details.push(...context.map(c => c.trim()));
        }
      }
    }
  }

  return { name, allNames: [...new Set(allNames)], details: [...new Set(details)] };
}
