import React, { useState, useEffect, useRef } from 'react';

function OilIndiaLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <div className={"flex items-center justify-center bg-white rounded-lg p-1 border border-stone-200 shadow-sm shrink-0 " + className}>
      <svg viewBox="0 0 100 110" className="w-full h-full" fill="none">
        {/* Red vertical bar */}
        <rect x="38" y="48" width="24" height="42" fill="#DA251C" rx="2" />
        {/* Black ring */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M50 12C68 12 82 23.5 82 37.5C82 51.5 68 63 50 63C32 63 18 51.5 18 37.5C18 23.5 32 12 50 12ZM50 24.5C41.2 24.5 34 30.3 34 37.5C34 44.7 41.2 50.5 50 50.5C58.8 50.5 66 44.7 66 37.5C66 30.3 58.8 24.5 50 24.5Z"
          fill="#231F20"
        />
      </svg>
    </div>
  );
}

const i18n: any = {
  "EN": {
    "greeting": "Good evening. Ready to log your field progress? Type an update, speak into the mic, or upload a DPR file.",
    "fieldLog": "Field Log",
    "history": "History",
    "analytics": "Analytics",
    "menu": "Menu",
    "typeMessage": "Type a message or activity...",
    "listening": "Listening... speak report now",
    "signIn": "Sign In via SSO",
    "timeAgent": "TIME AGENT",
    "linkedBadge": "ONLINE",
    "queuedMsg": "Your activity reports are queued locally and will auto-sync when you re-connect.",
    "transcribed": "Transcribed",
    "parsing": "Time Agent is parsing field report...",
    "settingsTitle": "Settings & Preferences",
    "simOffline": "Simulate Offline Mode",
    "forceCache": "Force local cache and queue entries",
    "enhanceSun": "High Contrast (Sunlight Mode)",
    "syncNow": "Sync Pending Queue",
    "signOut": "Sign Out",
    "saveConfig": "Save Configuration",
    "resetDefaults": "Reset to Defaults",
    "upload": "Attach DPR or File",
    "takePicture": "Capture Site Photo",
    "noProgressUpdate": "That does not look like a field progress update. Please describe the specific work completed (e.g., '14 spools erected on Line 24-PL-001').",
    "noActivitiesExtracted": "No activities could be extracted from {filename}.",
    "extractedEventsProcessing": "Extracted {count} event(s) from {filename}. Matching with Primavera...",
    "moreEventsQueued": "{count} more event(s) queued in the Review Console.",
    "uploadError": "Upload error: {error}",
    "backendError": "Backend error: {error}. Ensure ports 8001 and 8002 are running.",
    "syncQueueCleared": "Offline sync queue cleared.",
    "high": "High",
    "medium": "Medium",
    "low": "Low",
    "clearQueue": "Clear Queue",
    "cancel": "Cancel",
    "records": "records",
    "status": "Status",
    "startRec": "Voice input",
    "send": "Send update",
    "structured": "STRUCTURED FOR SCHEDULE",
    "activity": "ACTIVITY",
    "discipline": "DISCIPLINE",
    "tag": "TAG / LINE ID",
    "start": "START",
    "finish": "FINISH",
    "linkedTo": "Linked to",
    "totalReports": "Total Reports",
    "approved": "Approved",
    "rejected": "Rejected",
    "ambiguous": "Ambiguous",
    "byDiscipline": "BY DISCIPLINE",
    "noHistory": "No approved events yet.",
    "noAnalytics": "No analytics data yet.",
    "supervisor": "Supervisor S. Gogoi",
    "piping": "PIPING",
    "civil": "CIVIL",
    "electrical": "ELECTRICAL",
    "hse": "HSE",
    "instrumentation": "INSTRUMENTATION",
    "static_rotating": "STATIC/ROTATING",
    "pending": "Pending",
    "switchShift": "Switch Shift",
    "noApprovedRecs": "No approved records yet. Send a progress update to get started!",
    "profileName": "S. Gogoi",
    "profileDetails": "Piping • Shift {shift} • Oil India Ltd.",
    "shift": "SHIFT",
    "highContrast": "High Contrast",
    "normal": "Normal",
    "shiftSwitchedTo": "Shift switched to {shift}. Active on Piping · Shift {shift} · Oil India Ltd.",
    "noMatch": "No match",
    "noMatchFound": "No schedule match found",
    "offlineQueuedMsg": "Offline Mode: Saved field report to local sync queue.",
    "offlineFileQueuedMsg": "Offline Mode: File queued for sync.",
    "syncingMsg": "Syncing local queue to servers...",
    "syncSuccessMsg": "Successfully synced {count} updates to Review Console!"
  },
  "HI": {
    "greeting": "शुभ संध्या। अपनी फ़ील्ड प्रगति दर्ज करने के लिए तैयार हैं? अपडेट टाइप करें, माइक में बोलें, या DPR फ़ाइल अपलोड करें।",
    "fieldLog": "फ़ील्ड लॉग",
    "history": "इतिहास",
    "analytics": "एनालिटिक्स",
    "menu": "मेनू",
    "typeMessage": "संदेश या गतिविधि टाइप करें...",
    "listening": "सुन रहे हैं... रिपोर्ट बोलें",
    "signIn": "SSO के माध्यम से साइन इन करें",
    "timeAgent": "टाइम एजेंट",
    "linkedBadge": "ऑनलाइन",
    "queuedMsg": "आपकी गतिविधि रिपोर्ट कतार में हैं और आपके ऑनलाइन होने पर सिंक हो जाएंगी",
    "transcribed": "प्रतिलेखित",
    "parsing": "टाइम एजेंट रिपोर्ट पार्स कर रहा है...",
    "settingsTitle": "सेटिंग्स और प्राथमिकताएं",
    "simOffline": "ऑफ़लाइन अनुकरण करें",
    "forceCache": "केवल स्थानीय कैश को बाध्य करें",
    "enhanceSun": "उच्च कंट्रास्ट (धूप मोड)",
    "syncNow": "अभी सिंक करें",
    "signOut": "साइन आउट करें",
    "saveConfig": "कॉन्फ़िगरेशन सहेजें",
    "resetDefaults": "डिफ़ॉल्ट पर रीसेट करें",
    "upload": "रिपोर्ट या अटैचमेंट अपलोड करें",
    "takePicture": "तस्वीर लें",
    "noProgressUpdate": "वह फ़ील्ड प्रगति अपडेट जैसा नहीं लग रहा है। कृपया पूरी की गई विशिष्ट गतिविधि का वर्णन करें ताकि मैं इसे लॉग कर सकूं।",
    "noActivitiesExtracted": "{filename} से कोई भी गतिविधि निकाली नहीं जा सकी।",
    "extractedEventsProcessing": "{filename} से {count} गतिविधि निकाली गईं। मिलान प्रक्रिया चालू है...",
    "moreEventsQueued": "{count} और गतिविधि समीक्षा कंसोल में कतारबद्ध हैं।",
    "uploadError": "अपलोड त्रुटि: {error}",
    "backendError": "बैकएंड त्रुटि: {error}। सुनिश्चित करें कि पोर्ट 8001 और 8002 चल रहे हैं।",
    "syncQueueCleared": "ऑफ़लाइन सिंक कतार साफ कर दी गई है।",
    "high": "उच्च",
    "medium": "मध्यम",
    "low": "निम्न",
    "clearQueue": "कतार साफ करें",
    "cancel": "रद्द करें",
    "records": "रिकॉर्ड",
    "status": "स्थिति",
    "startRec": "वॉयस इनपुट",
    "send": "अपडेट भेजें",
    "structured": "शेड्यूल के लिए संरचित",
    "activity": "गतिविधि",
    "discipline": "अनुशासन",
    "tag": "टैग / लाइन आईडी",
    "start": "शुरुआत",
    "finish": "समाप्ति",
    "linkedTo": "से जुड़ा हुआ",
    "totalReports": "कुल रिपोर्ट",
    "approved": "मंज़ूर की गई",
    "rejected": "अस्वीकृत",
    "ambiguous": "अस्पष्ट",
    "byDiscipline": "अनुशासन के अनुसार",
    "noHistory": "अभी तक कोई स्वीकृत ईवेंट नहीं।",
    "noAnalytics": "कोई एनालिटिक्स डेटा नहीं।",
    "supervisor": "सुपरवाइज़र एस. गोगोई",
    "piping": "पाइपिंग",
    "civil": "सिविल",
    "electrical": "विद्युत",
    "hse": "एचएसई",
    "instrumentation": "इंस्ट्रूमेंटेशन",
    "static_rotating": "स्थैतिक/घूर्णन",
    "pending": "लंबित",
    "switchShift": "शिफ्ट बदलें",
    "noApprovedRecs": "अभी तक कोई स्वीकृत रिकॉर्ड नहीं। प्रगति अपडेट भेजें!",
    "profileName": "एस. गोगोई",
    "profileDetails": "पाइपिंग • शिफ्ट {shift} • ऑयल इंडिया लिमिटेड",
    "shift": "शिफ्ट",
    "highContrast": "उच्च कंट्रास्ट",
    "normal": "सामान्य",
    "shiftSwitchedTo": "शिफ्ट {shift} में बदल गया। अब आप पाइपिंग · शिफ्ट {shift} · ऑयल इंडिया लिमिटेड पर हैं।",
    "noMatch": "कोई मिलान नहीं",
    "noMatchFound": "कोई शेड्यूल मैच नहीं मिला",
    "offlineQueuedMsg": "ऑफ़लाइन मोड: स्थानीय सिंक कतार में फ़ील्ड रिपोर्ट सहेजी गई।",
    "offlineFileQueuedMsg": "ऑफ़लाइन मोड: सिंक के लिए फ़ाइल कतारबद्ध है।",
    "syncingMsg": "स्थानीय कतार को सर्वर पर सिंक किया जा रहा है...",
    "syncSuccessMsg": "{count} अपडेट सफलतापूर्वक रिव्यू कंसोल पर सिंक किए गए!"
  }
};

