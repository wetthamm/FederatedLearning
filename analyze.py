"""
Turns experiment outputs into the paper's tables and figures.

Sub-commands (each reads the folders written by the experiment scripts):

  baseline      m_cnt (baseline misclassification counts) from M_NP runs and
                suggested source -> target pairs (Sec. 3.1 "Label Flipping
                Process": frequent / infrequent / middle confusion)
  feasibility   Fig. 1, Fig. 2, Table 2, Table 3            (Sec. 3.2)
  timing        Fig. 3, Fig. 4, Table 4                       (Sec. 3.3)
  availability  Fig. 5, Fig. 6, Fig. 7                        (Sec. 3.4)

Every result CSV row is one round: accuracy, loss, precision[C], recall[C].
Recalls are reported in percent, as in the paper.
"""
import argparse
import glob
import json
import os
import re

import numpy

# Reference categorical palette, slots in fixed order (see README).
SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"]
ALPHA_RAMP = ["#86b6ef", "#3987e5", "#1c5cab", "#0d366b"]  # ordinal, light -> dark
INK = "#2b2b29"
MUTED = "#8a897f"
GRID = "#e6e5e0"


def class_name(c):
    """FEMNIST label -> character (LEAF: 0-9, A-Z = 10-35, a-z = 36-61)."""
    c = int(c)
    if c < 10:
        return str(c)
    if c < 36:
        return chr(ord("A") + c - 10)
    return chr(ord("a") + c - 36)


def label(c):
    return "{} ('{}')".format(c, class_name(c))


# ---------------------------------------------------------------- loading

def load_run(directory, idx):
    rows = numpy.loadtxt(os.path.join(directory, "{}_results.csv".format(idx)), delimiter=",", ndmin=2)
    with open(os.path.join(directory, "{}_meta.json".format(idx))) as f:
        meta = json.load(f)
    c = meta["num_classes"]
    run = {
        "meta": meta,
        "accuracy": rows[:, 0],
        "recall": rows[:, 2 + c:2 + 2 * c] * 100.0,
        "confusion": numpy.load(os.path.join(directory, "{}_final_confusion.npy".format(idx))),
    }
    with open(os.path.join(directory, "{}_workers_selected.csv".format(idx))) as f:
        run["selected"] = [[int(x) for x in line.strip().split(",") if x] for line in f if line.strip()]
    poisoned = set(meta["poisoned_workers"])
    run["num_malicious"] = numpy.array([sum(w in poisoned for w in r) for r in run["selected"]])
    return run


def load_runs(directory):
    ids = sorted(int(os.path.basename(p).split("_")[0]) for p in glob.glob(os.path.join(directory, "*_meta.json")))
    return [load_run(directory, i) for i in ids]


def subdirs(directory, pattern):
    out = {}
    for d in sorted(glob.glob(os.path.join(directory, "*"))):
        m = re.fullmatch(pattern, os.path.basename(d))
        if m and os.path.isdir(d):
            out[d] = m
    return out


def mean_std(values):
    values = numpy.asarray(values, dtype=float)
    return values.mean(), values.std()


# ---------------------------------------------------------------- plotting

def plt_setup():
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.rcParams.update({
        "axes.edgecolor": MUTED, "axes.labelcolor": INK, "xtick.color": INK, "ytick.color": INK,
        "axes.grid": True, "grid.color": GRID, "grid.linewidth": 0.8, "axes.axisbelow": True,
        "axes.spines.top": False, "axes.spines.right": False, "font.size": 10,
        "legend.frameon": False, "figure.dpi": 150,
    })
    return plt


def save(fig, out_dir, name):
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, name)
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    print("wrote", path)


def write_table(out_dir, name, header, rows):
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, name)
    with open(path, "w") as f:
        f.write(",".join(header) + "\n")
        for r in rows:
            f.write(",".join(str(x) for x in r) + "\n")
    widths = [max(len(str(x)) for x in col) for col in zip(header, *rows)] if rows else [len(h) for h in header]
    print("\n" + name)
    print("  ".join(h.ljust(w) for h, w in zip(header, widths)))
    for r in rows:
        print("  ".join(str(x).ljust(w) for x, w in zip(r, widths)))
    print("wrote", path)


