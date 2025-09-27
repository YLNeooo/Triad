"use client";

import React, { useState } from 'react';

export default function TestMemorySimplePage() {
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const testMemoryAPI = async () => {
    setIsLoading(true);
    setResult("Testing memory API...");
    
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_recent',
          limit: 3
        }),
      });

      const data = await response.json();
      
      setResult(`Memory API Response:
Success: ${data.success}
Memories count: ${data.memories ? data.memories.length : 0}

Recent memories:
${data.memories ? data.memories.map((m, i) => `${i + 1}. ${m.summary.substring(0, 100)}...`).join('\n') : 'No memories'}

Memory tags from first memory:
${data.memories && data.memories[0] ? data.memories[0].memoryTags : 'No tags'}

Contains Neo: ${data.memories && data.memories[0] ? 
  (data.memories[0].summary.includes('Neo') || data.memories[0].memoryTags.includes('Neo')) : false}`);
      
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Simple Memory Test
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <button
            onClick={testMemoryAPI}
            disabled={isLoading}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "Test Memory API"}
          </button>

          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {result || "Click the button to test the memory API"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
