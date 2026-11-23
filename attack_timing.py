"""
Sec. 3.3 - Attack timing (Fig. 3, 4; Table 4).

  --mode early : malicious participants can only be selected before the
                 breakpoint round (r < 75)   [original: AfterBreakpoint]
  --mode late  : malicious participants can only be selected from the
                 breakpoint round on (r >= 75) [original: BeforeBreakpoint]

The original attack_timing.py used 25 poisoned workers (m = 50%), which is
kept as the default here.

Example:
    python3 attack_timing.py --source 24 --target 0 --mode early late --num-exp 10 --jobs 4
"""
import os

from experiment_cli import base_parser, num_poisoned, pair_name, run_jobs
from federated_learning.worker_selection import AfterBreakpoint, BeforeBreakpoint

if __name__ == '__main__':
    parser = base_parser(__doc__)
    parser.add_argument("--mode", nargs="+", choices=["early", "late"], default=["early", "late"])
    parser.add_argument("--malicious-pct", type=float, default=50)
    parser.add_argument("--breakpoint", type=int, default=75)
    cli = parser.parse_args()

    jobs = []
    for mode in cli.mode:
        strategy = AfterBreakpoint() if mode == "early" else BeforeBreakpoint()
        out = os.path.join(cli.output_dir, "attack_timing", pair_name(cli), mode)
        for experiment_id in range(cli.start_idx, cli.start_idx + cli.num_exp):
            jobs.append(dict(
                num_poisoned_workers=num_poisoned(cli.malicious_pct),
                KWARGS={
                    "BeforeBreakPoint_EPOCH": cli.breakpoint,
                    "BeforeBreakpoint_NUM_WORKERS_PER_ROUND": cli.workers_per_round,
                    "AfterBreakPoint_EPOCH": cli.breakpoint,
                    "AfterBreakpoint_NUM_WORKERS_PER_ROUND": cli.workers_per_round,
                },
                client_selection_strategy=strategy,
                idx=experiment_id,
                output_dir=out,
                extra_info={"experiment": "attack_timing", "mode": mode,
                            "malicious_pct": cli.malicious_pct, "breakpoint": cli.breakpoint}))

    run_jobs(cli, jobs)
