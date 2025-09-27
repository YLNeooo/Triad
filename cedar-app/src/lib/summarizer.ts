// lib/summarizer.ts
import { AgentMessage } from '../app/api/summarizer/route';

interface ConversationSummary {
  id: string;
  timestamp: string;
  summary: string;
  keyTopics: string[];
  insights: string[];
  agentInteractions: {
    ego: number;
    superego: number;
    user: number;
  };
  conversationLength: number;
  storagePath: string;
}

interface SummarizerResponse {
  success: boolean;
  summary?: ConversationSummary;
  analysis?: any;
  storagePath?: string;
  error?: string;
}

/**
 * Summarizes a conversation between psychological agents and user
 * @param messages - Array of conversation messages
 * @param conversationId - Optional ID for the conversation
 * @returns Promise with summary data and storage path
 */
export async function summarize(
  messages: AgentMessage[], 
  conversationId?: string
): Promise<SummarizerResponse> {
  try {
    const response = await fetch('/api/summarizer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        conversationId,
        generateSummary: true
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to summarize conversation');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in summarize function:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Retrieves a specific conversation summary by ID
 * @param summaryId - The ID of the summary to retrieve
 * @returns Promise with summary data
 */
export async function getSummary(summaryId: string): Promise<SummarizerResponse> {
  try {
    const response = await fetch(`/api/summarizer?id=${summaryId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to retrieve summary');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error retrieving summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Retrieves all available conversation summaries
 * @returns Promise with array of summaries
 */
export async function getAllSummaries(): Promise<{ success: boolean; summaries?: ConversationSummary[]; error?: string }> {
  try {
    const response = await fetch('/api/summarizer', {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to retrieve summaries');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error retrieving all summaries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Creates a formatted summary display for UI
 * @param summary - The conversation summary object
 * @returns Formatted HTML string for display
 */
export function formatSummaryForDisplay(summary: ConversationSummary): string {
  return `
    <div class="conversation-summary">
      <h3>Conversation Summary</h3>
      <p><strong>Date:</strong> ${new Date(summary.timestamp).toLocaleString()}</p>
      <p><strong>Length:</strong> ${summary.conversationLength} messages</p>
      
      <h4>Summary</h4>
      <p>${summary.summary}</p>
      
      <h4>Key Topics</h4>
      <ul>
        ${summary.keyTopics.map(topic => `<li>${topic}</li>`).join('')}
      </ul>
      
      <h4>Insights</h4>
      <ul>
        ${summary.insights.map(insight => `<li>${insight}</li>`).join('')}
      </ul>
      
      <h4>Agent Interactions</h4>
      <p>Ego: ${summary.agentInteractions.ego} messages</p>
      <p>Superego: ${summary.agentInteractions.superego} messages</p>
      <p>User: ${summary.agentInteractions.user} messages</p>
      
      <p><strong>Storage Path:</strong> <a href="${summary.storagePath}" target="_blank">${summary.storagePath}</a></p>
    </div>
  `;
}
