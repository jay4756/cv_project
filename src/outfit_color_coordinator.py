from __future__ import annotations

from typing import Dict, List, Tuple

import cv2
import numpy as np
from PIL import Image


def load_image(file_bytes: bytes) -> np.ndarray:
    """Load uploaded image bytes as an RGB array."""
    pil_image = Image.open(__import__('io').BytesIO(file_bytes)).convert("RGB")
    return np.array(pil_image)


def crop_focus_region(image: np.ndarray) -> np.ndarray:
    """Focus on the central garment area and ignore the background scene."""
    height, width = image.shape[:2]
    start_x = int(width * 0.25)
    end_x = int(width * 0.75)
    start_y = int(height * 0.18)
    end_y = int(height * 0.88)
    return image[start_y:end_y, start_x:end_x]


def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def hue_name(hue: float) -> str:
    if hue < 15 or hue >= 345:
        return "Red"
    if 15 <= hue < 45:
        return "Orange"
    if 45 <= hue < 75:
        return "Yellow"
    if 75 <= hue < 160:
        return "Green"
    if 160 <= hue < 190:
        return "Teal"
    if 190 <= hue < 260:
        return "Blue"
    if 260 <= hue < 290:
        return "Purple"
    if 290 <= hue < 345:
        return "Pink"
    return "Neutral"


def normalize_color(rgb: np.ndarray) -> np.ndarray:
    rgb = rgb.astype(np.float32)
    max_channel = rgb.max()
    if max_channel == 0:
        return rgb
    rgb = rgb / max_channel
    return rgb


def dominant_colors(image: np.ndarray, colors_to_show: int = 5) -> List[Tuple[int, int, int]]:
    """Extract prominent colors from the garment-focused region using quantization."""
    crop = crop_focus_region(image)
    rgb_pixels = crop.reshape(-1, 3).astype(np.int32)
    saturation = cv2.cvtColor(crop, cv2.COLOR_RGB2HSV)[:, :, 1].reshape(-1)
    colored_pixels = saturation > 35
    if np.count_nonzero(colored_pixels) >= rgb_pixels.shape[0] * 0.12:
        rgb_pixels = rgb_pixels[colored_pixels]

    if rgb_pixels.size == 0:
        return [(180, 180, 180)]

    quantized = np.floor(rgb_pixels / 32.0) * 32
    unique_colors, counts = np.unique(quantized, axis=0, return_counts=True)
    ranked = unique_colors[np.argsort(counts)[::-1][:colors_to_show]]
    return [tuple(int(v) for v in color) for color in ranked]


def complementary_color(color: Tuple[int, int, int]) -> Tuple[int, int, int]:
    r, g, b = color
    rgb = np.array([r, g, b], dtype=np.int32)
    complementary = 255 - rgb
    return tuple(int(v) for v in complementary)


def create_palette(primary: Tuple[int, int, int], accent: Tuple[int, int, int]) -> List[Tuple[int, int, int]]:
    return [primary, accent, (245, 240, 235), (40, 40, 40)]


def recommend_outfit(primary_color: Tuple[int, int, int]) -> Dict[str, List[str]]:
    hsv = cv2.cvtColor(np.uint8([[list(primary_color)]]), cv2.COLOR_RGB2HSV)[0, 0]
    hue = float(hsv[0]) * 2
    base_name = "Neutral" if hsv[1] <= 35 else hue_name(hue)

    suggestions = {
        "primary": [base_name],
        "complements": [],
        "styling": [],
    }

    if base_name in {"Red", "Orange", "Yellow"}:
        suggestions["complements"] = ["Soft navy", "Stone beige", "Cream white"]
        suggestions["styling"] = ["Pair with denim or taupe accessories", "Use ivory layers for balance"]
    elif base_name in {"Green", "Teal"}:
        suggestions["complements"] = ["Warm cream", "Rust brown", "Off-white"]
        suggestions["styling"] = ["Add gold accents for a polished look", "Blend with neutral bottoms"]
    elif base_name in {"Blue", "Purple"}:
        suggestions["complements"] = ["Blush pink", "Sand beige", "Silver gray"]
        suggestions["styling"] = ["Use a soft neutral jacket", "Add metallic details for contrast"]
    else:
        suggestions["complements"] = ["Deep plum", "Forest green", "Dusty blue"]
        suggestions["styling"] = ["Layer with structured outerwear", "Add one statement accessory to lift the outfit"]

    return suggestions


def analyze_outfit(file_bytes: bytes) -> Dict[str, object]:
    image = load_image(file_bytes)
    dominant = dominant_colors(image)
    primary = dominant[0]
    accent = complementary_color(primary)
    palette = create_palette(primary, accent)

    palette_hex = [rgb_to_hex(color) for color in palette]
    recommendations = recommend_outfit(primary)

    return {
        "dominant_colors": [rgb_to_hex(color) for color in dominant],
        "primary_color": rgb_to_hex(primary),
        "accent_color": rgb_to_hex(accent),
        "palette": palette_hex,
        "recommendations": recommendations,
    }
