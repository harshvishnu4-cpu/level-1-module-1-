#!/usr/bin/env node
/*
  Generates every clip index.html plays (audio/<id>.mp3) with ElevenLabs text-to-speech.

  The API key is never stored in this project, so it cannot reach GitHub or the page.
  It is read, in this order, from:
    1. the ELEVENLABS_API_KEY environment variable
    2. a key file OUTSIDE the project: ~/.elevenlabs_key (or the path in ELEVENLABS_KEY_FILE)
    3. a git-ignored .env in the project (supported, but not recommended)

  Usage (from the project folder):
    node tools/generate-audio.mjs                 generate any clips that are missing
    node tools/generate-audio.mjs --force         regenerate every clip
    node tools/generate-audio.mjs --only=mgr-     (re)generate only clips whose id starts with "mgr-"
    node tools/generate-audio.mjs --list-voices   show the voices on your account
  Optional settings (environment or .env): ELEVENLABS_VOICE_ID (narrator), ELEVENLABS_MANAGER_VOICE_ID, ELEVENLABS_MODEL
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'audio');
const API = 'https://api.elevenlabs.io/v1';

/* Voices (a voice ID is not a secret) */
const NARRATOR = 'X5RWySWhCXiGdP9YIKck'; // Tripti – Warm & Sweet Training Voice: words, Ananya, instructions, situations
const MANAGER = '9PvnT6XRzlljoaDG6Knu';  // Ranbir Merchant – Warm & Friendly: Ananya's manager in the arrive/leave story

/* Everything the page says. Ids must match index.html. voice: 'manager' uses MANAGER, otherwise NARRATOR.
   Instruction and situation texts must stay identical to the text on screen. */
const CLIPS = [
  // the six key words
  { id: 'good-morning', text: 'Good morning!' },
  { id: 'good-afternoon', text: 'Good afternoon!' },
  { id: 'good-evening', text: 'Good evening!' },
  { id: 'goodbye', text: 'Goodbye!' },
  { id: 'see-you', text: 'See you!' },
  { id: 'see-you-tomorrow', text: 'See you tomorrow!' },
  // Ananya's manager
  { id: 'mgr-good-evening', text: 'Good evening!', voice: 'manager' },
  { id: 'mgr-see-you-tomorrow', text: 'See you tomorrow!', voice: 'manager' },
  // instructions, read aloud on request
  { id: 'ins-welcome', text: 'Learn what to say when you arrive and when you leave, at work and in daily life.' },
  { id: 'ins-greetings', text: 'Say these when you arrive. Tap a card to hear it, then tap Say it and say it yourself.' },
  { id: 'ins-farewells', text: 'Say these when you leave. Tap a card to hear it, then tap Say it and say it yourself.' },
  { id: 'ins-story-1', text: 'Ananya arrives at the office in the evening. What does she say?' },
  { id: 'ins-story-2', text: 'Later that evening, Ananya leaves. What does she say now?' },
  { id: 'ins-recap', text: 'Same evening. Same office. Only the direction changes. Even in the evening, say Goodbye or See you when you leave.' },
  { id: 'ins-match', text: 'Find each word and its picture.' },
  { id: 'ins-match-sounds', text: 'Listen to each card and find its picture.' },
  { id: 'ins-sprint', text: 'Pick what you would say, or say it out loud.' },
  { id: 'tip-night', text: "Tip: when you meet someone at night, say Good evening. You'll find out when to say Good night later." },
  // Scenario Sprint situations
  { id: 'sit-office', text: 'You are arriving at the office in the morning.' },
  { id: 'sit-market', text: 'You are leaving the market in the evening.' },
  { id: 'sit-friend', text: 'You are meeting a friend at night.' },
  { id: 'sit-work', text: 'You are leaving work in the afternoon.' },
  { id: 'sit-home', text: 'You are arriving home in the evening.' },
  { id: 'sit-client', text: "You are arriving at a client's office in the afternoon." },
  { id: 'sit-shop-morning', text: 'You are leaving a shop in the morning.' },
  { id: 'sit-market-morning', text: 'You are arriving at the market in the morning.' },
  { id: 'sit-friend-home', text: "You are leaving a friend's home at night." },
  { id: 'sit-college', text: 'You are arriving at college in the afternoon.' },
  { id: 'sit-office-evening', text: 'You are leaving the office in the evening. You will come back tomorrow.' },
  { id: 'sit-manager-morning', text: 'You meet your manager at the office gate in the morning.' },
  // Stage 5: Reading Card (the passage is read from index.html's text, word for word) and its questions
  { id: "ins-read", text: "Ananya greeted her manager with words. People greet with actions too. Read the passage, then answer three questions." },
  { id: "read-passage", text: "Saying Hello — Words and Actions\n\nHello is a greeting used in the English language. People say 'hello' when they meet someone, or when they answer a phone call. Many people also say 'hi'. 'Hi' is an informal word. We often use it with friends and family. 'Hello' can be used in both informal and formal places, like a class or an office. There are other informal greetings too, like 'hey' and 'hiya'. Saying hello is a sign of politeness, especially when you say it in a friendly way.\n\nA greeting is not only a word. People also greet each other with actions. They may wave, nod, bow or shake hands. One of the most common action greetings is the handshake.\n\nIn a handshake, two people hold each other's right hand for a short time. They move their hands up and down a little, and then they let go. People shake hands when they meet. They also shake hands to show that they agree on something.\n\nThe handshake is very old, and people in many cultures use it. But it is not exactly the same everywhere. In some places, people give a firm handshake and hold the other hand tightly. In other places, a gentle handshake is more polite. In some cultures, the senior person, who is older or more important, offers a hand first. A handshake can be short or long. Almost everywhere, people shake hands with bare hands, not with gloves on.\n\nIn some places, men and women do not usually shake hands. Family members often hug instead. So it is a good idea to watch what other people do, and follow them.\n\nWhether you say 'hello,' wave, or shake hands, a greeting is your first chance to be friendly and polite to someone new." },
  { id: "rq1", text: "What are two example words from the text that mean “hello”?" },
  { id: "rq2", text: "What is a handshake used for, according to the text?" },
  { id: "rq3", text: "Is a handshake exactly the same in every culture? Give one difference." },
  // Stage 8: Quick Check
  { id: "qc1", text: "Listen. Which picture matches?" },
  { id: "qc2", text: "Which word means “a small apology”?" },
  { id: "qc3", text: "Drag “am” and “is” into the right blanks." },
  { id: "qc4", text: "You're leaving a shop in the evening. What do you say?" },
  { id: "qc-done", text: "Great start! Next, you'll get to use this greeting in five different situations of your own." }
];

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
const args = process.argv.slice(2);
const has = flag => args.includes(flag);
const only = (args.find(a => a.startsWith('--only=')) || '').slice(7);

