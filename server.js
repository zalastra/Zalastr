// README + Fullstack example: Instagram Reel Downloader // ----------------------------------------------------- // This single-file repository contains: // 1) README and instructions // 2) Frontend: React component (Tailwind) that lets user paste an Instagram Reel/Post URL and requests download // 3) Backend: Node.js (Express) server that fetches the Instagram page HTML, parses og:video meta tags and returns a direct video URL // // IMPORTANT LEGAL / ETHICS NOTE: // - This tool is provided for educational purposes. Only download content you own or have permission to download. // - Using automated scraping may violate Instagram's Terms of Service. Use responsibly. // // ------------------------- // Quick usage summary // ------------------------- // 1) Start backend: //    - Create a folder, put the backend code into server.js //    - npm init -y //    - npm i express node-fetch@2 cheerio cors rate-limit //    - node server.js //    (server will run on http://localhost:4000) // // 2) Start frontend: //    - Create a React app (Vite or CRA). Replace App.jsx with the frontend component below. //    - Ensure Tailwind is configured or remove Tailwind classnames if not using Tailwind. //    - Run frontend (http://localhost:5173 or CRA default) // // 3) Paste an Instagram reel/post URL into the UI and click Download. //    The frontend calls the backend endpoint /api/get-video which returns { videoUrl } //    The frontend then downloads the file or opens the video in new tab. // // ------------------------- // Backend: server.js (Node + Express) // -------------------------

/* Save this portion as server.js Install: npm i express node-fetch@2 cheerio cors express-rate-limit Run: node server.js */

const backendCode = ` const express = require('express'); const fetch = require('node-fetch'); const cheerio = require('cheerio'); const cors = require('cors'); const rateLimit = require('express-rate-limit');

const app = express(); app.use(express.json()); app.use(cors());

// Basic rate limiting to avoid abuse const limiter = rateLimit({ windowMs: 60 * 1000, // 1 minute max: 20, // limit each IP to 20 requests per windowMs }); app.use(limiter);

function extractVideoUrlFromHtml(html) { const $ = cheerio.load(html); // Many Instagram pages include meta property="og:video" or "og:video:secure_url" const ogVideo = $('meta[property="og:video"]').attr('content') || $('meta[property="og:video:secure_url"]').attr('content'); if (ogVideo) return ogVideo;

// Newer pages sometimes use JSON-LD or window.__additionalDataLoaded // Try to find the first video tag const videoTag = $('video').first(); if (videoTag && videoTag.attr('src')) return videoTag.attr('src');

// Attempt to find scripts containing "video_url" or "display_url" const scripts = $('script').get().map(s => $(s).html()).join('\n'); const match = scripts.match(/"video_url":"(https:[^"\]+)/); if (match) return match[1].replace(/\u0026/g, '&');

return null; }

app.post('/api/get-video', async (req, res) => { try { const { url } = req.body; if (!url) return res.status(400).json({ error: 'no url provided' });

// Basic validation
if (!/^https?:\/\/(www\.)?instagram.com\//i.test(url) && !/^https?:\/\/(www\.)?instagr.am\//i.test(url)) {
  return res.status(400).json({ error: 'unsupported url' });
}

// Fetch the instagram page HTML using a browser-like user-agent
const r = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
  },
});

if (!r.ok) return res.status(502).json({ error: 'failed to fetch instagram page', status: r.status });
const html = await r.text();

const videoUrl = extractVideoUrlFromHtml(html);
if (!videoUrl) return res.status(404).json({ error: 'video url not found — instagram may block or changed markup' });

// Return the direct video URL (client can download or open in new tab)
return res.json({ videoUrl });

} catch (err) { console.error('ERR', err); return res.status(500).json({ error: 'internal error' }); } });

const PORT = process.env.PORT || 4000; app.listen(PORT, () => console.log('Server listening on', PORT)); `;

// ------------------------- // Frontend: React component (App.jsx) // -------------------------

const frontendCode = ` import React, { useState } from 'react';

export default function App(){ const [url, setUrl] = useState(''); const [loading, setLoading] = useState(false); const [videoUrl, setVideoUrl] = useState(''); const [error, setError] = useState('');

async function handleDownload(e){ e.preventDefault(); setError(''); setVideoUrl(''); if(!url) return setError('Paste an Instagram post/reel URL'); setLoading(true); try{ const resp = await fetch('http://localhost:4000/api/get-video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }), }); const data = await resp.json(); if(!resp.ok) throw new Error(data.error || 'Failed'); setVideoUrl(data.videoUrl); }catch(err){ setError(err.message || 'Error'); }finally{ setLoading(false); } }

return ( <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4"> <div className="w-full max-w-xl bg-white shadow-lg rounded-2xl p-6"> <h1 className="text-2xl font-semibold mb-3">Instagram Reel Downloader</h1> <p className="text-sm text-slate-500 mb-4">Paste a public Instagram post or reel URL below. Download only content you own or have permission to use.</p>

<form onSubmit={handleDownload} className="space-y-3">
      <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/...." className="w-full p-3 border rounded-md" />
      <div className="flex gap-2">
        <button disabled={loading} className="px-4 py-2 rounded-md bg-blue-600 text-white">{loading? 'Checking...' : 'Get Video'}</button>
        <button type="button" onClick={()=>{ setUrl(''); setError(''); setVideoUrl(''); }} className="px-4 py-2 rounded-md border">Clear</button>
      </div>
    </form>

    {error && <div className="mt-4 text-red-600">{error}</div>}

    {videoUrl && (
      <div className="mt-4">
        <video controls src={videoUrl} className="w-full rounded-md mb-2" />
        <div className="flex gap-2">
          <a href={videoUrl} target="_blank" rel="noreferrer" className="px-4 py-2 border rounded-md">Open in new tab</a>
          <a href={videoUrl} download className="px-4 py-2 bg-green-600 text-white rounded-md">Download</a>
        </div>
      </div>
    )}
  </div>
</div>

); } `;

// ------------------------- // Single-file output: include both codes plus short instructions // -------------------------

const fullFile = # Instagram Reel Downloader - Fullstack Example\n\n---\n\n## Backend (server.js)\n\n\``js\n${backendCode}\n```\n\n## Frontend (React - App.jsx)\n\n```jsx\n${frontendCode}\n```\n\n---\n\n## Run instructions\n\n1. Backend:\n   - mkdir server && cd server\n   - Save server.js with the backend code snippet above\n   - npm init -y\n   - npm i express node-fetch@2 cheerio cors express-rate-limit\n   - node server.js\n\n2. Frontend:\n   - Create a React app (Vite recommended) and replace App.jsx with the frontend code\n   - npm install, npm run dev\n\n3. Open frontend and paste the Instagram post/reel URL.\n\n---\n\n## Notes & Disclaimers\n\n- This scraper works by fetching Instagram HTML and parsing meta tags. Instagram may change markup or block requests; in that case the backend will return an error.\n- Use only with public posts or content you have rights to download. Respect copyright and Instagram Terms of Service.\n- Deploying public services that scrape Instagram at scale may lead to IP blocking; consider using rate limits and caching.\n`;

// create_textdoc call content

fullFile;

// Return a single code/react file that contains the README + code

module.exports = fullFile;
