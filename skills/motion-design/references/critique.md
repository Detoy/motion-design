# Critique loop

The model can see. That is the difference between a mid first try and a reel you would post. Iteration is the method, not a failure.

## What to render

Before encoding the full sequence, capture stills at:

- t = 0.15s (first readable frame, not a blank fade)
- Each scene's settled midpoint
- Each transition's 50% mark
- The last 0.3s

Use `scripts/render-frames.mjs --times …`. Then *look at the files* with the image reader. Do not score from imagination.

## Scorecard (1–10)

Write `<output-dir>/critique.md`.

| Category | 8 means |
|---|---|
| Hook | Frame 0.15–2.0 would stop a thumb in a feed |
| Product truth | A stranger can name the product and what it does |
| Type | Every intended line is readable, settled, not clipped |
| Layout | Margins, alignment, no collisions, no widows hanging off a card |
| Contrast | Text vs field passes a gut WCAG check; no gray-on-color |
| Motion clarity | Even a still implies direction; mid-transition is not soup |
| Brand | Palette and mark match the source; logo not recolored |
| Finish | No default-gradient-plus-fade-plus-logo smell |

Any category below 8 becomes a fix item. List the three worst problems first, then the patch for each.

## Common fails and patches

- **Muddy crossfade** — dip through background or stagger out/in
- **Type clipped** — shrink display size 10–15% or raise the hold, do not squash tracking
- **Low contrast** — sample the real background pixel, pick text that clears it, add a thin shadow or plate only if needed
- **Fake dashboard** — replace with a captured product frame inside the device/card
- **Dead center stack** — shift the stack to a third, add one product artifact at a different scale
- **Everything fades** — replace opacity-only moves with springed y/scale
- **Busy still** — kill one idea per scene

## Stop condition

Stop when every category is 8+ or you have completed three honest look-and-fix passes and logged the leftover risk. Do not encode a "final" before the first look.

After the final encode, extract the poster candidate and three more frames (hook, product shot, outro). Glance once more. If frame 0 is a fade, you picked the wrong poster.
