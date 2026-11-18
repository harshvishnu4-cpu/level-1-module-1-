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
