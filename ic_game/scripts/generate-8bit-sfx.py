#!/usr/bin/env python3
"""
Procedural 8-Bit Retro SFX Generator
====================================
Synthesizes authentic 8-bit chiptune and retro foley sound effects
mathematically using NumPy and encodes them directly to `.mp3` via `lameenc`.

Outputs standalone `.mp3` files into `src/assets/audio/`.

To add a new 8-bit sound in the future:
  1. Write a `synth_<name>() -> np.ndarray` function returning a float32 mono buffer in [-1.0, 1.0].
  2. Register `"<name>": synth_<name>` in `SOUND_REGISTRY` at the bottom of this file.
  3. Run `npm run sfx:generate` (or `python scripts/generate-8bit-sfx.py`).
"""

from __future__ import annotations

from pathlib import Path
from typing import Callable, Dict, List, Tuple

import lameenc
import numpy as np

# ---------------------------------------------------------------------------
# Global Audio Constants
# ---------------------------------------------------------------------------
SAMPLE_RATE = 44100
BIT_CRUSH_LEVELS = 64  # Authentic 8-bit / 6-bit retro DAC stepping
MASTER_QUIET_GAIN = 0.24  # Stark, quiet, minimalist master level

PROJECT_ROOT = Path(__file__).resolve().parent.parent
AUDIO_OUT_DIR = PROJECT_ROOT / "src" / "assets" / "audio"


# ---------------------------------------------------------------------------
# Core 8-Bit Synthesis & DSP Primitives
# ---------------------------------------------------------------------------
def silence(duration_s: float) -> np.ndarray:
    """Return a buffer of pure digital silence."""
    n_samples = max(1, int(round(duration_s * SAMPLE_RATE)))
    return np.zeros(n_samples, dtype=np.float32)


def quantize_8bit(signal: np.ndarray, levels: int = BIT_CRUSH_LEVELS) -> np.ndarray:
    """Quantize amplitude to discrete retro DAC steps."""
    return np.round(signal * levels) / float(levels)


def downsample_hold(signal: np.ndarray, factor: int = 2) -> np.ndarray:
    """Zero-order hold sample-rate reduction for classic chiptune crunch."""
    if factor <= 1:
        return signal
    reduced = signal[::factor]
    repeated = np.repeat(reduced, factor)
    if len(repeated) < len(signal):
        repeated = np.pad(repeated, (0, len(signal) - len(repeated)), mode="edge")
    return repeated[: len(signal)]


def apply_envelope(
    signal: np.ndarray,
    attack_s: float = 0.004,
    decay_s: float = 0.02,
    sustain_level: float = 0.85,
    release_s: float = 0.015,
    exp_decay: float = 0.0,
) -> np.ndarray:
    """Apply click-free ADSR + optional exponential decay to a mono buffer."""
    n = len(signal)
    if n == 0:
        return signal

    env = np.full(n, sustain_level, dtype=np.float32)
    n_attack = min(n, int(round(attack_s * SAMPLE_RATE)))
    n_decay = min(max(0, n - n_attack), int(round(decay_s * SAMPLE_RATE)))
    n_release = min(max(0, n - n_attack - n_decay), int(round(release_s * SAMPLE_RATE)))

    if n_attack > 0:
        env[:n_attack] = np.linspace(0.0, 1.0, n_attack, dtype=np.float32)
    if n_decay > 0:
        env[n_attack : n_attack + n_decay] = np.linspace(
            1.0, sustain_level, n_decay, dtype=np.float32
        )
    if n_release > 0:
        start_rel = n - n_release
        env[start_rel:] = np.linspace(
            env[start_rel - 1] if start_rel > 0 else sustain_level,
            0.0,
            n_release,
            dtype=np.float32,
        )

    if exp_decay > 0.0:
        t = np.linspace(0.0, 1.0, n, dtype=np.float32)
        env *= np.exp(-exp_decay * t)

    return signal * env


def square_wave(
    freq_start: float,
    freq_end: float,
    duration_s: float,
    duty: float = 0.5,
    vibrato_hz: float = 0.0,
    vibrato_depth_hz: float = 0.0,
    vibrato_square_lfo: bool = True,
    pitch_curve: float = 1.0,
) -> np.ndarray:
    """
    Synthesize an 8-bit pulse/square wave with pitch slide and optional LFO vibrato.
    """
    n_samples = max(1, int(round(duration_s * SAMPLE_RATE)))
    t = np.arange(n_samples, dtype=np.float64) / SAMPLE_RATE
    progress = np.linspace(0.0, 1.0, n_samples, dtype=np.float64) ** pitch_curve

    inst_freq = freq_start + (freq_end - freq_start) * progress

    if vibrato_hz > 0.0 and vibrato_depth_hz > 0.0:
        lfo_phase = 2.0 * np.pi * vibrato_hz * t
        if vibrato_square_lfo:
            lfo = np.where(np.sin(lfo_phase) >= 0.0, 1.0, -1.0)
        else:
            lfo = np.sin(lfo_phase)
        inst_freq = inst_freq + vibrato_depth_hz * lfo

    phase = np.cumsum(inst_freq / SAMPLE_RATE) % 1.0
    wave_out = np.where(phase < duty, 1.0, -1.0).astype(np.float32)
    return quantize_8bit(wave_out)


