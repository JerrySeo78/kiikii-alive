"""
KiiKii Island Deco Asset Generator
Generates 9 isometric furniture PNG assets using Gemini 2.5 Flash Image API.
Kim (character/background artist) - A.I.D Games

Follows gemini_image_workflow.md rules:
  - Images MUST come before text in contents
  - response_modalities=["IMAGE"] required
  - Multi-layer response validation
  - Exponential backoff retry (3 attempts)
  - Key rotation on 429 / RESOURCE_EXHAUSTED
"""

import time
import shutil
from pathlib import Path
from PIL import Image
import google.genai as genai
from google.genai import types

# ── Paths ──────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(r"F:\Personal_project\kiikii_service")
OUTPUT_DIR   = PROJECT_ROOT / "assets" / "island"
REF_DIR      = Path(r"F:\Personal_project\brown_farm_ground_edit\resource\brownfarm")

REF_GROUND   = REF_DIR / "ground_green.png"
REF_DECO     = REF_DIR / "deco_01.png"

# Ground tiles to copy at the end
TILE_COPIES = [
    (REF_DIR / "ground_green.png", "tile_green.png"),
    (REF_DIR / "ground_pink.png",  "tile_pink.png"),
    (REF_DIR / "ground_white.png", "tile_white.png"),
    (REF_DIR / "map_tile.png",     "tile_base.png"),
]

# ── API Keys (rotation pool) ───────────────────────────────────────────────
API_KEYS = [
    "AIzaSyBzX62RAm0M9tV9xCOFFNEssewavdzUejI",   # KEY 1
    "AIzaSyDcFjSeMx7oVfbH6dV-8Im-MpA4UrNWvP8",   # KEY 2
    "AIzaSyDYEuJ04Y0TTiTnMWhywnED18d1ncvui68",    # KEY 3
    "AIzaSyDpUpyTCj2Cm0mkFmJoj30JtR-0u6HkHgA",   # KEY 4
    "AIzaSyDzvOSlw1V2D8v5FYy7PoZadf-ovoEaBcs",   # KEY 5
]
_key_index = 0

MODEL_ID = "gemini-2.5-flash-image"   # Confirmed image model (models/gemini-2.5-flash-image)

# ── Items to generate ──────────────────────────────────────────────────────
ITEMS = [
    {
        "filename": "deco_bed.png",
        "description": (
            "A single bed with pink and lavender bedding and a heart-shaped pillow on top. "
            "Isometric side view showing the bed from a 45-degree angle."
        ),
    },
    {
        "filename": "deco_wardrobe.png",
        "description": (
            "A tall wardrobe cabinet in pastel purple with cute rounded door handles. "
            "Isometric view at 45-degree angle, doors slightly visible on one face."
        ),
    },
    {
        "filename": "deco_mirror.png",
        "description": (
            "A round Hollywood vanity mirror with small decorative light bulbs arranged around the frame, gold-colored frame. "
            "Isometric view at 45-degree angle."
        ),
    },
    {
        "filename": "deco_sofa.png",
        "description": (
            "A two-seat sofa in lavender purple with cute rounded fluffy cushions. "
            "Isometric view at 45-degree angle."
        ),
    },
    {
        "filename": "deco_table.png",
        "description": (
            "A small round table with a cute boba tea drink and a tiny vase of colorful flowers on top. "
            "Isometric view at 45-degree angle."
        ),
    },
    {
        "filename": "deco_rug.png",
        "description": (
            "A flat rectangular rug in pink with a star pattern, seen from isometric top-down perspective. "
            "The rug lies flat on the floor, viewed at 45-degree isometric angle."
        ),
    },
    {
        "filename": "deco_lamp.png",
        "description": (
            "A cute arc floor lamp with a white and gold finish, with a warm soft light glow from the lampshade. "
            "Isometric view at 45-degree angle."
        ),
    },
    {
        "filename": "deco_dresser.png",
        "description": (
            "A makeup dresser with a rectangular mirror on top, small pastel pink perfume bottles and cosmetics arranged on the surface. "
            "Isometric view at 45-degree angle."
        ),
    },
    {
        "filename": "deco_bookshelf.png",
        "description": (
            "A small bookshelf with rows of colorful books in pastel colors, and a tiny cute plushie toy sitting on the top shelf. "
            "Isometric view at 45-degree angle."
        ),
    },
]

PROMPT_TEMPLATE = (
    "Isometric view furniture item for a cute K-pop fan room. {description} "
    "Same isometric 45-degree perspective as the reference images provided. "
    "Cute kawaii style, soft pastel colors, chibi proportions, clean outlines. "
    "SOLID MAGENTA (#FF00FF) background — no gradients, no shadows, pure flat magenta behind the item. "
    "No human characters. No animals. No LINE Friends characters. Furniture and decor only."
)

# ── Post-process: remove magenta background ────────────────────────────────

def _is_magenta(r: int, g: int, b: int) -> bool:
    """Loose magenta/pink match for flood-fill bg removal. Safe because flood-fill is corner-seeded."""
    return r > 140 and g < 150 and b > 100


def remove_magenta(img: Image.Image) -> Image.Image:
    """Flood-fill from all 4 corners to remove magenta background."""
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
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny * w + nx]:
                stack.append((nx, ny))

    return img

# ── Key rotation ───────────────────────────────────────────────────────────

