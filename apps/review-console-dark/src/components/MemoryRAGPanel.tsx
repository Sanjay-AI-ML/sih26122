import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  BrainCircuit, 
  User, 
  Sparkles, 
  AlertTriangle, 
  RotateCcw, 
  Clock, 
  Tag, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Building2,
  Loader2
} from 'lucide-react';
import { queryHistoricalMemory, type HistoricalQueryResponse } from '../lib/api';

interface MemoryRAGPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content?: string;
  data?: HistoricalQueryResponse;
  isError?: boolean;
  isCached?: boolean;
  timestamp: string;
}

const queryCache = new Map<string, HistoricalQueryResponse>();

export const MemoryRAGPanel: React.FC<MemoryRAGPanelProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'ai',
      content: 'Welcome to the Institutional Memory RAG Copilot. I search historical Daily Progress Reports, schedule variance logs, and resolved bottleneck records. What would you like to investigate?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || query).trim();
    if (!textToSend || isLoading) return;

    const userMsgId = Date.now().toString();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setQuery('');
    setLastQuery(textToSend);
    setIsLoading(true);

    try {
      const responseData = await queryHistoricalMemory(textToSend);
      queryCache.set(textToSend.toLowerCase(), responseData);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        data: responseData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.warn('Analytics backend request error:', err);
      const cached = queryCache.get(textToSend.toLowerCase());
      if (cached) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            data: cached,
            isCached: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: 'Analytics service offline. Could not reach analytics server on port 8004.',
            isError: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastQuery) {
      handleSend(lastQuery);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[100] transition-opacity" 
        onClick={onClose}
      />
      
      <aside 
        aria-label="Institutional Memory Panel"
        className="fixed top-0 right-0 h-full w-full sm:w-[460px] md:w-[500px] bg-slate-900 shadow-2xl z-[101] flex flex-col animate-[slideLeft_0.3s_ease-out] border-l border-slate-800"
      >
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-5 bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center border border-amber-400/40 shadow-xs">
              <BrainCircuit className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide">Institutional Memory RAG</span>
              <span className="text-[10px] text-amber-200/90 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> DuckDB + Vector Search
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close panel"
            className="p-2 rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white/90" />
          </button>
        </header>

        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">Try:</span>
          {["spool erection delays", "civil foundation rebar", "11kV cable pulling"].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSend(suggestion)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap cursor-pointer text-[11px]"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 bg-slate-950/40 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                msg.role === 'user' 
                  ? 'bg-sky-600 text-white' 
                  : 'bg-gradient-to-br from-amber-500 to-amber-700 text-white'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
              </div>

              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[88%]`}>
                {msg.content && (
                  <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-sky-600 text-white rounded-tr-xs shadow-xs' 
                      : msg.isError
                        ? 'bg-red-950/50 border border-red-800 text-red-200 rounded-tl-xs'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-xs shadow-xs'
                  }`}>
                    {msg.isError && (
                      <div className="flex items-center gap-2 font-bold mb-1 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Analytics Service Offline</span>
                      </div>
                    )}
                    <p>{msg.content}</p>

                    {msg.isError && (
                      <div className="mt-2.5 pt-2 border-t border-red-900/60 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRetry}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry Query</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {msg.data && (
                  <div className="flex flex-col gap-3 w-full bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-tl-xs shadow-xs text-xs sm:text-sm">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs sm:text-sm">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>{msg.data.summary}</span>
                      </div>
                      {msg.isCached && (
                        <span className="text-[10px] bg-amber-900/60 text-amber-200 px-1.5 py-0.5 rounded font-medium">
                          Cached
                        </span>
                      )}
                    </div>

                    {msg.data.similar_extractions && msg.data.similar_extractions.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Similar Historical Extractions
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {msg.data.similar_extractions.map((item, idx) => {
                            const isCompleted = item.status === 'completed';
                            const isDelayed = item.status === 'delayed' || (item.variance_days && item.variance_days > 0);

                            return (
                              <div
                                key={idx}
                                className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col gap-1.5 transition-all hover:border-sky-500/40 shadow-2xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-1.5 font-semibold text-slate-100 text-xs">
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    ) : (
                                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    )}
                                    <span className="leading-snug">{item.activity_phrase}</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                                    isCompleted 
                                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800' 
                                      : 'bg-amber-950/70 text-amber-300 border border-amber-800'
                                  }`}>
                                    {isDelayed 
                                      ? `delayed ${item.variance_days || 2} days` 
                                      : item.status}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap pt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {item.date}
                                  </span>
                                  {item.tag && (
                                    <span className="flex items-center gap-1 font-technical-data text-sky-300 bg-slate-800 px-1 py-0.2 rounded">
                                      <Tag className="w-2.5 h-2.5" />
                                      {item.tag}
                                    </span>
                                  )}
                                  {item.contractor && (
                                    <span className="flex items-center gap-1">
                                      <Building2 className="w-3 h-3" />
                                      {item.contractor}
                                    </span>
                                  )}
                                </div>

                                {item.delay_reason && (
                                  <div className="text-[11px] text-amber-300 bg-amber-950/40 p-1.5 rounded-md border border-amber-800/40 mt-0.5 leading-tight">
                                    <span className="font-semibold">Cause: </span>
                                    {item.delay_reason}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {msg.data.common_bottlenecks && msg.data.common_bottlenecks.length > 0 && (
                      <div className="flex flex-col gap-2 pt-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Identified Schedule Bottlenecks
                        </span>
                        {msg.data.common_bottlenecks.map((b, bIdx) => (
                          <div
                            key={bIdx}
                            className="p-2.5 rounded-xl border border-amber-700/80 bg-amber-950/40 flex flex-col gap-1 shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-amber-200 text-xs flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                {b.title}
                              </span>
                              <span className="text-[10px] font-semibold bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded-full border border-amber-700">
                                {b.period}
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-300/90 leading-tight">
                              {b.impact}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.data.timeline_insights && msg.data.timeline_insights.length > 0 && (
                      <div className="flex flex-col gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-sky-400" />
                          Institutional Insights
                        </span>
                        <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                          {msg.data.timeline_insights.map((insight, inIdx) => (
                            <li key={inIdx} className="leading-snug">
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-xs flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-slate-800 shadow-xs p-3.5 rounded-2xl rounded-tl-xs flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                <span>Querying institutional memory & DuckDB logs...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <footer className="p-3.5 sm:p-4 bg-slate-900 border-t border-slate-800 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
              placeholder="Ask about spool delays, civil bottlenecks, history..."
              className="w-full bg-slate-950 border border-slate-800 rounded-full py-2.5 pl-4 pr-12 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all disabled:opacity-60"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!query.trim() || isLoading}
              aria-label="Send Query"
              className="absolute right-1.5 w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center hover:bg-sky-500 disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
};

export default MemoryRAGPanel;