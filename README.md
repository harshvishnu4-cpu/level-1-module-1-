# level-1-module-1-

Segment 1 of the Communicate course in one interactive page. A first-time learner starts on the
Key Words start screen; once Stage 4 is done, home becomes a learning path (like Duolingo's) where
the stages sit on a winding path and open in order, with an Up next card, the words you know and
your progress beside it.

- **Stage 4 · Key Words**: greetings and farewells (arriving vs leaving), Word Match, Scenario Sprint.
- **Stage 5 · Reading Card**: "Saying Hello — Words and Actions" (291 words), tap-to-see glossary,
  Listen, then three questions with "Show text". 12-minute limit; a lapse restarts the task.
  The passage is the content team's approved text, word for word: adapted from Simple English
  Wikipedia, "Hello" and "Handshake", CC BY-SA 4.0, and the adapted text carries the same licence.
- **Stage 8 · Quick Check**: four questions (listening, vocabulary, drag "am"/"is", application),
  not graded, feedback after each answer. 10-minute limit; a lapse restarts from Q1.

Finishing a stage returns to the path: the stage turns green, the path fills in and the next stage opens.
Stages 6–7 show as "coming soon" (not built yet) and don't block Stage 8. Progress is saved on the device.
For content reviewers and testers, open the page with `?review` (for example `http://localhost:8765/?review`)
to open every stage without playing the earlier ones. Open `index.html` in a browser; it needs an internet
connection only for the timer's digit font (GSAP and the rest are local).

## What ships

| Path | What it is |
|---|---|
| `index.html` | The whole lesson (HTML, CSS, JS with GSAP) |
| `audio/` | Recorded word clips (ElevenLabs, voice: Tripti). The page plays these. |
| `assets/sticky/` | Sticky-note artwork from Figma. No longer used by the page (the word cards now use the learning-plan card style); kept for reference |
| `assets/timer/` | Game timer artwork (Figma) |
| `tools/generate-audio.mjs` | Script that makes the clips in `audio/` |
| `fonts/outfit/` | Outfit, the text and button font (SIL Open Font License, `OFL.txt`) |
| `fonts/switzer/` | Switzer, the font for titles and big words (Fontshare Free Font License, `FFL.txt`). The font file is git-ignored: its licence does not allow sharing it through a public repository, so the page loads it from Fontshare when the file is missing |

The page never calls ElevenLabs and contains no API key. The audio is
generated once, ahead of time, and saved as MP3 files.

Course files copied unchanged from the Communicate course (`public/`):
`css/base.css`, `js/motion.js`, `lib/gsap.min.js`, and CommKit for offline
speech checking: `kit/commkit.js`, `lib/vosk.js`, `js/scoring.js`,
`js/answer-scoring.js`, `models/en-in.tar.gz` (36 MB), `commkit-sw.js`.

## What learners can do

- Hear each word on its card, then tap **Say it** and say it (checked on the device).
- Read aloud: every instruction, question and situation has a speaker button.
- **Practice / Test**: Practice has no timer and hints after a wrong answer; Test is timed and scored (the spec).
- Word Match with **Words** or **Sounds** (sound cards play the phrase instead of showing it).
- Scenario Sprint: the spec's five situations first, then five drawn from a pool of 12 on each replay. Answers can be tapped or said.
- Progress is saved on the device (Continue / Start over on the welcome screen).
- The end screen shows what to practise. A session report for testers is saved on the device (not shown to learners); see `docs/learner-testing.md`.

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
