const http = require('http');

const today = new Date().toISOString().split('T')[0];

let queue = [
  {
    queue_id: 'Q-1001',
    event: {
      activity_phrase: "Completed erection and hydrotesting of 5 gate valves in CW cooling line",
      discipline: "piping",
      tag_or_line_id: "TAG-402",
      event_date: "2026-08-25",
      finish_date: today,
      quantity: "5 units",
      contractor: "L&T Heavy Engineering"
    },
    match: {
      top_activity_id: "L6-PIP-402",
      confidence_score: 0.88,
      confidence_band: "high",
      is_ambiguous: false,
      candidates: [
        { activity_id: "L6-PIP-402", activity_name: "Cooling Line 24-CW Valve Erection & Hydrotest", discipline: "piping", score: 0.88, tag: "TAG-402", rationale: "Exact match on valve erection and hydrotesting." }
      ]
    },
    status: "approved",
    receivedAt: new Date(Date.now() - 18000000).toISOString()
  },
  {
    queue_id: 'Q-1002',
    event: {
      activity_phrase: "Completed concrete pouring and curing for main substation transformer block B",
      discipline: "civil",
      tag_or_line_id: "FOUND-CIV-104",
      event_date: "2026-08-26",
      finish_date: today,
      quantity: "45 m3",
      contractor: "Shapoorji Pallonji Civil"
    },
    match: {
      top_activity_id: "L6-CIV-104",
      confidence_score: 0.92,
      confidence_band: "high",
      is_ambiguous: false,
      candidates: [
        { activity_id: "L6-CIV-104", activity_name: "Substation Transformer Block Concrete Pouring & Curing", discipline: "civil", score: 0.92, tag: "FOUND-CIV-104", rationale: "High similarity on transformer block civil pour." }
      ]
    },
    status: "approved",
    receivedAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    queue_id: 'Q-1003',
    event: {
      activity_phrase: "Completed cable pulling and termination for 11kV main electrical substation feeder",
      discipline: "electrical",
      tag_or_line_id: "CABLE-ELE-201",
      event_date: "2026-08-27",
      finish_date: today,
      quantity: "350 meters",
      contractor: "Siemens India"
    },
    match: {
      top_activity_id: "L6-ELE-201",
      confidence_score: 0.95,
      confidence_band: "high",
      is_ambiguous: false,
      candidates: [
        { activity_id: "L6-ELE-201", activity_name: "Main Substation Feeder Cable Pulling & Termination", discipline: "electrical", score: 0.95, tag: "CABLE-ELE-201", rationale: "Direct match on 11kV cable pulling." }
      ]
    },
    status: "approved",
    receivedAt: new Date(Date.now() - 10800000).toISOString()
  },
  {
    queue_id: 'Q-1004',
    event: {
      activity_phrase: "Safety walkdown and scaffold inspection completed at hydrocracker unit 3",
      discipline: "hse",
      tag_or_line_id: "HSE-INSP-301",
      event_date: "2026-08-28",
      finish_date: today,
      quantity: "1 audit",
      contractor: "Oil India Safety Division"
    },
    match: {
      top_activity_id: "L6-HSE-301",
      confidence_score: 0.65,
      confidence_band: "medium",
      is_ambiguous: true,
      candidates: [
        { activity_id: "L6-HSE-301", activity_name: "Hydrocracker Area Weekly Safety Walkdown", discipline: "hse", score: 0.65, tag: "HSE-INSP-301", rationale: "Medium match on HSE audit phrase." }
      ]
    },
    status: "review",
    receivedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    queue_id: 'Q-1005',
    event: {
      activity_phrase: "Pressure transmitter calibration finished for boiler feedback control loop",
      discipline: "instrumentation",
      tag_or_line_id: "PT-509",
      event_date: "2026-08-28",
      finish_date: today,
      quantity: "2 loops",
      contractor: "ABB Automation"
    },
    match: {
      top_activity_id: "L6-INS-509",
      confidence_score: 0.86,
      confidence_band: "high",
      is_ambiguous: false,
      candidates: [
        { activity_id: "L6-INS-509", activity_name: "Boiler Control Loop Pressure Transmitter Calibration", discipline: "instrumentation", score: 0.86, tag: "PT-509", rationale: "Matched tag PT-509 and calibration procedure." }
      ]
    },
    status: "approved",
    receivedAt: new Date(Date.now() - 3600000).toISOString()
  }
];

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/queue/add') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const item = JSON.parse(body);
        item.queue_id = 'Q-' + Date.now();
        queue.push(item);
        console.log("Added to queue:", item.queue_id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', id: item.queue_id }));
      } catch (e) {
        res.writeHead(400);
        res.end();
      }
    });
  } else if (req.method === 'GET' && req.url === '/queue/pending') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(queue));
  } else if (req.method === 'GET' && (req.url.startsWith('/audit/history') || req.url === '/history')) {
    const history = queue.map(q => ({
      activity_id: q.match?.top_activity_id || q.event?.tag_or_line_id || "LOG-" + Math.floor(Math.random()*900+100),
      discipline: q.event?.discipline || "civil",
      event_date: q.event?.event_date || today,
      finish_date: q.event?.finish_date || today,
      confidence_score: q.match?.confidence_score || 0.85,
      status: q.match?.confidence_band === 'high' ? 'approved' : (q.match?.is_ambiguous ? 'review' : 'flagged'),
      source_excerpt: q.event?.activity_phrase
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(history));
  } else if (req.method === 'GET' && (req.url.startsWith('/analytics') || req.url === '/analytics/stats')) {
    const total = queue.length;
    const approved = queue.filter(q => q.match?.confidence_band === 'high').length;
    const ambiguous = queue.filter(q => q.match?.is_ambiguous || q.match?.confidence_band === 'medium').length;
    const rejected = queue.filter(q => q.match?.confidence_band === 'low').length;
    
    const discMap = {};
    queue.forEach(q => {
      const d = (q.event?.discipline || 'civil').toLowerCase();
      discMap[d] = (discMap[d] || 0) + 1;
    });
    const discipline_breakdown = Object.keys(discMap).map(k => ({ discipline: k, count: discMap[k] }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      total_events: total,
      approved: approved,
      ambiguous: ambiguous,
      rejected: rejected,
      discipline_breakdown: discipline_breakdown
    }));
  } else if (req.method === 'DELETE' && (req.url === '/queue/clear' || req.url === '/queue/all')) {
    queue = [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Queue cleared' }));
  } else if (req.method === 'DELETE' && req.url.startsWith('/queue/')) {
    const id = req.url.split('/').pop();
    queue = queue.filter(q => q.queue_id !== id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(8003, () => {
  console.log('Bridge Server running on port 8003');
});
