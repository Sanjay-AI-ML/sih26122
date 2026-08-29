import React from 'react';
import { X, Download, TrendingDown, AlertTriangle, Activity, BrainCircuit, Search, CheckCircle } from 'lucide-react';
import { useReviewQueue } from '../context/ReviewQueueContext';

interface DelayRiskDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

// Rich realistic fallback data for presentation demo
const SAMPLE_BOTTLENECKS = [
  { id: "Q-1001", reason: "Crane availability delay for 12-inch heavy valve lifting at Cooling Line", activity: "Cooling Line 24-CW Valve Erection (L6-PIP-402)", discipline: "Piping", delayDays: 12 },
  { id: "Q-1002", reason: "Monsoon rainwater accumulation in Substation Transformer pit", activity: "Substation Transformer Concrete Pouring (L6-CIV-104)", discipline: "Civil", delayDays: 8 },
  { id: "Q-1003", reason: "Cable tray alignment conflict with overhead HVAC ducting", activity: "11kV Substation Feeder Cable Pulling (L6-ELE-201)", discipline: "Electrical", delayDays: 5 },
  { id: "Q-1004", reason: "Scaffold re-certification pending at Hydrocracker Unit 3", activity: "Hydrocracker Area Weekly Safety Audit (L6-HSE-301)", discipline: "HSE", delayDays: 3 },
  { id: "Q-1005", reason: "Calibration rig test certificate delay from supplier", activity: "Boiler Control Pressure Calibration (L6-INS-509)", discipline: "Instrumentation", delayDays: 2 }
];

const SAMPLE_CRITICAL_PATH = [
  { node: "L6-PIP-402", name: "Cooling Line 24-CW Valve Erection", discipline: "Piping", riskPct: 35, status: "Expediting Crane", band: "high-risk" },
  { node: "L6-CIV-104", name: "Substation Transformer Block Concrete Pour", discipline: "Civil", riskPct: 22, status: "Pumping Pit Water", band: "medium-risk" },
  { node: "L6-ELE-201", name: "11kV Substation Feeder Cable Pulling", discipline: "Electrical", riskPct: 15, status: "Tray Re-alignment", band: "medium-risk" },
  { node: "L6-HSE-301", name: "Hydrocracker Area Weekly Safety Audit", discipline: "HSE", riskPct: 8, status: "On Track", band: "low-risk" },
  { node: "L6-INS-509", name: "Boiler Control Loop Pressure Calibration", discipline: "Instrumentation", riskPct: 4, status: "On Track", band: "low-risk" }
];

