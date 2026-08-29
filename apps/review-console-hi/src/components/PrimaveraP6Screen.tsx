import React, { useState } from 'react';
import { Database, Layers, CheckCircle2, Clock, AlertTriangle, PauseCircle, RefreshCw, Download, Search, ArrowRight } from 'lucide-react';
import { useReviewQueue } from '../context/ReviewQueueContext';

export const PrimaveraP6Screen: React.FC = () => {
  const { isDarkMode, language } = useReviewQueue();
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const isHi = language === 'HI';

  // WBS summary cards data
  const wbsSummary = [
    { level: "L1", labelHi: "\u092a\u094d\u0930\u094b\u091c\u0946\u0915\u094d\u091f \u092e\u093e\u0938\u094d\u091f\u0930", labelEn: "Project Master", pct: "100%", finished: isHi ? "1 / 1 \u0938\u092e\u093e\u092a\u094d\u0924" : "1 / 1 Finished", active: isHi ? "0 \u0938\u0915\u094d\u0930\u093f\u092f" : "0 Active", barWidth: "100%", statusColor: "bg-emerald-600 text-white font-extrabold" },
    { level: "L2", labelHi: "\u092f\u0942\u0928\u093f\u091f \u0938\u094d\u0924\u0930", labelEn: "Unit Level", pct: "95%", finished: isHi ? "19 / 20 \u0938\u092e\u093e\u092a\u094d\u0924" : "19 / 20 Finished", active: isHi ? "1 \u0938\u0915\u094d\u0930\u093f\u092f" : "1 Active", barWidth: "95%", statusColor: "bg-emerald-600 text-white font-extrabold" },
    { level: "L3", labelHi: "\u0938\u093f\u0938\u094d\u091f\u092e \u092a\u0948\u0915\u0946\u091c", labelEn: "System Package", pct: "72%", finished: isHi ? "45 / 62 \u0938\u092e\u093e\u092a\u094d\u0924" : "45 / 62 Finished", active: isHi ? "17 \u0938\u0915\u094d\u0930\u093f\u092f" : "17 Active", barWidth: "72%", statusColor: "bg-amber-500 text-slate-950 font-black" },
    { level: "L4", labelHi: "\u0938\u092c-\u0938\u093f\u0938\u094d\u091f\u092e / \u092e\u094c\u0921 me\u094d\u092f\u0942\u0932", labelEn: "Sub-System / Module", pct: "50%", finished: isHi ? "120 / 240 \u0938\u092e\u093e\u092a\u094d\u0924" : "120 / 240 Finished", active: isHi ? "80 \u0938\u0915\u094d\u0930\u093f\u092f" : "80 Active", barWidth: "50%", statusColor: "bg-amber-500 text-slate-950 font-black" },
    { level: "L5", labelHi: "\u0935\u0930\u094d\u0915 \u092a\u0948\u0915\u0946\u091c", labelEn: "Work Package", pct: "15%", finished: isHi ? "25 / 165 \u0938\u092e\u093e\u092a\u094d\u0924" : "25 / 165 Finished", active: isHi ? "140 \u0938\u0915\u094d\u0930\u093f\u092f" : "140 Active", barWidth: "15%", statusColor: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold" },
    { level: "L6", labelHi: "\u092b\u093c\u0940\u0932\u094d\u0921 \u091f\u093e\u0938\u094d\u0915 \u0928\u094b\u0921", labelEn: "Field Task Node", pct: "2%", finished: isHi ? "4 / 200 \u0938\u092e\u093e\u092a\u094d\u0924" : "4 / 200 Finished", active: isHi ? "196 \u0938\u0915\u094d\u0930\u093f\u092f" : "196 Active", barWidth: "2%", statusColor: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold" },
  ];

  // Master schedule activities with explicit text color overrides
  const masterActivities = [
    { id: "HCU3-000", level: "L1", nameHi: "\u0939\u093e\u0904\u0921\u094d\u0930\u094b\u0915\u094d\u0930\u0948\u0915\u0930 \u0935\u093f\u0938\u094d\u0924\u093e\u0930 \u092f\u0942\u0928\u093f\u091f 3 \u092a\u0930\u093f\u092f\u094b\u091c\u0928\u093e \u0906\u0930\u0902\u092d", nameEn: "Hydrocracker Expansion Unit 3 Project Initiation", disciplineHi: "\u092a\u094d\u0930\u092c\u0902\u0920\u0928", disciplineEn: "Management", discColor: "bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800", status: "Completed", start: "2024-01-01", finish: "2024-03-31", progress: 100 },
    { id: "HCU3-ENG-105", level: "L3", nameHi: "\u092e\u0941\u0916\u094d\u092f \u0930 me\u0940\u090f\u0915 me\u094d\u091f\u0930 \u092a me\u094b\u0924 \u0915 me\u0947 \u0932 me\u093f\u090f \u0935 me\u093f\u0938 me\u094d\u0924 me\u0943\u0924 \u0904\u0902\u091c me\u0940\u0928 me\u093f\u092f me\u0930 me\u093f\u0902\u0917 \u0921 me\u093f me\u091c me\u093e me\u0904\u0928", nameEn: "Detailed Engineering Design for Main Reactor Vessel", disciplineHi: "\u0904\u0902\u091c me\u0940\u0928 me\u093f\u092f me\u0930 me\u093f\u0902\u0917", disciplineEn: "Engineering", discColor: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800", status: "In Progress", start: "2024-04-01", finish: "2024-11-15", progress: 75 },
    { id: "HCU3-CIV-202", level: "L4", nameHi: "\u0928\u0940\u0902\u0935 \u0915\u0940 \u0916\u0941\u0926\u093e\u0908 \u0914\u0930 \u092a\u093e\u0904\u0932\u093f\u0902\u0917 \u0915\u093e\u0930\u094d\u092f - \u091c me\u094b\u0928 B", nameEn: "Foundation Excavation and Piling Works - Zone B", disciplineHi: "\u0938\u093f\u0935\u093f\u0932", disciplineEn: "Civil", discColor: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800", status: "Delayed", start: "2024-09-01", finish: "2024-12-30", progress: 40 },
    { id: "HCU3-MEC-310", level: "L5", nameHi: "\u0909\u091a\u094d\u091a \u0926\u092c\u093e\u0935 \u0939\u0940\u091f \u090f\u0915 me\u094d\u0938\u091a me\u0947 me\u0902\u091c me\u0930 me\u094b me\u0902 (E-101 A/B) \u0915\u0940 \u0938\u094d\u0925\u093e\u092a\u0928\u093e", nameEn: "Installation of High-Pressure Heat Exchangers (E-101 A/B)", disciplineHi: "\u092e me\u0948\u0915 me\u0947\u0928 me\u093f\u0915\u0932", disciplineEn: "Mechanical", discColor: "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800", status: "Not Started", start: "2025-02-15", finish: "2025-05-20", progress: 0 },
    { id: "HCU3-INS-405-A", level: "L6", nameHi: "\u092b me\u094d\u0932\u094b \u091f me\u094d\u0930\u093e\u0902\u0938 me\u092e me\u0940\u091f\u0930 me\u094b me\u0902 \u0915\u093e \u0932 me\u0942\u092a \u091a me\u0947\u0915 me\u093f\u0902\u0917 \u0914\u0930 \u0915 me\u0948\u0932 me\u093f\u092c me\u094d\u0930 me\u0947\u0936 me\u0928", nameEn: "Loop Checking and Calibration of Flow Transmitters (FT-201 to FT-250)", disciplineHi: "\u0904\u0902\u0938 me\u094d\u091f me\u094d\u0930 me\u0942\u092e me\u0947\u0902\u091f me\u0947\u0936 me\u0928", disciplineEn: "Instrumentation", discColor: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800", status: "Not Started", start: "2025-08-01", finish: "2025-09-15", progress: 0 },
  ];

  const filteredActivities = masterActivities.filter(act => {
    const name = isHi ? act.nameHi : act.nameEn;
    const matchesLevel = selectedLevel === "ALL" || act.level === selectedLevel;
    const matchesSearch = searchQuery === "" || act.id.toLowerCase().includes(searchQuery.toLowerCase()) || name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });


  return (
    <main 
      style={{ backgroundColor: isDarkMode ? '#020617' : '#f8fafc', color: isDarkMode ? '#f8fafc' : '#0f172a' }}
      className="lg:ml-[240px] ml-0 mt-[56px] flex-1 overflow-y-auto p-4 lg:p-6 min-h-[calc(100vh-56px)] flex flex-col gap-6 transition-colors"
    >
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Database className="w-6 h-6" />
          </div>
          <h2 
            style={{ color: isDarkMode ? '#ffffff' : '#0f172a' }}
            className="text-xl sm:text-2xl font-black tracking-tight"
          >
            {isHi ? "\u092a\u094d\u0930\u093f\u092e\u093e\u0935\u0947\u0930\u093e P6 \u092e\u093e\u0938\u094d\u091f\u0930 \u0905\u0928 me\u0941\u0938\u0942\u091a\u0940 (L1 \u0938\u0947 L6)" : "Primavera P6 Master Schedule (L1 to L6)"}
          </h2>
          <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-full font-mono text-xs font-black flex items-center gap-2 shadow-xs whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
            Live P6 API (PRM-OIL-2026-HCU3)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', color: isDarkMode ? '#f8fafc' : '#0f172a', borderColor: isDarkMode ? '#334155' : '#cbd5e1' }}
            className="border rounded-lg px-4 py-2 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            {isHi ? "PDF \u0928\u093f\u0930\u094d\u092f\u093e\u0924 \u0915\u0930\u0947\u0902" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* KPI Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div 
          style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}
          className="border rounded-xl p-4 flex flex-col gap-1 shadow-xs transition-colors"
        >
          <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-500 dark:text-slate-400">
            {isHi ? "\u0915\u0941\u0932 \u092e\u093e\u0938\u094d\u091f\u0930 WBS \u0928\u094b\u0921\u094d\u0938" : "TOTAL MASTER WBS NODES"}
          </span>
          <span className="text-3xl font-black text-blue-600 dark:text-sky-400">508</span>
        </div>

        <div 
          style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}
          className="border rounded-xl p-4 flex flex-col gap-1 shadow-xs transition-colors"
        >
          <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-500 dark:text-slate-400">
            {isHi ? "\u092a\u0942\u0930\u094d\u0923 \u0915 me\u093f\u090f \u0917 me\u090f \u0928\u094b\u0921\u094d\u0938" : "FINISHED NODES"}
          </span>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">325</span>
        </div>

        <div 
          style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}
          className="border rounded-xl p-4 flex flex-col gap-1 shadow-xs transition-colors"
        >
          <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-500 dark:text-slate-400">
            {isHi ? "\u092a\u094d\u0930\u0917\u0924\u093f \u092e me\u0947\u0902 \u0928\u094b\u0921\u094d\u0938" : "IN PROGRESS NODES"}
          </span>
          <span className="text-3xl font-black text-amber-600 dark:text-amber-500">145</span>
        </div>

        <div 
          style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}
          className="border rounded-xl p-4 flex flex-col gap-1 shadow-xs transition-colors"
        >
          <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-500 dark:text-slate-400">
            {isHi ? "\u0935\u093f\u0932\u0902\u092c\u093f\u0924 \u0915\u094d\u0930\u093f\u091f me\u093f\u0915\u0932 \u092a\u093e\u0925" : "DELAYED CRITICAL PATH"}
          </span>
          <span className="text-3xl font-black text-red-600 dark:text-red-500">38</span>
        </div>
      </div>

      {/* WBS Level-Wise Progress Summary (6 Cards Grid) */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          {isHi ? "WBS \u0938\u094d\u0924\u0930\u0935\u093e\u0930 \u092a\u094d\u0930\u0917\u0924\u093f \u092c\u094d\u0930\u0947\u0915\u0921\u093e\u0909\u0928 (L1 - L6)" : "WBS Level-Wise Progress Summary"}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {wbsSummary.map((item) => (
            <div 
              key={item.level}
              onClick={() => setSelectedLevel(selectedLevel === item.level ? "ALL" : item.level)}
              style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}
              className={`border rounded-xl flex flex-col overflow-hidden transition-all cursor-pointer ${
                selectedLevel === item.level ? 'ring-2 ring-blue-600 border-blue-600' : 'hover:border-blue-400'
              }`}
            >
              <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
                <div className="flex justify-between items-start">
                  <span className="font-black text-lg text-blue-600 dark:text-sky-400">{item.level}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${item.statusColor}`}>
                    {item.pct} {isHi ? "\u092a\u0942\u0930\u094d\u0923" : "DONE"}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-bold flex flex-col gap-0.5">
                  <div>{item.finished}</div>
                  <div>{item.active}</div>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800">
                <div className="h-full bg-emerald-500 rounded-r-full transition-all" style={{ width: item.barWidth }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Master Activity Table Section */}
      <div 
        style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}
        className="border rounded-xl flex flex-col shadow-xs overflow-hidden"
      >
        
        {/* Toolbar */}
        <div 
          style={{ backgroundColor: isDarkMode ? '#020617' : '#f1f5f9', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}
          className="p-4 border-b flex flex-wrap items-center gap-4"
        >
          <span 
            style={{ color: isDarkMode ? '#94a3b8' : '#334155' }}
            className="text-xs font-black uppercase tracking-wider"
          >
            {isHi ? "WBS \u0938\u094d\u0924\u0930 \u091a me\u0941\u0928 me\u0947\u0902:" : "SELECT WBS LEVEL:"}
          </span>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button 
              onClick={() => setSelectedLevel("ALL")}
              className={`px-3 py-1 rounded-md font-extrabold transition-all cursor-pointer ${
                selectedLevel === "ALL" 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              {isHi ? "\u0938\u092d\u0940 \u0938\u094d\u0924\u0930" : "ALL LEVELS"}
            </button>
            {["L1", "L2", "L3", "L4", "L5", "L6"].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1 rounded-md font-extrabold transition-all cursor-pointer ${
                  selectedLevel === lvl 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="ml-auto relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHi ? "\u0917\u0924\u093f\u0935\u093f\u0925\u093f ID \u0916\u094b\u091c\u0947\u0902..." : "Search Activity ID..."}
              style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', color: isDarkMode ? '#f8fafc' : '#0f172a', borderColor: isDarkMode ? '#334155' : '#cbd5e1' }}
              className="w-full pl-9 pr-3 py-1.5 border rounded-md text-xs font-bold outline-none transition-colors"
            />
          </div>
        </div>

        {/* Table - HIGH CONTRAST IN LIGHT MODE AND DARK MODE WITH EXPLICIT INLINE COLOR OVERRIDES */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead 
              style={{ backgroundColor: isDarkMode ? '#020617' : '#e2e8f0', color: isDarkMode ? '#cbd5e1' : '#0f172a' }}
              className="border-b border-slate-300 dark:border-slate-800"
            >
              <tr>
                <th className="py-3.5 px-4 font-black uppercase tracking-wider w-16 text-center">
                  {isHi ? "\u0938\u094d\u0924\u0930" : "LEVEL"}
                </th>
                <th className="py-3.5 px-4 font-black uppercase tracking-wider w-36">
                  {isHi ? "P6 \u0917\u0924\u093f\u0935\u093f\u0925\u093f ID" : "P6 ACTIVITY ID"}
                </th>
                <th className="py-3.5 px-4 font-black uppercase tracking-wider min-w-[320px]">
                  {isHi ? "\u092e\u093e\u0938\u094d\u091f\u0930 \u0917\u0924\u093f\u0935\u093f\u0925\u093f \u0928\u093e\u092e" : "MASTER ACTIVITY NAME"}
                </th>
                <th className="py-3.5 px-4 font-black uppercase tracking-wider w-28">
                  {isHi ? "\u0905\u0928\u0941\u0936\u093e\u0938\u0928" : "DISCIPLINE"}
                </th>
                <th className="py-3.5 px-4 font-black uppercase tracking-wider w-32">
                  {isHi ? "\u0938\u094d\u0925\u093f\u0924\u093f" : "STATUS"}
                </th>
                <th className="py-3.5 px-4 font-black uppercase tracking-wider w-52">
                  {isHi ? "\u0928\u093f\u092f\u094b\u091c\u093f\u0924 \u0924\u093f\u0925\u093f\u092f\u093e\u0902" : "PLANNED DATES"}
                </th>
                <th className="py-3.5 px-4 font-black uppercase tracking-wider w-40">
                  {isHi ? "\u092a\u094d\u0930\u0917\u0924\u093f %" : "PROGRESS %"}
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {filteredActivities.map((row) => (
                <tr 
                  key={row.id} 
                  style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }}
                  className="transition-colors hover:bg-blue-50/60 dark:hover:bg-slate-800/60"
                >
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-blue-600/10 text-blue-700 dark:text-sky-400 px-2 py-0.5 rounded font-black text-xs border border-blue-500/20">
                      {row.level}
                    </span>
                  </td>
                  {/* P6 Activity ID: SOLID #0f172a in Light Mode, #f8fafc in Dark Mode */}
                  <td 
                    style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
                    className="py-3.5 px-4 font-mono font-black whitespace-nowrap text-sm"
                  >
                    {row.id}
                  </td>
                  {/* Master Activity Name: SOLID #0f172a in Light Mode, #ffffff in Dark Mode */}
                  <td 
                    style={{ color: isDarkMode ? '#ffffff' : '#0f172a' }}
                    className="py-3.5 px-4 font-black whitespace-normal text-sm leading-snug"
                  >
                    {isHi ? row.nameHi : row.nameEn}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded text-xs font-black border ${row.discColor}`}>
                      {isHi ? row.disciplineHi : row.disciplineEn}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {row.status === 'Completed' ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {isHi ? "\u092a\u0942\u0930\u094d\u0923" : "Completed"}
                      </span>
                    ) : row.status === 'Delayed' ? (
                      <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-black">
                        <AlertTriangle className="w-4 h-4 text-red-600" /> {isHi ? "\u0935\u093f\u0932\u0902\u092c\u093f\u0924" : "Delayed"}
                      </span>
                    ) : row.status === 'In Progress' ? (
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-black">
                        <Clock className="w-4 h-4 text-amber-500" /> {isHi ? "\u092a\u094d\u0930\u0917\u0924\u093f \u092a\u0930" : "In Progress"}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold">
                        <PauseCircle className="w-4 h-4 text-slate-400" /> {isHi ? "\u0906\u0930\u0902\u092d \u0928\u0939\u0940\u0902" : "Not Started"}
                      </span>
                    )}
                  </td>
                  {/* Planned Dates: SOLID #1e293b in Light Mode, #cbd5e1 in Dark Mode */}
                  <td 
                    style={{ color: isDarkMode ? '#cbd5e1' : '#1e293b' }}
                    className="py-3.5 px-4 font-mono text-[11.5px] font-black whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{row.start}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>{row.finish}</span>
                    </div>
                  </td>
                  {/* Progress %: SOLID #0f172a in Light Mode */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            row.status === 'Completed' ? 'bg-emerald-500' : row.status === 'Delayed' ? 'bg-red-500' : 'bg-amber-500'
                          }`} 
                          style={{ width: `${row.progress}%` }}
                        ></div>
                      </div>
                      <span 
                        style={{ color: row.status === 'Delayed' ? '#dc2626' : (isDarkMode ? '#ffffff' : '#0f172a') }}
                        className="font-mono text-xs font-black min-w-[36px]"
                      >
                        {row.progress}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div 
          style={{ backgroundColor: isDarkMode ? '#020617' : '#f1f5f9', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0', color: isDarkMode ? '#94a3b8' : '#475569' }}
          className="p-3.5 border-t flex justify-between items-center text-xs font-bold"
        >
          <span>{isHi ? "508 \u0928\u094b\u0921\u094d\u0938 \u092e me\u0947\u0902 \u0938\u0947 1-5 \u092a\u094d\u0930\u0926\u0930 me\u094d\u0936\u093f\u0924" : "Showing 1-5 of 508 nodes"}</span>
          <div className="flex gap-1">
            <button className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 disabled:opacity-50 text-xs font-bold cursor-not-allowed" disabled>&lt; {isHi ? "\u092a\u093f\u091b\u0932\u093e" : "Prev"}</button>
            <button className="px-2.5 py-1 border border-blue-600 rounded bg-blue-600 text-white font-extrabold text-xs">1</button>
            <button className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs font-bold">2</button>
            <button className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs font-bold">3</button>
            <span className="px-1 py-1">...</span>
            <button className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs font-bold">{isHi ? "\u0905\u0917\u0932\u093e" : "Next"} &gt;</button>
          </div>
        </div>

      </div>

    </main>
  );
};
