const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;
const publicDir = __dirname;

const server = http.createServer((req, res) => {
  let filePath = path.join(publicDir, req.url === '/' ? 'working-app.html' : req.url);
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
  }
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📱 Open your browser and go to: http://localhost:${port}`);
  console.log(`💳 For payment demo: http://localhost:${port}/payment-complete.html`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${port} is busy, trying port ${port + 1}...`);
    server.listen(port + 1);
  }
});
