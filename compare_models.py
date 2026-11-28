"""
Compares trained global models on several test sets and reports accuracy and confidence.

Test sets (see tools/make_test_sets.py): FEMNIST easy, FEMNIST hard, and our own
font-rendered set. For each model and set it reports:
  * top-1 accuracy;
  * mean top-1 confidence (softmax probability of the predicted class), split into
    correct and wrong predictions;
  * mean probability mass on the remaining 61 classes;
  * for the attack's source class: recall, and how often it is predicted as the target.

Usage:
    python3 compare_models.py --out analysis/model_comparison.json
"""
import argparse
import json

import numpy
import torch

from demo import LABELS, load_model, load_test

MODELS = {
    "clean (0% malicious)": "results_models/label_flipping/0_to_0/m0/3000_final_model.pt",
    "O→0 attack, 50% malicious": "results_models/label_flipping/24_to_0/m50/3000_final_model.pt",
    "A→h attack, 50% malicious": "results_models/label_flipping/10_to_43/m50/3000_final_model.pt",
}
PAIRS = [(24, 0), (10, 43)]


@torch.no_grad()
def probs(net, X):
    return torch.cat([torch.softmax(net(X[i:i + 1000]), 1) for i in range(0, len(X), 1000)]).numpy()


def stats(P, Y):
    pred = P.argmax(1); top = P.max(1); ok = pred == Y
    r = {"n": int(len(Y)), "accuracy": float(ok.mean()), "top1_conf_mean": float(top.mean()),
         "top1_conf_correct": float(top[ok].mean()) if ok.any() else None,
         "top1_conf_wrong": float(top[~ok].mean()) if (~ok).any() else None,
         "rest_mass_mean": float((1 - top).mean()),
         "true_class_conf_mean": float(P[numpy.arange(len(Y)), Y].mean())}
    for s, t in PAIRS:
        m = Y == s
        if m.any():
            r["{}->{}".format(LABELS[s], LABELS[t])] = {"n": int(m.sum()), "recall": float((pred[m] == s).mean()),
                                                        "to_target": float((pred[m] == t).mean()),
                                                        "conf_source": float(P[m, s].mean()), "conf_target": float(P[m, t].mean())}
    return r


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--sets", default="data/extra_test_sets")
    p.add_argument("--out", default="analysis/model_comparison.json")
    a = p.parse_args()
    X, Y = load_test()
    sets = {"FEMNIST full test": (X, Y.numpy())}
    for k, f in (("FEMNIST easy", "femnist_easy"), ("FEMNIST hard", "femnist_hard"), ("Fonts (ours)", "fonts")):
        d = numpy.load("{}/{}.npz".format(a.sets, f))
        sets[k] = (torch.from_numpy(d["X"]), d["Y"])
    out = {}
    for mname, path in MODELS.items():
        net = load_model(path)
        out[mname] = {}
        for sname, (Xs, Ys) in sets.items():
            out[mname][sname] = stats(probs(net, Xs), Ys)
            r = out[mname][sname]
            print("{:28s} {:18s} acc {:6.2%}  top-1 conf {:.3f} (right {:.3f} / wrong {:.3f})  rest {:.3f}".format(
                mname, sname, r["accuracy"], r["top1_conf_mean"], r["top1_conf_correct"] or 0, r["top1_conf_wrong"] or 0, r["rest_mass_mean"]))
    json.dump(out, open(a.out, "w"), indent=1)
    print("wrote", a.out)
