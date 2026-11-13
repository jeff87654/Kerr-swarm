"""Compare two sets of plan pictures saved by tools/planhash.mjs --save.

  python tools/plandiff.py out/plans/a out/plans/b

For each picture: the share of pixels that differ by more than 24 levels in any channel, the largest difference, and
where the worst 64-pixel block is (as x, z in pixels of the 2048 x 1024 picture). Two runs of unchanged code differ
only by scattered single levels at shape edges; a shape that has gone missing shows as a block.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def compare(a, b):
    A = np.asarray(Image.open(a).convert("RGB"), dtype=np.int16)
    B = np.asarray(Image.open(b).convert("RGB"), dtype=np.int16)
    if A.shape != B.shape:
        return "different sizes"
    d = np.abs(A - B).max(axis=2)
    big = d > 24
    h, w = d.shape
    blocks = big[: h - h % 64, : w - w % 64].reshape(h // 64, 64, w // 64, 64).sum(axis=(1, 3))
    iz, ix = np.unravel_index(blocks.argmax(), blocks.shape)
    return f"{big.mean() * 100:7.3f}% over 24   max {int(d.max()):3d}   mean {d.mean():6.3f}   worst block {int(blocks.max()):4d} px at ({ix * 64}, {iz * 64})"


if __name__ == "__main__":
    da, db = Path(sys.argv[1]), Path(sys.argv[2])
    for a in sorted(da.glob("*.png")):
        b = db / a.name
        print(f"{a.stem:32s}", compare(a, b) if b.is_file() else "missing in the second set")
