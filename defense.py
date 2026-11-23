"""
Sec. 4 - Defending against label flipping attacks (Algorithm 1, Fig. 8).

For every round r in R and participant P_i in P_r, take
theta_delta_i = theta_{r,i} - theta_{r-1}, keep only the parameters connected
to the source-class output node (row c_src of the final layer, ``fc.weight``
for the FEMNIST CNN), standardize the collected vectors, project them on 2
principal components and plot them: blue X = malicious, orange O = honest.

The original defense.py rebuilt these deltas from every model saved to disk.
Here the deltas are recorded during training instead: run an experiment with
``--record-deltas`` (it writes ``<id>_deltas.npz``) and point this script at
those files.

Example:
    python3 label_flipping_attack.py --source 24 --target 0 --malicious-pct 10 \
        --num-exp 1 --record-deltas
    python3 defense.py results/label_flipping/24_to_0/m10/3000_deltas.npz --source 24
"""
import argparse

import numpy
from loguru import logger

from federated_learning.dimensionality_reduction import calculate_pca_of_gradients
from federated_learning.utils import apply_standard_scaler


def load_deltas(paths, source_class, first_round, last_round):
    """
    Build U (Algorithm 1) from one or more recorded runs.
    """
    vectors, poisoned = [], []
    for path in paths:
        data = numpy.load(path)
        classes = list(data["classes"])
        if source_class not in classes:
            raise ValueError("{} does not contain deltas for class {} (has {})".format(path, source_class, classes))
        row = classes.index(source_class)
        keep = (data["rounds"] >= first_round) & (data["rounds"] <= last_round)
        vectors.append(data["deltas"][keep, row, :])
        poisoned.append(data["is_poisoned"][keep])

    return numpy.concatenate(vectors), numpy.concatenate(poisoned)


def separation_score(points, is_poisoned):
    """
    Not in the paper: a number to go with the plot. Clusters the 2-D PCA
    points into two groups with k-means and reports how well the clusters
    match the honest / malicious labels (1.0 = perfect separation).
    """
    from sklearn.cluster import KMeans
    if is_poisoned.all() or not is_poisoned.any():
        return float("nan")
    labels = KMeans(n_clusters=2, n_init=10, random_state=0).fit_predict(points)
    agreement = (labels == is_poisoned.astype(int)).mean()
    return float(max(agreement, 1 - agreement))


def plot_gradients_2d(points, is_poisoned, save_name, title=None):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(6, 4.5))
    honest = ~is_poisoned
    ax.scatter(points[honest, 0], points[honest, 1], color="orange", s=12, label="honest")
    ax.scatter(points[is_poisoned, 0], points[is_poisoned, 1], color="blue", marker="x", s=30, linewidth=1.5, label="malicious")
    ax.set_xticks([])
    ax.set_yticks([])
    ax.legend(loc="best")
    if title:
        ax.set_title(title)
    fig.tight_layout()
    fig.savefig(save_name, dpi=150)
    plt.close(fig)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("deltas", nargs="+", help="<id>_deltas.npz file(s) recorded with --record-deltas")
    parser.add_argument("--source", type=int, required=True, help="suspected source class c_src")
    parser.add_argument("--first-round", type=int, default=10, help="R = [first, last] (paper: [10, 200])")
    parser.add_argument("--last-round", type=int, default=200)
    parser.add_argument("--save", default="defense_results.png")
    parser.add_argument("--title", default=None)
    cli = parser.parse_args()

    param_diff, is_poisoned = load_deltas(cli.deltas, cli.source, cli.first_round, cli.last_round)
    logger.info("Gradients shape: {}  ({} malicious updates)", param_diff.shape, int(is_poisoned.sum()))

    scaled_param_diff = apply_standard_scaler(param_diff)
    dim_reduced_gradients = calculate_pca_of_gradients(logger, scaled_param_diff, 2)

    score = separation_score(dim_reduced_gradients, is_poisoned)
    logger.info("2-means cluster / label agreement: {:.3f}", score)

    plot_gradients_2d(dim_reduced_gradients, is_poisoned, cli.save, cli.title)
    logger.info("Saved {}", cli.save)
