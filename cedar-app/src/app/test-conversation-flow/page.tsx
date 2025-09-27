"use client";

import React, { useState } from 'react';
import { Play, Square, RotateCcw, Bot, Brain, Sparkles } from 'lucide-react';

export default function TestConversationFlowPage() {
  const [conversation, setConversation] = useState({
    messages: [],
    currentAgent: "ego",
    turnCount: 0,
    maxTurns: 100,
    isRunning: false,
    conversationComplete: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState("");

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dual-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startConversation: true,
          maxTurns: conversation.maxTurns
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('Error starting conversation:', data.error);
        return;
      }

      setConversation(prev => ({
        ...prev,
        messages: [data],
        currentAgent: data.currentAgent,
        turnCount: data.turnCount,
        isRunning: true,
        conversationComplete: data.conversationComplete
      }));
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const continueConversation = async () => {
    if (conversation.conversationComplete || !conversation.isRunning) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/dual-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation.messages,
          currentAgent: conversation.currentAgent,
          turnCount: conversation.turnCount,
          maxTurns: conversation.maxTurns
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('Error continuing conversation:', data.error);
        return;
      }

      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, data],
        currentAgent: data.currentAgent,
        turnCount: data.turnCount,
        conversationComplete: data.conversationComplete
      }));
    } catch (error) {
      console.error('Error continuing conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendUserInput = async () => {
    if (!userInput.trim() || isLoading) return;

    console.log('Sending user input:', userInput.trim());
    console.log('Conversation state before:', {
      isRunning: conversation.isRunning,
      conversationComplete: conversation.conversationComplete,
      turnCount: conversation.turnCount
    });

    setIsLoading(true);
    try {
      const response = await fetch('/api/dual-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation.messages,
          currentAgent: conversation.currentAgent,
          turnCount: conversation.turnCount,
          maxTurns: conversation.maxTurns,
          userInput: userInput.trim()
        }),
      });

      const data = await response.json();
      
      console.log('Response from API:', data);
      
      if (data.error) {
        console.error('Error sending user input:', data.error);
        return;
      }

      const userMessage = {
        role: "user" as const,
        content: userInput.trim(),
        agent: "user" as const
      };

      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage, data],
        currentAgent: data.currentAgent,
        turnCount: data.turnCount,
        conversationComplete: data.conversationComplete,
        isRunning: !data.conversationComplete // Keep conversation running unless explicitly completed
      }));

      console.log('Conversation state after:', {
        isRunning: !data.conversationComplete,
        conversationComplete: data.conversationComplete,
        turnCount: data.turnCount
      });

      setUserInput("");
    } catch (error) {
      console.error('Error sending user input:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setConversation({
      messages: [],
      currentAgent: "ego",
      turnCount: 0,
      maxTurns: 100,
      isRunning: false,
      conversationComplete: false
    });
    setUserInput("");
  };

  const getAgentIcon = (agent: "ego" | "superego" | "user") => {
    if (agent === "user") return <Bot className="w-4 h-4" />;
    return agent === "ego" ? <Brain className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />;
  };

  const getAgentName = (agent: "ego" | "superego" | "user") => {
    if (agent === "user") return "You";
    return agent === "ego" ? "Ego" : "Superego";
  };

  const getAgentColor = (agent: "ego" | "superego" | "user") => {
    if (agent === "user") return "bg-green-100 text-green-800 border-green-200";
    return agent === "ego" ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-purple-100 text-purple-800 border-purple-200";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Conversation Flow Test
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Conversation Continuity
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            This test verifies that conversations continue properly after user input, agents don't use markdown formatting, and max turns is set to 100.
          </p>

          {/* Status Display */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Conversation Status:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Running:</span> 
                <span className={`ml-2 px-2 py-1 rounded ${conversation.isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {conversation.isRunning ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Complete:</span> 
                <span className={`ml-2 px-2 py-1 rounded ${conversation.conversationComplete ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {conversation.conversationComplete ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Turn Count:</span> {conversation.turnCount}
              </div>
              <div>
                <span className="font-medium">Current Agent:</span> {conversation.currentAgent}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mb-6">
            {!conversation.isRunning && conversation.messages.length === 0 && (
              <button
                onClick={startConversation}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4" />
                {isLoading ? "Starting..." : "Start Conversation"}
              </button>
            )}

            {conversation.isRunning && !conversation.conversationComplete && (
              <button
                onClick={continueConversation}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Bot className="w-4 h-4" />
                {isLoading ? "Thinking..." : "Continue"}
              </button>
            )}

            <button
              onClick={resetConversation}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>

          {/* User Input */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendUserInput()}
              placeholder="Try: 'What color should I use for my website?'"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={sendUserInput}
              disabled={!userInput.trim() || isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>

          {/* Messages */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {conversation.messages.map((message, index) => (
              <div key={index} className={`flex ${
                message.agent === "user" 
                  ? "justify-center" 
                  : message.agent === "ego" 
                    ? "justify-start" 
                    : "justify-end"
              }`}>
                <div className={`max-w-3xl ${
                  message.agent === "user" 
                    ? "mx-8" 
                    : message.agent === "ego" 
                      ? "mr-8" 
                      : "ml-8"
                }`}>
                  <div className={`flex items-center gap-2 mb-2 ${
                    message.agent === "user" 
                      ? "justify-center" 
                      : message.agent === "ego" 
                        ? "justify-start" 
                        : "justify-end"
                  }`}>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getAgentColor(message.agent!)}`}>
                      {getAgentIcon(message.agent!)}
                      {getAgentName(message.agent!)}
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    message.agent === "user"
                      ? "bg-green-50 border border-green-200 text-green-900"
                      : message.agent === "ego" 
                        ? "bg-blue-50 border border-blue-200 text-blue-900" 
                        : "bg-purple-50 border border-purple-200 text-purple-900"
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {/* Check for markdown formatting */}
                    {message.content.includes('**') || message.content.includes('*') || message.content.includes('#') ? (
                      <div className="mt-2 p-2 bg-red-100 text-red-800 rounded text-xs">
                        ⚠️ Markdown detected: {message.content.match(/\*\*|\*|#/g)?.join(', ')}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {conversation.currentAgent === "ego" ? "Ego" : "Superego"} is thinking...
                  </span>
                </div>
              </div>
            )}

            {conversation.conversationComplete && (
              <div className="flex justify-center">
                <div className="px-6 py-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium text-center">
                    Conversation Complete! Check the flow and formatting above.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Test Steps:
          </h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-1">
            <li>Start a conversation</li>
            <li>Let agents exchange a few messages</li>
            <li>Send user input (e.g., "What color should I use for my website?")</li>
            <li>Verify conversation continues after user input</li>
            <li>Check that no markdown formatting appears (no **bold**, *italic*, # headers)</li>
            <li>Verify agents respond to your question directly</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
