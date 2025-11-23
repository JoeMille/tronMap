import numpy as np
import imageio.v3 as iio
from pathlib import Path
import json
import time

OUTPUT_DIR = Path("../backend/static/data/lysozyme_good")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TOTAL_FRAMES = 360
IMAGE_SIZE = 2048
CENTER = IMAGE_SIZE // 2

def add_sharp_spot(img, x, y, intensity, resolution):
    x, y = int(x), int(y)
    if not (0 <= x < IMAGE_SIZE and 0 <= y < IMAGE_SIZE):
        return
    
    spot_radius = max(3, int(10 / resolution))
    
    for dy in range(-spot_radius, spot_radius + 1):
        for dx in range(-spot_radius, spot_radius + 1):
            px, py = x + dx, y + dy
            if 0 <= px < IMAGE_SIZE and 0 <= py < IMAGE_SIZE:
                dist = np.sqrt(dx*dx + dy*dy)
                if dist <= spot_radius:
                    gaussian = np.exp(-(dist * dist) / (2 * (spot_radius/2.5)**2))
                    spot_intensity = intensity * gaussian
                    img[py, px] = max(img[py, px], spot_intensity)

def generate_realistic_frame(frame_num, total_frames):
    img = np.zeros((IMAGE_SIZE, IMAGE_SIZE), dtype=np.float32)
    
    angle = (frame_num / total_frames) * 2 * np.pi
    
    resolution_shells = [
        (8.0, 120, 255, 450),
        (4.0, 220, 240, 400),
        (2.5, 360, 220, 350),
        (2.0, 520, 180, 300),
        (1.7, 680, 140, 250),
        (1.5, 820, 100, 200),
    ]
    
    for resolution, base_radius, max_intensity, spots_per_shell in resolution_shells:
        for i in range(spots_per_shell):
            lattice_angle = (i / spots_per_shell) * 2 * np.pi
            spot_angle = lattice_angle + angle
            
            radius_jitter = np.random.normal(0, 10)
            radius = base_radius + radius_jitter
            
            angular_jitter = np.random.normal(0, 0.03)
            final_angle = spot_angle + angular_jitter
            
            x = CENTER + radius * np.cos(final_angle)
            y = CENTER + radius * np.sin(final_angle)
            
            intensity_var = np.random.lognormal(0, 0.35)
            intensity = max_intensity * intensity_var
            
            if 60 < x < IMAGE_SIZE - 60 and 60 < y < IMAGE_SIZE - 60:
                add_sharp_spot(img, x, y, intensity, resolution)
    
    ice_rings = [(3.9, 560), (3.7, 590), (3.4, 630)]
    for ice_res, ice_radius in ice_rings:
        if np.random.random() < 0.2:
            num_ice = np.random.randint(50, 80)
            for _ in range(num_ice):
                ice_angle = np.random.uniform(0, 2 * np.pi)
                x = CENTER + ice_radius * np.cos(ice_angle)
                y = CENTER + ice_radius * np.sin(ice_angle)
                intensity = np.random.uniform(120, 220)
                add_sharp_spot(img, x, y, intensity, ice_res)
    
    img = np.clip(img, 0, 255).astype(np.uint8)
    
    return img

def calculate_shell_statistics(frame_num, total_frames):
    progress = frame_num / total_frames
    
    shells = []
    resolutions = [8.0, 4.0, 2.5, 2.0, 1.7, 1.5]
    
    for idx, angstrom in enumerate(resolutions):
        base_iosig = 35 - (idx * 5)
        variation = np.sin(progress * 2 * np.pi) * 8
        noise = np.random.uniform(-3, 3)
        iosig = max(0.5, base_iosig + variation + noise)
        
        completeness = min(100, 75 + (progress * 20) + np.random.uniform(-8, 8))
        
        shells.append({
            "resolution": angstrom,
            "i_over_sigma": round(iosig, 2),
            "completeness": round(completeness, 1),
            "n_reflections": int(1200 / angstrom)
        })
    
    return shells

print("Generating high-contrast diffraction frames...")
start_time = time.time()

frame_metrics = []

for i in range(1, TOTAL_FRAMES + 1):
    img = generate_realistic_frame(i, TOTAL_FRAMES)
    
    output_path = OUTPUT_DIR / f"frame_{i:04d}.png"
    iio.imwrite(output_path, img, compress_level=1)
    
    shells = calculate_shell_statistics(i, TOTAL_FRAMES)
    
    overall_iosig = np.mean([s["i_over_sigma"] for s in shells])
    overall_completeness = np.mean([s["completeness"] for s in shells])
    
    frame_metrics.append({
        "frame": i,
        "resolution_shells": shells,
        "overall_i_over_sigma": round(overall_iosig, 2),
        "overall_completeness": round(overall_completeness, 1)
    })
    
    if i % 50 == 0:
        print(f"Frame {i}/{TOTAL_FRAMES} ({(i/TOTAL_FRAMES)*100:.1f}%)")

metrics_data = {
    "dataset": "lysozyme_good",
    "total_frames": TOTAL_FRAMES,
    "frames": frame_metrics,
    "overall_statistics": {
        "resolution": 1.5,
        "space_group": "P43212",
        "unit_cell": "a=78.9 b=78.9 c=38.8",
        "completeness": 99.2,
        "i_over_sigma": 18.5,
        "r_merge": 0.082,
        "cc_half": 0.998,
        "mosaicity": 0.12
    }
}

metrics_path = OUTPUT_DIR / "metrics.json"
with open(metrics_path, "w") as f:
    json.dump(metrics_data, f, indent=2)

elapsed_time = time.time() - start_time
print(f"\nComplete! {elapsed_time:.2f}s | {TOTAL_FRAMES} frames | {elapsed_time/TOTAL_FRAMES:.2f}s/frame")
print(f"Output: {OUTPUT_DIR}")