"""
Shared command-line handling for the experiment scripts.

The original scripts hard-coded every setting at the top of the file and ran
one configuration at a time. These helpers expose the same settings as
command-line flags and run (configuration x repetition) jobs in parallel
processes, which matters on CPU-only machines.
"""
import argparse
import multiprocessing
import os
import traceback

from federated_learning.utils import LabelFlip

NUM_WORKERS = 50  # N in the paper


def base_parser(description):
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--source", type=int, required=True, help="c_src (FEMNIST: 0-9 digits, 10-35 A-Z, 36-61 a-z)")
    parser.add_argument("--target", type=int, required=True, help="c_target")
    parser.add_argument("--num-exp", type=int, default=10, help="repetitions per setting (paper: 10, availability: 3)")
    parser.add_argument("--start-idx", type=int, default=3000, help="first experiment id (also the random seed)")
    parser.add_argument("--rounds", type=int, default=200, help="FL rounds R (paper: 200)")
    parser.add_argument("--workers-per-round", type=int, default=5, help="k (paper: 5)")
    parser.add_argument("--output-dir", default="results")
    parser.add_argument("--jobs", type=int, default=1, help="experiments run in parallel")
    parser.add_argument("--threads", type=int, default=0, help="torch threads per job (0 = cpu_count // jobs)")
    parser.add_argument("--record-deltas", action="store_true",
                        help="record source-class output-node parameter deltas for the defense (Algorithm 1)")
    parser.add_argument("--record-all-classes", action="store_true",
                        help="with --record-deltas: record every class (for an unknown c_src); larger files")
    parser.add_argument("--save-final-model", action="store_true",
                        help="also save the final global model as <id>_final_model.pt (for demo.py)")
    parser.add_argument("--dataset", default=None, help="dataset profile (default: femnist)")
    return parser


def num_poisoned(malicious_pct):
    return int(round(NUM_WORKERS * malicious_pct / 100.0))


def pair_name(cli):
    return "{}_to_{}".format(cli.source, cli.target)


def _run_job(job):
    import torch
    torch.set_num_threads(job.pop("threads"))
    import sys
    from loguru import logger
    # Full DEBUG log still goes to <output_dir>/logs/<id>.log; keep the
    # console readable (and fast) when several experiments run at once.
    logger.remove()
    logger.add(sys.stderr, level=os.environ.get("FL_CONSOLE_LOG_LEVEL", "WARNING"))
    from server import run_exp
    try:
        return run_exp(**job)
    except Exception:
        traceback.print_exc()
        raise


def run_jobs(cli, jobs):
    """
    :param jobs: list of dicts with run_exp keyword arguments (without
        replacement_method / record_delta_classes / num_rounds / dataset)
    """
    threads = cli.threads or max(1, (os.cpu_count() or 1) // max(1, cli.jobs))
    flip = LabelFlip(cli.source, cli.target)
    record = None
    if cli.record_deltas:
        record = list(range(62 if cli.dataset in (None, "femnist") else 10)) if cli.record_all_classes else [cli.source]

    full_jobs = []
    for job in jobs:
        if os.path.exists(os.path.join(job["output_dir"], "{}_meta.json".format(job["idx"]))):
            print("skip (done): {} #{}".format(job["output_dir"], job["idx"]))
            continue
        job = dict(job)
        job.update(replacement_method=flip, num_rounds=cli.rounds, record_delta_classes=record,
                   dataset=cli.dataset, threads=threads, save_final_model=cli.save_final_model)
        full_jobs.append(job)

    print("Running {} experiment(s), {} in parallel, {} torch thread(s) each".format(len(full_jobs), cli.jobs, threads))
    if cli.jobs <= 1:
        for job in full_jobs:
            _run_job(job)
    else:
        ctx = multiprocessing.get_context("spawn")
        with ctx.Pool(cli.jobs, maxtasksperchild=1) as pool:
            for meta in pool.imap_unordered(_run_job, full_jobs):
                print("finished experiment {}".format(meta["experiment_id"]))
