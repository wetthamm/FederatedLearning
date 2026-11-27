"""
Scores the Sec. 4 defense (Algorithm 1) on recorded deltas. Not in the paper.

Algorithm 1 itself only produces a 2-D PCA plot of the source-class
output-node updates. To turn the plot into numbers, this script adds two
automatic decision rules that an aggregator could run without knowing who is
malicious. Both are our own, not the paper's.

"update" rule (naive): 2-means on the 2-D PCA points, the smaller cluster is
suspicious, a participant is flagged if most of its updates fall in it, and
nothing is flagged unless silhouette >= --min-silhouette. This turns out to
split on update size (early rounds are ~10x larger), not on honesty.

"participant" rule (used in the write-up): average each participant's PC1
score over all its updates in the window, run 2-means on those 50 averages,
flag the smaller group, and act only if silhouette >= --min-part-silhouette.

It also reports the AUC of PC1 (update level) and of the averaged PC1
(participant level): how well the plot ranks attackers, with no rule at all.
Each is computed for R = [10, --last-round] and the early window
R = [10, --early-last].

Example:
    python3 defense_eval.py results_defense/label_flipping/24_to_0 --source 24 --out analysis
"""
import argparse
import glob
import json
import os

import numpy
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import roc_auc_score, silhouette_score
from sklearn.preprocessing import StandardScaler


def load(path, source, first, last):
    d = numpy.load(path)
    row = list(d["classes"]).index(source)
    keep = (d["rounds"] >= first) & (d["rounds"] <= last)
    return d["deltas"][keep, row, :], d["is_poisoned"][keep], d["workers"][keep], d["rounds"][keep]


def auc(y, score):
    a = roc_auc_score(y, score)
    return round(float(max(a, 1 - a)), 3)  # PCA's sign is arbitrary


def participant_rule(pc1, poisoned, workers, min_sil):
    wset = sorted(set(workers.tolist()))
    avg = numpy.array([pc1[workers == w].mean() for w in wset]).reshape(-1, 1)
    mal = numpy.array([poisoned[workers == w].any() for w in wset])
    lab = KMeans(n_clusters=2, n_init=10, random_state=0).fit(avg).labels_
    sil = float(silhouette_score(avg, lab))
    act = sil >= min_sil
    fl = (lab == numpy.argmin(numpy.bincount(lab))) & act
    res = {"silhouette": round(sil, 3), "acted": bool(act), "malicious_caught": int((fl & mal).sum()),
           "malicious_seen": int(mal.sum()), "honest_flagged": int((fl & ~mal).sum()),
           "honest_seen": int((~mal).sum())}
    if mal.any():
        res["auc"] = auc(mal, avg[:, 0])
    return res


def evaluate(X, poisoned, workers, min_sil, min_part_sil):
    pts = PCA(n_components=2).fit_transform(StandardScaler().fit_transform(X))
    km = KMeans(n_clusters=2, n_init=10, random_state=0).fit(pts)
    lab = km.labels_
    sil = float(silhouette_score(pts, lab)) if len(set(lab)) > 1 else float("nan")
    small = int(numpy.argmin(numpy.bincount(lab)))
    act = sil >= min_sil
    flagged_upd = (lab == small) & act

    res = {"updates": int(len(lab)), "malicious_updates": int(poisoned.sum()),
           "participant_rule": participant_rule(pts[:, 0], poisoned, workers, min_part_sil),
           "update_rule_silhouette": round(sil, 3), "update_rule_acted": bool(act)}
    if poisoned.any():
        res["update_auc_pc1"] = auc(poisoned, pts[:, 0])
        res["update_recall"] = round(float((flagged_upd & poisoned).sum() / poisoned.sum()), 3)
    res["update_false_pos"] = int((flagged_upd & ~poisoned).sum())

    wset = sorted(set(workers.tolist()))
    flagged_w = [w for w in wset if flagged_upd[workers == w].mean() > 0.5]
    mal_w = sorted(set(workers[poisoned].tolist()))
    res["update_rule_malicious_caught"] = len([w for w in flagged_w if w in mal_w])
    res["update_rule_honest_flagged"] = len([w for w in flagged_w if w not in mal_w])

    # how far apart the two groups are along the first principal component,
    # in units of the honest updates' spread
    if poisoned.any() and (~poisoned).any():
        h, m = pts[~poisoned, 0], pts[poisoned, 0]
        res["pc1_gap_in_honest_sd"] = round(float(abs(m.mean() - h.mean()) / h.std()), 2)
        hm, mm = X[~poisoned].mean(0), X[poisoned].mean(0)
        res["cosine_mean_honest_vs_malicious"] = round(float(hm @ mm / (numpy.linalg.norm(hm) * numpy.linalg.norm(mm))), 3)
        res["mean_norm_honest"] = round(float(numpy.linalg.norm(X[~poisoned], axis=1).mean()), 4)
        res["norm_ratio_malicious_to_honest"] = round(float(numpy.linalg.norm(X[poisoned], axis=1).mean() /
                                                            numpy.linalg.norm(X[~poisoned], axis=1).mean()), 3)
    return res, pts


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("pair_dir", help="e.g. results_defense/label_flipping/24_to_0")
    p.add_argument("--source", type=int, required=True)
    p.add_argument("--first-round", type=int, default=10)
    p.add_argument("--last-round", type=int, default=200)
    p.add_argument("--early-last", type=int, default=50)
    p.add_argument("--min-silhouette", type=float, default=0.5)
    p.add_argument("--min-part-silhouette", type=float, default=0.65)
    p.add_argument("--out", default="analysis")
    a = p.parse_args()

    name = os.path.basename(os.path.normpath(a.pair_dir))
    out, points = {}, {}
    for f in sorted(glob.glob(os.path.join(a.pair_dir, "m*", "*_deltas.npz"))):
        m = os.path.basename(os.path.dirname(f))
        X, pz, w, r = load(f, a.source, a.first_round, a.last_round)
        full, pts = evaluate(X, pz, w, a.min_silhouette, a.min_part_silhouette)
        X, pz, w, r = load(f, a.source, a.first_round, a.early_last)
        early, _ = evaluate(X, pz, w, a.min_silhouette, a.min_part_silhouette)
        out[m] = {"R_full": full, "R_early": early}
        _, pz, w, r = load(f, a.source, a.first_round, a.last_round)
        points[m] = {"pc": pts.round(4).tolist(), "poisoned": pz.tolist(), "workers": w.tolist(), "rounds": r.tolist()}
        print(m, "full", full)
        print(m, "early", early)

    os.makedirs(a.out, exist_ok=True)
    json.dump(out, open(os.path.join(a.out, "defense_{}.json".format(name)), "w"), indent=1)
    json.dump(points, open(os.path.join(a.out, "defense_points_{}.json".format(name)), "w"))
    print("wrote", os.path.join(a.out, "defense_{}.json".format(name)))
