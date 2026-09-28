# Motion

Cheap motion eases A → B on a fixed curve. Expensive motion has mass: it accelerates, overshoots a hair, settles. Keep that mass a closed form of time so `seek(t)` stays deterministic.

## Closed-form spring

Use `assets/motion.js`.

```js
// x = spring01(t, t0, durationLike, { zeta, wn })
// 0 at t0, 1 after settle. Overshoot is a function of zeta.
```

Presets (already in the file):

| Name | Feel | Use |
|---|---|---|
| `snappy` | tight, tiny overshoot | buttons, toggles, leading edges, cursors |
| `default` | soft overshoot | cards, containers, camera |
| `heavy` | slow settle | big type, 3D-ish lockups, logos |
| `playful` | visible overshoot | stickers, mascots, chaotic tone |
| `linear` | no mass | wipe masks, playheads, counters you want exact |

Do not put overshoot on body copy. Display type can have a little. UI chrome wants snappy.

## Multiple targets — `track()`

When a value changes destination more than once (cursor, card width, camera x), do not restart a single spring. Add one spring per change, each with its own `t0`. `track()` does this. Frame 812 is still O(changes), not O(frames).

```js
const x = track(t, [
  { t: 0.0, v: 80 },
  { t: 1.2, v: 640 },
  { t: 3.4, v: 220 }
], 'snappy');
```

## Camera

Treat the frame as a camera, not a slide deck.

- Hold, then push in 2–4% on a reveal
- Parallax: background moves less than midground, type least of all
- Cut on incoming momentum (the next scene should already be traveling)
- Never animate `opacity` as the only idea. Opacity can *support* a springed offset or scale

## Type

- One idea per scene
- Optical alignment beats geometric centering — sit headlines slightly above mathematical center
- Tracking (letter-spacing) tightens on huge type, opens on small caps
- Do not animate tracking, font-weight, or blur as the primary move
- Mask-up or spring-up from 110% → 100% scale reads more expensive than fade

## Transitions

| Kind | When |
|---|---|
| Hard cut | yc-parody, chaotic, comedy timing |
| Dip to brand color | default, app-store — old content out, then new in |
| Wipe / mask | cinematic, product chrome |
| Matched move | same object survives the cut (UI morph) |
| Flash frame (1–2 frames) | chaotic only |

Never crossfade two busy layouts. Stagger (out, then in) or dip through the background.

## UI morph pattern

One object, never a hard cut. States are listed in the brief. A cursor or finger drives each change with a real press. Radius, size, and color are tracked springs. Last frame equals first if the piece must loop.

## Alive, not busy

Every 2–3 seconds something should resolve — a click, a number landing, a card seating. Micro-motion (idle float, shimmer) is optional seasoning, not the meal. If the product is quiet, deadpan holds beat fake activity.
