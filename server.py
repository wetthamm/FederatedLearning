import json
import os
import random

import numpy
import torch
from loguru import logger

from federated_learning.arguments import Arguments
from federated_learning.utils import generate_data_loaders_from_distributed_dataset
from federated_learning.datasets.data_distribution import distribute_batches_equally
from federated_learning.utils import average_nn_parameters
from federated_learning.utils import convert_distributed_data_into_numpy
from federated_learning.utils import poison_data
from federated_learning.utils import identify_random_elements
from federated_learning.utils import save_results
from federated_learning.utils import load_train_data_loader
from federated_learning.utils import load_test_data_loader
from federated_learning.utils import generate_experiment_ids
from federated_learning.utils import convert_results_to_csv
from client import Client


class UpdateRecorder:
    """
    Records theta_delta^src for Algorithm 1 (the defense): for every
    participant P_i in P_r, the difference between the global parameters
    theta_{r-1} and its local update theta_{r,i}, restricted to the
    parameters connected to the chosen output nodes.
    """

    def __init__(self, layer_name, classes):
        self.layer_name = layer_name
        self.classes = list(classes)
        self.rounds = []
        self.workers = []
        self.deltas = []

    def start_round(self, global_params):
        self.global_rows = global_params[self.layer_name][self.classes].detach().cpu().clone()

    def record(self, epoch, worker_idx, local_params):
        local_rows = local_params[self.layer_name][self.classes].detach().cpu()
        self.rounds.append(epoch)
        self.workers.append(worker_idx)
        self.deltas.append((local_rows - self.global_rows).numpy().astype(numpy.float32))

    def save(self, path, poisoned_workers):
        numpy.savez_compressed(path,
            rounds=numpy.asarray(self.rounds),
            workers=numpy.asarray(self.workers),
            is_poisoned=numpy.asarray([w in poisoned_workers for w in self.workers]),
            classes=numpy.asarray(self.classes),
            deltas=numpy.asarray(self.deltas))


def train_subset_of_clients(epoch, args, clients, poisoned_workers, recorder=None):
    """
    Train a subset of clients per round.

    :param epoch: epoch
    :type epoch: int
    :param args: arguments
    :type args: Arguments
    :param clients: clients
    :type clients: list(Client)
    :param poisoned_workers: indices of poisoned workers
    :type poisoned_workers: list(int)
    """
    kwargs = args.get_round_worker_selection_strategy_kwargs()
    kwargs["current_epoch_number"] = epoch

    random_workers = args.get_round_worker_selection_strategy().select_round_workers(
        list(range(args.get_num_workers())),
        poisoned_workers,
        kwargs)

    if recorder is not None:
        # All clients hold theta_{r-1} at this point.
        recorder.start_round(clients[0].get_nn_parameters())

    for client_idx in random_workers:
        args.get_logger().info("Training epoch #{} on client #{}", str(epoch), str(clients[client_idx].get_client_index()))
        clients[client_idx].train(epoch)

        if recorder is not None:
            recorder.record(epoch, client_idx, clients[client_idx].get_nn_parameters())

    args.get_logger().info("Averaging client parameters")
    parameters = [clients[client_idx].get_nn_parameters() for client_idx in random_workers]
    new_nn_params = average_nn_parameters(parameters)

    for client in clients:
        args.get_logger().info("Updating parameters on client #{}", str(client.get_client_index()))
        client.update_nn_parameters(new_nn_params)

    return clients[0].test(), random_workers

def create_clients(args, train_data_loaders, test_data_loader):
    """
    Create a set of clients.
    """
    clients = []
    for idx in range(args.get_num_workers()):
        clients.append(Client(args, idx, train_data_loaders[idx], test_data_loader))

    return clients

def run_machine_learning(clients, args, poisoned_workers, recorder=None):
    """
    Complete machine learning over a series of clients.
    """
    epoch_test_set_results = []
    worker_selection = []
    for epoch in range(1, args.get_num_epochs() + 1):
        results, workers_selected = train_subset_of_clients(epoch, args, clients, poisoned_workers, recorder)

        epoch_test_set_results.append(results)
        worker_selection.append(workers_selected)

        logger.info("Round {}/{}: accuracy {:.2f}%", epoch, args.get_num_epochs(), results[0])

    return convert_results_to_csv(epoch_test_set_results), worker_selection

