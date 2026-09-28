/**
 * Closed-form springs + multi-target tracks.
 * Every helper is a pure function of t. Safe inside seek(t).
 */
(function (root) {
  const PRESETS = {
    snappy:  { wn: 18, zeta: 0.72 },
    default: { wn: 12, zeta: 0.78 },
    heavy:   { wn: 8,  zeta: 0.86 },
    playful: { wn: 11, zeta: 0.58 },
    linear:  { wn: 0,  zeta: 1 }
  };

  function preset(name) {
    if (typeof name === 'object' && name) return name;
    return PRESETS[name] || PRESETS.default;
  }

  function clamp01(x) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
  }

  function lerp(a, b, u) {
    return a + (b - a) * u;
  }

  function easeCubic(u) {
    return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  }

  function spring01(t, t0, settle, kind) {
    const p = preset(kind);
    const tau = t - t0;
    if (tau <= 0) return 0;
    if (!p.wn) return clamp01(tau / (settle || 0.001));
    const wn = p.wn;
    const z = p.zeta;
    const wd = wn * Math.sqrt(Math.max(0.0001, 1 - z * z));
    const env = Math.exp(-z * wn * tau);
    let x;
    if (z < 0.999) {
      x = 1 - env * (Math.cos(wd * tau) + ((z * wn) / wd) * Math.sin(wd * tau));
    } else {
      x = 1 - env * (1 + wn * tau);
    }
    const window = settle || (4.5 / (z * wn));
    if (tau >= window) return 1;
    return x;
  }

  function spring(t, t0, from, to, settle, kind) {
    return lerp(from, to, spring01(t, t0, settle, kind));
  }

  function track(t, keys, kind, settle) {
    if (!keys || !keys.length) return 0;
    const ks = keys.slice().sort((a, b) => a.t - b.t);
    if (t <= ks[0].t) return ks[0].v;
    return trackWalk(t, ks, kind, settle);
  }

  function trackWalk(t, ks, kind, settle) {
    let current = ks[0].v;
    let tStart = ks[0].t;
    let dest = ks[0].v;
    for (let i = 1; i < ks.length; i++) {
      if (t < ks[i].t) {
        return spring(t, tStart, current, dest, settle, kind);
      }
      current = spring(ks[i].t, tStart, current, dest, settle, kind);
      tStart = ks[i].t;
      dest = ks[i].v;
    }
    return spring(t, tStart, current, dest, settle, kind);
  }

  function step(t, t0, from, to) {
    return t >= t0 ? to : from;
  }

  function clamp(t, a, b) {
    return Math.min(b, Math.max(a, t));
  }

  function remap(t, a0, a1, b0, b1) {
    if (a1 === a0) return b0;
    return lerp(b0, b1, clamp01((t - a0) / (a1 - a0)));
  }

  function cameraFit(t, keys) {
    return {
      x: track(t, keys.map((k) => ({ t: k.t, v: k.x || 0 })), 'default'),
      y: track(t, keys.map((k) => ({ t: k.t, v: k.y || 0 })), 'default'),
      s: track(t, keys.map((k) => ({ t: k.t, v: k.s == null ? 1 : k.s })), 'heavy')
    };
  }

  root.Motion = {
    PRESETS,
    clamp01,
    clamp,
    lerp,
    easeCubic,
    spring01,
    spring,
    track,
    step,
    remap,
    cameraFit
  };
})(typeof window !== 'undefined' ? window : globalThis);
