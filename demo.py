"""
Demo: classify FEMNIST images with a trained global model and show the confidence
(softmax probability) of the top-1 class and of the remaining 61 classes.

Models come from a run with --save-final-model, e.g.
    python3 label_flipping_attack.py --source 0 --target 0 --malicious-pct 0 --num-exp 1 \\
        --save-final-model --output-dir results_models

Examples:
    # one FEMNIST test image (by index), clean model vs. attacked model
    python3 demo.py --model results_models/label_flipping/0_to_0/m0/3000_final_model.pt \\
                    --model results_models/label_flipping/24_to_0/m50/3000_final_model.pt --index 120
    # first test image of a given class ('O')
    python3 demo.py --model ... --char O
    # your own image (any size; dark ink on a light background)
    python3 demo.py --model ... --image my_letter.png
    # latency / throughput on this machine
    python3 demo.py --model ... --benchmark
"""
import argparse
import os
import pickle
import time

import numpy
import torch

from federated_learning.nets import FEMNISTCNN

LABELS = [str(i) for i in range(10)] + [chr(65 + i) for i in range(26)] + [chr(97 + i) for i in range(26)]


def load_model(path):
    net = FEMNISTCNN()
    net.load_state_dict(torch.load(path, map_location="cpu"))
    return net.eval()


def load_test(path="data_loaders/femnist/test_data_loader.pickle"):
    ds = pickle.load(open(path, "rb")).dataset
    return ds.tensors[0], ds.tensors[1]


def load_image(path):
    """Any image -> FEMNIST format: 28x28, ink centered and scaled to ~10 px, white = 1."""
    from PIL import Image, ImageOps
    img = ImageOps.grayscale(Image.open(path))
    a = numpy.asarray(img, dtype=numpy.float32) / 255.0
    if a.mean() < 0.5:  # light ink on dark background -> invert
        a = 1.0 - a
    ink = a < 0.5
    rows, cols = numpy.where(ink.any(1))[0], numpy.where(ink.any(0))[0]
    a = a[rows[0]:rows[-1] + 1, cols[0]:cols[-1] + 1]
    glyph = Image.fromarray((255 * (1 - a)).astype(numpy.uint8))
    s = 100 / max(glyph.size)
    glyph = glyph.resize((max(1, round(glyph.width * s)), max(1, round(glyph.height * s))), Image.LANCZOS)
    canvas = Image.new("L", (280, 280), 0)
    canvas.paste(glyph, ((280 - glyph.width) // 2, (280 - glyph.height) // 2))
    small = numpy.asarray(canvas.resize((28, 28), Image.BOX), dtype=numpy.float32) / 255.0
    return torch.from_numpy(1.0 - small * 0.84).reshape(1, 1, 28, 28)


@torch.no_grad()
def predict(net, x):
    return torch.softmax(net(x), dim=1)


def show(name, p, true=None, k=5):
    p = p[0].numpy()
    order = numpy.argsort(-p)
    print("\n  model: {}".format(name))
    if true is not None:
        print("  true class: '{}'".format(LABELS[true]))
    for r, c in enumerate(order[:k]):
        bar = "#" * int(round(p[c] * 40))
        print("  {} '{}'  {:6.2%}  {}".format("top-1" if r == 0 else "     ", LABELS[c], p[c], bar))
    print("  remaining {} classes together: {:6.2%} (largest {:.2%})".format(len(p) - k, p[order[k:]].sum(), p[order[k]]))


def benchmark(net, X, threads):
    torch.set_num_threads(threads)
    with torch.no_grad():
        for _ in range(20):
            net(X[:1])
        t = []
        for i in range(500):
            t0 = time.perf_counter(); net(X[i:i + 1]); t.append(time.perf_counter() - t0)
        lat = numpy.array(t) * 1000
        res = {"threads": threads, "latency_ms_p50": float(numpy.median(lat)), "latency_ms_p95": float(numpy.percentile(lat, 95))}
        for bs in (64, 512):
            n = (len(X) // bs) * bs
            t0 = time.perf_counter()
            for i in range(0, n, bs):
                net(X[i:i + bs])
            res["throughput_img_s_batch{}".format(bs)] = float(n / (time.perf_counter() - t0))
    return res


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--model", action="append", required=True, help="path to <id>_final_model.pt (repeatable)")
    g = p.add_mutually_exclusive_group()
    g.add_argument("--index", type=int, help="FEMNIST test image index")
    g.add_argument("--char", help="use the first FEMNIST test image of this class")
    g.add_argument("--image", help="your own image file")
    g.add_argument("--benchmark", action="store_true")
    p.add_argument("--threads", type=int, default=1)
    p.add_argument("--top", type=int, default=5)
    a = p.parse_args()

    nets = [(os.path.relpath(m), load_model(m)) for m in a.model]
    X, Y = load_test()
    if a.benchmark:
        for name, net in nets[:1]:
            print("model", name, "| CPU,", a.threads, "thread(s)")
            print(benchmark(net, X, a.threads))
        raise SystemExit
    true = None
    if a.image:
        x = load_image(a.image)
    else:
        i = a.index if a.index is not None else int((Y == LABELS.index(a.char)).nonzero()[0])
        x, true = X[i:i + 1], int(Y[i])
        print("FEMNIST test image #{}".format(i))
    torch.set_num_threads(a.threads)
    for name, net in nets:
        t0 = time.perf_counter()
        prob = predict(net, x)
        ms = (time.perf_counter() - t0) * 1000
        show(name, prob, true, a.top)
        print("  inference time: {:.2f} ms".format(ms))
