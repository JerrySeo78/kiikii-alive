"""
KiiKii Island Floor & Wall Tile Generator
Generates 4 indoor floor tiles + 2 wall tiles via Gemini 2.5 Flash Image API.
"""

import time
import sys
from io import BytesIO
from pathlib import Path
from PIL import Image
import google.genai as genai
from google.genai import types

# ── Paths ──────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(r"F:\Personal_project\kiikii_service")
OUTPUT_DIR   = PROJECT_ROOT / "assets" / "island"
REF_DIR      = Path(r"F:\Personal_project\brown_farm_ground_edit\resource\brownfarm")

REF_GROUND = REF_DIR / "ground_green.png"
REF_DECO   = REF_DIR / "deco_01.png"

# ── API Keys ───────────────────────────────────────────────────────────────
API_KEYS = [
    "AIzaSyBzX62RAm0M9tV9xCOFFNEssewavdzUejI",
    "AIzaSyDcFjSeMx7oVfbH6dV-8Im-MpA4UrNWvP8",
    "AIzaSyDYEuJ04Y0TTiTnMWhywnED18d1ncvui68",
    "AIzaSyDpUpyTCj2Cm0mkFmJoj30JtR-0u6HkHgA",
    "AIzaSyDzvOSlw1V2D8v5FYy7PoZadf-ovoEaBcs",
]
_key_index = 0

MODEL_ID = "gemini-2.5-flash-image"

# ── Items ──────────────────────────────────────────────────────────────────
ITEMS = [
    {
        "filename": "tile_wood.png",
        "prompt": (
            "Isometric floor tile in cute kawaii room style. "
            "Light oak wood plank floor, warm honey-brown color, clear wood grain lines running diagonally. "
            "Same isometric diamond top-down perspective as the reference tile image. "
            "Diamond shape only — no walls, no side faces, no vertical surfaces. "
            "Soft shading, clean edges. "
            "SOLID MAGENTA (#FF00FF) background."
        ),
    },
    {
        "filename": "tile_marble.png",
        "prompt": (
            "Isometric floor tile in cute kawaii room style. "
            "White marble floor with subtle light-grey veining swirls, glossy surface. "
            "Same isometric diamond top-down perspective as the reference tile image. "
            "Diamond shape only — no walls, no side faces, no vertical surfaces. "
            "Soft shading, clean edges. "
            "SOLID MAGENTA (#FF00FF) background."
        ),
    },
    {
        "filename": "tile_carpet_pink.png",
        "prompt": (
            "Isometric floor tile in cute kawaii room style. "
            "Soft pastel pink carpet floor tile, fluffy texture with a subtle small dot or star pattern. "
            "Same isometric diamond top-down perspective as the reference tile image. "
            "Diamond shape only — no walls, no side faces, no vertical surfaces. "
            "Soft shading, clean edges. "
            "SOLID MAGENTA (#FF00FF) background."
        ),
    },
    {
        "filename": "tile_dark_wood.png",
        "prompt": (
            "Isometric floor tile in cute kawaii room style. "
            "Dark walnut wood plank floor, deep warm brown color, distinct wood grain lines. "
            "Same isometric diamond top-down perspective as the reference tile image. "
            "Diamond shape only — no walls, no side faces, no vertical surfaces. "
            "Soft shading, clean edges. "
            "SOLID MAGENTA (#FF00FF) background."
        ),
    },
    {
        "filename": "tile_wall_left.png",
        "prompt": (
            "Isometric wall tile for a cute kawaii indoor room. "
            "The tile shows: a floor diamond at the bottom AND a tall left-facing wall face rising upward from the back-left edge. "
            "Left wall face: light cream/white wallpaper with a tiny pastel flower pattern, visible from the front-left. "
            "The diamond floor portion at the bottom is a plain light wood or tile floor. "
            "Same isometric perspective as the reference tile. The overall shape is taller than a floor tile. "
            "No right wall face visible. Clean cute kawaii style. "
            "SOLID MAGENTA (#FF00FF) background."
        ),
    },
    {
        "filename": "tile_wall_right.png",
        "prompt": (
            "Isometric wall tile for a cute kawaii indoor room. "
            "The tile shows: a floor diamond at the bottom AND a tall right-facing wall face rising upward from the back-right edge. "
            "Right wall face: light cream/white wallpaper with a tiny pastel flower pattern, visible from the front-right. "
            "The diamond floor portion at the bottom is a plain light wood or tile floor. "
            "Same isometric perspective as the reference tile. The overall shape is taller than a floor tile. "
            "No left wall face visible. Clean cute kawaii style. "
            "SOLID MAGENTA (#FF00FF) background."
        ),
    },
]


# ── Flood-fill background removal ─────────────────────────────────────────

def _is_magenta(r: int, g: int, b: int) -> bool:
    return r > 140 and g < 150 and b > 100


