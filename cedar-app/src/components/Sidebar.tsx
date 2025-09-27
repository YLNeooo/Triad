"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, MessageSquare, History, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/FirebaseAuthProvider';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPage: 'calendar' | 'chat';
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, currentPage }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        // Fetch conversations from your API
        const response = await fetch('/api/conversations/history');
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-gray-900/95 backdrop-blur-sm border-r border-gray-700/50 transition-all duration-300 z-50 ${
      isOpen ? 'w-80' : 'w-0'
    } overflow-hidden`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <h2 className="text-lg font-semibold text-white">Navigation</h2>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2">
          <Link
            href="/calendar"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              currentPage === 'calendar'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Calendar</span>
          </Link>
          
          <Link
            href="/dual-agents"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              currentPage === 'chat'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </Link>
        </div>

        {/* Past Conversations */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 p-4 border-b border-gray-700/50">
            <History className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-400">Recent Conversations</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 text-sm mt-2">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No conversations yet</p>
                <p className="text-gray-500 text-xs mt-1">Start a new chat to see it here</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/dual-agents?conversation=${conversation.id}`}
                  className="block p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/50 transition-colors border border-gray-700/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-white truncate">
                      {conversation.title}
                    </h4>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                      {formatTimestamp(conversation.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mb-1">
                    {conversation.lastMessage}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{conversation.messageCount} messages</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="text-xs text-gray-500 text-center">
            {user ? `Logged in as ${user.email}` : 'Not logged in'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
