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
 * INSTITUTIONAL MEMORY PANEL — Local LLM Q&A over project data
 *
 * - Port 8001: /assistant/query (ingestion service, local Ollama LLM)
 * - Port 8003: audit history (writeback)
 * - Port 8004: analytics stats
 *
 * Fetches real project data, then asks the local LLM to answer the user's
 * question grounded in that data.
 */
export const MemoryRAGPanel: React.FC<MemoryRAGPanelProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'system',
      content: '✓ Connected to local LLM + analytics backend. I can analyze field reports, identify bottlenecks, and provide insights based on project history.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: '2',
      role: 'ai',
      content: 'Hello! I\'m your institutional memory assistant, backed by a local LLM. I can help you understand project patterns, identify delays, and spot bottlenecks based on historical data. Try asking about specific disciplines or recent delays.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Check if backend services are available
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const ingestResp = await fetch('http://localhost:8001/health', { signal: controller.signal });
        const matchResp = await fetch('http://localhost:8002/health', { signal: controller.signal });

        clearTimeout(timeoutId);
        setIsBackendAvailable(ingestResp.ok && matchResp.ok);
      } catch {
        setIsBackendAvailable(false);
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

    if (isBackendAvailable) {
      queryLocalClaude(newUserMsg.content);
    } else {
      showOfflineMessage();
    }
  };

  const queryLocalClaude = async (userQuery: string) => {
    try {
      const [stats, history] = await Promise.all([
        fetch('http://localhost:8004/analytics/stats').then(r => r.json()).catch(() => null),
        fetch('http://localhost:8003/audit/history?limit=20').then(r => r.json()).catch(() => []),
      ]);

      const disciplineBreakdown = Array.isArray(stats?.discipline_breakdown)
        ? stats.discipline_breakdown.map((d: { discipline: string; count: number }) => `${d.discipline}=${d.count}`).join(', ')
        : 'none';
      const delayAnalysis = Array.isArray(stats?.delay_analysis)
        ? stats.delay_analysis
            .filter((d: { has_delays: number }) => d.has_delays)
            .map((d: { discipline: string; avg_delay_pct: number }) => `${d.discipline}: ${Math.round(d.avg_delay_pct)}% of activities delayed`)
            .join('; ') || 'no delays recorded'
        : 'unavailable';
      // Repeated identical approvals (e.g. a double-click writing the same
      // activity twice) must not be presented to the model as N distinct
      // activities - dedupe by activity+excerpt before it ever reaches the
      // prompt, so a data glitch can't inflate what looks like a fact.
      const seenActivities = new Set<string>();
      const dedupedHistory = Array.isArray(history)
        ? history.filter((h: { activity_id: string; source_excerpt?: string }) => {
            const key = `${h.activity_id}|${h.source_excerpt || ''}`;
            if (seenActivities.has(key)) return false;
            seenActivities.add(key);
            return true;
          })
        : [];
      const recentActivities = dedupedHistory.length > 0
        ? dedupedHistory.slice(0, 10).map((h: { activity_id: string; discipline: string; status: string; delay_reason?: string | null }) =>
            `${h.activity_id} (${h.discipline}, ${h.status}${h.delay_reason ? `, delay: ${h.delay_reason}` : ''})`
          ).join('; ')
        : 'none yet';

      const context = [
        `Total approved/rejected events: ${stats?.total_events ?? 'unknown'}`,
        `Approved: ${stats?.approved ?? 'unknown'}, Rejected: ${stats?.rejected ?? 'unknown'}, Ambiguous: ${stats?.ambiguous ?? 'unknown'}`,
        `Discipline breakdown: ${disciplineBreakdown}`,
        `Delay analysis: ${delayAnalysis}`,
        `Recent activities: ${recentActivities}`,
      ].join('\n');

      const res = await fetch('http://localhost:8001/assistant/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQuery, context })
      });

      setIsTyping(false);
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: '⚠ Local LLM (Ollama) is not available. Start it and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `⚠ Query failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const showOfflineMessage = () => {
    setIsTyping(false);
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'system',
      content: '⚠ Backend services not available. Make sure ports 8001-8004 are running.',
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
              <span className="text-[10px] text-green-200 uppercase tracking-widest flex items-center gap-1">
                ✓ Local LLM Connected
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
              placeholder={isBackendAvailable ? "Ask about delays, deviations, history..." : "Backend not available"}
              disabled={!isBackendAvailable}
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 pl-4 pr-12 text-sm outline-none focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e]/20 transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!query.trim() || isTyping || !isBackendAvailable}
              className="absolute right-2 w-8 h-8 bg-[#1a237e] text-white rounded-full flex items-center justify-center hover:bg-[#283593] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          <p className="text-center text-[10px] text-yellow-600 mt-2 font-medium uppercase tracking-wider">
            {isBackendAvailable ? '✓ Connected to local LLM' : '⚠ Backend services unavailable'}
          </p>
        </div>

      </div>
    </>
  );
};