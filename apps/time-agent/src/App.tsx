import React, { useState, useEffect, useRef } from 'react';

    function OilIndiaLogo({ className = "w-7 h-7" }) {
      return (
        <div className={"flex items-center justify-center bg-white rounded p-0.5 border border-[#E0E0E0] shadow-sm shrink-0 " + className}>
          <svg viewBox="0 0 100 110" className="w-full h-full" fill="none">
            {/* Red vertical bar */}
            <rect x="38" y="48" width="24" height="42" fill="#DA251C" rx="1.5" />
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
    "greeting": "Good evening. Ready to log your field progress? Type an update or upload a DPR file.",
    "fieldLog": "Field Log",
    "history": "History",
    "analytics": "Analytics",
    "menu": "Menu",
    "typeMessage": "Type a message or activity...",
    "listening": "Listening... speak report",
    "signIn": "Sign In via SSO",
    "timeAgent": "TIME AGENT",
    "linkedBadge": "LINKED",
    "queuedMsg": "Your activity reports are queued and will sync when you are back online",
    "transcribed": "Transcribed",
    "parsing": "Time Agent is parsing report...",
    "settingsTitle": "Settings",
    "simOffline": "Simulate Offline",
    "forceCache": "Force local cache only",
    "enhanceSun": "Enhance readability in bright sunlight",
    "syncNow": "Sync Now",
    "signOut": "Sign Out",
    "saveConfig": "SAVE CONFIGURATION",
    "resetDefaults": "RESET TO DEFAULTS",
    "upload": "Upload Report or Attachment",
    "takePicture": "Take Picture",
    "noProgressUpdate": "That does not look like a field progress update. Please describe the specific work completed so I can log it.",
    "noActivitiesExtracted": "No activities could be extracted from {filename}.",
    "extractedEventsProcessing": "Extracted {count} event(s) from {filename}. Processing match...",
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
    "startRec": "Start recording",
    "send": "Send update",
    "structured": "STRUCTURED FOR SCHEDULE",
    "activity": "ACTIVITY",
    "discipline": "DISCIPLINE",
    "tag": "TAG",
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
    "noApprovedRecs": "No approved records yet. Send a progress update!",
    "profileName": "S. Gogoi",
    "profileDetails": "Piping • Shift {shift} • Oil India Ltd.",
    "shift": "SHIFT",
    "highContrast": "High Contrast",
    "normal": "Normal",
    "shiftSwitchedTo": "Shift switched to {shift}. You are now on Piping · Shift {shift} · Oil India Ltd.",
    "noMatch": "No match",
    "noMatchFound": "No schedule match found",
    "fontSmall": "A-",
    "fontNormal": "A",
    "fontLarge": "A+",
    "offlineQueuedMsg": "Offline Mode: Saved field report to local sync queue.",
    "offlineFileQueuedMsg": "Offline Mode: File queued for sync.",
    "syncingMsg": "Syncing local queue to servers...",
    "syncSuccessMsg": "Successfully synced {count} updates to Review Console!"
  },
  "HI": {
    "greeting": "शुभ संध्या। अपनी फ़ील्ड प्रगति दर्ज करने के लिए तैयार हैं? अपडेट टाइप करें या DPR फ़ाइल अपलोड करें।",
    "fieldLog": "फ़ील्ड लॉग",
    "history": "इतिहास",
    "analytics": "एनालिटिक्स",
    "menu": "मेनू",
    "typeMessage": "संदेश या गतिविधि टाइप करें...",
    "listening": "सुन रहे हैं... रिपोर्ट बोलें",
    "signIn": "SSO के माध्यम से साइन इन करें",
    "timeAgent": "टाइम एजेंट",
    "linkedBadge": "जुड़ा हुआ",
    "queuedMsg": "आपकी गतिविधि रिपोर्ट कतार में हैं और आपके ऑनलाइन होने पर सिंक हो जाएंगी",
    "transcribed": "प्रतिलेखित",
    "parsing": "टाइम एजेंट रिपोर्ट पार्स कर रहा है...",
    "settingsTitle": "सेटिंग्स",
    "simOffline": "ऑफ़लाइन अनुकरण करें",
    "forceCache": "केवल स्थानीय कैश को बाध्य करें",
    "enhanceSun": "तेज धूप में पठनीयता बढ़ाएं",
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
    "startRec": "रिकॉर्डिंग शुरू करें",
    "send": "अपडेट भेजें",
    "structured": "शेड्यूल के लिए संरचित",
    "activity": "गतिविधि",
    "discipline": "अनुशासन",
    "tag": "टैग",
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
    "fontSmall": "अ-",
    "fontNormal": "अ",
    "fontLarge": "अ+",
    "offlineQueuedMsg": "ऑफ़लाइन मोड: स्थानीय सिंक कतार में फ़ील्ड रिपोर्ट सहेजी गई।",
    "offlineFileQueuedMsg": "ऑफ़लाइन मोड: सिंक के लिए फ़ाइल कतारबद्ध है।",
    "syncingMsg": "स्थानीय कतार को सर्वर पर सिंक किया जा रहा है...",
    "syncSuccessMsg": "{count} अपडेट सफलतापूर्वक रिव्यू कंसोल पर सिंक किए गए!"
  }
};

