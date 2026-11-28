"""
Builds the extra test sets used by compare_models.py. None of them is used for training.

1. FEMNIST "easy" / "hard" subsets of LEAF's test split. The split is fixed before
   looking at any model, by visual ambiguity:
     hard = characters with a look-alike in FEMNIST's 62 classes
            (0/O/o, 1/I/l, 2/Z/z, 5/S/s, 9/g/q, C/c, K/k, M/m, P/p, U/u, V/v, W/w, X/x, Y/y)
     easy = every other class.
2. "fonts": a test set created by us, outside FEMNIST. Each of the 62 characters is
   rendered from 16 regular-weight computer fonts at 2 sizes (1,984 images). Images are drawn the way
   FEMNIST stores them: dark ink (~0.16) on white (1.0), 28x28, the glyph centered and
   scaled to 8 or 11 px, like the median FEMNIST character.

Usage: python3 tools/make_test_sets.py --out data/extra_test_sets
"""
import argparse
import glob
import os
import pickle

import numpy
from PIL import Image, ImageDraw, ImageFont

LABELS = [str(i) for i in range(10)] + [chr(65 + i) for i in range(26)] + [chr(97 + i) for i in range(26)]
HARD_GROUPS = ["0Oo", "1Il", "2Zz", "5Ss", "9gq", "Cc", "Kk", "Mm", "Pp", "Uu", "Vv", "Ww", "Xx", "Yy"]
HARD = sorted({LABELS.index(ch) for g in HARD_GROUPS for ch in g})
FONTS = ["DejaVuSans", "DejaVuSerif", "DejaVuSansMono", "LiberationSans-Regular", "LiberationSerif-Regular",
         "LiberationMono-Regular", "FreeSans", "FreeSerif", "FreeMono", "Carlito-Regular", "Caladea-Regular",
         "Inter-Regular", "JetBrainsMono-Regular", "FreeSansOblique", "Carlito-Italic", "Caladea-Italic"]
SIZES = [8, 11]  # target size of the glyph's longest side, in pixels


def find_font(name):
    hits = glob.glob("/usr/share/fonts/**/{}.[ot]tf".format(name), recursive=True)
    if not hits:
        raise FileNotFoundError(name)
    return hits[0]


def render(ch, font_path, size_px, ink=0.16):
    big = 280
    font = ImageFont.truetype(font_path, 200)
    img = Image.new("L", (big, big), 0)
    ImageDraw.Draw(img).text((big // 2, big // 2), ch, font=font, fill=255, anchor="mm")
    box = img.getbbox()
    glyph = img.crop(box)
    scale = size_px * 10 / max(glyph.size)
    glyph = glyph.resize((max(1, round(glyph.width * scale)), max(1, round(glyph.height * scale))), Image.LANCZOS)
    canvas = Image.new("L", (big, big), 0)
    canvas.paste(glyph, ((big - glyph.width) // 2, (big - glyph.height) // 2))
    small = numpy.asarray(canvas.resize((28, 28), Image.BOX), dtype=numpy.float32) / 255.0
    return (1.0 - small * (1.0 - ink)).astype(numpy.float32)  # white background, dark ink


def femnist_test(path):
    ds = pickle.load(open(path, "rb")).dataset
    return ds.tensors[0].numpy(), ds.tensors[1].numpy()


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--test-loader", default="data_loaders/femnist/test_data_loader.pickle")
    p.add_argument("--out", default="data/extra_test_sets")
    a = p.parse_args()
    os.makedirs(a.out, exist_ok=True)

    X, Y = femnist_test(a.test_loader)
    hard = numpy.isin(Y, HARD)
    numpy.savez_compressed(os.path.join(a.out, "femnist_easy.npz"), X=X[~hard], Y=Y[~hard])
    numpy.savez_compressed(os.path.join(a.out, "femnist_hard.npz"), X=X[hard], Y=Y[hard])
    print("easy:", int((~hard).sum()), "images,", 62 - len(HARD), "classes | hard:", int(hard.sum()), "images,", len(HARD), "classes")

    xs, ys, meta = [], [], []
    for f in FONTS:
        path = find_font(f)
        for s in SIZES:
            for y, ch in enumerate(LABELS):
                xs.append(render(ch, path, s)[None])
                ys.append(y)
                meta.append((f, s))
    numpy.savez_compressed(os.path.join(a.out, "fonts.npz"), X=numpy.stack(xs), Y=numpy.array(ys),
                           font=numpy.array([m[0] for m in meta]), size=numpy.array([m[1] for m in meta]))
    print("fonts:", len(ys), "images ({} fonts x {} sizes x 62 classes)".format(len(FONTS), len(SIZES)))
