"""
Sec. 3.2 - Label flipping attack feasibility (Fig. 1, 2; Tables 2, 3).

Malicious participants are a random m% of the N=50 participants and every
round selects k=5 participants uniformly at random. m=0 gives the
non-poisoned baseline M_NP.

Example (FEMNIST, one source->target pair, the paper's grid of m):
    python3 label_flipping_attack.py --source 24 --target 0 \
        --malicious-pct 0 2 4 10 20 30 40 50 --num-exp 10 --jobs 4
"""
import os

from experiment_cli import base_parser, num_poisoned, pair_name, run_jobs
from federated_learning.worker_selection import RandomSelectionStrategy

if __name__ == '__main__':
    parser = base_parser(__doc__)
    parser.add_argument("--malicious-pct", type=float, nargs="+", default=[10],
                        help="m%% values (paper: 2 4 10 20 30 40 50; 0 = no poisoning)")
    cli = parser.parse_args()

    jobs = []
    for pct in cli.malicious_pct:
        out = os.path.join(cli.output_dir, "label_flipping", pair_name(cli), "m{:g}".format(pct))
        for experiment_id in range(cli.start_idx, cli.start_idx + cli.num_exp):
            jobs.append(dict(
                num_poisoned_workers=num_poisoned(pct),
                KWARGS={"NUM_WORKERS_PER_ROUND": cli.workers_per_round},
                client_selection_strategy=RandomSelectionStrategy(),
                idx=experiment_id,
                output_dir=out,
                extra_info={"experiment": "label_flipping", "malicious_pct": pct}))

    run_jobs(cli, jobs)
