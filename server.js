const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json({ limit: '2mb' }));

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, filePath) => {
    // Set proper MIME types for CSS files
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Helper to ensure file is inside talents dir
function getSafeTalentPath(fileName) {
  const talentsDir = path.join(__dirname, 'js', 'raid-game', 'talents');
  const resolved = path.join(talentsDir, fileName);
  if (!resolved.startsWith(talentsDir)) {
    return null;
  }
  return resolved;
}

// Endpoint: list talent JSON files
app.get('/talents-list', (req, res) => {
  const talentsDir = path.join(__dirname, 'js', 'raid-game', 'talents');
  fs.readdir(talentsDir, (err, files) => {
    if (err) return res.status(500).send('Failed to list talents');
    const jsonFiles = files.filter((f) => f.endsWith('_talents.json'));
    res.json(jsonFiles);
  });
});

// Endpoint: save talent JSON
app.post('/save-talents', (req, res) => {
  const { fileName, content } = req.body || {};
  if (!fileName || !content) return res.status(400).send('fileName and content required');
  const safePath = getSafeTalentPath(fileName);
  if (!safePath) return res.status(400).send('Invalid path');

  fs.writeFile(safePath, JSON.stringify(content, null, 4), (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Failed to save');
    }
    res.json({ status: 'ok' });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Open http://localhost:${port}/character-selector.html to view your game`);
  console.log(`Talent editor at http://localhost:${port}/talent-editor.html`);
});