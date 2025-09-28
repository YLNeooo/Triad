"use client";

import React, { useState } from 'react';
import { useAuth } from '@/app/FirebaseAuthProvider';
import { useConversations } from '@/hooks/useConversations';
import type { ConversationCreateData, ConversationMessage } from '@/lib/firebase/conversations';

interface ConversationExampleProps {
  userId: string;
}

export default function ConversationExample({ userId }: ConversationExampleProps) {
  const { user } = useAuth();
  const uid = user?.uid || "";
  const { conversations, loading, error, createConversation, addMessage, archiveConversation } = useConversations({ uid });
  
  const [newConversation, setNewConversation] = useState<Omit<ConversationCreateData, 'uid'>>({
    title: '',
    messages: [],
    status: 'active',
    summary: '',
    tags: [],
    metadata: {
      totalMessages: 0,
      totalTokens: 0,
      participants: [],
      context: {}
    }
  });
  
  const [newMessage, setNewMessage] = useState({
    role: 'user' as const,
    content: '',
    metadata: {}
  });
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createConversation({
        title: newConversation.title,
        messages: newConversation.messages,
        status: newConversation.status,
        summary: newConversation.summary,
        tags: newConversation.tags,
        metadata: newConversation.metadata
      });
      setNewConversation({
        title: '',
        messages: [],
        status: 'active',
        summary: '',
        tags: [],
        metadata: {
          totalMessages: 0,
          totalTokens: 0,
          participants: [],
          context: {}
        }
      });
      alert('Conversation created successfully!');
    } catch (error: any) {
      alert(`Error creating conversation: ${error.message}`);
    }
  };

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversationId) return;
    
    try {
      await addMessage(selectedConversationId, newMessage);
      setNewMessage({ role: 'user', content: '', metadata: {} });
      alert('Message added successfully!');
    } catch (error: any) {
      alert(`Error adding message: ${error.message}`);
    }
  };

  if (loading) return <div className="text-white">Loading conversations...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Conversation History</h2>
      
      {/* Create New Conversation */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4 text-white">Create New Conversation</h3>
        <form onSubmit={handleCreateConversation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Title</label>
            <input
              type="text"
              value={newConversation.title}
              onChange={(e) => setNewConversation({ ...newConversation, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/80"
              placeholder="Enter conversation title..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">Summary</label>
            <textarea
              value={newConversation.summary}
              onChange={(e) => setNewConversation({ ...newConversation, summary: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/80"
              placeholder="Enter conversation summary..."
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={newConversation.tags.join(', ')}
              onChange={(e) => setNewConversation({ 
                ...newConversation, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
              })}
              className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/80"
              placeholder="Enter tags..."
            />
          </div>
          
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create Conversation
          </button>
        </form>
      </div>

      {/* Add Message to Conversation */}
      {conversations.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 text-white">Add Message</h3>
          <form onSubmit={handleAddMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Select Conversation</label>
              <select
                value={selectedConversationId || ''}
                onChange={(e) => setSelectedConversationId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white"
                required
              >
                <option value="">Select a conversation...</option>
                {conversations.map((conv) => (
                  <option key={conv.id} value={conv.id}>
                    {conv.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">Message Content</label>
              <textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/80"
                placeholder="Enter your message..."
                rows={3}
                required
              />
            </div>
            
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Add Message
            </button>
          </form>
        </div>
      )}

      {/* Conversations List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Your Conversations</h3>
        {conversations.length === 0 ? (
          <p className="text-white/70">No conversations yet. Create one above!</p>
        ) : (
          conversations.map((conversation) => (
            <div key={conversation.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">{conversation.title}</h4>
                  <p className="text-white/70 text-sm">{conversation.summary}</p>
                  <div className="flex gap-2 mt-2">
                    {conversation.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => archiveConversation(conversation.id!)}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
                  >
                    Archive
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-white/60 text-sm">
                  Messages: {conversation.metadata?.totalMessages || 0} | 
                  Status: {conversation.status}
                </p>
                {conversation.messages && conversation.messages.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {conversation.messages.slice(-3).map((message, index) => (
                      <div key={index} className="bg-white/5 rounded p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-white/80">{message.role}</span>
                          <span className="text-xs text-white/60">
                            {message.timestamp ? new Date(message.timestamp.seconds * 1000).toLocaleTimeString() : 'Now'}
                          </span>
                        </div>
                        <p className="text-white/90 text-sm">{message.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