def triangle_square_hybrid_chirp(
    freq_points: List[float],
    duration_s: float,
    square_mix: float = 0.28,
) -> np.ndarray:
    """
    Synthesize a NES-style quantized triangle wave blended with a thin 25% pulse wave
    across a multi-point pitch contour (ideal for tiny 8-bit rodent squeaks/chirps).
    """
    n_samples = max(1, int(round(duration_s * SAMPLE_RATE)))
    x_knots = np.linspace(0.0, 1.0, len(freq_points))
    x_eval = np.linspace(0.0, 1.0, n_samples)
    inst_freq = np.interp(x_eval, x_knots, freq_points)

    phase = np.cumsum(inst_freq / SAMPLE_RATE) % 1.0

    # 4-bit (16-step) quantized triangle wave like the NES APU triangle channel
    tri = 4.0 * np.abs(phase - 0.5) - 1.0
    tri_quantized = np.round(tri * 8.0) / 8.0

    # Thin 25% pulse harmonic edge
    pulse = np.where(phase < 0.25, 1.0, -1.0)

    mixed = (1.0 - square_mix) * tri_quantized + square_mix * pulse
    return quantize_8bit(mixed.astype(np.float32))


def bandpass_filtered_noise(
    duration_s: float,
    low_hz: float = 3000.0,
    high_hz: float = 4000.0,
    rng: np.random.Generator | None = None,
    hold_factor: int = 3,
) -> np.ndarray:
    """
    Synthesize dry, close-mic 8-bit filtered white noise using an FFT band-pass filter
    between `low_hz` and `high_hz` followed by 8-bit sample-and-hold quantization.
    """
    if rng is None:
        rng = np.random.default_rng(1337)

    n_samples = max(1, int(round(duration_s * SAMPLE_RATE)))
    raw_noise = rng.uniform(-1.0, 1.0, size=n_samples).astype(np.float32)
    crushed_noise = downsample_hold(raw_noise, factor=hold_factor)

    # Apply zero-phase FFT band-pass filter (with smooth cosine taper at band edges)
    spectrum = np.fft.rfft(crushed_noise)
    freqs = np.fft.rfftfreq(n_samples, d=1.0 / SAMPLE_RATE)

    mask = np.zeros_like(freqs, dtype=np.float32)
    in_band = (freqs >= low_hz) & (freqs <= high_hz)
    mask[in_band] = 1.0

    # 250 Hz roll-off skirts around [low_hz, high_hz] so it sounds crisp and dry
    skirt = 250.0
    low_skirt = (freqs >= (low_hz - skirt)) & (freqs < low_hz)
    high_skirt = (freqs > high_hz) & (freqs <= (high_hz + skirt))
    mask[low_skirt] = 0.5 * (
        1.0 - np.cos(np.pi * (freqs[low_skirt] - (low_hz - skirt)) / skirt)
    )
    mask[high_skirt] = 0.5 * (
        1.0 + np.cos(np.pi * (freqs[high_skirt] - high_hz) / skirt)
    )

    filtered = np.fft.irfft(spectrum * mask, n=n_samples).astype(np.float32)
    peak = np.max(np.abs(filtered))
    if peak > 1e-6:
        filtered /= peak

    return quantize_8bit(filtered, levels=32)


def mix_at(target: np.ndarray, clip: np.ndarray, offset_s: float) -> None:
    """Mix `clip` into `target` in-place starting at `offset_s` seconds."""
    start = max(0, int(round(offset_s * SAMPLE_RATE)))
    if start >= len(target):
        return
    end = min(len(target), start + len(clip))
    target[start:end] += clip[: end - start]


