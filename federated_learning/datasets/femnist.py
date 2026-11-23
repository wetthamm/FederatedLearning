import glob
import json
import os

import numpy

from .dataset import Dataset


def load_leaf_json_dir(directory):
    """
    Load every LEAF ``*.json`` file in ``directory`` and pool the samples.

    LEAF stores data as ``{"users": [...], "num_samples": [...],
    "user_data": {user: {"x": [[784 floats], ...], "y": [int, ...]}}}``.

    :return: (X, Y, users) where X is float32 (n, 1, 28, 28), Y is int64 (n,)
        and users is the LEAF writer id of every sample (kept so that a
        non-IID, writer-based partition can be added later).
    """
    files = sorted(glob.glob(os.path.join(directory, "*.json")))
    if not files:
        raise FileNotFoundError(
            "No LEAF json files found in '{}'. Run LEAF's "
            "data/femnist/preprocess.sh first (see README).".format(directory))

    xs, ys, users = [], [], []
    for path in files:
        with open(path, "r") as f:
            data = json.load(f)
        for user in data["users"]:
            user_data = data["user_data"][user]
            xs.append(numpy.asarray(user_data["x"], dtype=numpy.float32))
            ys.append(numpy.asarray(user_data["y"], dtype=numpy.int64))
            users.extend([user] * len(user_data["y"]))

    X = numpy.concatenate(xs).reshape(-1, 1, 28, 28)
    Y = numpy.concatenate(ys)

    return X, Y, numpy.asarray(users)


class FEMNISTDataset(Dataset):
    """
    LEAF FEMNIST (62 classes: 0-9 digits, 10-35 'A'-'Z', 36-61 'a'-'z').

    Uses the train/test split produced by LEAF's ``preprocess.sh -t sample``.
    All writers' samples are pooled here; the IID partition across the N
    federated participants is then done by the original paper code
    (``distribute_batches_equally``), exactly as for Fashion-MNIST.

    Pixel values are left as LEAF produces them (grey level / 255, in
    [0, 1]) with no further pre-processing, mirroring the paper's
    Fashion-MNIST setup.
    """

    def __init__(self, args):
        super(FEMNISTDataset, self).__init__(args)

    def load_train_dataset(self):
        self.get_args().get_logger().debug("Loading FEMNIST train data")
        X, Y, self.train_users = load_leaf_json_dir(os.path.join(self.get_args().get_leaf_femnist_path(), "train"))
        self.get_args().get_logger().debug("Finished loading FEMNIST train data: {} samples", len(Y))

        return (X, Y)

    def load_test_dataset(self):
        self.get_args().get_logger().debug("Loading FEMNIST test data")
        X, Y, self.test_users = load_leaf_json_dir(os.path.join(self.get_args().get_leaf_femnist_path(), "test"))
        self.get_args().get_logger().debug("Finished loading FEMNIST test data: {} samples", len(Y))

        return (X, Y)
