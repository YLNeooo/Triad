"use client";

import React, { useState } from 'react';
import { summarize, getAllSummaries } from '../../lib/summarizer';

export default function TestSummarizerPage() {
  const [testMessages, setTestMessages] = useState([
    {
      role: "assistant" as const,
      content: "Hello! I'm the Ego, your realistic mediator. What would you like to discuss today?",
      agent: "ego" as const
    },
    {
      role: "user" as const,
      content: "I'm struggling with a decision about my career. I want to follow my passion but I'm worried about financial stability.",
      agent: "user" as const
    },
    {
      role: "assistant" as const,
      content: "That's a very common dilemma. Let me help you think through the practical aspects of this decision. What specific career path are you considering?",
      agent: "ego" as const
    },
    {
      role: "assistant" as const,
      content: "I understand your concern, but remember that following your passion can lead to fulfillment that money cannot buy. What values are most important to you in life?",
      agent: "superego" as const
    }
  ]);

  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allSummaries, setAllSummaries] = useState<any[]>([]);

  const handleTestSummarize = async () => {
    setIsLoading(true);
    try {
      const summaryResult = await summarize(testMessages);
      setResult(summaryResult);
    } catch (error) {
      console.error('Error testing summarizer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAllSummaries = async () => {
    try {
      const summaries = await getAllSummaries();
      if (summaries.success) {
        setAllSummaries(summaries.summaries || []);
      }
    } catch (error) {
      console.error('Error getting summaries:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Summarizer Agent Test
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Conversation
          </h2>
          <div className="space-y-4">
            {testMessages.map((message, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {message.agent === "ego" ? "Ego" : message.agent === "superego" ? "Superego" : "User"}
                </div>
                <div className="text-gray-900 dark:text-white">{message.content}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={handleTestSummarize}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Summarizing..." : "Test Summarize Function"}
          </button>
          
          <button
            onClick={handleGetAllSummaries}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Get All Summaries
          </button>
        </div>

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Summarizer Result
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Success:</h3>
                <p className="text-gray-700 dark:text-gray-300">{result.success ? "Yes" : "No"}</p>
              </div>
              
              {result.summary && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Summary:</h3>
                  <p className="text-gray-700 dark:text-gray-300">{result.summary.summary}</p>
                </div>
              )}
              
              {result.summary?.keyTopics && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Key Topics:</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.summary.keyTopics.map((topic: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {result.storagePath && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Storage Path:</h3>
                  <p className="text-gray-700 dark:text-gray-300 font-mono text-sm">{result.storagePath}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {allSummaries.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              All Summaries ({allSummaries.length})
            </h2>
            <div className="space-y-4">
              {allSummaries.map((summary, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-semibold text-gray-900 dark:text-white mb-2">
                    {summary.id}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {new Date(summary.timestamp).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {summary.summary.substring(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
