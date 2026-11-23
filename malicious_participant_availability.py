"""
Sec. 3.4 - Malicious participant availability (Fig. 5, 6, 7).

Late-round poisoning (r >= 75) where each of the k slots in a round is
filled by a malicious participant with probability alpha.

Example (paper grid, 3 repetitions):
    python3 malicious_participant_availability.py --source 24 --target 0 \
        --alpha 0.6 0.7 0.8 0.9 --malicious-pct 2 4 10 14 20 --num-exp 3 --jobs 4
"""
import os

from experiment_cli import base_parser, num_poisoned, pair_name, run_jobs
from federated_learning.worker_selection import PoisonerProbability

if __name__ == '__main__':
    parser = base_parser(__doc__)
    parser.add_argument("--alpha", type=float, nargs="+", default=[0.6, 0.7, 0.8, 0.9])
    parser.add_argument("--malicious-pct", type=float, nargs="+", default=[2, 4, 10, 14, 20])
    parser.add_argument("--breakpoint", type=int, default=75)
    parser.set_defaults(num_exp=3)
    cli = parser.parse_args()

    jobs = []
    for alpha in cli.alpha:
        for pct in cli.malicious_pct:
            out = os.path.join(cli.output_dir, "availability", pair_name(cli), "alpha{:g}_m{:g}".format(alpha, pct))
            for experiment_id in range(cli.start_idx, cli.start_idx + cli.num_exp):
                jobs.append(dict(
                    num_poisoned_workers=num_poisoned(pct),
                    KWARGS={
                        "PoisonerProbability_BREAK_EPOCH": cli.breakpoint,
                        "PoisonerProbability_POST_BREAK_EPOCH_PROBABILITY": alpha,
                        "PoisonerProbability_PRE_BREAK_EPOCH_PROBABILITY": 0.0,
                        "PoisonerProbability_NUM_WORKERS_PER_ROUND": cli.workers_per_round,
                    },
                    client_selection_strategy=PoisonerProbability(),
                    idx=experiment_id,
                    output_dir=out,
                    extra_info={"experiment": "availability", "alpha": alpha,
                                "malicious_pct": pct, "breakpoint": cli.breakpoint}))

    run_jobs(cli, jobs)
