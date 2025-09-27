"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Tag, Brain, Sparkles, FileText, Search, RefreshCw } from 'lucide-react';
import { searchMemories, getRecentMemories, getContextualMemories } from '../../lib/memory';

export default function TestMemoryFeaturesPage() {
  const [memories, setMemories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [contextualMemories, setContextualMemories] = useState<any[]>([]);

  useEffect(() => {
    loadRecentMemories();
  }, []);

  const loadRecentMemories = async () => {
    setIsLoading(true);
    try {
      const result = await getRecentMemories(10);
      if (result.success) {
        setMemories(result.memories);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadRecentMemories();
      return;
    }

    setIsLoading(true);
    try {
      const result = await searchMemories({ searchQuery: searchQuery.trim() });
      if (result.success) {
        setMemories(result.memories);
      }
    } catch (error) {
      console.error('Error searching memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetContextual = async (topics: string[]) => {
    setIsLoading(true);
    try {
      const result = await getContextualMemories(topics);
      if (result.success) {
        setContextualMemories(result.memories);
      }
    } catch (error) {
      console.error('Error getting contextual memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Memory Features Test
        </h1>

        {/* Search and Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Memory Search & Management
          </h2>
          
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search memories by topic, theme, or content..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Search className="w-4 h-4" />
              {isLoading ? "Searching..." : "Search"}
            </button>
            <button
              onClick={loadRecentMemories}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Found {memories.length} memories
          </div>
        </div>

        {/* Memory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {memories.map((memory, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(memory.timestamp)}
                </span>
                <Clock className="w-4 h-4 text-blue-600 ml-auto" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatTime(memory.timestamp)}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {memory.summary.substring(0, 100)}...
              </h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Topics:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {memory.keyTopics.slice(0, 3).map((topic: string, topicIndex: number) => (
                      <span key={topicIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Emotional Tone:</span>
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {memory.emotionalTone}
                  </span>
                </div>
                
                {memory.memoryTags.length > 0 && (
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
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setSelectedMemory(memory)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleGetContextual(memory.keyTopics)}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    Find Similar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Memory Details */}
        {selectedMemory && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Memory Details
              </h2>
              <button
                onClick={() => setSelectedMemory(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Summary
                </h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {selectedMemory.summary}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Key Topics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedMemory.keyTopics || []).map((topic: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
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
                  {(selectedMemory.insights || []).map((insight: string, index: number) => (
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
                  {(selectedMemory.psychologicalThemes || []).map((theme: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {theme}
                    </span>
                  ))}
                </div>
                
                <div className="mt-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Emotional Tone</h5>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium capitalize">
                    {selectedMemory.emotionalTone || 'neutral'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contextual Memories */}
        {contextualMemories.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Similar Memories ({contextualMemories.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contextualMemories.map((memory, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(memory.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {memory.summary.substring(0, 150)}...
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(memory.keyTopics || []).slice(0, 2).map((topic: string, topicIndex: number) => (
                      <span key={topicIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {memories.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Memories Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start a conversation to create your first memory!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