def remove_magenta(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    visited = bytearray(w * h)
    stack = []
    for sx, sy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        r, g, b, a = pixels[sx, sy]
        if _is_magenta(r, g, b):
            stack.append((sx, sy))
    while stack:
        x, y = stack.pop()
        idx = y * w + x
        if visited[idx]:
            continue
        visited[idx] = 1
        r, g, b, a = pixels[x, y]
        if not _is_magenta(r, g, b):
            continue
        pixels[x, y] = (r, g, b, 0)
        for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny*w+nx]:
                stack.append((nx, ny))
    return img


REF_TILE_PATH = REF_DIR / "ground_green.png"


def normalize_floor_tile(img: Image.Image) -> Image.Image:
    """Resize to reference tile dimensions + apply reference alpha mask so all floor tiles tessellate."""
    import numpy as np
    ref = Image.open(REF_TILE_PATH).convert("RGBA")
    ref_arr = np.array(ref)
    ref_alpha = ref_arr[:, :, 3]
    gem = img.convert("RGBA").resize(ref.size, Image.LANCZOS)
    gem_arr = np.array(gem)
    gem_arr[:, :, 3] = ref_alpha
    return Image.fromarray(gem_arr.astype(np.uint8))


def autocrop(img: Image.Image, pad: int = 2) -> Image.Image:
    """Trim transparent padding, keep only bounding box of opaque content."""
    import numpy as np
    arr = np.array(img)
    mask = arr[:, :, 3] > 0
    if not mask.any():
        return img
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    rmin = max(0, rmin - pad); rmax = min(arr.shape[0] - 1, rmax + pad)
    cmin = max(0, cmin - pad); cmax = min(arr.shape[1] - 1, cmax + pad)
    return img.crop((cmin, rmin, cmax + 1, rmax + 1))


# ── Key rotation ───────────────────────────────────────────────────────────

def get_client():
    key = API_KEYS[_key_index % len(API_KEYS)]
    return genai.Client(api_key=key)


def rotate_key(reason: str):
    global _key_index
    old = _key_index % len(API_KEYS)
    _key_index += 1
    new = _key_index % len(API_KEYS)
    print(f"  [KEY ROTATE] {reason[:80]} slot {old} -> {new}")


# ── Generation ─────────────────────────────────────────────────────────────

def generate_tile(item: dict, ref1: Image.Image, ref2: Image.Image) -> bool:
    out_path = OUTPUT_DIR / item["filename"]
    contents = [ref1, ref2, item["prompt"]]
    config = types.GenerateContentConfig(
        responseModalities=["IMAGE"],
        candidateCount=1,
        imageConfig=types.ImageConfig(aspectRatio="1:1", imageSize="1K"),
    )
    MAX_RETRIES = 3
    for attempt in range(MAX_RETRIES):
        try:
            client = get_client()
            response = client.models.generate_content(
                model=MODEL_ID, contents=contents, config=config
            )
            # Extract image bytes
            for part in response.candidates[0].content.parts:
                if hasattr(part, "inline_data") and part.inline_data and part.inline_data.data:
                    raw = Image.open(BytesIO(part.inline_data.data))
                    processed = remove_magenta(raw)
                    # Floor tiles get normalized to reference dimensions for correct tessellation
                    # Wall tiles keep their natural proportions (they're taller by design)
                    if "wall_" not in item["filename"]:
                        processed = normalize_floor_tile(processed)
                    else:
                        processed = autocrop(processed)
                    processed.save(out_path, "PNG")
                    print(f"  [OK] {item['filename']}")
                    return True
            print(f"  [FAIL] {item['filename']} - no image in response")
            return False
        except Exception as e:
            err = str(e).lower()
            if any(k in err for k in ("429", "resource_exhausted", "quota", "rate")):
                rotate_key(str(e))
                wait = 5 * (2 ** attempt)
                print(f"  Rate limit - waiting {wait}s...")
                time.sleep(wait)
            elif attempt < MAX_RETRIES - 1:
                wait = 2 * (2 ** attempt)
                print(f"  [RETRY {attempt+1}] {str(e)[:100]} - retrying in {wait}s")
                time.sleep(wait)
            else:
                print(f"  [FAIL] {item['filename']} - {str(e)[:150]}")
                return False
    return False


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print("Loading reference images...")
    ref1 = Image.open(REF_GROUND).convert("RGBA")
    ref2 = Image.open(REF_DECO).convert("RGBA")
    print(f"  Model: {MODEL_ID}")
    print(f"  Output: {OUTPUT_DIR}\n")

    items = ITEMS
    if len(sys.argv) > 1:
        targets = set(sys.argv[1:])
        items = [it for it in ITEMS if it["filename"] in targets]
        print(f"Regenerating only: {targets}\n")

    ok, fail = [], []
    for i, item in enumerate(items, 1):
        print(f"[{i}/{len(items)}] {item['filename']}...")
        if generate_tile(item, ref1, ref2):
            ok.append(item["filename"])
        else:
            fail.append(item["filename"])
        if i < len(items):
            print("  Sleeping 3s...")
            time.sleep(3)

    print(f"\nDone - {len(ok)}/{len(items)} generated")
    if fail:
        print(f"  Failed: {', '.join(fail)}")


if __name__ == "__main__":
    main()
