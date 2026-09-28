# Sound

Picture without a scored track feels like a preview. Sound is where a code reel starts feeling like a film.

## Two paths

1. **User track.** Copy it to `work/stems/source.wav` (convert if needed). Probe duration and rough tempo. Lock at most 1–3 major picture cues to obvious downbeats. Never force readable type onto a 0.5s hat grid.
2. **Synthesize.** Run:

```bash
python3 <skill-dir>/scripts/synth-bed.py \
  --seconds 22 \
  --bpm 112 \
  --mood punchy \
  --out <output-dir>/work/stems/bed.wav
```

Moods: `punchy`, `warm`, `sparse`, `chaotic`, `cinematic`. The script writes an original bed (kick, hat, bass, pad). It is not a famous song and must not try to be.

## Mix

Target a simple, professional bed:

- Music sits at −18 to −14 LUFS-ish by ear. If you cannot measure, start at gain 0.28–0.40 vs full scale and duck
- SFX under the music, same implied room — short, dark, no cheap digital spikes
- Repeated ticks (keyboards, counters) belong in the background
- Fade the bed in over 0.3–0.6s and out over 0.8–1.2s
- Leave 0.2s of tail after the last picture cut so the end does not click

Build `work/stems/mix.wav` with ffmpeg (`amix` + `volume` + `afade`). Do not mux five random files at unity gain.

## SFX vocabulary

Generate tiny cues with ffmpeg when you need them (a 40ms sine blip, a filtered noise whoosh). Keep a consistent palette per film — one click, one whoosh, one hit.

Align SFX 0–80ms before the visual event so the picture feels late, which reads as weight.

Chaotic tone may be dense. Deadpan and polished almost never need more than two cues.

## Voice

Off unless `--voice`. If on:

- Script complements the picture; it does not read the headlines
- Keep it specific and short
- Duck the bed under speech (bed gain ~0.12–0.15)
- Use the Voice connected tool if available; otherwise skip voice and say so

## Beat math

```
beat = 60 / bpm
bar  = 4 * beat
```

Snap scene boundaries near bar lines when it does not fight the hold floor. Document cue locks in `plan.md` as `// beat-locked: 4.28s`.
