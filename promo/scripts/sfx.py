"""Synthesizes the ad's sound effects, so the project ships no third-party audio.

python3 scripts/sfx.py public/sfx
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48_000
rng = np.random.default_rng(7)


def t_axis(sec):
    return np.arange(int(SR * sec)) / SR


def noise(sec):
    return rng.standard_normal(int(SR * sec))


def band(x, lo, hi, soft=0.15):
    """Zero-phase band-pass in the frequency domain with soft (log-gaussian) edges."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-9
    g = np.ones_like(f)
    if lo:
        g *= 1 / (1 + np.exp(-(np.log(f) - np.log(lo)) / soft))
    if hi:
        g *= 1 / (1 + np.exp((np.log(f) - np.log(hi)) / soft))
    return np.fft.irfft(X * g, len(x))


def sweep_band(x, centers, width=0.5, hop=256, n=2048):
    """Time-varying band-pass (STFT): `centers` is a function of time 0..1 → Hz."""
    win = np.hanning(n)
    out = np.zeros(len(x) + n)
    norm = np.zeros(len(x) + n)
    f = np.fft.rfftfreq(n, 1 / SR) + 1e-9
    for i in range(0, len(x) - n, hop):
        c = centers(i / len(x))
        g = np.exp(-0.5 * ((np.log(f) - np.log(c)) / width) ** 2)
        seg = np.fft.irfft(np.fft.rfft(x[i : i + n] * win) * g, n)
        out[i : i + n] += seg * win
        norm[i : i + n] += win**2
    return out[: len(x)] / np.maximum(norm[: len(x)], 1e-3)


def reverb(stereo, sec=1.6, mix=0.25, bright=6000):
    """Convolution with a decaying, decorrelated noise tail."""
    tail = int(SR * sec)
    out = []
    for ch in range(2):
        ir = band(rng.standard_normal(tail), None, bright) * np.exp(-np.arange(tail) / SR / (sec / 5))
        ir /= np.sqrt(np.sum(ir**2))
        x = np.concatenate([stereo[ch], np.zeros(tail)])
        n = 1 << int(np.ceil(np.log2(len(x) + tail)))
        wet = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x)]
        out.append(x * (1 - mix) + wet * mix)
    return np.array(out)


def pan(x, p=0.0):
    """Equal-power pan, p in -1..1."""
    a = (p + 1) * np.pi / 4
    return np.array([x * np.cos(a), x * np.sin(a)])


def write(path, stereo, peak=0.89):
    if stereo.ndim == 1:
        stereo = pan(stereo)
    stereo = stereo / (np.max(np.abs(stereo)) + 1e-9) * peak
    fade = min(len(stereo[0]), int(SR * 0.01))
    stereo[:, -fade:] *= np.linspace(1, 0, fade)
    data = (stereo.T * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def boom():
    """A heavy cinematic hit: sub drop, chest thud, a click on top, long tail."""
    t = t_axis(4.0)
    f = 34 + 46 * np.exp(-t * 3.2)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.1)
    thud = np.sin(2 * np.pi * 110 * t) * np.exp(-t * 14)
    click = band(noise(4.0), 800, 6000) * np.exp(-t * 90) * 0.5
    body = band(noise(4.0), 60, 700) * np.exp(-t * 5) * 0.6
    x = np.tanh(2.2 * (sub + 0.7 * thud + click + body))
    return reverb(pan(x), sec=2.8, mix=0.3, bright=2500)


def glass():
    """Glass shattering: a crack, a bright burst, then a rain of tinkling shards."""
    dur = 2.6
    t = t_axis(dur)
    left, right = np.zeros(len(t)), np.zeros(len(t))
    crack = band(noise(dur), 1500, None) * np.exp(-t * 160)
    burst = band(noise(dur), 2500, 11000) * np.exp(-t * 9) * 0.55
    thud = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 12) * 0.6
    base = crack + burst + thud
    left += base
    right += base
    for _ in range(140):
        start = rng.exponential(0.32)
        if start > dur - 0.3:
            continue
        i0 = int(start * SR)
        n = len(t) - i0
        tt = np.arange(n) / SR
        f0 = rng.uniform(2200, 7800)
        decay = rng.uniform(25, 70)
        ring = sum(a * np.sin(2 * np.pi * f0 * r * tt + rng.uniform(0, 6.28)) for r, a in ((1, 1), (2.76, 0.5), (5.4, 0.25)))
        ring = ring * np.exp(-tt * decay) * (0.9 * np.exp(-start * 1.6) + 0.05) * rng.uniform(0.2, 0.7)
        p = rng.uniform(-0.9, 0.9)
        left[i0:] += ring * np.cos((p + 1) * np.pi / 4)
        right[i0:] += ring * np.sin((p + 1) * np.pi / 4)
    return reverb(np.array([left, right]), sec=1.4, mix=0.28)


