#!/usr/bin/env node
/*
  Generates the word clips that index.html plays (audio/<id>.mp3) with ElevenLabs text-to-speech.

  The API key is never stored in this project, so it cannot reach GitHub or the page.
  It is read, in this order, from:
    1. the ELEVENLABS_API_KEY environment variable
    2. a key file OUTSIDE the project: ~/.elevenlabs_key (or the path in ELEVENLABS_KEY_FILE)
    3. a git-ignored .env in the project (supported, but not recommended)

  Usage (from the project folder):
    node tools/generate-audio.mjs                 generate any clips that are missing
    node tools/generate-audio.mjs --force         regenerate every clip
    node tools/generate-audio.mjs --list-voices   show the voices on your account
  Optional settings (environment or .env): ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

/* Default voice: Tripti – Warm & Sweet Training Voice (a voice ID is not a secret) */
const DEFAULT_VOICE_ID = 'X5RWySWhCXiGdP9YIKck';

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

/* Key from the environment, else from a key file outside the project. Never printed. */
function readKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  const file = process.env.ELEVENLABS_KEY_FILE || join(homedir(), '.elevenlabs_key');
  if (existsSync(file)) return readFileSync(file, 'utf8').replace(/^[^=]*=/, '').replace(/["'\s]/g, '');
  return '';
}
const KEY = readKey();
if (!KEY) {
  console.error('No API key found. Save it in ~/.elevenlabs_key (outside this project) or set ELEVENLABS_API_KEY.');
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
  const voice = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const model = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
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
