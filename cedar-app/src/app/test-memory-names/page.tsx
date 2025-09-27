"use client";

import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, User, Search, RefreshCw } from 'lucide-react';
import { getRecentMemories, searchMemories } from '../../lib/memory';

export default function TestMemoryNamesPage() {
  const [memories, setMemories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const result = await getRecentMemories(10);
      if (result.success) {
        setMemories(result.memories);
        console.log('Loaded memories:', result.memories);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await searchMemories({ searchQuery: searchQuery.trim() });
      if (result.success) {
        setSearchResults(result.memories);
        console.log('Search results:', result.memories);
      }
    } catch (error) {
      console.error('Error searching memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractPersonalInfo = (summary: string) => {
    const namePatterns = [
      /(?:user|person|individual)\s+(?:named|called|is)\s+([A-Z][a-z]+)/gi,
      /(?:name\s+is|I'm|I am)\s+([A-Z][a-z]+)/gi,
      /(?:call me|my name is)\s+([A-Z][a-z]+)/gi
    ];

    for (const pattern of namePatterns) {
      const match = pattern.exec(summary);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Memory Names Test
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Memories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Memories
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

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {memories.map((memory, index) => {
                const extractedName = extractPersonalInfo(memory.summary);
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
                      {memory.keyTopics.slice(0, 3).map((topic, topicIndex) => (
                        <span key={topicIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search Memories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Search Memories
            </h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for 'Alex' or other names..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {searchResults.map((memory, index) => {
                const extractedName = extractPersonalInfo(memory.summary);
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
                      {memory.keyTopics.slice(0, 3).map((topic, topicIndex) => (
                        <span key={topicIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Test Instructions:
          </h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-1">
            <li>Check if any memories contain user names (look for green "Name:" badges)</li>
            <li>Search for "Alex" to see if the name appears in any summaries</li>
            <li>If no names are found, the summarizer needs to be enhanced to capture personal information</li>
            <li>Start a new conversation and mention your name to test if it gets captured</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