def whoosh(sec=0.75, up=True):
    x = noise(sec)
    c = (lambda p: 250 * 14 ** np.sin(np.pi * p * 0.9)) if up else (lambda p: 3500 * 0.08 ** p)
    y = sweep_band(x, c, width=0.45)
    env = np.sin(np.pi * np.clip(t_axis(sec) / sec, 0, 1)) ** 1.6
    return reverb(pan(y * env), sec=0.8, mix=0.2)


def snip():
    """Two metallic blade clicks."""
    t = t_axis(0.5)
    x = np.zeros(len(t))
    for start, amp in ((0.0, 0.7), (0.085, 1.0)):
        i0 = int(start * SR)
        tt = t[: len(t) - i0]
        hit = band(rng.standard_normal(len(tt)), 3000, 12000) * np.exp(-tt * 260)
        ring = (np.sin(2 * np.pi * 4300 * tt) + 0.6 * np.sin(2 * np.pi * 6900 * tt)) * np.exp(-tt * 55) * 0.25
        x[i0:] += amp * (hit + ring)
    return reverb(pan(x), sec=0.5, mix=0.12)


def tick():
    """A receipt printer stepping one line."""
    t = t_axis(0.12)
    return pan(band(noise(0.12), 1800, 5000) * np.exp(-t * 70) + np.sin(2 * np.pi * 900 * t) * np.exp(-t * 90) * 0.3)


def coin():
    """A cash-register ding for every charge that gets added."""
    t = t_axis(0.9)
    x = sum(a * np.sin(2 * np.pi * f * t) for f, a in ((2093, 1), (2637, 0.6), (4186, 0.25))) * np.exp(-t * 5.5)
    x[: int(SR * 0.004)] *= np.linspace(0, 1, int(SR * 0.004))
    return reverb(pan(x), sec=0.7, mix=0.2)


def pop():
    """Soft UI pop for each master joining the team."""
    t = t_axis(0.14)
    f = 520 + 520 * (1 - np.exp(-t * 60))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38)
    return pan(x)


def riser(sec=2.0):
    t = t_axis(sec)
    p = t / sec
    tone = np.sin(2 * np.pi * np.cumsum(180 * 7 ** p) / SR) * 0.35
    air = sweep_band(noise(sec), lambda q: 400 * 15**q, width=0.6)
    return reverb(pan((tone + air) * p**2.2), sec=1.0, mix=0.25)


def drone(sec=23.0):
    """A dark, slowly breathing low pad that sits under the problem half."""
    t = t_axis(sec)
    saw = lambda f: 2 * ((f * t) % 1) - 1
    x = saw(41.2) + saw(41.5) + 0.6 * saw(61.7) + 0.4 * saw(82.6)
    x = band(x, 30, 380, soft=0.25)
    x *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.18 * t)
    x *= np.clip(t / 2.0, 0, 1) * np.clip((sec - t) / 2.5, 0, 1)
    return reverb(np.array([x, np.roll(x, 900)]), sec=2.5, mix=0.3)


def chime():
    """Bright resolution for the reveal: a rising major arpeggio of bells."""
    t = t_axis(2.4)
    x = np.zeros(len(t))
    for k, f in enumerate((1046.5, 1318.5, 1568.0, 2093.0)):
        i0 = int(k * 0.07 * SR)
        tt = t[: len(t) - i0]
        x[i0:] += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.01 * tt)) * np.exp(-tt * 2.4)
    return reverb(pan(x), sec=2.0, mix=0.35)


if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "public/sfx")
    out.mkdir(parents=True, exist_ok=True)
    for name, fn in {
        "boom": boom, "glass": glass, "whoosh": whoosh, "whoosh-down": lambda: whoosh(0.6, up=False),
        "snip": snip, "tick": tick, "coin": coin, "pop": pop, "riser": riser, "drone": drone, "chime": chime,
    }.items():
        write(out / f"{name}.wav", fn())
        print(name)
