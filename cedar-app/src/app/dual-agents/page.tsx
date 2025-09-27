"use client";

import { useState } from 'react';
import { DualAgentChat } from "../../cedar/components/chatComponents/DualAgentChat";
import { TriadBackground } from '@/cedar/components/backgrounds/Background';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function DualAgentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <TriadBackground className="min-h-screen">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        currentPage="chat" 
      />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        {/* Header with menu button */}
        <div className="fixed top-4 left-4 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <main className="h-screen flex flex-col">
          <div className="flex-1 overflow-hidden">
            <DualAgentChat />
          </div>
        </main>
      </div>
    </TriadBackground>
  );
}
