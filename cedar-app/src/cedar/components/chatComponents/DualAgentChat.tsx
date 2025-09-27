"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, RotateCcw, Bot, Brain, Sparkles, FileText, Download, Clock, Calendar, Tag } from 'lucide-react';
import { summarize } from '../../../lib/summarizer';
import { getRecentMemories } from '../../../lib/memory';

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
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [recentMemories, setRecentMemories] = useState<any[]>([]);
  const [showMemories, setShowMemories] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  // Auto-summarize when conversation completes
  useEffect(() => {
    if (conversation.conversationComplete && conversation.messages.length > 0 && !summaryResult) {
      handleAutoSummarize();
    }
  }, [conversation.conversationComplete, conversation.messages.length, summaryResult]);

  // Load recent memories on component mount
  useEffect(() => {
    loadRecentMemories();
  }, []);

  const loadRecentMemories = async () => {
    try {
      const memories = await getRecentMemories(100);
      if (memories.success && Array.isArray(memories.memories)) {
        // Ensure each memory has the required properties with defaults
        const safeMemories = memories.memories.map(memory => ({
          ...memory,
          keyTopics: memory.keyTopics || [],
          memoryTags: memory.memoryTags || [],
          insights: memory.insights || [],
          psychologicalThemes: memory.psychologicalThemes || [],
          emotionalTone: memory.emotionalTone || 'neutral',
          userConcerns: memory.userConcerns || [],
          resolutions: memory.resolutions || []
        }));
        setRecentMemories(safeMemories);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
      setRecentMemories([]);
    }
  };

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
        conversationComplete: data.conversationComplete,
        isRunning: !data.conversationComplete // Keep conversation running unless explicitly completed
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
      maxTurns: 100,
      isRunning: false,
      conversationComplete: false
    });
    setUserInput("");
    setSummaryResult(null);
    setShowSummary(false);
  };

  const handleSummarize = async () => {
    if (conversation.messages.length === 0) {
      alert("No conversation to summarize yet!");
      return;
    }

    setIsSummarizing(true);
    try {
      const result = await summarize(conversation.messages);
      
      if (result.success && result.summary) {
        setSummaryResult(result);
        setShowSummary(true);
        
        // Add summary to recent memories list immediately
        if (result.summary) {
          setRecentMemories(prev => [result.summary, ...prev.slice(0, 99)]); // Add to top, keep max 100
        }
      } else {
        alert("Failed to generate summary: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      alert("Error generating summary. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAutoSummarize = async () => {
    if (conversation.messages.length === 0) return;

    setIsSummarizing(true);
    try {
      const result = await summarize(conversation.messages);
      
      if (result.success && result.summary) {
        setSummaryResult(result);
        setShowSummary(true);
        console.log('Conversation automatically summarized:', result.summary.storagePath);
        
        // Add summary to recent memories list immediately
        if (result.summary) {
          setRecentMemories(prev => [result.summary, ...prev.slice(0, 99)]); // Add to top, keep max 100
        }
        
        // Show a brief notification
        setTimeout(() => {
          alert(`Conversation automatically summarized!\n\nSummary saved to: ${result.summary.storagePath}`);
        }, 1000);
      } else {
        console.error('Auto-summarization failed:', result.error);
      }
    } catch (error) {
      console.error('Error in auto-summarization:', error);
    } finally {
      setIsSummarizing(false);
    }
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

          {conversation.messages.length > 0 && (
            <button
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileText className="w-4 h-4" />
              {isSummarizing ? "Summarizing..." : "Summarize"}
            </button>
          )}

          {recentMemories.length > 0 && (
            <button
              onClick={() => setShowMemories(!showMemories)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Tag className="w-4 h-4" />
              Memories ({recentMemories.length})
            </button>
          )}

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
              {isSummarizing && (
                <p className="text-green-600 text-sm text-center mt-2 flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  Auto-generating summary...
                </p>
              )}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Memory Display */}
      {showMemories && recentMemories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="border-t border-gray-200 dark:border-gray-700 p-4 bg-indigo-50 dark:bg-indigo-900/20"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Conversation Memories
              </h3>
              <button
                onClick={() => setShowMemories(false)}
                className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentMemories.map((memory, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-indigo-200 dark:border-indigo-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                      {memory.date}
                    </span>
                    <Clock className="w-4 h-4 text-indigo-600 ml-auto" />
                    <span className="text-sm text-indigo-600 dark:text-indigo-400">
                      {memory.time}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
                    {memory.summary}
                  </p>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Topics:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(memory.keyTopics || []).slice(0, 3).map((topic: string, topicIndex: number) => (
                          <span key={topicIndex} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md text-xs">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Emotional Tone:</span>
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {memory.emotionalTone || 'neutral'}
                      </span>
                    </div>
                    
                    {memory.memoryTags && memory.memoryTags.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {memory.memoryTags.slice(0, 2).map((tag: string, tagIndex: number) => (
                            <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Display */}
      {showSummary && summaryResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Conversation Summary
              </h3>
              <button
                onClick={() => setShowSummary(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Summary
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {summaryResult.summary?.summary || "No summary available"}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Key Topics
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(summaryResult.summary?.keyTopics || []).map((topic: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Psychological Insights
                  </h4>
                  <div className="space-y-2">
                    {(summaryResult.summary?.insights || []).map((insight: string, index: number) => (
                      <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Psychological Themes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(summaryResult.summary?.psychologicalThemes || []).map((theme: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                  
                  {summaryResult.summary?.emotionalTone && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Emotional Tone</h5>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium capitalize">
                        {summaryResult.summary.emotionalTone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {summaryResult.summary?.agentInteractions?.ego || 0}
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-300">Ego Messages</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {summaryResult.summary?.agentInteractions?.superego || 0}
                  </div>
                  <div className="text-sm text-purple-800 dark:text-purple-300">Superego Messages</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {summaryResult.summary?.agentInteractions?.user || 0}
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-300">User Messages</div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Storage Path:</strong> {summaryResult.summary?.storagePath}
                  </div>
                  <a
                    href={summaryResult.summary?.storagePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    View File
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
