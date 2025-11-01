import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;


// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Serve generated video pages
app.use('/videos', express.static(path.join(__dirname, 'videos')));

import fs from 'fs';

// Helper to generate a random page name
function generatePageName() {
  return 'video_' + Math.random().toString(36).substring(2, 10) + '.html';
}

// POST endpoint to create a new video page
app.post('/api/create-video-page', (req, res) => {
  const { driveLink } = req.body;
  if (!driveLink) {
    return res.status(400).json({ error: 'Missing driveLink' });
  }

  // Extract fileId from Google Drive link
  const patterns = [
    /\/file\/d\/([^/]+)/,  // Format: /file/d/FILE_ID/...
    /id=([^&]+)/,          // Format: ?id=FILE_ID&...
    /\/d\/([^/]+)/        // Format: /d/FILE_ID/...
  ];
  let fileId = null;
  for (const pattern of patterns) {
    const match = driveLink.match(pattern);
    if (match) {
      fileId = match[1];
      break;
    }
  }
  if (!fileId) {
    return res.status(400).json({ error: 'Invalid Google Drive link' });
  }

  // Generate HTML page with iframe
  const pageName = generatePageName();
  const pagePath = path.join(__dirname, 'videos', pageName);
  const iframeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Google Drive Video</title>
  <style>
    body { background: #f8f9fa; text-align: center; font-family: Arial, sans-serif; padding: 40px; }
    iframe { border-radius: 8px; box-shadow: 0 2px 8px #0002; }
    a { display: inline-block; margin-top: 20px; color: #007bff; }
  </style>
</head>
<body>
  <h1>Google Drive Video</h1>
  <iframe src="https://drive.google.com/file/d/${fileId}/preview" width="100%" height="450" frameborder="0" allowfullscreen></iframe>
  <br />
  <a href="/upload.html">Upload another</a>
</body>
</html>`;

  // Save the HTML file
  fs.writeFile(pagePath, iframeHtml, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create video page' });
    }
    // Respond with the URL to the new page
    res.json({ url: `/videos/${pageName}` });
  });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
