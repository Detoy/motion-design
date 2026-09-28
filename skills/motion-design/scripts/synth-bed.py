#!/usr/bin/env python3
"""Original, tiny music bed for motion reels. Not a famous song."""
from __future__ import annotations

import argparse
import wave
from pathlib import Path

import numpy as np


MOODS = {
    "punchy": dict(bpm=112, key_hz=110.0, hats=True, pad=0.12, bass=0.22, kick=0.55),
    "warm": dict(bpm=96, key_hz=98.0, hats=False, pad=0.22, bass=0.18, kick=0.32),
    "sparse": dict(bpm=80, key_hz=87.3, hats=False, pad=0.18, bass=0.10, kick=0.22),
    "chaotic": dict(bpm=132, key_hz=130.8, hats=True, pad=0.08, bass=0.20, kick=0.6),
    "cinematic": dict(bpm=88, key_hz=65.4, hats=False, pad=0.28, bass=0.24, kick=0.4),
}


def envelope(n, sr, attack=0.01, release=0.08):
    a = max(1, int(sr * attack))
    r = max(1, int(sr * release))
    env = np.ones(n, dtype=np.float32)
    env[:a] = np.linspace(0, 1, a, dtype=np.float32)
    if r < n:
        env[-r:] = np.linspace(1, 0, r, dtype=np.float32)
    return env


def tone(freq, n, sr, phase=0.0):
    t = np.arange(n, dtype=np.float32) / sr
    return np.sin(2 * np.pi * freq * t + phase).astype(np.float32)


def noise(n):
    return (np.random.rand(n).astype(np.float32) * 2 - 1)


def lowpass(x, alpha=0.2):
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = acc + alpha * (v - acc)
        y[i] = acc
    return y


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--seconds", type=float, default=22)
    p.add_argument("--bpm", type=float, default=None)
    p.add_argument("--mood", choices=MOODS.keys(), default="punchy")
    p.add_argument("--out", required=True)
    p.add_argument("--sr", type=int, default=44100)
    args = p.parse_args()

    mood = dict(MOODS[args.mood])
    if args.bpm:
        mood["bpm"] = args.bpm

    sr = args.sr
    n = int(args.seconds * sr)
    mix = np.zeros(n, dtype=np.float32)
    beat = 60.0 / mood["bpm"]
    samples_beat = int(beat * sr)
    rng = np.random.default_rng(2026)

    pad = tone(mood["key_hz"], n, sr) * 0.5 + tone(mood["key_hz"] * 1.505, n, sr, 0.3) * 0.5
    pad *= mood["pad"]
    pad *= np.linspace(0.4, 1.0, n, dtype=np.float32)
    mix += pad

    kick_len = int(0.18 * sr)
    for i, start in enumerate(range(0, n, samples_beat)):
        if i % 2 != 0:
            continue
        sl = min(kick_len, n - start)
        if sl <= 0:
            break
        t = np.arange(sl, dtype=np.float32) / sr
        freq = mood["key_hz"] * (1.8 * np.exp(-t * 18) + 0.55)
        k = np.sin(2 * np.pi * freq * t) * envelope(sl, sr, 0.002, 0.14)
        mix[start : start + sl] += k * mood["kick"]

    if mood["hats"]:
        hat_len = int(0.04 * sr)
        for i, start in enumerate(range(0, n, samples_beat // 2)):
            if i % 2 == 0:
                continue
            sl = min(hat_len, n - start)
            if sl <= 0:
                break
            h = lowpass(noise(sl) * envelope(sl, sr, 0.001, 0.03), 0.55)
            mix[start : start + sl] += h * 0.09

    bar = samples_beat * 4
    degrees = [1.0, 1.0, 1.25, 0.89]
    bass_len = int(beat * 1.6 * sr)
    for b_i, start in enumerate(range(0, n, bar)):
        sl = min(bass_len, n - start)
        if sl <= 0:
            break
        freq = mood["key_hz"] * 0.5 * degrees[b_i % len(degrees)]
        note = tone(freq, sl, sr) * envelope(sl, sr, 0.02, 0.25)
        mix[start : start + sl] += note * mood["bass"]

    fade_in = int(0.4 * sr)
    fade_out = int(1.0 * sr)
    mix[:fade_in] *= np.linspace(0, 1, fade_in, dtype=np.float32)
    mix[-fade_out:] *= np.linspace(1, 0, fade_out, dtype=np.float32)
    peak = np.max(np.abs(mix)) or 1.0
    mix = mix / peak * 0.7
    mix = np.clip(mix + rng.normal(0, 0.0004, n).astype(np.float32), -1, 1)

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    pcm = (mix * 32767).astype(np.int16)
    with wave.open(str(out), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    print(f"wrote {out} ({args.seconds}s, {mood['bpm']} bpm, {args.mood})")


if __name__ == "__main__":
    main()