async function fail(res, what) {
  let detail = '';
  try { const j = await res.json(); detail = j.detail?.message || j.detail?.status || JSON.stringify(j.detail || j); } catch { /* not JSON */ }
  console.error(`${what} failed: HTTP ${res.status} ${detail}`);
  if (res.status === 401) console.error('The API key was rejected.');
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

/* The voice owner's own tuned settings sound most natural */
const settingsCache = {};
async function settingsFor(voice) {
  if (settingsCache[voice]) return settingsCache[voice];
  let s = { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true };
  const res = await fetch(`${API}/voices/${voice}/settings`, { headers });
  if (res.ok) s = await res.json();
  else if (res.status === 401) await fail(res, 'Reading voice settings');
  return (settingsCache[voice] = s);
}

async function generate() {
  const narrator = process.env.ELEVENLABS_VOICE_ID || NARRATOR;
  const manager = process.env.ELEVENLABS_MANAGER_VOICE_ID || MANAGER;
  const model = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
  mkdirSync(OUT_DIR, { recursive: true });
  let made = 0, skipped = 0;
  for (const clip of CLIPS) {
    if (only && !clip.id.startsWith(only)) continue;
    const out = join(OUT_DIR, `${clip.id}.mp3`);
    if (existsSync(out) && !has('--force')) { skipped++; continue; }
    const voice = clip.voice === 'manager' ? manager : narrator;
    const res = await fetch(`${API}/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: clip.text, model_id: model, voice_settings: await settingsFor(voice) })
    });
    if (!res.ok) await fail(res, `Generating "${clip.text}"`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(out, buf);
    made++;
    console.log(`saved ${clip.id}.mp3  (${(buf.length / 1024).toFixed(1)} KB, ${clip.voice === 'manager' ? 'manager' : 'narrator'})`);
  }
  console.log(`done: ${made} generated, ${skipped} already there`);
}

(has('--list-voices') ? listVoices() : generate()).catch(e => { console.error(e.message); process.exit(1); });