def get_client():
    """Return a new genai.Client using the current key slot."""
    key = API_KEYS[_key_index % len(API_KEYS)]
    client = genai.Client(api_key=key)
    return client


def rotate_key(reason: str):
    global _key_index
    old = _key_index % len(API_KEYS)
    _key_index += 1
    new = _key_index % len(API_KEYS)
    print(f"  [KEY ROTATE] {reason[:80]} — slot {old} → {new}")


# ── Response validation (multi-layer) ─────────────────────────────────────

def extract_image_bytes(response) -> bytes:
    """4-layer validated image extraction per gemini_image_workflow.md."""
    # Layer 1
    if not response.candidates:
        raise ValueError("No candidates in response")

    candidate = response.candidates[0]

    # Layer 2
    if not candidate.content:
        raise ValueError("No content in candidate")

    # Layer 3
    if not candidate.content.parts:
        raise ValueError("No parts in content")

    # Layer 4: iterate parts
    for part in candidate.content.parts:
        if hasattr(part, "inline_data") and part.inline_data:
            data = part.inline_data.data
            if data:
                return data

    raise ValueError("No image data found in any response part")


# ── Per-item generation ────────────────────────────────────────────────────

def generate_item(item: dict, ref_img1: Image.Image, ref_img2: Image.Image) -> bool:
    """
    Generate one deco PNG. Returns True on success.
    CRITICAL: images must come BEFORE text in the contents list.
    """
    filename = item["filename"]
    out_path = OUTPUT_DIR / filename
    prompt   = PROMPT_TEMPLATE.format(description=item["description"])

    # Images FIRST, text LAST (gemini_image_workflow.md rule #1)
    contents = [ref_img1, ref_img2, prompt]

    config = types.GenerateContentConfig(
        responseModalities=["IMAGE"],
        candidateCount=1,
        imageConfig=types.ImageConfig(
            aspectRatio="1:1",
            imageSize="1K",
        ),
    )

    MAX_RETRIES = 3
    for attempt in range(MAX_RETRIES):
        try:
            client = get_client()
            response = client.models.generate_content(
                model=MODEL_ID,
                contents=contents,
                config=config,
            )
            image_bytes = extract_image_bytes(response)
            # Post-process: remove magenta background
            from io import BytesIO
            raw_img = Image.open(BytesIO(image_bytes))
            clean_img = remove_magenta(raw_img)
            clean_img.save(out_path, "PNG")
            print(f"  [OK] {filename}  ({len(image_bytes):,} bytes → bg removed)")
            return True

        except Exception as e:
            err_str = str(e).lower()
            is_rate_limit = (
                "429" in err_str
                or "resource_exhausted" in err_str
                or "quota" in err_str
                or "rate" in err_str
            )

            if is_rate_limit:
                rotate_key(str(e))
                wait = 5 * (2 ** attempt)   # 5s, 10s, 20s
                print(f"  Rate limit — waiting {wait}s...")
                time.sleep(wait)
            elif attempt < MAX_RETRIES - 1:
                wait = 2 * (2 ** attempt)   # 2s, 4s
                print(f"  [RETRY {attempt+1}/{MAX_RETRIES-1}] {str(e)[:120]} — retrying in {wait}s")
                time.sleep(wait)
            else:
                print(f"  [FAIL] {filename} — {str(e)[:200]}")
                return False

    return False


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load reference images (PIL Image objects, RGBA)
    print("Loading reference images...")
    ref_img1 = Image.open(REF_GROUND).convert("RGBA")
    ref_img2 = Image.open(REF_DECO).convert("RGBA")
    print(f"  {REF_GROUND.name}: {ref_img1.size}")
    print(f"  {REF_DECO.name}:   {ref_img2.size}")
    print(f"  Model: {MODEL_ID}")
    print(f"  Output: {OUTPUT_DIR}\n")

    success_list = []
    fail_list    = []
    total        = len(ITEMS)

    for i, item in enumerate(ITEMS, 1):
        print(f"[{i}/{total}] {item['filename']}...")
        ok = generate_item(item, ref_img1, ref_img2)
        if ok:
            success_list.append(item["filename"])
        else:
            fail_list.append(item["filename"])

        if i < total:
            print("  Sleeping 3s...")
            time.sleep(3)

    # ── Copy ground tiles ──────────────────────────────────────────────────
    print("\n--- Copying ground tiles ---")
    for src, dst_name in TILE_COPIES:
        dst = OUTPUT_DIR / dst_name
        if src.exists():
            shutil.copy2(src, dst)
            print(f"  [COPY] {src.name} → {dst_name}")
        else:
            print(f"  [SKIP] {src.name} not found at {src}")

    # ── Summary ────────────────────────────────────────────────────────────
    print("\n" + "=" * 55)
    print(f"DONE  {len(success_list)}/{total} items generated successfully")
    if success_list:
        print("  Generated :", ", ".join(success_list))
    if fail_list:
        print("  Failed    :", ", ".join(fail_list))
    print(f"  Output dir: {OUTPUT_DIR}")


if __name__ == "__main__":
    import sys
    # Optional: pass item filenames to regenerate only those
    # e.g.  python generate_island_decos.py deco_dresser.png deco_mirror.png
    if len(sys.argv) > 1:
        targets = set(sys.argv[1:])
        ITEMS[:] = [it for it in ITEMS if it["filename"] in targets]
        print(f"Regenerating only: {targets}\n")
    main()
