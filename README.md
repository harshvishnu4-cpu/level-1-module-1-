# level-1-module-1-

Stage 4 · Key Words: an interactive HTML lesson on greetings and farewells
(arriving vs leaving). Open `index.html` in a browser; it needs an internet
connection for GSAP and Google Fonts.

## What ships

| Path | What it is |
|---|---|
| `index.html` | The whole lesson (HTML, CSS, JS with GSAP) |
| `audio/` | Recorded word clips (ElevenLabs, voice: Tripti). The page plays these. |
| `assets/sticky/` | Sticky-note card artwork (Figma) |
| `assets/timer/` | Game timer artwork (Figma) |
| `tools/generate-audio.mjs` | Script that makes the clips in `audio/` |

The page never calls ElevenLabs and contains no API key. The audio is
generated once, ahead of time, and saved as MP3 files.

Course files copied unchanged from the Communicate course (`public/`):
`css/base.css`, `js/motion.js`, `lib/gsap.min.js`, and CommKit for offline
speech checking: `kit/commkit.js`, `lib/vosk.js`, `js/scoring.js`,
`js/answer-scoring.js`, `models/en-in.tar.gz` (36 MB), `commkit-sw.js`.

## What learners can do

- Hear each word on a sticky note, then tap **Say it** and say it (checked on the device).
- Read aloud: every instruction, question and situation has a speaker button.
- **Practice / Test**: Practice has no timer and hints after a wrong answer; Test is timed and scored (the spec).
- Word Match with **Words** or **Sounds** (sound cards play the phrase instead of showing it).
- Scenario Sprint: the spec's five situations first, then five drawn from a pool of 12 on each replay. Answers can be tapped or said.
- Progress is saved on the device (Continue / Start over on the welcome screen).
- The end screen shows what to practise and a session report for testers. See `docs/learner-testing.md`.

## Running it

Opening `index.html` as a file works for everything except speaking: browsers only allow the
microphone on `http://localhost` or `https://`. To try speaking on a laptop:

```
python3 -m http.server 8765
```

then open `http://localhost:8765/`. The first "Say it" loads the 36 MB speech model (a few seconds);
after that it is cached on the device.

## Regenerating the audio

1. Save your ElevenLabs API key (it starts with `sk_`) in a file **outside this
   project**: `~/.elevenlabs_key`, then run `chmod 600 ~/.elevenlabs_key`.
2. From this folder run `node tools/generate-audio.mjs --force`.
   Use `--list-voices` to see voices; set `ELEVENLABS_VOICE_ID` to change voice.

## Keeping the key off GitHub

- Never put the key in this folder. `.env`, `*.key` and `.elevenlabs_key` are
  git-ignored as a backstop.
- After `git init` or cloning, run once: `git config core.hooksPath .githooks`.
  The pre-commit hook then blocks any commit containing a `.env` file or an
  `sk_…` key.
- `.gitignore` only works with git. If you upload files through the GitHub
  website instead, check that no key file is in the upload.
- If a key is ever pushed, rotate it immediately in ElevenLabs. Deleting the
  file afterwards does not remove it from git history.