export const DelayRiskDashboard: React.FC<DelayRiskDashboardProps> = ({ isOpen, onClose }) => {
  const { setIsExportModalOpen, items, isDarkMode } = useReviewQueue();
  const [searchQuery, setSearchQuery] = React.useState("");

  if (!isOpen) return null;

  const safeItems = items || [];
  
  // Real queue items with delay reasons
  const realBottlenecks = safeItems.filter(i => i.delayReason);
  
  // Merge real bottlenecks with sample bottlenecks for demo richness
  const activeBottlenecksList = realBottlenecks.length > 0 
    ? realBottlenecks.map((b, idx) => ({
        id: b.id || `Q-${idx}`,
        reason: b.delayReason || "Schedule Variance Reported",
        activity: b.activityDescription || b.eventId || "WBS Node Activity",
        discipline: b.discipline || "Piping",
        delayDays: 4
      }))
    : SAMPLE_BOTTLENECKS;

  const bottleneckCount = activeBottlenecksList.length;
  
  const scheduleVariance = -14; // -14 Days cumulative schedule delay
  const riskLevel = 'HIGH';
  const riskColor = 'text-red-600';
  const riskBg = 'bg-red-50';
  
  const avgConfidence = safeItems.length > 0 
    ? Math.round(safeItems.reduce((acc, item) => acc + (item.confidenceScore || 85), 0) / safeItems.length) 
    : 86;

  // Group by discipline delay days
  const discDelays: Record<string, number> = {
    'Piping': 12, 
    'Civil': 8, 
    'Electrical': 5, 
    'Instrumentation': 3, 
    'Static/Rotating': 2
  };

  // Add active bottleneck days if any
  activeBottlenecksList.forEach(b => {
    const disc = b.discipline || 'Piping';
    if (discDelays[disc] !== undefined) {
      discDelays[disc] = Math.max(discDelays[disc], b.delayDays || 4);
    }
  });

  const maxDelay = Math.max(...Object.values(discDelays), 1);

  // Critical path rows
  const criticalPathRows = SAMPLE_CRITICAL_PATH.filter(item => 
    item.node.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.discipline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={"fixed inset-0 z-[150] flex justify-center overflow-y-auto transition-colors " + (isDarkMode ? "bg-slate-950/90 backdrop-blur-md text-white" : "bg-gray-50/95 backdrop-blur-sm text-gray-900")}>
      <div className="w-full max-w-7xl mx-auto p-8 pb-32 animate-fade-in mt-10">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className={"text-2xl font-bold mb-1 " + (isDarkMode ? "text-white" : "text-[#1a237e]")}>Delay & Risk Analytics</h1>
            <p className={"text-sm " + (isDarkMode ? "text-slate-400" : "text-gray-500")}>Real-time variance, discipline bottlenecks, and critical path risk Discovery</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => { onClose(); setIsExportModalOpen(true); }}
              className="bg-[#1a237e] hover:bg-[#283593] text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
            <button onClick={onClose} className={"p-2 rounded-md transition-colors cursor-pointer border " + (isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100")}>
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className={"p-5 rounded-lg border shadow-sm transition-colors " + (isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200")}>
            <div className="flex justify-between items-start mb-2">
              <span className={"text-[10px] font-bold uppercase tracking-wider " + (isDarkMode ? "text-slate-400" : "text-gray-500")}>Cumulative Schedule Variance</span>
              <div className="p-1.5 bg-red-50 rounded-md">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {scheduleVariance} Days
            </div>
            <p className={"text-[11px] mt-1 font-medium " + (isDarkMode ? "text-slate-400" : "text-gray-500")}>Critical Path Delay</p>
          </div>
          
          <div className={"p-5 rounded-lg border shadow-sm transition-colors " + (isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200")}>
            <div className="flex justify-between items-start mb-2">
              <span className={"text-[10px] font-bold uppercase tracking-wider " + (isDarkMode ? "text-slate-400" : "text-gray-500")}>Active Bottlenecks</span>
              <div className="p-1.5 bg-amber-50 rounded-md">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-500">{bottleneckCount}</div>
            <p className={"text-[11px] mt-1 font-medium " + (isDarkMode ? "text-slate-400" : "text-gray-500")}>Reported in Field Logs</p>
          </div>

          <div className={"p-5 rounded-lg border shadow-sm transition-colors " + (isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200")}>
            <div className="flex justify-between items-start mb-2">
              <span className={"text-[10px] font-bold uppercase tracking-wider " + (isDarkMode ? "text-slate-400" : "text-gray-500")}>Predicted Risk Level</span>
              <div className={`p-1.5 ${riskBg} rounded-md`}>
                <Activity className={`w-4 h-4 ${riskColor}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${riskColor}`}>{riskLevel}</div>
            <p className={"text-[11px] mt-1 font-medium " + (isDarkMode ? "text-slate-400" : "text-gray-500")}>Requires Mitigation</p>
          </div>

          <div className={"p-5 rounded-lg border shadow-sm transition-colors " + (isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200")}>
            <div className="flex justify-between items-start mb-2">
              <span className={"text-[10px] font-bold uppercase tracking-wider " + (isDarkMode ? "text-slate-400" : "text-gray-500")}>AI Match Confidence</span>
              <div className="p-1.5 bg-green-50 rounded-md">
                <BrainCircuit className="w-4 h-4 text-green-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600">{avgConfidence}%</div>
            <p className={"text-[11px] mt-1 font-medium " + (isDarkMode ? "text-slate-400" : "text-gray-500")}>Calibrated Cosine Score</p>
          </div>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          
          {/* Delay by Discipline */}
          <div className={"p-6 rounded-lg border shadow-sm transition-colors " + (isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200")}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className={"text-lg font-bold " + (isDarkMode ? "text-white" : "text-[#1a237e]")}>Delay by Discipline</h2>
                <p className={"text-xs " + (isDarkMode ? "text-slate-400" : "text-gray-500")}>Cumulative variance across engineering packages</p>
              </div>
              <span className={"text-[10px] font-mono font-bold px-2 py-1 rounded " + (isDarkMode ? "bg-slate-900 text-amber-400 border border-slate-700" : "bg-blue-50 text-[#1a237e]")}>P6 Baseline Comparison</span>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { disc: 'Piping', color: 'bg-teal-600' },
                { disc: 'Civil', color: 'bg-blue-600' },
                { disc: 'Electrical', color: 'bg-amber-600' },
                { disc: 'Instrumentation', color: 'bg-purple-600' },
                { disc: 'Static/Rotating', color: 'bg-orange-600' }
              ].map(({ disc, color }) => {
                const delay = discDelays[disc] || 0;
                const pct = Math.round((delay / maxDelay) * 100);
                return (
                  <div key={disc}>
                    <div className="flex justify-between mb-1">
                      <span className={"text-sm font-semibold " + (isDarkMode ? "text-slate-200" : "text-gray-800")}>{disc}</span>
                      <span className={"text-sm font-bold " + (isDarkMode ? "text-white" : "text-gray-900")}>{delay} days delay</span>
                    </div>
                    <div className={"w-full rounded-full h-2.5 " + (isDarkMode ? "bg-slate-700" : "bg-gray-100")}>
                      <div className={`${color} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${Math.max(pct, 12)}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Bottlenecks */}
          <div className={"p-6 rounded-lg border shadow-sm transition-colors " + (isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200")}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className={"text-lg font-bold " + (isDarkMode ? "text-white" : "text-[#1a237e]")}>Top Reported Bottlenecks</h2>
              </div>
              <span className="text-xs text-gray-500 font-medium">Real-Time Field Memos</span>
            </div>
            <div className="flex flex-col gap-3">
              {activeBottlenecksList.slice(0, 4).map((item, idx) => (
                <div key={item.id || idx} className={"p-4 rounded-md border flex items-start gap-3.5 transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-default " + (isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-gray-50 border-gray-200")}>
                  <div className="w-6 h-6 bg-[#1a237e] text-white rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{idx + 1}</div>
                  <div className="flex flex-col flex-1">
                    <span className={"text-sm font-bold " + (isDarkMode ? "text-white" : "text-gray-900")}>{item.reason}</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className={"text-[11px] font-semibold " + (isDarkMode ? "text-sky-400" : "text-[#1a237e]")}>{item.activity}</span>
                      <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">{item.discipline}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Critical Path Risk Table */}
        <div className={"rounded-lg border shadow-sm overflow-hidden mb-12 transition-colors " + (isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200")}>
          <div className={"p-6 border-b flex justify-between items-center " + (isDarkMode ? "border-slate-700 bg-slate-800" : "border-gray-100 bg-white")}>
            <div>
              <h2 className={"text-lg font-bold " + (isDarkMode ? "text-white" : "text-[#1a237e]")}>Critical Path Risk Analysis</h2>
              <p className={"text-xs " + (isDarkMode ? "text-slate-400" : "text-gray-500")}>Predicted delay probability and proactive mitigation status</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search WBS Node or Activity..." 
                className={"pl-9 pr-4 py-2 rounded-md text-sm focus:outline-none w-64 transition-colors " + (isDarkMode ? "bg-slate-900 border-slate-700 text-white placeholder-slate-400 focus:ring-amber-400" : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-[#1a237e]")}
              />
            </div>
          </div>
          <table className="w-full text-left">
            <thead className={"border-b " + (isDarkMode ? "bg-slate-900/90 border-slate-700 text-slate-300" : "bg-gray-50/50 border-gray-100 text-gray-500")}>
              <tr>
                <th className={"py-3 px-6 text-[10px] font-bold uppercase tracking-wider " + (isDarkMode ? "text-slate-300" : "text-gray-500")}>WBS Node</th>
                <th className={"py-3 px-6 text-[10px] font-bold uppercase tracking-wider " + (isDarkMode ? "text-slate-300" : "text-gray-500")}>Activity Name</th>
                <th className={"py-3 px-6 text-[10px] font-bold uppercase tracking-wider " + (isDarkMode ? "text-slate-300" : "text-gray-500")}>Discipline</th>
                <th className={"py-3 px-6 text-[10px] font-bold uppercase tracking-wider " + (isDarkMode ? "text-slate-300" : "text-gray-500")}>AI Risk Prediction</th>
                <th className={"py-3 px-6 text-[10px] font-bold uppercase tracking-wider " + (isDarkMode ? "text-slate-300" : "text-gray-500")}>Mitigation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {criticalPathRows.map((item, idx) => {
                let badgeClass = 'bg-green-50 text-green-700';
                let icon = <CheckCircle className="w-3.5 h-3.5 text-green-600" />;

                if (item.band === 'high-risk') {
                  badgeClass = 'bg-red-50 text-red-700 font-bold';
                  icon = <AlertTriangle className="w-3.5 h-3.5 text-red-600" />;
                } else if (item.band === 'medium-risk') {
                  badgeClass = 'bg-amber-50 text-amber-700 font-bold';
                  icon = <Activity className="w-3.5 h-3.5 text-amber-600" />;
                }

                return (
                  <tr key={idx} className={"transition-colors border-b " + (isDarkMode ? "hover:bg-slate-700/60 border-slate-700" : "hover:bg-gray-50/80 border-gray-100")}>
                    <td className={"px-6 py-4 text-sm font-mono font-bold " + (isDarkMode ? "text-sky-400" : "text-[#1a237e]")}>{item.node}</td>
                    <td className={"px-6 py-4 text-sm font-semibold " + (isDarkMode ? "text-slate-200" : "text-gray-800")}>{item.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={"px-2.5 py-1 rounded text-xs font-semibold " + (isDarkMode ? "bg-slate-900 text-slate-200 border border-slate-700" : "bg-gray-100 text-gray-700")}>
                        {item.discipline}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${badgeClass}`}>
                        {icon} {item.riskPct}% Delay Risk
                      </span>
                    </td>
                    <td className={"px-6 py-4 text-sm font-medium " + (isDarkMode ? "text-slate-300" : "text-gray-700")}>{item.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Bottom Scroll Gap */}
        <div className="h-24 w-full"></div>
      </div>
    </div>
  );
};
