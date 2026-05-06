"""
Re-apply background removal to already-generated deco PNGs.
Uses the flood-fill remove_magenta from generate_island_decos.
"""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))

from pathlib import Path
from PIL import Image
from generate_island_decos import remove_magenta

ASSETS_DIR = Path(r"F:\Personal_project\kiikii_service\assets\island")

files = sorted(ASSETS_DIR.glob("deco_*.png"))
if not files:
    print("No deco_*.png files found.")
    sys.exit(1)

for f in files:
    img = Image.open(f)
    before_alpha = sum(1 for p in img.convert("RGBA").getdata() if p[3] > 0)
    cleaned = remove_magenta(img)
    after_alpha  = sum(1 for p in cleaned.getdata() if p[3] > 0)
    cleaned.save(f, "PNG")
    removed = before_alpha - after_alpha
    print(f"  {f.name}: removed {removed:,} bg pixels  ({before_alpha:,} → {after_alpha:,} opaque)")

print(f"\nDone - {len(files)} files updated.")
