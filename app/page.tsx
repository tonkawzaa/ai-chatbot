"use client";

import { useState } from 'react';
import FileProcessingModal from '@/components/FileProcessingModal';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-12 bg-black border-r border-white/10 flex flex-col items-center py-3 gap-6">
        {/* New Chat Icon */}
        <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors mt-auto">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-3xl">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            {/* Sparkle Icon */}
            <div className="mb-4 flex justify-center">
              <span className="text-3xl">✨</span>
            </div>
            
            {/* Greeting */}
            <div className="mb-2">
              <span className="text-sm text-gray-400">✨ Hi PiyawatAI</span>
            </div>
            
            {/* Main Prompt */}
            <h1 className="text-3xl font-normal text-white">
              Where should we start?
            </h1>
          </div>

          {/* Input Area */}
          <div className="mb-6">
            <div className="bg-[#1E1E1E] rounded-xl border border-white/10 p-4 hover:bg-[#252525] transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Ask Gemini 3"
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base"
                />
                <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
              
              {/* Toolbar */}
              <div className="flex items-center justify-between text-sm">
                <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <span>Tools</span>
                </button>
                
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5">
                    <span>Fast</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors rounded hover:bg-white/5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { icon: "", label: "Read File", onClick: () => setIsModalOpen(true) },
            ].map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className="flex items-center gap-2 px-4 py-2 bg-[#1E1E1E] hover:bg-[#252525] border border-white/10 rounded-full transition-colors text-sm"
              >
                <span>{action.icon}</span>
                <span className="text-gray-300">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* File Processing Modal */}
      <FileProcessingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
