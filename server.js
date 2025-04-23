const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, filePath) => {
    // Set proper MIME types for CSS files
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Open http://localhost:${port}/raid-game.html to view your game`);
}); 