export default function App() {
  const [screen, setScreen] = useState("home");
  const [isOffline, setIsOffline] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState("EN");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState("");
  const [playingAudio, setPlayingAudio] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setVideoStream(stream);
      setIsCameraActive(true);
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setVideoStream(stream);
        setIsCameraActive(true);
      } catch (e) {
        setMessages((prev: any[]) => [...prev, { 
          id: Date.now() + 1, 
          type: "bot", 
          text: "Camera access denied or unavailable: " + (e as Error).message, 
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
        }]);
      }
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setIsCameraActive(false);
  };

  const uploadCapturedFile = async (file: File) => {
    if (isOffline) {
      const fileItem: any = {
        id: Date.now(),
        type: "camera",
        name: file.name,
        size: file.size,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      const newQueue = [...queue, fileItem];
      setQueue(newQueue);
      localStorage.setItem("time_agent_offline_queue", JSON.stringify(newQueue));
      setMessages((prev: any[]) => [
        ...prev,
        { id: Date.now(), type: "user", text: "Uploading capture: " + file.name, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        { id: Date.now() + 1, type: "bot", text: "offlineFileQueuedMsg", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
      ]);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsTyping(true);
    setMessages((prev: any[]) => [...prev, { id: Date.now(), type: "user", text: "Uploading capture: " + file.name, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    try {
      const res = await fetch("http://localhost:8001/ingest/file", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload HTTP " + res.status);
      const data = await res.json();
      if (!data.events || data.events.length === 0) {
        setMessages((prev: any[]) => [...prev, { id: Date.now() + 1, type: "bot", text: "noActivitiesExtracted", vars: { filename: "capture" }, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      } else {
        setMessages((prev: any[]) => [...prev, { id: Date.now() + 1, type: "bot", text: "extractedEventsProcessing", vars: { count: String(data.total_events), filename: "capture" }, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
        const event = data.events[0];
        const matchRes = await fetch("http://localhost:8002/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(event) });
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          setMessages((prev: any[]) => [...prev, {
            id: Date.now() + 2, type: "card",
            activity: (event.activity_phrase ? event.activity_phrase.charAt(0).toUpperCase() + event.activity_phrase.slice(1) : "Unknown Activity"),
            discipline: (event.discipline || "unknown").charAt(0).toUpperCase() + (event.discipline || "").slice(1),
            tag: event.tag_or_line_id || (matchData.top_activity_id && matchData.confidence_band !== "low" && matchData.candidates && matchData.candidates[0] ? matchData.candidates[0].tag : null) || "N/A",
            start: event.event_date || "-", finish: "-",
            linkedActivityId: matchData.top_activity_id || null,
            confidenceScore: Math.round((matchData.confidence_score || 0) * 100),
            confidenceBand: matchData.confidence_band || 'low',
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }]);
          if (data.total_events > 1) {
            setMessages((prev: any[]) => [...prev, { id: Date.now() + 3, type: "bot", text: "moreEventsQueued", vars: { count: String(data.total_events - 1) }, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
          }
        }
      }
    } catch (err: any) {
      setMessages((prev: any[]) => [...prev, { id: Date.now() + 1, type: "bot", text: "uploadError", vars: { error: err.message }, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } finally {
      setIsTyping(false);
    }
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-preview') as HTMLVideoElement;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `camera_capture_${Date.now()}.png`, { type: 'image/png' });
            await uploadCapturedFile(file);
          }
        }, 'image/png');
      }
    }
    stopCamera();
  };

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream, isCameraActive]);

  const clearQueue = () => {
    setQueue([]);
    localStorage.removeItem("time_agent_offline_queue");
    setMessages((prev: any[]) => [...prev, {
      id: Date.now(),
      type: "bot",
      text: "syncQueueCleared",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }]);
  };

  const t = (key: string) => {
    return i18n[language === "EN" ? "EN" : "HI"][key] || key;
  };

  const tf = (key: string, vars: Record<string,string>) => {
    let str = t(key);
    Object.entries(vars).forEach(([k,v]) => { str = str.replace(new RegExp(`{${k}}`, 'g'), v); });
    return str;
  };

  const [shift, setShift] = useState("B");
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const [messages, setMessages] = useState<any[]>([
    { id: 1, type: "bot", text: "greeting", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
  ]);

  const [queue, setQueue] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("time_agent_offline_queue");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (screen === "home") {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, screen]);

  const handleSync = async () => {
    setIsOffline(false);
    setScreen("home");
    if (queue.length === 0) return;

    setMessages((prev: any[]) => [...prev, {
      id: Date.now(),
      type: "bot",
      text: "syncingMsg",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }]);

    const itemsToSync = [...queue];
    setQueue([]);
    localStorage.removeItem("time_agent_offline_queue");

    let successCount = 0;
    for (const item of itemsToSync) {
      try {
        if (item.type === "text") {
          const ingestRes = await fetch("http://localhost:8001/ingest/llm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: item.text, source_document: "field_agent_chat_offline", default_date: new Date().toISOString().split("T")[0] })
          });
          if (!ingestRes.ok) throw new Error();
          const ingestData = await ingestRes.json();
          if (ingestData.events && ingestData.events.length > 0) {
            const event = ingestData.events[0];
            const matchRes = await fetch("http://localhost:8002/match", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(event)
            });
            if (matchRes.ok) {
              const matchData = await matchRes.json();
              await fetch("http://localhost:8003/queue/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: event, match: matchData })
              });
              successCount++;
              
              setMessages((prev: any[]) => [
                ...prev,
                {
                  id: Date.now() + Math.random(),
                  type: "user",
                  text: item.text,
                  time: item.time
                },
                {
                  id: Date.now() + Math.random(),
                  type: "bot",
                  text: "parsing",
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                },
                {
                  id: Date.now() + Math.random(),
                  type: "card",
                  activity: (event.activity_phrase ? event.activity_phrase.charAt(0).toUpperCase() + event.activity_phrase.slice(1) : "Unknown Activity"),
                  discipline: (event.discipline || "unknown").charAt(0).toUpperCase() + (event.discipline || "").slice(1),
                  tag: event.tag_or_line_id || (matchData.top_activity_id && matchData.confidence_band !== "low" && matchData.candidates && matchData.candidates[0] ? matchData.candidates[0].tag : null) || "N/A",
                  start: event.event_date || "-",
                  finish: "-",
                  linkedActivityId: matchData.top_activity_id || null,
                  confidenceScore: Math.round((matchData.confidence_score || 0) * 100),
                  confidenceBand: matchData.confidence_band || 'low',
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }
              ]);
            }
          }
        } else if (item.type === "file" || item.type === "camera") {
          const formData = new FormData();
          if (item.content) {
            const response = await fetch(item.content);
            const blob = await response.blob();
            formData.append("file", blob, item.name);
          } else {
            const blob = new Blob(["Offline file entry"], { type: "text/plain" });
            formData.append("file", blob, item.name);
          }
          const res = await fetch("http://localhost:8001/ingest/file", { method: "POST", body: formData });
          if (res.ok) {
            const data = await res.json();
            if (data.events && data.events.length > 0) {
              for (let i = 0; i < data.events.length; i++) {
                const event = data.events[i];
                const matchRes = await fetch("http://127.0.0.1:8002/match", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(event)
                });
                if (matchRes.ok) {
                  const matchData = await matchRes.json();
                  await fetch("http://127.0.0.1:8003/queue/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: event, match: matchData })
                  });
                  successCount++;
                  
                  if (i === 0) {
                    setMessages((prev: any[]) => [
                      ...prev,
                      { id: Date.now() + Math.random(), type: "user", text: "Uploaded file: " + item.name, time: item.time },
                      { id: Date.now() + Math.random(), type: "bot", text: "extractedEventsProcessing", vars: { count: String(data.total_events), filename: item.name }, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
                      {
                        id: Date.now() + Math.random(),
                        type: "card",
                        activity: (event.activity_phrase ? event.activity_phrase.charAt(0).toUpperCase() + event.activity_phrase.slice(1) : "Unknown Activity"),
                        discipline: (event.discipline || "unknown").charAt(0).toUpperCase() + (event.discipline || "").slice(1),
                        tag: event.tag_or_line_id || (matchData.top_activity_id && matchData.confidence_band !== "low" && matchData.candidates && matchData.candidates[0] ? matchData.candidates[0].tag : null) || "N/A",
                        start: event.event_date || "-", finish: "-",
                        linkedActivityId: matchData.top_activity_id || null,
                        confidenceScore: Math.round((matchData.confidence_score || 0) * 100),
                        confidenceBand: matchData.confidence_band || 'low',
                        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      }
                    ]);
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("Sync item failed", e);
        setQueue(prev => {
          const newQ = [...prev, item];
          localStorage.setItem("time_agent_offline_queue", JSON.stringify(newQ));
          return newQ;
        });
      }
    }

    if (successCount > 0) {
      setMessages((prev: any[]) => [...prev, {
        id: Date.now() + 1,
        type: "bot",
        text: "syncSuccessMsg", vars: { count: String(successCount) },
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);
    }
  };

  useEffect(() => {
    if (screen === "history") {
      fetch("http://localhost:8003/audit/history?limit=30")
        .then(r => r.json())
        .then(data => setHistoryItems(Array.isArray(data) ? data : []))
        .catch(() => setHistoryItems([]));
    }
    if (screen === "analytics") {
      fetch("http://localhost:8004/analytics/stats")
        .then(r => r.json())
        .then(data => setAnalyticsData(data))
        .catch(() => setAnalyticsData(null));
    }
  }, [screen]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const newMsg = { id: Date.now(), type: "user", text: inputText, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev: any[]) => [...prev, newMsg]);
    setInputText("");

    if (isOffline) {
      const queueItem = {
        id: Date.now(),
        type: "text",
        text: newMsg.text,
        time: newMsg.time
      };
      const newQueue = [...queue, queueItem];
      setQueue(newQueue);
      localStorage.setItem("time_agent_offline_queue", JSON.stringify(newQueue));

      setMessages((prev: any[]) => [...prev, {
        id: Date.now() + 1,
        type: "bot",
        text: "offlineQueuedMsg",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);
      return;
    }

    setIsTyping(true);
    try {
      const ingestRes = await fetch("http://localhost:8001/ingest/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newMsg.text, source_document: "field_agent_chat", default_date: new Date().toISOString().split("T")[0] })
      });
      if (!ingestRes.ok) throw new Error("Ingest HTTP " + ingestRes.status);
      const ingestData = await ingestRes.json();
      if (!ingestData.events || ingestData.events.length === 0) {
        setMessages((prev: any[]) => [...prev, { id: Date.now() + 1, type: "bot", text: "noProgressUpdate", vars: undefined, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
        return;
      }
      const event = ingestData.events[0];
      const matchRes = await fetch("http://localhost:8002/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event)
      });
      if (!matchRes.ok) throw new Error("Match HTTP " + matchRes.status);
      const matchData = await matchRes.json();
      try {
        await fetch("http://localhost:8003/queue/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: event, match: matchData })
        });
      } catch(e) { console.error("Queue fail", e); }
      setMessages((prev: any[]) => [...prev, {
        id: Date.now() + 1, type: "card",
        activity: (event.activity_phrase ? event.activity_phrase.charAt(0).toUpperCase() + event.activity_phrase.slice(1) : "Unknown Activity"),
        discipline: (event.discipline || "unknown").charAt(0).toUpperCase() + (event.discipline || "").slice(1),
        tag: event.tag_or_line_id || (matchData.top_activity_id && matchData.confidence_band !== "low" && matchData.candidates && matchData.candidates[0] ? matchData.candidates[0].tag : null) || "N/A",
        start: event.event_date || "-", finish: "-",
        linkedActivityId: matchData.top_activity_id || null,
        confidenceScore: Math.round((matchData.confidence_score || 0) * 100),
        confidenceBand: matchData.confidence_band || 'low',
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);
    } catch (err: any) {
      setMessages((prev: any[]) => [...prev, { id: Date.now() + 1, type: "bot", text: "backendError", vars: { error: err.message }, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isOffline) {
      const fileItem: any = {
        id: Date.now(),
        type: "file",
        name: file.name,
        size: file.size,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      const saveAndMsg = (item: any) => {
        const newQueue = [...queue, item];
        setQueue(newQueue);
        localStorage.setItem("time_agent_offline_queue", JSON.stringify(newQueue));
        setMessages((prev: any[]) => [
          ...prev,
          { id: Date.now(), type: "user", text: "Uploading: " + file.name, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
          { id: Date.now() + 1, type: "bot", text: "offlineFileQueuedMsg", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
        ]);
      };
      const reader = new FileReader();
      reader.onload = (evt) => {
        fileItem.content = evt.target?.result;
        saveAndMsg(fileItem);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsTyping(true);
    setMessages((prev: any[]) => [...prev, { id: Date.now(), type: "user", text: "Uploading: " + file.name, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    
    try {
      const res = await fetch("http://localhost:8001/ingest/file", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload HTTP " + res.status);
      const data = await res.json();
      
      if (!data.events || data.events.length === 0) {
        setMessages((prev: any[]) => [...prev, { id: Date.now() + 1, type: "bot", text: "noActivitiesExtracted", vars: { filename: file.name }, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      } else {
        setMessages((prev: any[]) => [...prev, { id: Date.now() + 1, type: "bot", text: "extractedEventsProcessing", vars: { count: String(data.total_events), filename: file.name }, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
        
        for (let i = 0; i < data.events.length; i++) {
          const event = data.events[i];
          const matchRes = await fetch("http://localhost:8002/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(event) });
          
          if (matchRes.ok) {
            const matchData = await matchRes.json();
            
            try {
              await fetch("http://localhost:8003/queue/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: event, match: matchData })
              });
            } catch(err) {
              console.error("Queue add failed", err);
            }
            
            if (i === 0) {
              setMessages((prev: any[]) => [...prev, {
                id: Date.now() + 2, type: "card",
                activity: (event.activity_phrase ? event.activity_phrase.charAt(0).toUpperCase() + event.activity_phrase.slice(1) : "Unknown Activity"),
                discipline: (event.discipline || "unknown").charAt(0).toUpperCase() + (event.discipline || "").slice(1),
                tag: event.tag_or_line_id || (matchData.top_activity_id && matchData.confidence_band !== "low" && matchData.candidates && matchData.candidates[0] ? matchData.candidates[0].tag : null) || "N/A",
                start: event.event_date || "-", finish: "-",
                linkedActivityId: matchData.top_activity_id || null,
                confidenceScore: Math.round((matchData.confidence_score || 0) * 100),
                confidenceBand: matchData.confidence_band || 'low',
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              }]);
            }
          }
        }
        
        if (data.events.length > 1) {
          setMessages((prev: any[]) => [...prev, { id: Date.now() + 3, type: "bot", text: "moreEventsQueued", vars: { count: String(data.events.length - 1) }, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
        }
      }
    } catch (err: any) {
      setMessages((prev: any[]) => [...prev, { id: Date.now() + 1, type: "bot", text: "uploadError", vars: { error: err.message }, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } finally {
      setIsTyping(false);
      e.target.value = "";
    }
  };

  const toggleMic = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition requires Chrome or Edge browser.");
      return;
    }
    if (isRecording) { setIsRecording(false); return; }
    // @ts-ignore
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === "EN" ? "en-US" : "hi-IN";
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (e: any) => { setInputText(e.results[0][0].transcript); setIsRecording(false); };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  if (!isLoggedIn) {
    return (
      <div className="w-full min-h-screen bg-slate-900 flex justify-center items-center p-4">
        <div className="flex flex-col items-center justify-center w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 gap-6 border border-slate-100 animate-slide-up">
          <OilIndiaLogo className="w-20 h-20 shadow-md" />
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              OIL INDIA LIMITED
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Time Agent</h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Intelligent Field Execution Progress & Time Capture System
            </p>
          </div>
          <button 
            onClick={() => setIsLoggedIn(true)} 
            className="w-full h-12 mt-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">login</span>
            <span>{t("signIn")}</span>
          </button>
          <span className="text-[11px] text-slate-400">Authorized Personnel Only • SIH26122</span>
        </div>
      </div>
    );
  }

  return (
    <div className={"flex flex-col h-screen w-screen bg-slate-50 text-slate-800 antialiased font-sans select-none " + (highContrast ? "contrast-125 bg-amber-50/30 " : "")}>
      
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setScreen("home")}>
          <OilIndiaLogo className="w-9 h-9 transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 tracking-tight">{t("timeAgent")}</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded-md">OIL</span>
            </div>
            <span className="text-[11px] text-slate-500 leading-tight">{tf("profileDetails", { shift })}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status Badge */}
          {isOffline ? (
            <span className="bg-rose-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              OFFLINE · {queue.length}
            </span>
          ) : (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t("linkedBadge")}
            </span>
          )}

          {/* Clean Language Switcher Pill */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button 
              onClick={() => setLanguage("EN")} 
              className={"px-2 py-0.5 rounded-md transition-all cursor-pointer " + (language === "EN" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800")}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage("HI")} 
              className={"px-2 py-0.5 rounded-md transition-all cursor-pointer " + (language === "HI" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800")}
            >
              हिन्दी
            </button>
          </div>

          {/* Settings Trigger */}
          <button 
            onClick={() => setScreen(screen === "settings" ? "home" : "settings")} 
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title={t("settingsTitle")}
          >
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
        </div>
      </header>

      {/* ── HIGH CONTRAST STATUS BANNER (If enabled) ────────────────────────── */}
      {highContrast && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1 text-[11px] text-amber-900 font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">light_mode</span>
            High Contrast Sunlight Mode Active
          </span>
          <button onClick={() => setHighContrast(false)} className="underline text-[10px] hover:text-amber-950 cursor-pointer">
            Disable
          </button>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto relative pb-36 px-3 pt-3">
        {isOffline ? (
          /* Offline Sync Queue View */
          <div className="p-4 flex flex-col items-center gap-4 max-w-lg mx-auto animate-slide-up">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
              <span className="material-symbols-outlined text-3xl">wifi_off</span>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-sm text-slate-900">Offline Standalone Mode</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">{t("queuedMsg")}</p>
            </div>
            
            <div className="w-full flex flex-col gap-2 mt-2">
              <div className="flex justify-between items-center px-1">
                <span className="font-bold text-xs text-slate-700">Pending Sync Queue ({queue.length})</span>
                {queue.length > 0 && (
                  <button onClick={clearQueue} className="text-xs text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-sm">delete_sweep</span>
                    {t("clearQueue")}
                  </button>
                )}
              </div>
              
              {queue.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                  No pending records. Updates you record will wait here safely.
                </div>
              ) : (
                queue.map(q => (
                  <div key={q.id} className="bg-white border border-slate-200 border-l-4 border-l-amber-500 p-3.5 rounded-xl shadow-xs flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-xs text-slate-900 flex items-center gap-2">
                        {q.type === 'file' ? (
                          <>
                            <span className="material-symbols-outlined text-sm text-blue-600">description</span>
                            <span className="truncate max-w-[200px]" title={q.name}>{q.name}</span>
                          </>
                        ) : q.type === 'camera' ? (
                          <>
                            <span className="material-symbols-outlined text-sm text-emerald-600">photo_camera</span>
                            <span className="truncate max-w-[200px]" title={q.name}>{q.name || 'Site Photo'}</span>
                          </>
                        ) : q.type === 'voice' ? (
                          <>
                            <span className="material-symbols-outlined text-sm text-amber-600">mic</span>
                            <span>Voice Log</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm text-slate-500">chat</span>
                            <span className="truncate max-w-[200px]" title={q.text}>{q.text}</span>
                          </>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span> {q.time}
                      </div>
                    </div>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      QUEUED
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : screen === "home" ? (
          /* Field Log Chat View */
          <div className="flex flex-col gap-3.5 max-w-2xl mx-auto py-1">
            {messages.map(m => {
              if (m.type === "bot") {
                return (
                  <div key={m.id} className="self-start max-w-[88%] flex items-start gap-2.5 animate-slide-up">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <span className="material-symbols-outlined text-base">smart_toy</span>
                    </div>
                    <div>
                      <div className="bg-white border border-slate-200/90 p-3.5 rounded-2xl rounded-tl-sm text-xs text-slate-800 shadow-xs leading-relaxed">
                        {m.vars ? tf(m.text, m.vars) : (i18n["EN"][m.text] ? t(m.text) : m.text)}
                      </div>
                      <span className="text-[10px] text-slate-400 ml-1.5 mt-1 block">{m.time}</span>
                    </div>
                  </div>
                );
              }
              if (m.type === "user") {
                return (
                  <div key={m.id} className="self-end max-w-[85%] animate-slide-up">
                    <div className="bg-slate-900 text-white p-3.5 rounded-2xl rounded-tr-sm text-xs shadow-sm leading-relaxed">
                      {m.vars ? tf(m.text, m.vars) : (i18n["EN"][m.text] ? t(m.text) : m.text)}
                    </div>
                    <span className="text-[10px] text-slate-400 mr-1.5 mt-1 text-right block">{m.time}</span>
                  </div>
                );
              }
              if (m.type === "voice") {
                return (
                  <div key={m.id} className="self-end max-w-[90%] animate-slide-up">
                    <div className="bg-amber-50/90 border border-amber-200/80 border-l-4 border-l-amber-500 p-3.5 rounded-2xl rounded-tr-sm text-xs flex flex-col gap-2.5 shadow-xs">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setPlayingAudio(!playingAudio)} 
                          className="w-8 h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                        >
                          <span className="material-symbols-outlined text-lg">{playingAudio ? "pause" : "play_arrow"}</span>
                        </button>
                        <div className="flex-1 flex items-center gap-1 h-6">
                          {[8, 14, 22, 16, 10, 18, 24, 12, 8, 14, 20, 10].map((h, i) => (
                            <div 
                              key={i} 
                              className={"w-1 rounded-full transition-all duration-300 " + (playingAudio ? "bg-amber-600 animate-pulse" : "bg-amber-400")} 
                              style={{ height: h + "px" }}
                            ></div>
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{m.duration || "0:12"}</span>
                      </div>
                      <div className="border-t border-amber-200/60 pt-2 text-slate-900 font-medium text-xs">
                        "{m.vars ? tf(m.text, m.vars) : (i18n["EN"][m.text] ? t(m.text) : m.text)}"
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="bg-amber-200/60 text-amber-900 px-1.5 py-0.5 rounded font-bold">HI-EN</span>
                        <span className="text-slate-500">{t("transcribed")}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 mr-1.5 mt-1 text-right block">{m.time}</span>
                  </div>
                );
              }
              if (m.type === "card") {
                return (
                  <div key={m.id} className="self-start w-full max-w-lg pl-9 animate-slide-up">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden border-l-4 border-l-emerald-500">
                      {/* Card Header */}
                      <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-[11px] text-slate-900 tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                          {t("structured")}
                        </span>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {m.confidenceScore}% · {t(m.confidenceBand?.toLowerCase() || 'low')}
                        </span>
                      </div>

                      {/* Card Grid */}
                      <div className="p-4 text-xs flex flex-col gap-2.5">
                        <div className="grid grid-cols-3 items-center">
                          <span className="text-slate-400 text-[11px] font-medium">{t("activity")}</span>
                          <span className="col-span-2 font-semibold text-slate-900">{t(m.activity) || m.activity}</span>
                        </div>
                        <div className="grid grid-cols-3 items-center">
                          <span className="text-slate-400 text-[11px] font-medium">{t("discipline")}</span>
                          <span className="col-span-2 font-medium text-slate-700">{t(m.discipline?.toLowerCase() || "")?.toUpperCase() || m.discipline}</span>
                        </div>
                        <div className="grid grid-cols-3 items-center">
                          <span className="text-slate-400 text-[11px] font-medium">{t("tag")}</span>
                          <span className="col-span-2 font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit">{m.tag}</span>
                        </div>
                        <div className="border-t border-slate-100 pt-2.5 mt-1 grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">{t("start")}</span>
                            <span className="font-semibold text-slate-800">{m.start}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">{t("finish")}</span>
                            <span className="font-semibold text-slate-800">{m.finish}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Link Action */}
                      <div className="bg-blue-50/60 border-t border-blue-100 px-4 py-2.5 flex justify-between items-center text-blue-700 font-bold text-xs transition-colors hover:bg-blue-100/60 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-blue-600">link</span>
                          <span>{m.linkedActivityId ? `${t("linkedTo")}: ${m.linkedActivityId}` : t("noMatchFound")}</span>
                        </div>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 ml-1.5 mt-1 block">{m.time}</span>
                  </div>
                );
              }
              return null;
            })}

            {isTyping && (
              <div className="self-start flex items-center gap-2 text-xs text-slate-500 p-2 pl-9 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
                <span>{t("parsing")}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : screen === "history" ? (
          /* History View */
          <div className="flex flex-col gap-3 max-w-2xl mx-auto py-2">
            {historyItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-slate-400">history</span>
                </div>
                <p className="text-xs">{t("noApprovedRecs")}</p>
              </div>
            ) : (
              historyItems.map((item: any, idx: number) => {
                const isApproved = item.status === 'approved';
                const color = isApproved ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200';
                return (
                  <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs relative overflow-hidden flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-900 truncate pr-2">{item.activity_id}</span>
                      <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full border " + color}>
                        {t(item.status?.toLowerCase() || "")?.toUpperCase() || item.status?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span className="text-blue-700 font-mono font-semibold">{t(item.discipline?.toLowerCase() || "")?.toUpperCase() || item.discipline}</span>
                      <span>•</span>
                      <span>{item.event_date}</span>
                      <span>•</span>
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px]">
                        {Math.round((item.confidence_score || 0) * 100)}% conf
                      </span>
                    </div>
                    {item.source_excerpt && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                        "{item.source_excerpt}"
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : screen === "analytics" ? (
          /* Analytics View */
          <div className="flex flex-col gap-3.5 max-w-2xl mx-auto py-2">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: t('totalReports'), value: analyticsData?.total_events ?? '--', color: 'text-blue-700', bg: 'bg-blue-50/60' },
                { label: t('approved'), value: analyticsData?.approved ?? '--', color: 'text-emerald-700', bg: 'bg-emerald-50/60' },
                { label: t('rejected'), value: analyticsData?.rejected ?? '--', color: 'text-rose-700', bg: 'bg-rose-50/60' },
                { label: t('ambiguous'), value: analyticsData?.ambiguous ?? '--', color: 'text-amber-700', bg: 'bg-amber-50/60' },
              ].map((stat, i) => (
                <div key={i} className={"border border-slate-200 p-3.5 rounded-xl shadow-xs " + stat.bg}>
                  <div className="text-[11px] text-slate-500 font-medium">{stat.label}</div>
                  <div className={"text-2xl font-bold mt-1 " + stat.color}>{stat.value}</div>
                </div>
              ))}
            </div>

            {analyticsData?.discipline_breakdown && (
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                <div className="text-xs font-bold text-slate-700 mb-3 tracking-wide">{t("byDiscipline")}</div>
                <div className="flex flex-col gap-2">
                  {analyticsData.discipline_breakdown.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                      <span className="font-medium text-slate-700 capitalize">{t(item.discipline?.toLowerCase() || "")?.toUpperCase() || item.discipline}</span>
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ── SETTINGS DRAWER ────────────────────────────────────────────────── */}
      {screen === "settings" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end animate-fade-in" onClick={() => setScreen("home")}>
          <div className="w-full sm:w-96 bg-white h-full z-50 flex flex-col shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="h-16 border-b border-slate-200 px-5 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <OilIndiaLogo className="w-7 h-7" />
                <h2 className="font-bold text-sm text-slate-900">{t("settingsTitle")}</h2>
              </div>
              <button onClick={() => setScreen("home")} className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-3.5 flex-1 overflow-y-auto">
              <div className="p-3.5 border border-slate-200 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-bold text-xs text-slate-900">{t("simOffline")}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{t("forceCache")}</div>
                </div>
                <button 
                  onClick={() => setIsOffline(!isOffline)} 
                  className={"w-12 h-6 rounded-full transition-colors relative cursor-pointer " + (isOffline ? "bg-rose-500" : "bg-slate-300")}
                >
                  <div className={"w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-xs " + (isOffline ? "translate-x-6" : "translate-x-0.5")}></div>
                </button>
              </div>

              <div className="p-3.5 border border-slate-200 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-bold text-xs text-slate-900">{t("highContrast")}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{t("enhanceSun")}</div>
                </div>
                <button 
                  onClick={() => setHighContrast(!highContrast)} 
                  className={"w-12 h-6 rounded-full transition-colors relative cursor-pointer " + (highContrast ? "bg-amber-500" : "bg-slate-300")}
                >
                  <div className={"w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-xs " + (highContrast ? "translate-x-6" : "translate-x-0.5")}></div>
                </button>
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 flex flex-col gap-2.5 bg-slate-50/50">
              <button 
                onClick={() => setScreen("home")} 
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {t("saveConfig")}
              </button>
              <button 
                onClick={() => { setIsOffline(false); setHighContrast(false); }} 
                className="w-full h-10 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-white transition-colors cursor-pointer"
              >
                {t("resetDefaults")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MENU BOTTOM SHEET ──────────────────────────────────────────────── */}
      {screen === "menu" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex flex-col justify-end animate-fade-in" onClick={() => setScreen("home")}>
          <div className="bg-white rounded-t-3xl p-5 flex flex-col gap-4 shadow-2xl max-w-lg mx-auto w-full animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto"></div>
            
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
              <OilIndiaLogo className="w-12 h-12" />
              <div>
                <div className="font-bold text-sm text-slate-900">{t("profileName")}</div>
                <div className="text-xs text-slate-500">{tf("profileDetails", { shift })}</div>
              </div>
            </div>

            <button 
              onClick={handleSync} 
              className="flex items-center justify-between p-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-lg text-blue-600">sync</span> 
                {t("syncNow")}
              </span>
              {queue.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {queue.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => {
                const newShift = shift === 'A' ? 'B' : 'A';
                setShift(newShift);
                setScreen("home");
                setMessages((prev: any[]) => [...prev, {
                  id: Date.now(),
                  type: "bot",
                  text: "shiftSwitchedTo", vars: { shift: newShift },
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }]);
              }} 
              className="flex items-center gap-2.5 p-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg text-slate-600">swap_horiz</span> 
              {t("switchShift")}
            </button>

            <button 
              onClick={() => setIsLoggedIn(false)} 
              className="flex items-center gap-2.5 p-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border-t border-slate-100 pt-3"
            >
              <span className="material-symbols-outlined text-lg">logout</span> 
              {t("signOut")}
            </button>
          </div>
        </div>
      )}

      {/* ── FLOATING COMPOSER (Home only) ─────────────────────────────────── */}
      {screen === "home" && (
        <div className="fixed bottom-16 left-0 w-full px-3 py-2 flex justify-center z-30 pointer-events-none">
          <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-1.5 flex items-center gap-1.5 shadow-lg pointer-events-auto transition-all duration-200">
            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder={isRecording ? t("listening") : t("typeMessage")}
              className="flex-1 bg-transparent h-10 px-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
            />

            <input type="file" id="file-upload-input" className="hidden" accept=".txt,.csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png,.wav,.mp3,.docx,.xer,.xml" onChange={handleFileUpload} />
            
            {/* Attachment Button */}
            <label 
              htmlFor="file-upload-input" 
              className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center cursor-pointer shrink-0 transition-colors" 
              title={t("upload")}
            >
              <span className="material-symbols-outlined text-lg">attach_file</span>
            </label>

            {/* Camera Button */}
            <button 
              onClick={startCamera} 
              title={t("takePicture")} 
              className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">photo_camera</span>
            </button>

            {/* Mic Button */}
            <button 
              onClick={toggleMic} 
              title={t("startRec")} 
              className={"w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer " + (isRecording ? "bg-rose-500 text-white shadow-md animate-pulse" : "text-amber-600 hover:bg-amber-50")}
            >
              <span className="material-symbols-outlined text-lg">mic</span>
            </button>

            {/* Send Button */}
            <button 
              onClick={handleSend} 
              title={t("send")} 
              className="w-9 h-9 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM NAVIGATION BAR ────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 w-full h-15 bg-white/95 backdrop-blur-md border-t border-slate-200/90 flex justify-center items-center px-3 z-40 shadow-xs">
        <div className="w-full max-w-2xl flex justify-between items-center gap-1">
          <button 
            onClick={() => setScreen("home")} 
            className={"flex-1 flex flex-col items-center justify-center h-11 rounded-xl text-xs transition-all duration-200 cursor-pointer " + (screen === "home" ? "font-bold text-slate-900 bg-slate-100" : "text-slate-500 hover:text-slate-800")}
          >
            <span className="material-symbols-outlined text-lg">chat</span>
            <span className="text-[10px] mt-0.5">{t("fieldLog")}</span>
          </button>
          
          <button 
            onClick={() => setScreen("history")} 
            className={"flex-1 flex flex-col items-center justify-center h-11 rounded-xl text-xs transition-all duration-200 cursor-pointer " + (screen === "history" ? "font-bold text-slate-900 bg-slate-100" : "text-slate-500 hover:text-slate-800")}
          >
            <span className="material-symbols-outlined text-lg">history</span>
            <span className="text-[10px] mt-0.5">{t("history")}</span>
          </button>
          
          <button 
            onClick={() => setScreen("analytics")} 
            className={"flex-1 flex flex-col items-center justify-center h-11 rounded-xl text-xs transition-all duration-200 cursor-pointer " + (screen === "analytics" ? "font-bold text-slate-900 bg-slate-100" : "text-slate-500 hover:text-slate-800")}
          >
            <span className="material-symbols-outlined text-lg">analytics</span>
            <span className="text-[10px] mt-0.5">{t("analytics")}</span>
          </button>
          
          <div className="flex-1 flex justify-center items-center">
            <button 
              onClick={() => setScreen("menu")} 
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
              <span>{t("menu")}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── CAMERA VIEWPORT MODAL ────────────────────────────────────────── */}
      {isCameraActive && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="bg-white p-5 rounded-2xl w-full max-w-md border border-slate-200 flex flex-col gap-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-amber-500">photo_camera</span>
                {t("takePicture")}
              </span>
              <button onClick={stopCamera} className="text-slate-400 hover:text-slate-800 cursor-pointer">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
              <video 
                ref={videoRef}
                id="camera-preview"
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button 
                onClick={stopCamera}
                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button 
                onClick={capturePhoto}
                className="px-4 py-2 rounded-xl font-semibold text-xs text-white bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">camera</span>
                <span>{t("takePicture")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
