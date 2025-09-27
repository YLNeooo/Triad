"use client";

import React, { useState, useEffect } from 'react';

export default function TestMemoryDirectPage() {
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const testDirectMemory = async () => {
    setIsLoading(true);
    setResult("Testing direct memory access...");
    
    try {
      // Test the memory API with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_recent',
          limit: 3
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setResult(`Memory API Response:
Success: ${data.success}
Memories count: ${data.memories ? data.memories.length : 0}

First memory:
${data.memories && data.memories[0] ? 
  `Summary: ${data.memories[0].summary.substring(0, 200)}...
Tags: ${data.memories[0].memoryTags}
Contains Neo: ${data.memories[0].summary.includes('Neo') || data.memories[0].memoryTags.includes('Neo')}` : 
  'No memories found'}`);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        setResult('Error: Request timed out after 5 seconds. The memory API is not responding.');
      } else {
        setResult(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testAlternative = async () => {
    setIsLoading(true);
    setResult("Testing alternative approach...");
    
    try {
      // Try to access the test-memory API
      const response = await fetch('/api/test-memory', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setResult(`Test Memory API Response:
Success: ${data.success}
Message: ${data.message}
Memories count: ${data.memories ? data.memories.length : 0}

First memory:
${data.memories && data.memories[0] ? 
  `ID: ${data.memories[0].id}
Summary: ${data.memories[0].summary}
Tags: ${data.memories[0].memoryTags}
Contains Neo: ${data.memories[0].memoryTags && data.memories[0].memoryTags.includes('Neo')}` : 
  'No memories found'}`);
      
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
          Direct Memory Test
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test Memory API (with timeout)
            </h2>
            <button
              onClick={testDirectMemory}
              disabled={isLoading}
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Testing..." : "Test Memory API (5s timeout)"}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test Alternative API
            </h2>
            <button
              onClick={testAlternative}
              disabled={isLoading}
              className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "Testing..." : "Test Alternative API"}
            </button>
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Results
          </h2>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {result || "Click a button to test the memory system"}
            </pre>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Troubleshooting Steps:
          </h3>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1">
            <li>If both tests timeout, the Next.js server may need to be restarted</li>
            <li>If the alternative API works but memory API doesn't, there's an issue with the memory API code</li>
            <li>If both fail, check the browser console for errors</li>
            <li>Try restarting the development server: <code>npm run dev</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
