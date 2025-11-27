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
        
        self.height, self.width = self.ima