import React, { useState, useEffect, useRef } from 'react';
import { X, Send, BrainCircuit, User, Sparkles } from 'lucide-react';

interface MemoryRAGPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export const MemoryRAGPanel: React.FC<MemoryRAGPanelProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Hello! I am your Institutional Memory Copilot. I have access to the entire history of field reports, bottlenecks, and execution delays. What would you like to know?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!query.trim()) return;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setQuery('');
    setIsTyping(true);

    // Mock RAG processing delay
    setTimeout(() => {
      setIsTyping(false);
      let aiResponse = "I'm analyzing the historical progress data...";
      
      const q = newUserMsg.content.toLowerCase();
      if (q.includes('delay') || q.includes('bottleneck') || q.includes('piping')) {
        aiResponse = "Based on 14 recent execution records in the FAISS database, the primary bottleneck for Piping in Sector 4 is 'Late arrival of Gate Valves'. This has caused a cumulative 12-day schedule variance. Recommendation: Expedite PO-8821 and cross-reference with the baseline MS Project schedule.";
      } else if (q.includes('civil') || q.includes('trench')) {
        aiResponse = "Historical data shows Civil trenching activities are currently running 15% ahead of schedule, largely due to uninterrupted weather conditions. However, soil anomaly reports indicate potential slowdowns in Block B next week.";
      } else {
        aiResponse = "I have queried the project history. The data indicates that current resource allocation is generally aligning with the L5/L6 baseline, but I recommend reviewing the 'Needs Review' queue for recent unverified field deviations.";
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1800);
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] transition-opacity" 
        onClick={onClose}
      />
      
      {/* Slide-over Panel */}
      <div className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-[101] flex flex-col animate-slide-left border-l border-gray-200">
        
        {/* Header */}
        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-5 bg-gradient-to-r from-[#1a237e] to-[#283593] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/50">
              <BrainCircuit className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-wide">Institutional Memory</span>
              <span className="text-[10px] text-amber-200 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> FAISS RAG Active
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-gray-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#1565c0]/10 text-[#1a237e]' : 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
              </div>
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#1a237e] text-white rounded-tr-sm' : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'}`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about delays, deviations, history..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 pl-4 pr-12 text-sm outline-none focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e]/20 transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={!query.trim() || isTyping}
              className="absolute right-2 w-8 h-8 bg-[#1a237e] text-white rounded-full flex items-center justify-center hover:bg-[#283593] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider">
            Connected to FAISS Vector Database
          </p>
        </div>

      </div>
    </>
  );
};