# ---------------------------------------------------------------------------
# Sound Recipes
# ---------------------------------------------------------------------------
def synth_rat_steps() -> np.ndarray:
    """
    `rat_steps` (~1.30s):
    Isolated, close-mic-style 8-bit rat footsteps walking/scuttling—synthesized
    using tiny, dry 12ms-15ms bursts of band-pass filtered white noise
    (around 3000Hz–4000Hz) spaced in an organic scurrying rhythm.
    """
    total_duration = 1.30
    out = silence(total_duration)
    rng = np.random.default_rng(42)

    # Organic 3-cluster rat scurry pattern
    step_events: List[Tuple[float, float, float, float, float]] = [
        # (offset_s, duration_s, low_hz, high_hz, rel_gain)
        (0.02, 0.013, 3050.0, 3950.0, 0.72),
        (0.08, 0.012, 3200.0, 4050.0, 0.58),
        (0.14, 0.014, 2950.0, 3850.0, 0.80),
        (0.20, 0.012, 3150.0, 4000.0, 0.64),
        (0.27, 0.015, 3000.0, 3900.0, 0.70),
        # Brief hesitation, then Cluster 2
        (0.45, 0.013, 3100.0, 4000.0, 0.78),
        (0.51, 0.012, 3250.0, 4100.0, 0.62),
        (0.58, 0.014, 3000.0, 3900.0, 0.85),
        (0.65, 0.013, 3150.0, 4020.0, 0.66),
        # Brief pause, then Cluster 3 (faster scurry away)
        (0.82, 0.012, 3100.0, 4000.0, 0.88),
        (0.87, 0.013, 3250.0, 4100.0, 0.70),
        (0.93, 0.014, 3000.0, 3900.0, 0.92),
        (0.98, 0.012, 3200.0, 4050.0, 0.74),
        (1.04, 0.013, 3050.0, 3950.0, 0.65),
        (1.11, 0.015, 2950.0, 3850.0, 0.52),
    ]

    for offset_s, dur_s, low_hz, high_hz, rel_gain in step_events:
        burst = bandpass_filtered_noise(
            duration_s=dur_s,
            low_hz=low_hz,
            high_hz=high_hz,
            rng=rng,
            hold_factor=2,
        )
        burst = apply_envelope(
            burst,
            attack_s=0.001,
            decay_s=0.004,
            sustain_level=0.65,
            release_s=0.004,
            exp_decay=3.5,
        )
        mix_at(out, burst * rel_gain * (MASTER_QUIET_GAIN * 1.15), offset_s)

    return quantize_8bit(out)


def _single_rat_chirp(
    freq_contour: List[float], duration_s: float, rel_gain: float = 1.0
) -> np.ndarray:
    """Create a single ultra-short (50ms-80ms) high-pitched 8-bit rat squeak chirp."""
    chirp = triangle_square_hybrid_chirp(
        freq_points=freq_contour,
        duration_s=duration_s,
        square_mix=0.25,
    )
    chirp = apply_envelope(
        chirp,
        attack_s=0.003,
        decay_s=0.015,
        sustain_level=0.75,
        release_s=0.012,
        exp_decay=2.2,
    )
    return quantize_8bit(chirp * rel_gain * (MASTER_QUIET_GAIN * 0.72))


def synth_rat_squeaks() -> np.ndarray:
    """
    `rat_squeaks` (~0.75s):
    3 ultra-short (55ms–72ms), quiet high-pitched triangle/square wave chirps
    rapidly sliding between 2800Hz and 4200Hz so it sounds like a rat squeaking.
    """
    total_duration = 0.75
    out = silence(total_duration)

    c1 = _single_rat_chirp([2850.0, 4100.0, 3350.0], duration_s=0.055, rel_gain=0.85)
    c2 = _single_rat_chirp(
        [3000.0, 4200.0, 3600.0, 2900.0], duration_s=0.065, rel_gain=1.00
    )
    c3 = _single_rat_chirp([3100.0, 3950.0, 2800.0], duration_s=0.072, rel_gain=0.75)

    mix_at(out, c1, 0.04)
    mix_at(out, c2, 0.24)
    mix_at(out, c3, 0.52)

    return quantize_8bit(out)


# ---------------------------------------------------------------------------
# Encoding Helpers (.mp3)
# ---------------------------------------------------------------------------
def float_to_pcm16(signal: np.ndarray) -> bytes:
    """Convert float32 signal in [-1.0, 1.0] to 16-bit signed little-endian PCM bytes."""
    clipped = np.clip(signal, -1.0, 1.0)
    pcm16 = (clipped * 32767.0).astype("<i2")
    return pcm16.tobytes()


def save_mp3(path: Path, signal: np.ndarray, bitrate: int = 128) -> None:
    """Encode mono 16-bit PCM signal directly to MP3 using lameenc."""
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm_bytes = float_to_pcm16(signal)
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(bitrate)
    encoder.set_in_sample_rate(SAMPLE_RATE)
    encoder.set_channels(1)
    encoder.set_quality(2)  # 2 = high quality
    mp3_data = encoder.encode(pcm_bytes) + encoder.flush()
    path.write_bytes(bytes(mp3_data))


# ---------------------------------------------------------------------------
# Registry of Standalone Sounds (Add future 8-bit sounds here!)
# ---------------------------------------------------------------------------
SOUND_REGISTRY: Dict[str, Callable[[], np.ndarray]] = {
    "rat_steps": synth_rat_steps,
    "rat_squeaks": synth_rat_squeaks,
}


def main() -> None:
    AUDIO_OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[generate-8bit-sfx] Generating 8-bit MP3 assets into: {AUDIO_OUT_DIR}")

    for name, synth_fn in SOUND_REGISTRY.items():
        signal = synth_fn()
        duration_s = len(signal) / SAMPLE_RATE
        mp3_file = AUDIO_OUT_DIR / f"{name}.mp3"
        save_mp3(mp3_file, signal)
        print(
            f"  + {name:16s} ({duration_s:4.2f}s) -> {mp3_file.name} ({mp3_file.stat().st_size} B)"
        )

    print("[generate-8bit-sfx] Done!")


if __name__ == "__main__":
    main()