# ---------------------------------------------------------------- baseline

def cmd_baseline(cli):
    runs = load_runs(cli.dir)
    if not runs:
        raise SystemExit("no runs in " + cli.dir)
    conf = numpy.mean([r["confusion"] for r in runs], axis=0)
    support = conf.sum(axis=1)
    acc = [r["accuracy"][-1] for r in runs]
    print("M_NP: {} run(s), final accuracy {:.2f}% +- {:.2f}".format(len(runs), *mean_std(acc)))

    os.makedirs(cli.out, exist_ok=True)
    numpy.savetxt(os.path.join(cli.out, "baseline_mcnt_matrix.csv"), conf, delimiter=",", fmt="%.1f")

    pairs = []
    for i in range(conf.shape[0]):
        if support[i] < cli.min_support:
            continue
        for j in range(conf.shape[1]):
            if i != j:
                pairs.append((conf[i, j], i, j))
    pairs.sort(reverse=True)

    rows = [(label(i), label(j), "{:.1f}".format(cnt), int(support[i]),
             "{:.1f}".format(100.0 * conf[i, i] / support[i])) for cnt, i, j in pairs[:cli.top]]
    write_table(cli.out, "baseline_top_confusions.csv",
                ["c_src", "c_target", "m_cnt", "src_test_samples", "src_recall_%"], rows)

    # Paper: one frequent, one infrequent and one middle pair. "Infrequent"
    # is taken among each well-supported source's *most* confused target so
    # the pair is still plausible, not an arbitrary zero-count pair.
    best_per_src = {}
    for cnt, i, j in pairs:
        best_per_src.setdefault(i, (cnt, i, j))
    ranked = sorted(best_per_src.values(), reverse=True)
    high, low, mid = ranked[0], ranked[-1], ranked[len(ranked) // 2]
    print("\nSuggested pairs (source has >= {} test samples):".format(cli.min_support))
    for name, (cnt, i, j) in (("frequent", high), ("middle", mid), ("infrequent", low)):
        print("  {:10s} {} -> {}  m_cnt={:.1f}".format(name, label(i), label(j), cnt))


# ---------------------------------------------------------------- feasibility

def cmd_feasibility(cli):
    plt = plt_setup()
    src, tgt = [int(x) for x in os.path.basename(os.path.normpath(cli.pair_dir)).split("_to_")]
    by_m = {}
    for d, m in subdirs(cli.pair_dir, r"m([\d.]+)").items():
        runs = load_runs(d)
        if runs:
            by_m[float(m.group(1))] = runs
    if 0.0 not in by_m:
        raise SystemExit("need the m0 (no poisoning) runs in " + cli.pair_dir)
    ms = sorted(by_m)
    base = by_m[0.0]
    base_recall = numpy.mean([r["recall"][-1] for r in base], axis=0)
    base_conf = numpy.mean([r["confusion"] for r in base], axis=0)

    acc = {m: mean_std([r["accuracy"][-1] for r in by_m[m]]) for m in ms}
    rec = {m: mean_std([r["recall"][-1][src] for r in by_m[m]]) for m in ms}

    # Table 2: loss in source class recall vs. M_NP
    rows = [(m, len(by_m[m]), "{:.2f}".format(acc[m][0]), "{:.2f}".format(acc[m][1]),
             "{:.2f}".format(rec[m][0]), "{:.2f}".format(rec[m][1]),
             "{:.2f}".format(base_recall[src] - rec[m][0])) for m in ms]
    write_table(cli.out, "table2_{}_to_{}.csv".format(src, tgt),
                ["m%", "runs", "M_acc", "M_acc_std", "src_recall", "src_recall_std", "src_recall_loss"], rows)
    print("m_cnt({} -> {}) = {:.1f}".format(label(src), label(tgt), base_conf[src, tgt]))

    # Table 3: change in recall for src / target / all others, at --table3-m
    m3 = cli.table3_m
    if m3 in by_m:
        delta = numpy.mean([r["recall"][-1] for r in by_m[m3]], axis=0) - base_recall
        others = [c for c in range(len(delta)) if c not in (src, tgt)]
        write_table(cli.out, "table3_{}_to_{}.csv".format(src, tgt),
                    ["pair", "m%", "delta_src_recall", "delta_target_recall", "sum_other_delta_recall"],
                    [("{}->{}".format(src, tgt), m3, "{:.2f}".format(delta[src]), "{:.2f}".format(delta[tgt]),
                      "{:.2f}".format(delta[others].sum()))])

    poisoned_ms = [m for m in ms if m > 0]
    x = numpy.arange(len(poisoned_ms))
    title = "FEMNIST {} → {}".format(label(src), label(tgt))

    # Fig. 1: bars with std error bars + M_NP reference line
    fig, axes = plt.subplots(1, 2, figsize=(8, 3.2))
    for ax, data, ylabel in ((axes[0], acc, "Model accuracy (%)"), (axes[1], rec, "Source class recall (%)")):
        means = [data[m][0] for m in poisoned_ms]
        stds = [data[m][1] for m in poisoned_ms]
        ax.bar(x, means, width=0.6, color=SERIES[0], yerr=stds, error_kw={"ecolor": INK, "elinewidth": 1, "capsize": 2})
        ax.axhline(data[0.0][0], color=MUTED, linestyle="--", linewidth=1.2)
        ax.annotate("$M_{NP}$", (len(x) - 0.5, data[0.0][0]), textcoords="offset points", xytext=(0, 3),
                    ha="right", color=MUTED)
        ax.set_xticks(x, ["{:g}".format(m) for m in poisoned_ms])
        ax.set_xlabel("Malicious participants (%)")
        ax.set_ylabel(ylabel)
        lo = min(means) - max(stds) - 5
        ax.set_ylim(max(0, lo), max(data[0.0][0], max(means)) + 5)
    fig.suptitle("Fig. 1 – " + title, color=INK)
    save(fig, cli.out, "fig1_{}_to_{}.png".format(src, tgt))

    # Fig. 2: accuracy and source recall vs. m on a shared % axis (one axis,
    # not the paper's dual axis).
    fig, ax = plt.subplots(figsize=(5, 3.2))
    ax.plot(ms, [acc[m][0] for m in ms], color=SERIES[0], linewidth=2, marker="o", markersize=5, label="Model accuracy")
    ax.plot(ms, [rec[m][0] for m in ms], color=SERIES[1], linewidth=2, marker="s", markersize=5, label="Source class recall")
    ax.set_xlabel("Malicious participants (%)")
    ax.set_ylabel("%")
    ax.legend(loc="lower left")
    ax.set_title("Fig. 2 – " + title, color=INK)
    save(fig, cli.out, "fig2_{}_to_{}.png".format(src, tgt))


# ---------------------------------------------------------------- timing

def round_curve(runs, src):
    return numpy.mean([r["recall"][:, src] for r in runs], axis=0)


def cmd_timing(cli):
    plt = plt_setup()
    src, tgt = [int(x) for x in os.path.basename(os.path.normpath(cli.pair_dir)).split("_to_")]
    base = load_runs(cli.baseline_dir)
    if not base:
        raise SystemExit("no baseline runs in " + cli.baseline_dir)
    bp = cli.breakpoint

    for mode, fig_no in (("early", 3), ("late", 4)):
        d = os.path.join(cli.pair_dir, mode)
        runs = load_runs(d) if os.path.isdir(d) else []
        if not runs:
            continue
        fig, ax = plt.subplots(figsize=(6, 3.2))
        rounds = numpy.arange(1, len(runs[0]["accuracy"]) + 1)
        ax.plot(rounds, round_curve(base, src)[:len(rounds)], color=SERIES[0], linewidth=1.2, label="Non-poisoned")
        ax.plot(rounds, round_curve(runs, src), color=SERIES[1], linewidth=1.2, label="Poisoned")
        ax.axvline(bp, color=MUTED, linestyle="--", linewidth=1)
        ax.set_xlabel("Communication round")
        ax.set_ylabel("Source class recall (%)")
        ax.set_ylim(0, 100)
        ax.legend(loc="lower right")
        ax.set_title("Fig. {} – {} poisoning, {} → {} (mean of {} runs)".format(
            fig_no, mode, label(src), label(tgt), len(runs)), color=INK)
        save(fig, cli.out, "fig{}_{}_{}_to_{}.png".format(fig_no, mode, src, tgt))

    # Table 4: final source recall when >= 1 malicious participant is in P_R vs none.
    dirs = cli.table4_dirs or [os.path.join(cli.pair_dir, "late")]
    with_mal, without = [], []
    for d in dirs:
        for r in load_runs(d):
            (with_mal if r["num_malicious"][-1] > 0 else without).append(r["recall"][-1][src])
    fmt = lambda v: "{:.2f} (n={})".format(numpy.mean(v), len(v)) if v else "n/a (n=0)"
    write_table(cli.out, "table4_{}_to_{}.csv".format(src, tgt),
                ["pair", "src_recall_malicious_in_P_R", "src_recall_no_malicious_in_P_R"],
                [("{}->{}".format(src, tgt), fmt(with_mal), fmt(without))])


# ---------------------------------------------------------------- availability

def cmd_availability(cli):
    plt = plt_setup()
    src, tgt = [int(x) for x in os.path.basename(os.path.normpath(cli.pair_dir)).split("_to_")]
    data = {}
    for d, m in subdirs(cli.pair_dir, r"alpha([\d.]+)_m([\d.]+)").items():
        runs = load_runs(d)
        if runs:
            data[(float(m.group(1)), float(m.group(2)))] = runs
    if not data:
        raise SystemExit("no runs in " + cli.pair_dir)
    alphas = sorted({a for a, _ in data})
    ms = sorted({m for _, m in data})
    bp = cli.breakpoint

    # Fig. 5: source recall averaged over rounds >= breakpoint
    late_mean = {k: numpy.mean([r["recall"][bp - 1:, src].mean() for r in v]) for k, v in data.items()}
    rows = [(a, m, len(data[(a, m)]), "{:.2f}".format(late_mean[(a, m)])) for a in alphas for m in ms if (a, m) in data]
    write_table(cli.out, "fig5_{}_to_{}.csv".format(src, tgt), ["alpha", "m%", "runs", "src_recall_rounds>=bp"], rows)

    fig, ax = plt.subplots(figsize=(6.5, 3.4))
    width = 0.8 / len(alphas)
    for i, a in enumerate(alphas):
        xs = [j + (i - (len(alphas) - 1) / 2) * width for j in range(len(ms))]
        ax.bar(xs, [late_mean.get((a, m), numpy.nan) for m in ms], width=width * 0.92,
               color=ALPHA_RAMP[i % len(ALPHA_RAMP)], label="α = {:g}".format(a))
    if cli.baseline_dir:
        base = load_runs(cli.baseline_dir)
        if base:
            ref = numpy.mean([r["recall"][bp - 1:, src].mean() for r in base])
            ax.axhline(ref, color=MUTED, linestyle="--", linewidth=1.2)
            ax.annotate("$M_{NP}$", (len(ms) - 0.6, ref), textcoords="offset points", xytext=(0, 3), color=MUTED)
    ax.set_xticks(range(len(ms)), ["{:g}".format(m) for m in ms])
    ax.set_xlabel("Malicious participants (%)")
    ax.set_ylabel("Source class recall (%)")
    ax.legend(ncol=len(alphas), loc="upper right")
    ax.set_title("Fig. 5 – availability, {} → {}".format(label(src), label(tgt)), color=INK)
    save(fig, cli.out, "fig5_{}_to_{}.png".format(src, tgt))

    # Fig. 6: per-round source recall, lowest vs highest alpha, at --fig6-m
    a_lo, a_hi = alphas[0], alphas[-1]
    if (a_lo, cli.fig6_m) in data and (a_hi, cli.fig6_m) in data:
        fig, ax = plt.subplots(figsize=(6, 3.2))
        for a, color in ((a_lo, SERIES[1]), (a_hi, SERIES[0])):
            run = data[(a, cli.fig6_m)][0]
            ax.plot(numpy.arange(1, len(run["accuracy"]) + 1), run["recall"][:, src], color=color,
                    linewidth=1.2, label="α = {:g}".format(a))
        ax.axvline(bp, color=MUTED, linestyle="--", linewidth=1)
        ax.set_xlabel("Communication round")
        ax.set_ylabel("Source class recall (%)")
        ax.set_ylim(0, 100)
        ax.legend(loc="lower left")
        ax.set_title("Fig. 6 – m = {:g}%, {} → {}".format(cli.fig6_m, label(src), label(tgt)), color=INK)
        save(fig, cli.out, "fig6_{}_to_{}.png".format(src, tgt))

    # Fig. 7: change in #malicious in consecutive rounds vs change in source recall (r >= bp)
    deltas = {}
    for runs in data.values():
        for r in runs:
            nm, rc = r["num_malicious"], r["recall"][:, src]
            for t in range(bp, len(nm)):  # 0-based t = round t+1 >= bp+1, previous round >= bp
                deltas.setdefault(int(nm[t] - nm[t - 1]), []).append(rc[t] - rc[t - 1])
    keys = sorted(deltas)
    means = [numpy.mean(deltas[k]) for k in keys]
    write_table(cli.out, "fig7_{}_to_{}.csv".format(src, tgt), ["delta_num_malicious", "n", "mean_delta_src_recall"],
                [(k, len(deltas[k]), "{:.2f}".format(v)) for k, v in zip(keys, means)])
    fig, ax = plt.subplots(figsize=(5, 3.2))
    ax.bar(keys, means, width=0.7, color=[SERIES[0] if v >= 0 else SERIES[1] for v in means])
    ax.axhline(0, color=INK, linewidth=0.8)
    ax.set_xticks(keys)
    ax.set_xlabel("Δ in # of malicious clients selected")
    ax.set_ylabel("Δ source class recall (pp)")
    ax.set_title("Fig. 7 – {} → {}".format(label(src), label(tgt)), color=INK)
    save(fig, cli.out, "fig7_{}_to_{}.png".format(src, tgt))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("baseline")
    p.add_argument("dir", help="folder with non-poisoned runs, e.g. results/label_flipping/<pair>/m0")
    p.add_argument("--out", default="analysis")
    p.add_argument("--min-support", type=int, default=50, help="minimum test samples of a candidate source class")
    p.add_argument("--top", type=int, default=20)

    p = sub.add_parser("feasibility")
    p.add_argument("pair_dir", help="e.g. results/label_flipping/24_to_0")
    p.add_argument("--out", default="analysis")
    p.add_argument("--table3-m", type=float, default=10)

    p = sub.add_parser("timing")
    p.add_argument("pair_dir", help="e.g. results/attack_timing/24_to_0")
    p.add_argument("--baseline-dir", required=True, help="non-poisoned runs, e.g. results/label_flipping/24_to_0/m0")
    p.add_argument("--table4-dirs", nargs="*", help="runs used for Table 4 (default: <pair_dir>/late)")
    p.add_argument("--breakpoint", type=int, default=75)
    p.add_argument("--out", default="analysis")

    p = sub.add_parser("availability")
    p.add_argument("pair_dir", help="e.g. results/availability/24_to_0")
    p.add_argument("--baseline-dir", default=None)
    p.add_argument("--breakpoint", type=int, default=75)
    p.add_argument("--fig6-m", type=float, default=10)
    p.add_argument("--out", default="analysis")

    cli = parser.parse_args()
    {"baseline": cmd_baseline, "feasibility": cmd_feasibility, "timing": cmd_timing,
     "availability": cmd_availability}[cli.cmd](cli)
