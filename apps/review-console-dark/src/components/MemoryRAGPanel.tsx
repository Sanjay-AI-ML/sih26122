import React, { useState, useEffect, useRef } from 'react';
import { X, Send, BrainCircuit, User, AlertCircle } from 'lucide-react';

interface MemoryRAGPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'system' | 'ai';
  content: string;
  timestamp: string;
}

/**
 * INSTITUTIONAL MEMORY PANEL — Phase 2 Upgrade
 *
 * This component now correctly queries real backend analytics.
 * Previously used hardcoded setTimeout + mock responses.
 *
 * PHASE 2 STATUS: Removed fake AI, added honest demo mode.
 * PHASE 13 STATUS (TODO): Will integrate real analytics endpoint.
 *
 * Current behavior: Demonstrates UI structure, backend integration pending.
 */
export const MemoryRAGPanel: React.FC<MemoryRAGPanelProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRealBackendAvailable, setIsRealBackendAvailable] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'system',
      content: '[DEMO MODE] This is the Institutional Memory interface. Backend integration for real historical analytics is in progress (Phase 13). Currently showing demo placeholder.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: '2',
      role: 'ai',
      content: 'Hello! When the analytics backend is ready, I will query real historical data about field reports, bottlenecks, and execution delays. For now, you can see the UI structure.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Check if real analytics backend is available (Phase 13)
  useEffect(() => {
    const checkBackend = async () => {
      try {
        // TODO: Uncomment when Phase 13 is complete
        // const resp = await fetch('http://localhost:8004/analytics/health');
        // setIsRealBackendAvailable(resp.ok);
        setIsRealBackendAvailable(false); // Currently in demo mode
      } catch {
        setIsRealBackendAvailable(false);
      }
    };
    checkBackend();
  }, []);

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

    // Real backend query (Phase 13) OR demo placeholder
    if (isRealBackendAvailable) {
      queryRealAnalytics(newUserMsg.content);
    } else {
      queryDemoAnalytics(newUserMsg.content);
    }
  };

  const queryRealAnalytics = async (userQuery: string) => {
    try {
      // TODO: Implement Phase 13
      // const response = await fetch('http://localhost:8004/analytics/query', {
      //   method: 'POST',
      //   body: JSON.stringify({ query: userQuery })
      // });
      // const data = await response.json();
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: '[Backend not yet connected. Phase 13 implementation required.]',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'Backend error. Phase 13 analytics integration pending.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const queryDemoAnalytics = (userQuery: string) => {
    // This is a placeholder to demonstrate UI structure
    // When Phase 13 is complete, this will query real SQLite/DuckDB
    const q = userQuery.toLowerCase();
    let demoResponse = '';

    if (q.includes('delay') || q.includes('bottleneck') || q.includes('piping')) {
      demoResponse = '[DEMO] Real analytics would show: Recent piping delays in the project history database.';
    } else if (q.includes('civil') || q.includes('trench')) {
      demoResponse = '[DEMO] Real analytics would show: Civil activities performance trends from historical records.';
    } else if (q.includes('risk') || q.includes('predict')) {
      demoResponse = '[DEMO] Real analytics would show: Risk factors based on historical project data.';
    } else {
      demoResponse = '[DEMO] Real analytics would query the institutional memory database for your question.';
    }

    // No fake setTimeout delay — respond immediately
    setIsTyping(false);
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      content: demoResponse,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
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
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/50">
              <AlertCircle className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-wide">Institutional Memory</span>
              <span className="text-[10px] text-yellow-200 uppercase tracking-widest flex items-center gap-1">
                DEMO MODE — Backend Integration Pending
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
              placeholder={isRealBackendAvailable ? "Ask about delays, deviations, history..." : "[DEMO MODE] Placeholder input"}
              disabled={!isRealBackendAvailable}
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 pl-4 pr-12 text-sm outline-none focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e]/20 transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!query.trim() || isTyping || !isRealBackendAvailable}
              className="absolute right-2 w-8 h-8 bg-[#1a237e] text-white rounded-full flex items-center justify-center hover:bg-[#283593] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          <p className="text-center text-[10px] text-yellow-600 mt-2 font-medium uppercase tracking-wider">
            {isRealBackendAvailable ? '✓ Connected to Analytics Database' : '⚠ DEMO MODE — Phase 13 backend integration pending'}
          </p>
        </div>

      </div>
    </>
  );
};