function App() {
      const [screen, setScreen] = useState("home");
      const [isOffline, setIsOffline] = useState(false);
      const [highContrast, setHighContrast] = useState(false);
      // "xs" = A-,  "sm" = Normal,  "base" = A+
      const [textSize, setTextSize] = useState<"xs"|"sm"|"base">("sm");
      const [language, setLanguage] = useState("EN");
      const [isRecording, setIsRecording] = useState(false);
      const [isTyping, setIsTyping] = useState(false);
      const [inputText, setInputText] = useState("");
      const [playingAudio, setPlayingAudio] = useState(false);
      const [isLoggedIn, setIsLoggedIn] = useState(true);

      const videoRef = useRef<HTMLVideoElement | null>(null);
      const [isCameraActive, setIsCameraActive] = useState(false);
      const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setVideoStream(stream);
          setIsCameraActive(true);
        } catch (err) {
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

  // Interpolates {shift} placeholder in translated strings
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
        } catch (e) {
          return [];
        }
      });

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
                  const event = data.events[0];
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
                        text: "Uploaded file: " + item.name,
                        time: item.time
                      },
                      {
                        id: Date.now() + Math.random(),
                        type: "bot",
                        text: "extractedEventsProcessing",
                        vars: { count: String(data.total_events), filename: item.name },
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

          // Convert any file (binary or text) to Base64 Data URL to fit local storage safely
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
          e.target.value = "";
        }
      };

      const toggleMic = () => {
        if (!("webkitSpeechRecognition" in window)) {
          alert("Speech recognition requires Chrome or Edge.");
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
          <div className="w-full min-h-screen bg-gray-200 flex justify-center items-start sm:py-8">
            <div className="flex flex-col items-center justify-center h-[800px] w-full max-w-[393px] bg-white relative shadow-2xl p-6 gap-6 overflow-hidden">
              <OilIndiaLogo className="w-20 h-20" />
              <div className="text-center">
                <h1 className="text-2xl font-bold text-black">Time Agent</h1>
                <p className="text-sm text-[#666666] mt-2">Field Progress Reporting - Oil India Ltd.</p>
              </div>
              <button onClick={() => setIsLoggedIn(true)} className="w-full h-12 mt-8 bg-[#1842AA] text-white font-bold rounded-lg shadow-md hover:bg-[#123180] transition-colors">{t("signIn")}</button>
            </div>
          </div>
        );
      }

      return (
        <div className={"flex flex-col h-screen w-screen " + (highContrast ? "contrast-125 " : "") + (textSize === "xs" ? "text-xs" : textSize === "base" ? "text-base" : "text-sm")}>
          {/* Header */}
          <header className="h-14 bg-white border-b border-[#CCCCCC] flex items-center justify-between px-3 shrink-0 z-20 shadow-sm">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setScreen("home")}>
              <OilIndiaLogo className="w-8 h-8" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-black leading-tight tracking-tight">{t("timeAgent")}</span>
                  <span className="text-[9px] bg-[#E1B91B]/20 text-[#856b00] font-semibold px-1 rounded">OIL</span>
                </div>
                <span className="text-[10px] text-[#666666] leading-none">{tf("profileDetails", {shift})}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOffline ? (
                <span className="bg-[#DA251C] text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">wifi_off</span> OFFLINE · {queue.length}
                </span>
              ) : (
                <span className="bg-[#51A71D] text-white text-[10px] font-bold px-2 py-0.5 rounded">{t("linkedBadge")}</span>
              )}
              <button onClick={() => setScreen(screen === "settings" ? "home" : "settings")} className="p-1 text-black">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </header>

          {/* Accessibility bar on Home */}
          {screen === "home" && !isOffline && (
            <div className="bg-[#fbf9f8] border-b border-[#CCCCCC] px-3 py-1.5 flex items-center justify-between shrink-0">
              <div className="flex gap-1">
                {([["xs", t("fontSmall")], ["sm", t("fontNormal")], ["base", t("fontLarge")]] as [string,string][]).map(([sentinel, label]) => (
                  <button key={sentinel} onClick={() => setTextSize(sentinel as "xs"|"sm"|"base")} className={"px-2 py-0.5 border border-[#CCCCCC] rounded text-xs " + (textSize === sentinel ? "bg-[#eae8e7] font-bold" : "bg-white")}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs text-[#666666] cursor-pointer">
                  <span>{t("highContrast")}</span>
                  <input type="checkbox" checked={highContrast} onChange={e => setHighContrast(e.target.checked)} className="cursor-pointer" />
                </label>
                <div className="flex border border-[#CCCCCC] rounded overflow-hidden">
                  <button onClick={() => setLanguage("EN")} className={"px-2 py-0.5 text-xs " + (language === "EN" ? "bg-[#eae8e7] font-bold" : "bg-white")}>EN</button>
                  <button onClick={() => setLanguage("HI")} className={"px-2 py-0.5 text-xs " + (language === "HI" ? "bg-[#eae8e7] font-bold" : "bg-white")}>हिन्दी</button>
                </div>
              </div>
            </div>
          )}

          {/* Main Area */}
          <div className="flex-1 overflow-y-auto relative pb-32">
            {isOffline ? (
              <div className="p-4 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-[#e4e2e1] flex items-center justify-center text-[#666666] mt-4">
                  <span className="material-symbols-outlined text-4xl">wifi_off</span>
                </div>
                <p className="text-center text-xs text-[#666666] max-w-xs">{t("queuedMsg")}</p>
                <div className="w-full max-w-md flex flex-col gap-2 mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-xs text-black">Queue ({queue.length})</h3>
                    {queue.length > 0 && (
                      <button onClick={clearQueue} className="text-xs text-[#DA251C] hover:underline cursor-pointer flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-sm">delete</span>
                        {t("clearQueue")}
                      </button>
                    )}
                  </div>
                  {queue.map(q => (
                    <div key={q.id} className="bg-white border border-[#CCCCCC] border-l-4 border-l-[#E1B91B] p-3 rounded shadow-sm flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-xs text-black flex items-center gap-1.5">
                          {q.type === 'file' ? (
                            <>
                              <span className="material-symbols-outlined text-sm text-[#1842AA]">description</span>
                              <span className="truncate max-w-[220px]" title={q.name}>{q.name} (File)</span>
                            </>
                          ) : q.type === 'camera' ? (
                            <>
                              <span className="material-symbols-outlined text-sm text-[#51A71D]">photo_camera</span>
                              <span className="truncate max-w-[220px]" title={q.name}>{q.name || 'Camera Capture'} (Photo)</span>
                            </>
                          ) : q.type === 'voice' ? (
                            <>
                              <span className="material-symbols-outlined text-sm text-[#E1B91B]">mic</span>
                              <span>Voice Record (Audio)</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm text-[#666666]">chat</span>
                              <span className="truncate max-w-[220px]" title={q.text}>{q.text} (Text)</span>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] text-[#666666] mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span> {q.time}
                        </div>
                      </div>
                      <span className="bg-[#f0eded] text-[#666666] text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">cloud_off</span> QUEUED
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : screen === "home" ? (
              <div className="p-3 flex flex-col gap-3 max-w-2xl mx-auto">
                {messages.map(m => {
                  if (m.type === "bot") {
                    return (
                      <div key={m.id} className="self-start max-w-[85%]">
                        <div className="bg-[#f6f3f2] border border-[#CCCCCC] p-3 rounded-lg text-xs text-black">
                          {m.vars ? tf(m.text, m.vars) : (i18n["EN"][m.text] ? t(m.text) : m.text)}
                        </div>
                        <span className="text-[9px] text-[#666666] ml-1">{m.time}</span>
                      </div>
                    );
                  }
                  if (m.type === "user") {
                    return (
                      <div key={m.id} className="self-end max-w-[85%]">
                        <div className="bg-[#1b1b1b] text-white p-3 rounded-lg text-xs">
                          {m.vars ? tf(m.text, m.vars) : (i18n["EN"][m.text] ? t(m.text) : m.text)}
                        </div>
                        <span className="text-[9px] text-[#666666] mr-1 text-right block">{m.time}</span>
                      </div>
                    );
                  }
                  if (m.type === "voice") {
                    return (
                      <div key={m.id} className="self-end max-w-[90%]">
                        <div className="bg-[#FFF8E1] border-l-4 border-[#E1B91B] border border-[#ffe082] p-3 rounded-lg text-xs flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setPlayingAudio(!playingAudio)} className="w-7 h-7 bg-[#1842AA]/10 text-[#1842AA] rounded flex items-center justify-center">
                              <span className="material-symbols-outlined text-base">{playingAudio ? "pause" : "play_arrow"}</span>
                            </button>
                            <div className="flex-1 flex items-center gap-1 h-5">
                              {[8, 14, 20, 16, 10, 18, 22, 12, 6, 14, 18, 10].map((h, i) => (
                                <div key={i} className={"w-1 rounded-full " + (playingAudio ? "bg-[#1842AA]" : "bg-[#E1B91B]")} style={{ height: h + "px" }}></div>
                              ))}
                            </div>
                            <span className="text-[9px] text-[#666666]">{m.duration}</span>
                          </div>
                          <div className="border-t border-[#E1B91B]/30 pt-1 text-black font-medium">"{m.vars ? tf(m.text, m.vars) : (i18n["EN"][m.text] ? t(m.text) : m.text)}"</div>
                          <div className="flex items-center gap-1 text-[9px]">
                            <span className="bg-[#E1B91B]/20 text-[#715b00] px-1 rounded font-bold">HI-EN</span>
                            <span className="text-[#666666] italic">{t("transcribed")}</span>
                          </div>
                        </div>
                        <span className="text-[9px] text-[#666666] mr-1 text-right block">{m.time}</span>
                      </div>
                    );
                  }
                  if (m.type === "card") {
                    return (
                      <div key={m.id} className="self-start w-full max-w-md">
                        <div className="bg-white border border-[#CCCCCC] border-l-4 border-l-[#51A71D] rounded-lg shadow-sm overflow-hidden">
                          <div className="bg-[#f6f3f2] px-3 py-2 border-b border-[#CCCCCC] flex justify-between items-center">
                            <span className="font-bold text-xs text-black">{t("structured")}</span>
                            <span className="bg-[#51A71D]/15 text-[#51A71D] text-[9px] font-bold px-2 py-0.5 rounded">
                              {m.confidenceScore}% - {t(m.confidenceBand?.toLowerCase() || 'low')}
                            </span>
                          </div>
                          <div className="p-3 text-xs flex flex-col gap-1.5">
                            <div className="grid grid-cols-3"><span className="text-[#666666] text-[10px]">{t("activity")}</span><span className="col-span-2 font-semibold">{t(m.activity) || m.activity}</span></div>
                            <div className="grid grid-cols-3"><span className="text-[#666666] text-[10px]">{t("discipline")}</span><span className="col-span-2">{t(m.discipline?.toLowerCase() || "")?.toUpperCase() || m.discipline}</span></div>
                            <div className="grid grid-cols-3"><span className="text-[#666666] text-[10px]">{t("tag")}</span><span className="col-span-2 font-mono text-[#1842AA]">{m.tag}</span></div>
                            <div className="border-t border-[#f0eded] pt-2 mt-1 grid grid-cols-2">
                              <div><span className="text-[9px] text-[#666666] block">START</span><span>{m.start}</span></div>
                              <div><span className="text-[9px] text-[#666666] block">FINISH</span><span>{m.finish}</span></div>
                            </div>
                          </div>
                          <div className="bg-[#1842AA]/5 border-t border-[#1842AA]/15 p-2.5 flex justify-between items-center text-[#1842AA] font-bold text-xs cursor-pointer hover:bg-[#1842AA]/10">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm">link</span>
                              {m.linkedActivityId ? `${t("linkedTo")}: ${m.linkedActivityId}` : t("noMatchFound")}
                            </div>
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                          </div>
                        </div>
                        <span className="text-[9px] text-[#666666] ml-1">{m.time}</span>
                      </div>
                    );
                  }
                  return null;
                })}
                {isTyping && <div className="text-xs text-[#666666] p-2 animate-pulse">{t("parsing")}</div>}
              </div>
            ) : screen === "history" ? (
              <div className="p-3 overflow-y-auto flex-1 flex flex-col gap-3">
                {historyItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-[#666666]">
                    <span className="material-symbols-outlined text-3xl">history</span>
                    <p className="text-xs">{t("noApprovedRecs")}</p>
                  </div>
                ) : (
                  historyItems.map((item: any, idx: number) => {
                    const isApproved = item.status === 'approved';
                    const color = isApproved ? '#51A71D' : '#DA251C';
                    return (
                      <div key={idx} className="bg-white border border-[#CCCCCC] p-3 pl-4 rounded relative overflow-hidden shadow-sm">
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }}></div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-bold text-xs text-black truncate pr-2">{item.activity_id}</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded border shrink-0" style={{ color, borderColor: color + '55', backgroundColor: color + '15' }}>{t(item.status?.toLowerCase() || "")?.toUpperCase() || item.status?.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-[#666666] flex-wrap">
                          <span className="text-[#1842AA] font-mono font-medium">{t(item.discipline?.toLowerCase() || "")?.toUpperCase() || item.discipline}</span>
                          <span>{item.event_date}</span>
                          <span className="bg-gray-100 px-1 rounded">{Math.round((item.confidence_score || 0) * 100)}% conf</span>
                        </div>
                        {item.source_excerpt && <p className="text-[10px] text-[#666666] mt-1.5 italic truncate">"{item.source_excerpt}"</p>}
                      </div>
                    );
                  })
                )}
              </div>
            ) : screen === "analytics" ? (
              <div className="p-3 overflow-y-auto flex-1 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: t('totalReports'), value: analyticsData?.total_events ?? '--', color: '#1842AA' },
                    { label: t('approved'), value: analyticsData?.approved ?? '--', color: '#51A71D' },
                    { label: t('rejected'), value: analyticsData?.rejected ?? '--', color: '#DA251C' },
                    { label: t('ambiguous'), value: analyticsData?.ambiguous ?? '--', color: '#E1B91B' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white border border-[#CCCCCC] p-3 rounded shadow-sm">
                      <div className="text-[11px] text-[#666666]">{stat.label}</div>
                      <div className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
                {analyticsData?.discipline_breakdown && (
                  <div className="bg-white border border-[#CCCCCC] p-3 rounded shadow-sm">
                    <div className="text-xs font-bold text-[#666666] mb-2">{t("byDiscipline")}</div>
                    {analyticsData.discipline_breakdown.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#f0eded] last:border-0">
                        <span className="capitalize">{t(item.discipline?.toLowerCase() || "")?.toUpperCase() || item.discipline}</span>
                        <span className="font-bold text-[#1842AA]">{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!analyticsData && (
                  <div className="flex flex-col items-center justify-center h-32 gap-2 text-[#666666]">
                    <span className="material-symbols-outlined text-3xl">analytics</span>
                    <p className="text-xs">{t("noAnalytics")}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Settings Drawer */}
          {screen === "settings" && (
            <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white border-l border-[#CCCCCC] z-50 flex flex-col shadow-2xl">
              <div className="h-14 border-b border-[#CCCCCC] px-4 flex items-center justify-between bg-[#fbf9f8]">
                <div className="flex items-center gap-2">
                  <OilIndiaLogo className="w-6 h-6" />
                  <h2 className="font-bold text-sm text-black">{t("settingsTitle")}</h2>
                </div>
                <button onClick={() => setScreen("home")} className="p-1"><span className="material-symbols-outlined">close</span></button>
              </div>
              <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
                <div className="p-3 border border-[#CCCCCC] rounded flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs">{t("simOffline")}</div>
                    <div className="text-[11px] text-[#666666]">{t("forceCache")}</div>
                  </div>
                  <button onClick={() => setIsOffline(!isOffline)} className={"w-11 h-6 rounded-full transition-colors relative " + (isOffline ? "bg-[#DA251C]" : "bg-gray-300")}>
                    <div className={"w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform " + (isOffline ? "translate-x-5" : "translate-x-0.5")}></div>
                  </button>
                </div>
                <div className="p-3 border border-[#CCCCCC] rounded flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs">{t("highContrast")}</div>
                    <div className="text-[11px] text-[#666666]">{t("enhanceSun")}</div>
                  </div>
                  <button onClick={() => setHighContrast(!highContrast)} className={"w-11 h-6 rounded-full transition-colors relative " + (highContrast ? "bg-black" : "bg-gray-300")}>
                    <div className={"w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform " + (highContrast ? "translate-x-5" : "translate-x-0.5")}></div>
                  </button>
                </div>
              </div>
              <div className="p-4 border-t border-[#CCCCCC] flex flex-col gap-2">
                <button onClick={() => setScreen("home")} className="w-full h-10 bg-[#E1B91B] text-white font-bold text-xs rounded">{t("saveConfig")}</button>
                <button onClick={() => { setIsOffline(false); setHighContrast(false); setTextSize("sm"); }} className="w-full h-10 border border-[#CCCCCC] text-black font-bold text-xs rounded">{t("resetDefaults")}</button>
              </div>
            </div>
          )}

          {/* Menu Drawer */}
          {screen === "menu" && (
            <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end" onClick={() => setScreen("home")}>
              <div className="bg-white rounded-t-xl p-4 flex flex-col gap-3 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-2"></div>
                <div className="flex items-center gap-3 pb-3 border-b border-[#CCCCCC]">
                  <OilIndiaLogo className="w-12 h-12" />
                  <div>
                    <div className="font-bold text-sm text-black">{t("profileName")}</div>
                    <div className="text-xs text-[#666666]">{tf("profileDetails", {shift})}</div>
                  </div>
                </div>
                <button onClick={handleSync} className="flex items-center justify-between py-2 text-xs font-semibold text-black hover:bg-gray-50 px-2 rounded">
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">sync</span> {t("syncNow")}</span>
                  {queue.length > 0 && <span className="bg-[#1842AA] text-white text-[9px] px-2 py-0.5 rounded-full">{queue.length}</span>}
                </button>
                <button onClick={() => {
                  const newShift = shift === 'A' ? 'B' : 'A';
                  setShift(newShift);
                  setScreen("home");
                  setMessages((prev: any[]) => [...prev, {
                    id: Date.now(),
                    type: "bot",
                    text: "shiftSwitchedTo", vars: { shift: newShift },
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  }]);
                }} className="flex items-center gap-2 py-2 text-xs font-semibold text-black hover:bg-gray-50 px-2 rounded">
                  <span className="material-symbols-outlined text-base">swap_horiz</span> {t("switchShift")}
                </button>
                <button onClick={() => setIsLoggedIn(false)} className="flex items-center gap-2 py-2 text-xs font-semibold text-[#DA251C] hover:bg-red-50 px-2 rounded border-t border-[#CCCCCC] pt-3">
                  <span className="material-symbols-outlined text-base">logout</span> {t("signOut")}
                </button>
              </div>
            </div>
          )}

          {/* Bottom Composer on Home */}
          {screen === "home" && (
            <div className="fixed bottom-14 left-0 w-full bg-white border-t border-[#CCCCCC] p-2.5 flex items-center justify-center z-30 shadow-sm">
              <div className="w-full max-w-2xl flex items-center gap-2">
                <input
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder={isRecording ? t("listening") : t("typeMessage")}
                  className="flex-1 bg-[#f6f3f2] border border-[#CCCCCC] rounded-lg h-10 px-3 text-xs text-black outline-none focus:border-black transition-colors"
                />
                <input type="file" id="file-upload-input" className="hidden" accept=".txt,.csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png,.wav,.mp3,.docx,.xer,.xml" onChange={handleFileUpload} />
                <label htmlFor="file-upload-input" className="w-10 h-10 rounded-lg border border-[#CCCCCC] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 shrink-0 transition-colors" title={t("upload")}>
                  <span className="material-symbols-outlined text-xl text-[#666666]">attach_file</span>
                </label>
                <button onClick={startCamera} title={t("takePicture")} className="w-10 h-10 rounded-lg border border-[#CCCCCC] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 shrink-0 transition-colors">
                  <span className="material-symbols-outlined text-xl text-[#666666]">photo_camera</span>
                </button>
                <button onClick={toggleMic} title={t("startRec")} className={"w-10 h-10 rounded-lg border flex items-center justify-center transition-colors shrink-0 " + (isRecording ? "bg-[#DA251C] text-white border-[#DA251C] animate-pulse" : "border-[#E1B91B] text-[#E1B91B] bg-white hover:bg-amber-50")}>
                  <span className="material-symbols-outlined text-xl">mic</span>
                </button>
                <button onClick={handleSend} title={t("send")} className="w-10 h-10 bg-[#E1B91B] text-white rounded-lg flex items-center justify-center hover:bg-[#c9a312] shrink-0 transition-colors">
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Nav Bar */}
          <nav className="fixed bottom-0 left-0 w-full h-14 bg-white border-t border-[#CCCCCC] flex justify-around items-center px-4 z-40">
            <div className="w-full max-w-2xl flex justify-between items-center">
              <button onClick={() => setScreen("home")} className={"flex-1 flex flex-col items-center justify-center h-12 text-xs transition-colors rounded-md " + (screen === "home" ? "font-bold text-black bg-[#f6f3f2]" : "text-[#666666] hover:text-black")}>
                <span className="material-symbols-outlined text-xl">chat</span>
                <span className="text-[10px] mt-0.5">{t("fieldLog")}</span>
              </button>
              <button onClick={() => setScreen("history")} className={"flex-1 flex flex-col items-center justify-center h-12 text-xs transition-colors rounded-md " + (screen === "history" ? "font-bold text-black bg-[#f6f3f2]" : "text-[#666666] hover:text-black")}>
                <span className="material-symbols-outlined text-xl">history</span>
                <span className="text-[10px] mt-0.5">{t("history")}</span>
              </button>
              <button onClick={() => setScreen("analytics")} className={"flex-1 flex flex-col items-center justify-center h-12 text-xs transition-colors rounded-md " + (screen === "analytics" ? "font-bold text-black bg-[#f6f3f2]" : "text-[#666666] hover:text-black")}>
                <span className="material-symbols-outlined text-xl">analytics</span>
                <span className="text-[10px] mt-0.5">{t("analytics")}</span>
              </button>
              <div className="flex-1 flex justify-center items-center">
                <button onClick={() => setScreen("menu")} className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#FED33A] text-black font-bold text-xs shadow-sm hover:bg-[#ebd230] transition-colors">
                  <span className="material-symbols-outlined text-base">apps</span>
                  <span>{t("menu")}</span>
                </button>
              </div>
            </div>
          </nav>

          {/* Camera Viewport Overlay */}
          {isCameraActive && (
            <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
              <div className="bg-[#f6f3f2] p-4 rounded-lg w-full max-w-md border border-[#CCCCCC] flex flex-col gap-3.5 shadow-lg">
                <div className="flex justify-between items-center border-b border-[#CCCCCC] pb-2">
                  <span className="font-bold text-xs text-black">{t("takePicture")}</span>
                  <button onClick={stopCamera} className="text-[#666666] hover:text-black cursor-pointer">
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
                <div className="relative aspect-video rounded overflow-hidden bg-black flex items-center justify-center">
                  <video 
                    ref={videoRef}
                    id="camera-preview"
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={stopCamera}
                    className="px-3 py-1.5 border border-[#CCCCCC] rounded font-semibold text-xs text-black bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    {t("cancel") || "Cancel"}
                  </button>
                  <button 
                    onClick={capturePhoto}
                    className="px-4 py-1.5 rounded font-semibold text-xs text-white bg-[#E1B91B] hover:bg-[#c9a312] cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">photo_camera</span>
                    <span>{t("takePicture")}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
export default App;
