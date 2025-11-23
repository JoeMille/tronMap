#!/usr/bin/env python3
import numpy as np
import imageio.v3 as iio
from pathlib import Path
import json
import time

OUTPUT_DIR = Path("../apps/web/public/data/lysozyme_good")   
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TOTAL_FRAMES = 360           
IMAGE_SIZE = 2048            
CENTER_X, CENTER_Y = IMAGE_SIZE // 2, IMAGE_SIZE // 2

# lysozyme target values 
GOOD_METRICS = {
    "resolution": 1.54,
    "completeness": 99.8,
    "i_over_sigma": 28.4,
    "r_merge": 0.078,
    "cc_half": 0.994,
    "mosaicity": 0.28,
    "unit_cell_a": 79.1,
    "unit_cell_b": 79.1,
    "unit_cell_c": 38.4,
    "space_group": "P 4₃ 2₁ 2"
}


def generate_frame(frame_idx: int) -> np.ndarray:
    img = np.random.normal(30, 12, (IMAGE_SIZE, IMAGE_SIZE)).astype(np.uint16)

    # ---- 5000–8000 Bragg spots ----
    num_spots = np.random.randint(5000, 8000)
    for _ in range(num_spots):
        radius = np.random.uniform(30, 950)                     
        angle = np.random.uniform(0, 2*np.pi)

        rotation = np.deg2rad(frame_idx * 0.5)  
        x = CENTER_X + radius * np.cos(angle + rotation)
        y = CENTER_Y + radius * np.sin(angle + rotation)

        x, y = int(x), int(y)
        if 0 <= x < IMAGE_SIZE and 0 <= y < IMAGE_SIZE:
            intensity = np.random.lognormal(9.5, 0.9)   
            sz = 5
            yy, xx = np.ogrid[-sz:sz+1, -sz:sz+1]
            spot = np.exp(-(xx**2 + yy**2)/(2*3**2)) * intensity
            img[y-sz:y+sz+1, x-sz:x+sz+1] += spot.astype(np.uint16)

    rr, cc = np.ogrid[:IMAGE_SIZE, :IMAGE_SIZE]
    beamstop = (rr - CENTER_Y)**2 + (cc - CENTER_X)**2 <= 40**2
    img[beamstop] = 0

    img[-100:, :] //= 4

    img = np.clip(img, 0, 65535).astype(np.uint16)
    return img

# ------------------------------------------------------------------
# Main loop 
# ------------------------------------------------------------------

print(f"Generating {TOTAL_FRAMES} frames → {OUTPUT_DIR}")

for frame in range(1, TOTAL_FRAMES + 1):
    img = generate_frame(frame)
    iio.imwrite(OUTPUT_DIR / f"frame_{frame:04d}.png", img)

    progress = frame / TOTAL_FRAMES

    metrics = {
        "current_frame": frame,
        "total_frames": TOTAL_FRAMES,
        "status": "collecting" if frame < 50 else "indexing" if frame < 120 else "integrating",
        "resolution": max(1.54, 9.0 - 7.5 * progress),
        "completeness": min(99.9, 100 * progress),
        "i_over_sigma": min(45.0, 1.5 + 43.5 * progress),
        "r_merge": max(0.078, 0.95 - 0.87 * progress),
        "cc_half": min(0.999, 0.45 + 0.549 * progress),
        "mosaicity": max(0.28, 1.9 - 1.62 * progress),
        "unit_cell_a": 79.1, "unit_cell_b": 79.1, "unit_cell_c": 38.4,
        "unit_cell_alpha": 90.0, "unit_cell_beta": 90.0, "unit_cell_gamma": 90.0,
        "space_group": "Indexing..." if frame < 120 else GOOD_METRICS["space_group"]
    }

    if frame == TOTAL_FRAMES:
        metrics["status"] = "success"
        metrics.update(GOOD_METRICS)

    with open(OUTPUT_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    if frame % 50 == 0 or frame == TOTAL_FRAMES:
        print(f"   → frame {frame}/{TOTAL_FRAMES}  |  resolution {metrics['resolution']:.2f} Å  |  I/σ {metrics['i_over_sigma']:.1f}")

print("sim image gen complete!")
print(f"   Images → {OUTPUT_DIR}/frame_XXXX.png")
print(f"   Live metrics → {OUTPUT_DIR}/metrics.json")