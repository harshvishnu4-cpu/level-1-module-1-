# Key Words (Stage 4): testing with real learners

Run this before release to check timing and the one confusion the stage exists to fix: saying a greeting ("Good evening") when leaving.

## Who and how many

- 3–5 learners from each group: working professionals, office support staff, students past school.
- One learner at a time, on the device they will really use (a phone or a tablet if that's the plan).
- Open the page from a web address (`http://` or `https://`), not as a file, so speaking practice works. A quick way on a laptop: in the project folder run `python3 -m http.server 8765`, then open `http://localhost:8765/`.

## Before each session

1. Use a fresh browser profile or clear the site's data, so the learner starts from the welcome screen (the page remembers progress on the device).
2. Set the volume, and check the microphone works.

## During the session

Say only: "Please go through this lesson as you normally would. Think aloud if you like." Don't help unless they're stuck for more than a minute.

Write down:

| Watch for | Note |
|---|---|
| Where they hesitate or look lost | Screen and what they tried |
| Whether they find and use the speaker and "Say it" buttons | Yes / no, and any trouble |
| Speaking: does the listener understand them? | Phrases it missed |
| Word Match and Scenario Sprint: do they run out of time? | Which game |
| What they say when they choose a wrong answer | Their reason, in their words |

## After the session

1. Get the session report from the device (it is no longer shown on the end screen). In Chrome: open the developer tools (Cmd+Option+I on a Mac, F12 on Windows), go to **Console**, type `copy(localStorage.getItem('kw-stage4-last-report'))` and press Enter; the report is now on the clipboard. Paste it into your notes. It lists the time per part, every answer (tapped or said), time-outs, and speaking tries.
2. Ask:
   - "When do you say *Good evening*? When do you say *Goodbye*?" (checks the arrive/leave rule)
   - "Was anything confusing or too fast?"
   - "Did speaking out loud help?"
3. The report is saved when a learner reaches the Key Words result screen. If they closed the page earlier, use the events sent to the parent page (below), or ask them to finish Scenario Sprint.

## What to look at across all sessions

- **Total time.** The spec allows 18 minutes; the estimate is 7–12. If most learners finish well under 15, report it.
- **Arrive/leave mix-ups** in the reports ("greeting when leaving" or "farewell when arriving"). If they persist after the story, the story or its tip needs work.
- **Time-outs.** Frequent ones mean a limit is too tight for that group.
- **Speaking.** If the listener often misses a phrase, note the phrase and the learner group, so the speech model can be checked.

## When embedded in the course

The page also sends each event to its parent page with `postMessage` (`kw-answer`, `kw-speak`, `kw-timeout`, `kw-match`, and `stage-complete` at the end), so the course can collect them automatically instead of copying reports.
