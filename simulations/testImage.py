import numpy as np
import imageio.v3 as iio
from pathlib import Path
import json
import time

OUTPUT_DIR = Path("../backend/static/data/lysozyme_good")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TOTAL_FRAMES = 360

def generate_frame(frame_num, total_frames):
    width, height = 2048, 2048
    img = np.zeros((height, width), dtype=np.uint8)
    
    center_x, center_y = width // 2, height // 2
    angle = (frame_num / total_frames) * 2 * np.pi
    
    num_spots = 150
    for i in range(num_spots):
        spot_angle = (i / num_spots) * 2 * np.pi + angle
        distance = np.random.uniform(200, 900)
        
        x = int(center_x + distance * np.cos(spot_angle))
        y = int(center_y + distance * np.sin(spot_angle))
        
        if 0 <= x < width and 0 <= y < height:
            intensity = int(np.random.uniform(150, 255))
            spot_size = np.random.randint(3, 8)
            
            y_min = max(0, y - spot_size)
            y_max = min(height, y + spot_size)
            x_min = max(0, x - spot_size)
            x_max = min(width, x + spot_size)
            
            img[y_min:y_max, x_min:x_max] = intensity
    
    noise = np.random.randint(0, 30, (height, width), dtype=np.uint8)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    return img

def calculate_shell_statistics(frame_num, total_frames):
    progress = frame_num / total_frames
    
    shells = []
    for angstrom in [8.0, 4.0, 2.0, 1.6, 1.5]:
        base_iosig = 25 - (angstrom * 2)
        variation = np.sin(progress * np.pi) * 5
        noise = np.random.uniform(-2, 2)
        iosig = max(0.5, base_iosig + variation + noise)
        
        completeness = min(100, 85 + (progress * 15) + np.random.uniform(-5, 5))
        
        shells.append({
            "resolution": angstrom,
            "i_over_sigma": round(iosig, 2),
            "completeness": round(completeness, 1),
            "n_reflections": int(1000 / angstrom)
        })
    
    return shells

print("Generating diffraction frames...")
start_time = time.time()

frame_metrics = []

for i in range(1, TOTAL_FRAMES + 1):
    img = generate_frame(i, TOTAL_FRAMES)
    
    output_path = OUTPUT_DIR / f"frame_{i:04d}.png"
    iio.imwrite(output_path, img)
    
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
        print(f"Generated frame {i}/{TOTAL_FRAMES}")

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
print(f"\nGeneration complete!")
print(f"Total time: {elapsed_time:.2f} seconds")
print(f"Frames: {TOTAL_FRAMES}")
print(f"Output: {OUTPUT_DIR}")