# AGENTS

This repository is an [Agent Skill](https://agentskills.io).

Start here:

1. Read `skills/motion-design/SKILL.md`. Follow it. Do not improvise a slideshow.
2. Load references only when the current step needs them:
   - `references/inspect.md`
   - `references/plan.md`
   - `references/engine.md`
   - `references/motion.md`
   - `references/sound.md`
   - `references/critique.md`
   - `references/tones.md`
3. Copy `assets/motion.js` into the composition. Use `scripts/render-frames.mjs` for stills and frames. Use `scripts/synth-bed.py` only when the user did not give a track.
4. Do not encode a final `reel.mp4` before you have opened the stills and written `critique.md`.

Contract the composition must expose:

```js
window.WIDTH
window.HEIGHT
window.DURATION
window.seek = function (t) { /* pure */ }
window.__ready = true // after fonts + images
```

Default output directory: `motion-output/` (timestamped if that folder already exists).

If this file and `SKILL.md` disagree, `SKILL.md` wins.
