"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, RotateCcw, Bot, Brain, Sparkles } from 'lucide-react';

interface AgentMessage {
  role: "system" | "user" | "assistant";
  content: string;
  agent?: "ego" | "superego" | "user";
  turnCount?: number;
  currentAgent?: "ego" | "superego";
  conversationComplete?: boolean;
}

interface ConversationState {
  messages: AgentMessage[];
  currentAgent: "ego" | "superego";
  turnCount: number;
  maxTurns: number;
  isRunning: boolean;
  conversationComplete: boolean;
}

export const DualAgentChat: React.FC = () => {
  const [conversation, setConversation] = useState<ConversationState>({
    messages: [],
    currentAgent: "ego",
    turnCount: 0,
    maxTurns: 100,
    isRunning: false,
    conversationComplete: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [userMode, setUserMode] = useState<"listen" | "solve">("listen");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dual-agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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

    setIsLoading(true);
    try {
      const response = await fetch('/api/dual-agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversation.messages,
          currentAgent: conversation.currentAgent,
          turnCount: conversation.turnCount,
          maxTurns: conversation.maxTurns,
          userInput: userInput.trim(),
          userMode: userMode
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('Error sending user input:', data.error);
        return;
      }

      // Add user message and agent response
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
        conversationComplete: data.conversationComplete
      }));

      setUserInput(""); // Clear input
    } catch (error) {
      console.error('Error sending user input:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopConversation = () => {
    setConversation(prev => ({
      ...prev,
      isRunning: false
    }));
  };

  const resetConversation = () => {
    setConversation({
      messages: [],
      currentAgent: "ego",
      turnCount: 0,
      maxTurns: 10,
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
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Ego-Superego Conversation
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Interact with your psychological agents - Ego (realistic mediator) and Superego (moral compass)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
              <Brain className="w-3 h-3" />
              Ego
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs">
              <Sparkles className="w-3 h-3" />
              Superego
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs">
              <Bot className="w-3 h-3" />
              You
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
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

          {conversation.isRunning && (
            <button
              onClick={stopConversation}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}

          <button
            onClick={resetConversation}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Turn {conversation.turnCount} / {conversation.maxTurns}
          </div>
        </div>
      </div>

      {/* User Input Section */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Mode:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setUserMode("listen")}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  userMode === "listen"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Listen
              </button>
              <button
                onClick={() => setUserMode("solve")}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  userMode === "solve"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Solve
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendUserInput()}
              placeholder="Type your message to interrupt the conversation..."
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
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {conversation.messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                message.agent === "user" 
                  ? "justify-center" 
                  : message.agent === "ego" 
                    ? "justify-start" 
                    : "justify-end"
              }`}
            >
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
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {conversation.currentAgent === "ego" ? "Ego" : "Superego"} is thinking...
              </span>
            </div>
          </motion.div>
        )}

        {conversation.conversationComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            <div className="px-6 py-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium text-center">
                 Conversation Complete! The psychological agents have finished their thoughtful exchange.
              </p>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
