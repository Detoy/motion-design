# Contributing

PRs that make a worse reel harder to ship are welcome. PRs that add a new tone preset, a sharper critique check, or a renderer fallback for a real environment are useful.

Please do not:

- Add bundled commercial music
- Paste API keys into skill text or examples
- Grow `SKILL.md` past ~500 lines — put detail in `references/`
- Check in `motion-output/` or rendered frames

Open an issue first if the change is a new render backend (Remotion, Hyperframes, headless WebKit). The default path is HTML + Chrome CDP + ffmpeg on purpose.
