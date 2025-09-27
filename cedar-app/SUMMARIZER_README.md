# AI Summarizer Agent

This document describes the AI Summarizer Agent that has been added to the Cedar App's dual agents system. The summarizer analyzes conversations between psychological agents (Ego and Superego) and users to create comprehensive summaries.

## Overview

The Summarizer Agent is a specialized AI that:
- Analyzes conversations between Ego, Superego, and users
- Extracts key topics, insights, and psychological themes
- Creates structured summaries with metadata
- Stores summaries in a dedicated directory with links

## Architecture

### Core Components

1. **API Route**: `/src/app/api/summarizer/route.ts`
   - Handles POST requests for summarization
   - Handles GET requests for retrieving summaries
   - Uses OpenAI GPT-4o-mini for analysis

2. **Library Functions**: `/src/lib/summarizer.ts`
   - `summarize()` - Main function to summarize conversations
   - `getSummary()` - Retrieve specific summary by ID
   - `getAllSummaries()` - Get all available summaries
   - `formatSummaryForDisplay()` - Format summary for UI display

3. **Storage**: `/LINK_TO_STORAGE/`
   - JSON files containing conversation summaries
   - Each file named: `{summaryId}.json`
   - Includes metadata and analysis results

4. **UI Integration**: Enhanced `DualAgentChat.tsx`
   - "Summarize" button in conversation controls
   - Summary display panel with insights
   - Storage path links

## Usage

### Basic Usage

```typescript
import { summarize } from '@/lib/summarizer';

// Summarize a conversation
const result = await summarize(conversationMessages);
if (result.success) {
  console.log('Summary:', result.summary);
  console.log('Storage Path:', result.storagePath);
}
```

### API Endpoints

#### POST `/api/summarizer`
Summarize a conversation.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "assistant",
      "content": "Hello! I'm the Ego...",
      "agent": "ego"
    }
  ],
  "conversationId": "optional-id"
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "id": "summary_1234567890_abc123",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "summary": "The conversation explored themes of...",
    "keyTopics": ["decision-making", "moral conflict"],
    "insights": ["User showed internal conflict..."],
    "agentInteractions": {
      "ego": 5,
      "superego": 4,
      "user": 3
    },
    "conversationLength": 12,
    "storagePath": "cedar-app/LINK_TO_STORAGE/summary_1234567890_abc123.json"
  }
}
```

#### GET `/api/summarizer`
Get all summaries or a specific one.

**Query Parameters:**
- `id` (optional): Get specific summary by ID

## Features

### Conversation Analysis
- **Psychological Themes**: Identifies recurring psychological patterns
- **Key Topics**: Extracts main discussion points
- **Insights**: Provides AI-generated insights about the conversation
- **Agent Interactions**: Counts messages from each agent type

### Storage System
- **Automatic Storage**: Summaries are automatically saved to JSON files
- **Unique IDs**: Each summary gets a unique identifier
- **Metadata**: Includes timestamps, conversation length, and interaction counts
- **Accessible Links**: Storage paths are provided as clickable links

### UI Integration
- **Auto-Summarization**: Automatically generates summaries when conversations end
- **Manual Summarize Button**: Appears when conversation has messages
- **Summary Panel**: Displays comprehensive analysis results
- **Visual Statistics**: Shows agent interaction counts
- **Storage Links**: Direct links to stored summary files
- **Completion Notifications**: Alerts when auto-summarization completes

### Agent Behavior Fixes
- **No User Imitation**: Agents no longer generate fake user responses
- **Clear Role Boundaries**: Each agent maintains its distinct personality
- **Authentic Conversations**: Only real user input triggers user messages

## Example Summary Structure

```json
{
  "id": "summary_1234567890_abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "summary": "The conversation explored themes of decision-making between practical considerations and moral values. The user expressed internal conflict about career choices, with the Ego providing realistic perspectives and the Superego emphasizing ethical considerations.",
  "keyTopics": [
    "career decision-making",
    "financial stability vs passion",
    "moral values",
    "practical considerations"
  ],
  "insights": [
    "User showed internal conflict between ideals and reality",
    "Strong emphasis on financial security concerns",
    "Moral compass (Superego) provided ethical framework",
    "Realistic mediator (Ego) offered practical solutions"
  ],
  "agentInteractions": {
    "ego": 5,
    "superego": 4,
    "user": 3
  },
  "conversationLength": 12,
  "storagePath": "cedar-app/LINK_TO_STORAGE/summary_1234567890_abc123.json"
}
```

## Testing

A test page is available at `/test-summarizer` to verify the summarizer functionality:

1. **Test Conversation**: Pre-loaded sample conversation
2. **Test Summarize**: Button to test the summarize function
3. **Get All Summaries**: Button to retrieve all stored summaries
4. **Result Display**: Shows summary results and storage paths

## Integration with Dual Agents

The summarizer is seamlessly integrated with the existing dual agents system:

1. **Conversation Tracking**: Automatically tracks all conversation messages
2. **Summarize Button**: Appears in the conversation controls
3. **Summary Display**: Shows analysis results in a dedicated panel
4. **Storage Management**: Handles file storage and retrieval

## File Structure

```
cedar-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── summarizer/
│   │   │       └── route.ts          # API endpoint
│   │   └── test-summarizer/
│   │       └── page.tsx              # Test page
│   ├── lib/
│   │   └── summarizer.ts            # Library functions
│   └── cedar/
│       └── components/
│           └── chatComponents/
│               └── DualAgentChat.tsx # Enhanced with summarizer
├── LINK_TO_STORAGE/                 # Summary storage directory
│   ├── README.md                   # Storage documentation
│   └── {summaryId}.json            # Individual summary files
└── SUMMARIZER_README.md            # This documentation
```

## Environment Requirements

- `OPENAI_API_KEY`: Required for AI analysis
- Node.js file system access for storage
- Next.js API routes for endpoints

## Future Enhancements

Potential improvements for the summarizer:

1. **Advanced Analytics**: More sophisticated psychological analysis
2. **Trend Analysis**: Track patterns across multiple conversations
3. **Export Options**: PDF, CSV, or other format exports
4. **Search Functionality**: Search through stored summaries
5. **Visualization**: Charts and graphs for conversation insights
6. **Privacy Controls**: User-controlled summary retention
7. **Batch Processing**: Summarize multiple conversations at once

## Troubleshooting

### Common Issues

1. **Missing API Key**: Ensure `OPENAI_API_KEY` is set in environment
2. **Storage Errors**: Check file system permissions for `LINK_TO_STORAGE` directory
3. **Empty Conversations**: Summarizer requires at least one message
4. **JSON Parsing**: AI responses are parsed as JSON; fallback handling included

### Error Handling

The summarizer includes comprehensive error handling:
- API failures are caught and reported
- JSON parsing errors have fallbacks
- Storage errors are logged and reported
- User-friendly error messages in UI

## Conclusion

The AI Summarizer Agent provides a powerful way to analyze and understand conversations between psychological agents and users. It offers structured insights, automatic storage, and seamless integration with the existing dual agents system, making it easy to track and understand the psychological journey of users through their conversations.