def seed_everything(seed):
    random.seed(seed)
    numpy.random.seed(seed % (2 ** 32))
    torch.manual_seed(seed)

def run_exp(replacement_method, num_poisoned_workers, KWARGS, client_selection_strategy, idx,
            output_dir=".", num_rounds=None, record_delta_classes=None, dataset=None, extra_info=None):
    """
    Run one federated learning experiment.

    New (optional) parameters compared with the original code:

    :param output_dir: folder receiving results / logs (original: cwd)
    :param num_rounds: number of FL rounds R (default: Arguments.epochs = 200)
    :param record_delta_classes: output classes whose parameter deltas are
        recorded for the defense (Algorithm 1); None disables recording.
    :param dataset: dataset profile name (default: arguments.DEFAULT_DATASET)
    :param extra_info: dict stored in the experiment's metadata json
    """
    # Each repetition picks a different random set of malicious participants
    # and round selections, but is reproducible from its experiment id.
    seed_everything(idx)

    os.makedirs(os.path.join(output_dir, "logs"), exist_ok=True)
    log_files, results_files, models_folders, worker_selections_files = generate_experiment_ids(idx, 1)
    log_file, results_file, models_folder, worker_selections_file = [
        os.path.join(output_dir, x[0]) for x in (log_files, results_files, models_folders, worker_selections_files)]

    # Initialize logger
    handler = logger.add(log_file, enqueue=True)

    args = Arguments(logger, dataset=dataset)
    if num_rounds is not None:
        args.set_num_epochs(num_rounds)
    args.set_model_save_path(models_folder)
    args.set_num_poisoned_workers(num_poisoned_workers)
    args.set_round_worker_selection_strategy_kwargs(KWARGS)
    args.set_client_selection_strategy(client_selection_strategy)
    args.log()

    train_data_loader = load_train_data_loader(logger, args)
    test_data_loader = load_test_data_loader(logger, args)

    # Distribute batches equal volume IID
    distributed_train_dataset = distribute_batches_equally(train_data_loader, args.get_num_workers())
    distributed_train_dataset = convert_distributed_data_into_numpy(distributed_train_dataset)

    poisoned_workers = identify_random_elements(args.get_num_workers(), args.get_num_poisoned_workers())
    distributed_train_dataset = poison_data(logger, distributed_train_dataset, args.get_num_workers(), poisoned_workers, replacement_method)

    train_data_loaders = generate_data_loaders_from_distributed_dataset(distributed_train_dataset, args.get_batch_size())

    clients = create_clients(args, train_data_loaders, test_data_loader)

    recorder = None
    if record_delta_classes:
        recorder = UpdateRecorder(args.get_defense_layer_name(), record_delta_classes)

    results, worker_selection = run_machine_learning(clients, args, poisoned_workers, recorder)
    save_results(results, results_file)
    save_results(worker_selection, worker_selections_file)

    prefix = os.path.join(output_dir, str(idx))
    numpy.save(prefix + "_final_confusion.npy", clients[0].last_confusion_matrix)
    if recorder is not None:
        recorder.save(prefix + "_deltas.npz", poisoned_workers)

    metadata = {
        "experiment_id": idx,
        "dataset": args.dataset,
        "replacement_method": getattr(replacement_method, "__name__", str(replacement_method)),
        "source_class": getattr(replacement_method, "source_class", None),
        "target_class": getattr(replacement_method, "target_class", None),
        "num_workers": args.get_num_workers(),
        "num_poisoned_workers": num_poisoned_workers,
        "poisoned_workers": sorted(int(w) for w in poisoned_workers),
        "selection_strategy": type(client_selection_strategy).__name__,
        "selection_kwargs": {k: v for k, v in KWARGS.items() if k != "current_epoch_number"},
        "num_rounds": args.get_num_epochs(),
        "num_classes": args.get_num_classes(),
    }
    if extra_info:
        metadata.update(extra_info)
    with open(prefix + "_meta.json", "w") as f:
        json.dump(metadata, f, indent=2)

    logger.remove(handler)

    return metadata
