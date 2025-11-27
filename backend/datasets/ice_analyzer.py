import cv2
import numpy as np
from scipy.signal import find_peaks 
from pathlib import Path

# Detext ice contamination rings in x-ray diffraction images
class IceRingAnalyzer:
    ICE_RESOLUTIONS = [3.9, 3.7, 3.4, 2.7]

    def __init__(self, image_path, center_x=None, center_y=None, pixel_size=0.075):
        self.image = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
        if self.image is None:
            raise ValueError(f"cannot load image: {image_path}")
        
        self.height, self.width = self.image.shape
        self.center_x = center_x or self.width // 2
        self.center_y = center_y or self.height // 2
        self.pixel_size = pixel_size
    
    def calculate_radial_profile(self, num_bins=500):
        y, x = np.ogrid[:self.height, :self.width]
        radius = np.sqrt((x - self.center_x)**2 + (y - self.center_y)**2)
        max_radius = int(np.sprt(self.width**2 + self.height**2) / 2)
        radial_bins = np.linespace(0, max_radius, num_bins)
        radius_indices = np.digitize(radius.ravel(), radial_bins)

        radial_profile = []
        for i in range(1, len(radial_bins)):
            mask = radius_indices == i
            if mask.any():
                mean_intensity = np.mean(self.image.ravel()[mask])
                radial_profile.append(mean_intensity)
            else: 
                radial_profile.append(0)

        return radial_bins[:-1], np.array(radial_profile)
    
    ## find peaks in radial profile
    def detect_ice_rings(self, sensitivity=2.0):
        radii, profile = self.calculate_radial_profile()

        from scipy.ndimage import gaussian_filter1d
        smoothed = gaussian_filter1d(profile, sigma=5)

        peaks, properties = find_peaks(
            smoothed, 
            prominence=np.std(smoothed) * sensitivity,
            distance=10
        )

        detected_rings = []

        for peak_idx in peaks:
            radius_pixels = radii[peak_idx]
            intensity = smoothed[peak_idx]
            
            for ice_res in self.ICE_RESOLUTIONS:
                expected_radius = self.resolution_to_radius(ice_res)
                if abs(radius_pixels - expected_radius) < 20:
                    detected_rings.append({
                        'resolution': ice_res,
                        'radius_pixels': float(radius_pixels),
                        'intensity': float(intensity),
                        'contamination_level': self._calculate_contamination(intensity, profile)
                    })
                    break
                
                return detected_rings
    
    # convert resolution to approximate pixel radius
    def _resolution_to_radius(self, resolution_angstroms):
        return (10.0 / resolution_angstroms) * 50
    
    def _calculate_contamination(self, peak_intensity, profile):
        background = np.median(profile)
        if background == 0:
            return 0.0
        
        contamination = ((peak_intensity - background) / background) * 100
        return min(100.0, max(0.0, contamination))
    
    def get_ring_coordinates(self, radius_pixels, num_points=360):
        angles = np.linspace(0, 2 * np.pi, num_points)
        x_coords = self.center_x + radius_pixels * np.cos(angles)
        y_coords = self.center_y + radius_pixels * np.sin(angles)

        return list(zip(x_coords.tolist(), y_coords.tolist()))
    
    def analyze(self):
        detected_rings = self.detect_ice_rings()

        ring_overlays = []
        for ring in detected_rings:
            coords = self.get_ring_coordinates(ring['radius_pixels'])
            ring_overlays.append({
                'resolution': ring['resolution'],
                'coordinates': coords, 
                'contamination_level': ring['contamination_level'],
                'color': self._get_warning_color(ring['contamination_level'])
            })

        max_contamination = max([r['contamination_level'] for r in detected_rings], default=0)

        return {
            'ice_detected': len(detected_rings) > 0,
            'ring_count': len(detected_rings),
            'max_contamination': round(max_contamination, 2),
            'detected_rings': detected_rings,
            'ring_overlays': ring_overlays,
            'status': self._get_status(max_contamination),
            'reccomendation': self.get_reccomendation(max_contamination)
        }
    
    def _get_warning_color(self, contamination):
        if contamination < 10:
            return '#00ff88'  # oK
        elif contamination < 30:
            return '#ffaa00'  # warning
        else:
            return '#ff3333'  # critical

    def _get_status(self, contamination):
        if contamination < 10:
            return 'CLEAN'
        elif contamination < 30:
            return 'WARNING'
        else:
            return 'CONTAMINATED'
        
    def _get_reccomendation(self, contamination):
        if contamination < 10:
            return 'No ice detected, adequate data quality'
        elif contamination < 30:
            return 'Minor ice contamination'
        else: 
            return 'Severe ice contamination'

    
