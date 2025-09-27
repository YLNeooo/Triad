"use client";

import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, User, Search, RefreshCw, Bug } from 'lucide-react';

export default function DebugMemoryPage() {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    setIsLoading(true);
    setDebugInfo("Loading memories...");
    
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_recent',
          limit: 5
        }),
      });

      const result = await response.json();
      console.log('Memory API response:', result);
      
      if (result.success) {
        setMemories(result.memories);
        setDebugInfo(`Loaded ${result.memories.length} memories successfully`);
        
        // Check for personal information
        const personalInfo = extractPersonalInfo(result.memories);
        if (personalInfo.name) {
          setDebugInfo(prev => prev + `\nFound user name: ${personalInfo.name}`);
        } else {
          setDebugInfo(prev => prev + '\nNo user name found in memories');
        }
      } else {
        setDebugInfo(`Error: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
      setDebugInfo(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const extractPersonalInfo = (memories) => {
    const allSummaries = memories.map(m => m.summary);
    const namePatterns = [
      /(?:user|person|individual)\s+(?:named|called|is)\s+([A-Z][a-z]+)/gi,
      /(?:name\s+is|I'm|I am)\s+([A-Z][a-z]+)/gi,
      /(?:call me|my name is)\s+([A-Z][a-z]+)/gi
    ];

    for (const summary of allSummaries) {
      for (const pattern of namePatterns) {
        const match = pattern.exec(summary);
        if (match && match[1]) {
          return { name: match[1] };
        }
      }
    }
    return { name: null };
  };

  const testMemoryContext = async () => {
    setDebugInfo("Testing memory context generation...");
    
    try {
      // Simulate what the dual-agents API does
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_recent',
          limit: 3
        }),
      });

      const result = await response.json();
      
      if (result.success && result.memories.length > 0) {
        // Import the memory functions (we'll simulate them)
        const memoryInsights = generateMemoryInsights(result.memories);
        const conversationStarter = generateConversationStarter(result.memories);
        
        const memoryContext = `PREVIOUS CONVERSATION CONTEXT:\n${memoryInsights}\n\nSuggested conversation starter: ${conversationStarter}`;
        
        setDebugInfo(`Memory Context Generated:\n\n${memoryContext}`);
      }
    } catch (error) {
      setDebugInfo(`Error testing memory context: ${error.message}`);
    }
  };

  const generateMemoryInsights = (memories) => {
    if (memories.length === 0) {
      return "No previous conversation history available.";
    }

    const allTopics = memories.flatMap(m => m.keyTopics || []);
    const allThemes = memories.flatMap(m => m.psychologicalThemes || []);
    const allConcerns = memories.flatMap(m => m.userConcerns || []);
    const allTones = memories.map(m => m.emotionalTone || 'neutral');
    const allSummaries = memories.map(m => m.summary);

    // Extract personal information from summaries
    const personalInfo = extractPersonalInfo(memories);

    // Count frequency of topics
    const topicCounts = allTopics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {});

    const frequentTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);

    const commonThemes = [...new Set(allThemes)].slice(0, 3);
    const commonConcerns = [...new Set(allConcerns)].slice(0, 3);
    const dominantTone = allTones.reduce((acc, tone) => {
      acc[tone] = (acc[tone] || 0) + 1;
      return acc;
    }, {});

    const mostCommonTone = Object.entries(dominantTone)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

    let insights = `User Conversation Patterns:
- Frequently discusses: ${frequentTopics.join(', ')}
- Common psychological themes: ${commonThemes.join(', ')}
- Recurring concerns: ${commonConcerns.join(', ')}
- Typical emotional tone: ${mostCommonTone}
- Total conversations: ${memories.length}`;

    if (personalInfo.name) {
      insights += `\n\nPersonal Information:
- User's name: ${personalInfo.name}`;
    }

    return insights;
  };

  const generateConversationStarter = (memories) => {
    if (memories.length === 0) {
      return "Hello! I'm here to help you explore your thoughts and feelings. What's on your mind today?";
    }

    const recentMemory = memories[0];
    const topics = (recentMemory.keyTopics || []).slice(0, 2);
    const concerns = (recentMemory.userConcerns || []).slice(0, 1);
    const allSummaries = memories.map(m => m.summary);
    
    // Extract user's name from summaries
    const personalInfo = extractPersonalInfo(memories);
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
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Memory Debug Tool
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Debug Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Debug Information
              </h2>
              <button
                onClick={loadMemories}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {debugInfo || "Click 'Refresh' to load debug information"}
              </pre>
            </div>

            <button
              onClick={testMemoryContext}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Test Memory Context Generation
            </button>
          </div>

          {/* Memories List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Memories
            </h2>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {memories.map((memory, index) => {
                const extractedName = extractPersonalInfo([memory]).name;
                return (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {memory.date} at {memory.time}
                        </span>
                        {extractedName && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                            Name: {extractedName}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-3">
                      {memory.summary}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(memory.keyTopics || []).slice(0, 3).map((topic, topicIndex) => (
                        <span key={topicIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                    {memory.memoryTags && memory.memoryTags.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {memory.memoryTags.slice(0, 3).map((tag, tagIndex) => (
                            <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Debug Steps:
          </h3>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1">
            <li>Click "Refresh" to load memories and check for user names</li>
            <li>Click "Test Memory Context Generation" to see what context is passed to agents</li>
            <li>Check if the memory context contains the user's name</li>
            <li>If no name is found, the summarizer needs to be enhanced</li>
            <li>If name is found but agents don't use it, the system prompts need enhancement</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
