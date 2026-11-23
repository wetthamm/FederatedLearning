#!/usr/bin/env bash
# Full replication of Tolpegin et al. (ESORICS 2020) on LEAF FEMNIST.
#
# Every finished run is skipped on re-launch, so this script can be
# interrupted and restarted. Set JOBS to the number of experiments to run in
# parallel (CPU: number of cores; GPU: 2-4 per GPU usually works).
#
#   JOBS=4 ./run_all.sh
set -euo pipefail

JOBS=${JOBS:-4}
OUT=${OUT:-results}
REPS=${REPS:-10}          # paper: 10 (availability: 3)
AVAIL_REPS=${AVAIL_REPS:-3}

# source:target pairs (FEMNIST labels: 0-9 digits, 10-35 A-Z, 36-61 a-z).
# Chosen from the non-poisoned baseline's misclassification counts
# (python3 analyze.py baseline ...): frequent, middle, infrequent.
PAIRS=${PAIRS:-"24:0 2:61 10:43"}   # O->0, 2->z, A->h
# Pair used for the timing / availability / defense experiments
# (the paper used one pair per dataset for these figures).
MAIN_PAIR=${MAIN_PAIR:-"24:0"}

run() { echo "+ $*"; python3 "$@"; }

# 0. Non-poisoned baseline M_NP (independent of the pair; same seeds as below).
run label_flipping_attack.py --source 0 --target 0 --malicious-pct 0 \
    --num-exp "$REPS" --jobs "$JOBS" --output-dir "$OUT"
run analyze.py baseline "$OUT/label_flipping/0_to_0/m0" --out analysis

# 1. Sec. 3.2 feasibility: Fig. 1-2, Tables 2-3
for pair in $PAIRS; do
    s=${pair%%:*}; t=${pair##*:}
    mkdir -p "$OUT/label_flipping/${s}_to_${t}"
    ln -sfn "$(cd "$OUT/label_flipping/0_to_0/m0" && pwd)" "$OUT/label_flipping/${s}_to_${t}/m0"
    run label_flipping_attack.py --source "$s" --target "$t" --malicious-pct 2 4 10 20 30 40 50 \
        --num-exp "$REPS" --jobs "$JOBS" --output-dir "$OUT"
    run analyze.py feasibility "$OUT/label_flipping/${s}_to_${t}" --out analysis
done

s=${MAIN_PAIR%%:*}; t=${MAIN_PAIR##*:}

# 2. Sec. 3.3 attack timing: Fig. 3-4, Table 4
run attack_timing.py --source "$s" --target "$t" --mode early late \
    --num-exp "$REPS" --jobs "$JOBS" --output-dir "$OUT"
run analyze.py timing "$OUT/attack_timing/${s}_to_${t}" \
    --baseline-dir "$OUT/label_flipping/0_to_0/m0" \
    --table4-dirs "$OUT/attack_timing/${s}_to_${t}/late" $(ls -d "$OUT/label_flipping/${s}_to_${t}"/m[1-9]*) \
    --out analysis

# 3. Sec. 3.4 availability: Fig. 5-7
run malicious_participant_availability.py --source "$s" --target "$t" \
    --alpha 0.6 0.7 0.8 0.9 --malicious-pct 2 4 10 14 20 \
    --num-exp "$AVAIL_REPS" --jobs "$JOBS" --output-dir "$OUT"
run analyze.py availability "$OUT/availability/${s}_to_${t}" \
    --baseline-dir "$OUT/label_flipping/0_to_0/m0" --out analysis

# 4. Sec. 4 defense: Fig. 8 (one run per m, deltas recorded)
run label_flipping_attack.py --source "$s" --target "$t" --malicious-pct 2 4 10 20 \
    --num-exp 1 --start-idx 9000 --record-deltas --jobs "$JOBS" --output-dir "$OUT/defense"
for m in 2 4 10 20; do
    run defense.py "$OUT/defense/label_flipping/${s}_to_${t}/m${m}/9000_deltas.npz" --source "$s" \
        --save "analysis/fig8_defense_${s}_to_${t}_m${m}.png" --title "m = ${m}%"
done
