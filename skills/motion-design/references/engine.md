# Engine — deterministic seek(t)

Opus-class models write programs, not MP4s. The film is a pure function of time. A headless Chrome calls that function once per frame; ffmpeg stitches the PNGs.

## Contract

`work/composition/index.html` must define:

```js
window.WIDTH = 1920;      // or 1080
window.HEIGHT = 1080;     // or 1920 / 1080
window.DURATION = 20;     // seconds
window.seek = function (t) { /* paint t, in seconds */ };
```

Rules:

- `seek(t)` is a pure function. No `requestAnimationFrame`, no CSS transitions, no `setTimeout`, no Web Audio clocks, no randomness without a seed derived from `t`.
- Fonts and images must be loaded *before* the first capture. Use `document.fonts.ready` and image `decode()`.
- The page is sized to `WIDTH×HEIGHT` with no browser chrome. `html, body { margin:0; overflow:hidden; background:#000; }`
- Prefer painting into DOM you fully control, or a single canvas. Do not rely on scroll position.
- Put `?t=1.25` support on the page so a still can be previewed in a normal browser.

Copy `<skill-dir>/assets/motion.js` into the composition and use it.

## Layout function

Do not hardcode 1920-only positions. One module:

```js
function layout(w, h) {
  const min = Math.min(w, h);
  return {
    w, h,
    gutter: Math.round(min * 0.06),
    safe: { x: Math.round(min * 0.06), y: Math.round(min * 0.08),
            w: w - 2 * Math.round(min * 0.06), h: h - 2 * Math.round(min * 0.08) },
    display: Math.round(min * 0.09),
    body: Math.round(min * 0.028),
    radius: Math.round(min * 0.02)
  };
}
```

Reflow for vertical/square by calling `layout(WIDTH, HEIGHT)`, not by scaling a landscape render.

## File map

```
work/composition/
  index.html
  motion.js          // copy from assets/
  style.css          // optional
  assets/            // logos, screenshots, fonts
```

## Stills then frames

From the skill directory:

```bash
node <skill-dir>/scripts/render-frames.mjs \
  --html <output-dir>/work/composition/index.html \
  --out <output-dir>/work/stills \
  --times 0.2,1.5,3.0,5.5,8.0,11.0,14.0,17.0,19.5

node <skill-dir>/scripts/render-frames.mjs \
  --html <output-dir>/work/composition/index.html \
  --out <output-dir>/work/frames \
  --fps 30
```

The script launches system Chrome over CDP (`/opt/google/chrome/chrome` by default, override with `CHROME_BIN`). No npm install required. It waits for `window.__ready === true` — set that after fonts and images load.

If CDP fails in a locked-down environment, capture stills with the `browser_tab` tool against the local composition URL instead, then encode those PNGs the same way.

## Encode

```bash
ffmpeg -y -framerate 30 -i <output-dir>/work/frames/frame-%05d.png \
  -i <output-dir>/work/stems/mix.wav \
  -map 0:v -map 1:a \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow \
  -c:a aac -b:a 192k -shortest \
  -movflags +faststart \
  <output-dir>/work/reel-raw.mp4
```

If there is no audio yet, omit the audio input and `-shortest`. Probe the result. Then bake the poster with `scripts/bake-poster.sh`.

Draft quality while iterating: `-crf 28 -preset veryfast` and `--fps 15` stills-only is fine. Final is 30fps (60 only if the user asked and motion needs it).

## Route B (only if asked)

If the user names Remotion or Hyperframes, use that stack explicitly. Otherwise stay on route A — one HTML file, `seek(t)`, Chrome, ffmpeg.

## Preview scrubber

`assets/player.html` is a local scrubber. Point it at your composition when you need to watch motion before a full render.
