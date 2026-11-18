#!/usr/bin/env node
/*
  Generates the word clips that index.html plays (audio/<id>.mp3) with ElevenLabs text-to-speech.

  The API key never goes into the page. It is read here, on your machine, from the
  ELEVENLABS_API_KEY environment variable or from the project's .env file (git-ignored).

  Usage (from the project folder):
    node tools/generate-audio.mjs                 generate any clips that are missing
    node tools/generate-audio.mjs --force         regenerate every clip
    node tools/generate-audio.mjs --list-voices   show the voices on your account
  Optional .env settings: ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'audio');
const API = 'https://api.elevenlabs.io/v1';

/* What the page says. Keys must match the word ids in index.html. */
const CLIPS = {
  'good-morning': 'Good morning!',
  'good-afternoon': 'Good afternoon!',
  'good-evening': 'Good evening!',
  'goodbye': 'Goodbye!',
  'see-you': 'See you!',
  'see-you-tomorrow': 'See you tomorrow!'
};

/* Read KEY=value lines from .env without printing anything */
function loadEnv() {
  const file = join(ROOT, '.env');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
loadEnv();

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error('No API key found. Put ELEVENLABS_API_KEY=... in .env (see .env.example).');
  process.exit(1);
}
const headers = { 'xi-api-key': KEY };
const args = new Set(process.argv.slice(2));

async function fail(res, what) {
  let detail = '';
  try { const j = await res.json(); detail = j.detail?.message || j.detail?.status || JSON.stringify(j.detail || j); } catch { /* not JSON */ }
  console.error(`${what} failed: HTTP ${res.status} ${detail}`);
  if (res.status === 401) console.error('The API key was rejected. Check ELEVENLABS_API_KEY in .env.');
  process.exit(1);
}

async function listVoices() {
  const res = await fetch(`${API}/voices`, { headers });
  if (!res.ok) await fail(res, 'Listing voices');
  const { voices } = await res.json();
  for (const v of voices) {
    const l = v.labels || {};
    console.log([v.voice_id, v.name, l.gender, l.age, l.accent, l.description || l.descriptive, v.category].filter(Boolean).join(' | '));
  }
}

async function generate() {
  const voice = process.env.ELEVENLABS_VOICE_ID;
  const model = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
  if (!voice) {
    console.error('Set ELEVENLABS_VOICE_ID in .env (run with --list-voices to pick one).');
    process.exit(1);
  }
  // Use the voice's own tuned settings (the voice owner's defaults sound most natural)
  let voiceSettings = { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true };
  const sres = await fetch(`${API}/voices/${voice}/settings`, { headers });
  if (sres.ok) voiceSettings = await sres.json();
  else if (sres.status === 401) await fail(sres, 'Reading voice settings');
  console.log(`voice ${voice}, model ${model}, settings ${JSON.stringify(voiceSettings)}`);

  mkdirSync(OUT_DIR, { recursive: true });
  for (const [id, text] of Object.entries(CLIPS)) {
    const out = join(OUT_DIR, `${id}.mp3`);
    if (existsSync(out) && !args.has('--force')) { console.log(`skip  ${id}.mp3 (exists)`); continue; }
    const res = await fetch(`${API}/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: voiceSettings
      })
    });
    if (!res.ok) await fail(res, `Generating "${text}"`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(out, buf);
    console.log(`saved ${id}.mp3  (${(buf.length / 1024).toFixed(1)} KB)  "${text}"`);
  }
}

(args.has('--list-voices') ? listVoices() : generate()).catch(e => { console.error(e.message); process.exit(1); });
