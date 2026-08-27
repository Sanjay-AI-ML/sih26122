const http = require('http');

let queue = [];

const server = http.createServer((req, res) => {
  // CORS headers
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

