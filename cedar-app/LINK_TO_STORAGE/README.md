# Conversation Summaries Storage

This directory contains AI-generated summaries of conversations between psychological agents (Ego and Superego) and users.

## File Structure

- Each summary is stored as a JSON file with a unique ID
- Files are named: `{summaryId}.json`
- Each file contains:
  - Conversation summary
  - Key topics discussed
  - Psychological insights
  - Agent interaction counts
  - Timestamp and metadata

## Accessing Summaries

Summaries can be accessed via:
- Direct file access: `cedar-app/LINK_TO_STORAGE/{summaryId}.json`
- API endpoints: `/api/summarizer?id={summaryId}`
- Programmatically: `import { getSummary } from '@/lib/summarizer'`

## Example Summary Structure

```json
{
  "id": "summary_1234567890_abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "summary": "The conversation explored themes of decision-making...",
  "keyTopics": ["decision-making", "moral conflict", "practical solutions"],
  "insights": ["User showed internal conflict between ideals and reality"],
  "agentInteractions": {
    "ego": 5,
    "superego": 4,
    "user": 3
  },
  "conversationLength": 12,
  "storagePath": "cedar-app/LINK_TO_STORAGE/summary_1234567890_abc123.json"
}
```
