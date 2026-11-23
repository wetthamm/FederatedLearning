import argparse
import os
import pathlib
import random

from loguru import logger
from federated_learning.arguments import Arguments
from federated_learning.utils import generate_train_loader
from federated_learning.utils import generate_test_loader
from federated_learning.utils import save_data_loader_to_file


def get_dataset(name, args):
    # Imported lazily so FEMNIST does not require torchvision downloads.
    if name == "femnist":
        from federated_learning.datasets import FEMNISTDataset
        return FEMNISTDataset(args)
    if name == "fashion-mnist":
        from federated_learning.datasets import FashionMNISTDataset
        return FashionMNISTDataset(args)
    if name == "cifar10":
        from federated_learning.datasets import CIFAR10Dataset
        return CIFAR10Dataset(args)
    raise ValueError(name)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Build the static (shuffled) train/test data loaders used by every experiment.")
    parser.add_argument("--datasets", nargs="+", default=["femnist"], choices=["femnist", "fashion-mnist", "cifar10"])
    parser.add_argument("--seed", type=int, default=1)
    cli = parser.parse_args()

    for name in cli.datasets:
        random.seed(cli.seed)
        args = Arguments(logger, dataset=name)
        dataset = get_dataset(name, args)

        train_path = args.get_train_data_loader_pickle_path()
        test_path = args.get_test_data_loader_pickle_path()
        pathlib.Path(os.path.dirname(train_path)).mkdir(parents=True, exist_ok=True)

        train_data_loader = generate_train_loader(args, dataset)
        test_data_loader = generate_test_loader(args, dataset)

        with open(train_path, "wb") as f:
            save_data_loader_to_file(train_data_loader, f)

        with open(test_path, "wb") as f:
            save_data_loader_to_file(test_data_loader, f)

        logger.info("{}: {} train / {} test samples -> {}, {}", name,
                    len(train_data_loader.dataset), len(test_data_loader.dataset), train_path, test_path)
