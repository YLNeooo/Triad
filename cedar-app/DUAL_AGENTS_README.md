# Dual Agent System

This application now includes a dual agent conversation system where two AI agents communicate with each other in a feedback loop.

## How It Works

### Agent A - Creative Agent 🎨
- **Role**: Generates creative ideas, stories, and thought-provoking questions
- **Personality**: Imaginative, thinks outside the box, generates engaging content
- **Temperature**: 0.8 (higher creativity)

### Agent B - Analytical Agent 🧠
- **Role**: Analyzes, critiques, and provides feedback on Agent A's output
- **Personality**: Thoughtful, analytical, constructive, asks probing questions
- **Temperature**: 0.6 (more focused analysis)

## Features

- **Automatic Turn-taking**: Agents automatically alternate turns
- **Conversation Management**: Configurable maximum turns (default: 10)
- **Real-time UI**: Live conversation display with agent identification
- **Control Options**: Start, continue, stop, and reset conversations
- **Visual Distinction**: Different colors and icons for each agent

## Usage

1. **Start the application**:
   ```bash
   npm install
   npm run dev
   ```

2. **Access the dual agent system**:
   - Go to `http://localhost:3000`
   - Click "Try Dual Agents" button
   - Or navigate directly to `http://localhost:3000/dual-agents`

3. **Control the conversation**:
   - **Start**: Begin a new conversation
   - **Continue**: Let the next agent respond
   - **Stop**: Pause the conversation
   - **Reset**: Clear the conversation and start fresh

## API Endpoints

### POST `/api/dual-agents`
Handles agent communication and conversation flow.

**Request Body**:
```json
{
  "startConversation": true,  // Start a new conversation
  "messages": [...],          // Conversation history
  "currentAgent": "A",        // Current agent ("A" or "B")
  "turnCount": 0,             // Current turn number
  "maxTurns": 100              // Maximum conversation length
}
```

**Response**:
```json
{
  "role": "assistant",
  "content": "Agent response...",
  "agent": "A",
  "turnCount": 1,
  "currentAgent": "B",
  "conversationComplete": false
}
```

### GET `/api/dual-agents`
Get system information and status.

## Environment Setup

Make sure you have your OpenAI API key set:

```bash
# In your .env.local file
OPENAI_API_KEY=your_openai_api_key_here
```

## Example Conversation Flow

1. **Agent A** starts with a creative prompt or idea
2. **Agent B** analyzes and provides feedback
3. **Agent A** responds with new creative direction
4. **Agent B** asks deeper analytical questions
5. This continues until max turns or natural conclusion

## Customization

You can modify the agent personalities by editing the system prompts in `/src/app/dual-agents/route.ts`:

- `AGENT_A_SYSTEM_PROMPT`: Creative agent instructions
- `AGENT_B_SYSTEM_PROMPT`: Analytical agent instructions

Adjust parameters like:
- `maxTurns`: Maximum conversation length
- `temperature`: Creativity level (0.0-1.0)
- `MODEL`: OpenAI model to use

## Technical Details

- Built with Next.js 15 and React 19
- Uses OpenAI GPT-4o-mini for agent responses
- Real-time UI updates with Framer Motion animations
- TypeScript for type safety
- Tailwind CSS for styling
