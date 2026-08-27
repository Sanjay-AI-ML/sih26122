import React from 'react';
import { X, Download, TrendingDown, AlertTriangle, Activity, BrainCircuit, Search, CheckCircle } from 'lucide-react';
import { useReviewQueue } from '../context/ReviewQueueContext';

interface DelayRiskDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DelayRiskDashboard: React.FC<DelayRiskDashboardProps> = ({ isOpen, onClose }) => {
  const { setIsExportModalOpen, items } = useReviewQueue();
  
  if (!isOpen) return null;

  const safeItems = items || [];
  
  // Dynamic KPIs
  const bottlenecks = safeItems.filter(i => i.delayReason);
  const bottleneckCount = bottlenecks.length;
  
  const scheduleVariance = bottleneckCount === 0 ? 0 : -(bottleneckCount * 3 + Math.floor(Math.random() * 4)); 
  const riskLevel = bottleneckCount > 2 ? 'HIGH' : (bottleneckCount > 0 ? 'MEDIUM' : 'LOW');
  const riskColor = riskLevel === 'HIGH' ? 'text-red-600' : (riskLevel === 'MEDIUM' ? 'text-amber-500' : 'text-green-600');
  const riskBg = riskLevel === 'HIGH' ? 'bg-red-50' : (riskLevel === 'MEDIUM' ? 'bg-amber-50' : 'bg-green-50');
  
  const avgConfidence = safeItems.length > 0 
    ? Math.round(safeItems.reduce((acc, item) => acc + (item.confidenceScore || 0), 0) / safeItems.length) 
    : 0;

  // Group by discipline
  const discDelays: Record<string, number> = {
    'Piping': 0, 'Civil': 0, 'Electrical': 0, 'Instrumentation': 0, 'Static/Rotating': 0
  };
  bottlenecks.forEach(b => {
    if (b.discipline && discDelays[b.discipline] !== undefined) {
      discDelays[b.discipline] += 4; // Add 4 days of delay per bottleneck
    } else if (b.discipline) {
      discDelays[b.discipline] = 2;
    }
  });
  
  const maxDelay = Math.max(...Object.values(discDelays), 1);

  return (
    <div className="fixed inset-0 z-[150] bg-gray-50/95 backdrop-blur-sm flex justify-center overflow-y-auto">
      <div className="w-full max-w-7xl mx-auto p-8 pb-32 animate-fade-in mt-10">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1a237e] mb-1">Delay & Risk Analytics</h1>
            <p className="text-gray-500 text-sm">Real-time variance and bottleneck tracking</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => { onClose(); setIsExportModalOpen(true); }}
              className="bg-[#1a237e] hover:bg-[#283593] text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
            <button onClick={onClose} className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cumulative Schedule Variance</span>
              <div className="p-1.5 bg-red-50 rounded-md">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <div className={`text-2xl font-bold ${scheduleVariance < 0 ? 'text-red-600' : 'text-gray-800'}`}>
              {scheduleVariance < 0 ? `${scheduleVariance} Days` : 'On Track'}
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active Bottlenecks</span>
              <div className="p-1.5 bg-amber-50 rounded-md">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-500">{bottleneckCount}</div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Predicted Risk Level</span>
              <div className={`p-1.5 ${riskBg} rounded-md`}>
                <Activity className={`w-4 h-4 ${riskColor}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${riskColor}`}>{riskLevel}</div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">AI Confidence Score</span>
              <div className="p-1.5 bg-green-50 rounded-md">
                <BrainCircuit className="w-4 h-4 text-green-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600">{avgConfidence}%</div>
          </div>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          
          {/* Delay by Discipline */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[#1a237e]">Delay by Discipline</h2>
            </div>
            <div className="flex flex-col gap-5">
              {['Piping', 'Civil', 'Electrical', 'Instrumentation'].map(disc => {
                const delay = discDelays[disc] || 0;
                const pct = Math.round((delay / maxDelay) * 100);
                return (
                  <div key={disc}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800">{disc}</span>
                      <span className="text-sm font-bold text-gray-900">{delay} days</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="bg-[#1a237e] h-2.5 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Bottlenecks */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-ordered w-5 h-5 text-gray-500"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
              <h2 className="text-lg font-bold text-[#1a237e]">Top Reported Bottlenecks</h2>
            </div>
            <div className="flex flex-col gap-3">
              {bottlenecks.length > 0 ? (
                bottlenecks.slice(0, 3).map((item, idx) => (
                  <div key={item.id || idx} className="bg-gray-50 p-4 rounded-md border border-gray-100 flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-default">
                    <div className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">{idx + 1}</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">{item.delayReason}</span>
                      <span className="text-[11px] font-semibold text-red-600 mt-0.5">Reported in {item.activityDescription || 'Event ' + (item.id || '').substring(0,6)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 p-6 rounded-md border border-gray-100 flex flex-col items-center justify-center text-gray-500 gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-sm font-medium">No bottlenecks reported currently!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Critical Path Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-12">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#1a237e]">Critical Path Risk Analysis</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search WBS..." 
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a237e] w-64"
              />
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="py-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider">WBS Node</th>
                <th className="py-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Activity Name</th>
                <th className="py-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Discipline</th>
                <th className="py-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider">AI Risk Prediction</th>
                <th className="py-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mitigation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {safeItems.slice(0, 5).map((item, idx) => {
                const conf = item.confidenceScore || 0;
                let riskText = '';
                let badgeClass = '';
                let icon = <Activity className="w-3 h-3" />;
                let status = '';

                if (item.delayReason) {
                  riskText = `${100 - conf}% Delay Probability`;
                  badgeClass = 'bg-red-50 text-red-600';
                  icon = <AlertTriangle className="w-3 h-3" />;
                  status = 'Needs Expediting';
                } else if (conf >= 80) {
                  riskText = `${100 - conf}% Risk`;
                  badgeClass = 'bg-green-50 text-green-600';
                  status = 'On Track';
                } else {
                  riskText = `${100 - conf}% Risk`;
                  badgeClass = 'bg-amber-50 text-amber-600';
                  status = 'Under Review';
                }

                return (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.eventId || 'UNLINKED'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.activityDescription?.substring(0, 40) || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.discipline || 'Unassigned'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                        {icon} {riskText}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{status}</td>
                  </tr>
                );
              })}
              {safeItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No items in queue to analyze.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Spacer to ensure a large scroll gap at the bottom */}
        <div className="h-24 w-full"></div>
      </div>
    </div>
  );
};



