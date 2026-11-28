# Data Poisoning Attacks Against FL — replication on LEAF FEMNIST

This repository re-runs the experiments of

> V. Tolpegin, S. Truex, M. E. Gursoy, L. Liu. *Data Poisoning Attacks Against
> Federated Learning Systems.* ESORICS 2020. [arXiv:2007.08432](https://arxiv.org/abs/2007.08432)

on a different dataset: **FEMNIST** from the [LEAF benchmark](https://github.com/TalwalkarLab/leaf)
(handwritten digits and letters, 62 classes, 28×28 grayscale).

It is built on the authors' code, [git-disl/DataPoisoning_FL](https://github.com/git-disl/DataPoisoning_FL)
(commit `467eca0`). The first commit in this repository is an unmodified copy of that code, so
`git diff 7ca82d3` shows every change made for FEMNIST.

## What is kept from the paper

| Setting | Paper | Here |
|---|---|---|
| Participants N / per round k / rounds R | 50 / 5 / 200 | same |
| Local training | 1 epoch SGD per selected participant | same |
| Aggregation | plain average of the k models (FedAvg) | same code |
| Data partition | IID, equal share per participant | same code (`distribute_batches_equally`) |
| Attack | label flip c_src → c_target on every malicious participant | same |
| Malicious participants | random m% of N, re-drawn per repetition | same |
| Repetitions | 10 (availability: 3) | same defaults |
| Model | Fashion-MNIST CNN (2 conv + BN, 1 FC) | same CNN, output layer 10 → **62** |
| Hyperparameters | batch 4, lr 0.001, momentum 0.9, StepLR(10, 0.1) | same (Fashion-MNIST settings) |
| Timing breakpoint / α grid / defense rounds | 75 / {0.6…0.9} / [10, 200] | same |

## What changed for FEMNIST

* **Data** (`federated_learning/datasets/femnist.py`): reads LEAF's train/test JSON
  (LEAF's default 10% sample of FEMNIST, split per writer 90/10): **73,425 train / 8,341 test**
  images, similar in size to Fashion-MNIST (60k/10k). All writers' samples are pooled
  and then split IID across the 50 participants, as in the paper. Pixels stay in [0, 1]
  with no further preprocessing, as for Fashion-MNIST.
* **Model** (`federated_learning/nets/femnist_cnn.py`): `FEMNISTCNN`, the paper's
  Table 6 network with 62 outputs.
* **Attack pairs**: picked the paper's way, from the misclassification counts m_cnt of the
  non-poisoned model: a pair the model often confuses, one it rarely confuses, and one in
  between. See [Choosing the source → target pairs](#choosing-the-source--target-pairs).
* **Class imbalance**: FEMNIST is unbalanced, unlike CIFAR-10 and Fashion-MNIST. Test samples
  per class range from 18 to 453, with a median of 61, and many lowercase letters are rare.
  Per-class recall on rare classes is noisy, so candidate source classes must have at least
  50 test samples (`--min-support`).

## Engineering changes (behavior otherwise unchanged)

* `LabelFlip(src, tgt)` replaces the hand-written `replace_X_with_Y` functions.
* The experiment scripts take command-line flags instead of constants edited at the top of
  each file. They run repetitions in parallel (`--jobs`) and skip runs that already
  finished, so a long grid can be restarted.
* Each run is seeded by its experiment id. Runs with the same id use the same malicious set
  and the same round selections, so poisoned and non-poisoned runs can be compared pair by
  pair. Each run writes `<id>_results.csv`, `<id>_workers_selected.csv`, `<id>_meta.json`
  (settings and malicious ids), `<id>_final_confusion.npy` and `logs/<id>.log`.
* **Defense**: the original code saved every client model to disk (≈900 MB per run here)
  and rebuilt the deltas afterwards. Now `--record-deltas` records θ_Δ for the
  source-class output node during training (`<id>_deltas.npz`, a few MB). `defense.py` runs
  Algorithm 1 on that file (standardize, then 2-component PCA, then plot). It also prints a
  k-means agreement score that is **not in the paper**.
* `analyze.py` produces Tables 2–4 and Figures 1–7.
* Bug fixes needed for 62 classes:
  * `poison_data` built the class list from worker 0's data only, which crashed when another
    worker held a class worker 0 lacked.
  * The confusion matrix is now always 62×62.
* Updated to current PyTorch, Python 3.13 and CPU-only machines.

Some quirks of the original code are kept on purpose, so the results stay comparable:

* Each client keeps its own SGD momentum buffer and learning-rate schedule.
* The learning rate decays per local epoch that a client trains, not per global round.
* The timing experiment uses m = 50% (25 poisoned workers), the original `attack_timing.py`
  default.

## Setup

```bash
pip install -r requirements.pip

# 1. FEMNIST through LEAF (downloads ~1.4 GB of NIST images, ~15 min)
git clone https://github.com/TalwalkarLab/leaf
cd leaf/data/femnist
sed -i 's/Image.ANTIALIAS/Image.LANCZOS/' preprocess/data_to_json.py   # Pillow >= 10
./preprocess.sh -s niid --sf 0.1 -k 0 -t sample --tf 0.9 \
    --smplseed 1549786595 --spltseed 1549786796
cd -

# 2. point this repo at LEAF's output
mkdir -p data/leaf_femnist
ln -s /path/to/leaf/data/femnist/data/train data/leaf_femnist/train
ln -s /path/to/leaf/data/femnist/data/test  data/leaf_femnist/test
#    (or: export LEAF_FEMNIST_PATH=/path/to/leaf/data/femnist/data)

# 3. fixed train/test loaders and the shared initial model theta_0
python3 generate_data_distribution.py      # --datasets femnist fashion-mnist cifar10
python3 generate_default_models.py
```

The original datasets still work: run `FL_DATASET=fashion-mnist` or `FL_DATASET=cifar10`,
or pass `--dataset`.

## Running the experiments

`./run_all.sh` runs the whole replication. Set `JOBS=<parallel runs>`. The individual steps:

| Paper | Command | Outputs (`analysis/`) |
|---|---|---|
| Baseline M_NP and pair choice | `python3 label_flipping_attack.py --source 0 --target 0 --malicious-pct 0 --num-exp 10 --jobs 4`<br>`python3 analyze.py baseline results/label_flipping/0_to_0/m0` | `baseline_top_confusions.csv`, `baseline_mcnt_matrix.csv` |
| §3.2 Feasibility | `python3 label_flipping_attack.py --source S --target T --malicious-pct 2 4 10 20 30 40 50 --num-exp 10 --jobs 4`<br>`python3 analyze.py feasibility results/label_flipping/S_to_T` (link the baseline `m0` folder into `S_to_T/` first, as `run_all.sh` does) | Fig. 1, Fig. 2, Table 2, Table 3 |
| §3.3 Attack timing | `python3 attack_timing.py --source S --target T --mode early late --num-exp 10 --jobs 4`<br>`python3 analyze.py timing results/attack_timing/S_to_T --baseline-dir results/label_flipping/0_to_0/m0` | Fig. 3, Fig. 4, Table 4 |
| §3.4 Availability | `python3 malicious_participant_availability.py --source S --target T --alpha 0.6 0.7 0.8 0.9 --malicious-pct 2 4 10 14 20 --num-exp 3 --jobs 4`<br>`python3 analyze.py availability results/availability/S_to_T` | Fig. 5, Fig. 6, Fig. 7 |
| §4 Defense | `python3 label_flipping_attack.py --source S --target T --malicious-pct 10 --num-exp 1 --record-deltas`<br>`python3 defense.py results/label_flipping/S_to_T/m10/3000_deltas.npz --source S` | Fig. 8 |

FEMNIST labels: `0–9` are digits, `10–35` are `A–Z`, `36–61` are `a–z`.

**Cost.** On 4 CPU cores with no GPU, a 200-round run takes about 7 minutes of machine time
when 4 runs go in parallel. The full grid in `run_all.sh` is about 480 runs (≈56 h on that
machine). A GPU cuts this a lot: clients use `cuda:0` automatically when it is available.
To get every table and figure from a cheaper grid, lower the repetitions (`REPS=3`) and the
values of m.

## Demo, extra test sets and model comparison

```bash
# train and keep the final global model (clean run and two attacked runs, seed 3000)
python3 label_flipping_attack.py --source 0  --target 0  --malicious-pct 0  --num-exp 1 --save-final-model --output-dir results_models
python3 label_flipping_attack.py --source 24 --target 0  --malicious-pct 50 --num-exp 1 --save-final-model --output-dir results_models
python3 label_flipping_attack.py --source 10 --target 43 --malicious-pct 50 --num-exp 1 --save-final-model --output-dir results_models

# top-1 and remaining-class confidence for one image, a class, or your own photo
python3 demo.py --model results_models/label_flipping/0_to_0/m0/3000_final_model.pt --index 3196
python3 demo.py --model results_models/label_flipping/0_to_0/m0/3000_final_model.pt --image my_letter.png
python3 demo.py --model results_models/label_flipping/0_to_0/m0/3000_final_model.pt --benchmark

# FEMNIST easy/hard split and our font-rendered test set, then compare the three models
python3 tools/make_test_sets.py --out data/extra_test_sets
python3 compare_models.py --out analysis/model_comparison.json
```

The three final models are committed under `results_models/`. They match the corresponding
runs in `results/` exactly, because runs are seeded by their id.

## Choosing the source → target pairs

Following the paper, the pairs come from the misclassification counts m_cnt of the
non-poisoned model M_NP. m_cnt(c_src, c_target) is the average number of c_src test samples
that M_NP labels as c_target (`python3 analyze.py baseline results/label_flipping/0_to_0/m0`).

**Baseline M_NP**: 10 runs, 200 rounds, final test accuracy **86.04% ± 0.09**.

Most-confused pairs (mean over the 10 runs; full list in `analysis/baseline_top_confusions.csv`):

| c_src → c_target | m_cnt | c_src test samples | c_src recall |
|---|---|---|---|
| `l` (47) → `1` (1) | 109.3 | 198 | 33.1% |
| `O` (24) → `0` (0) | 72.3 | 299 | 75.2% |
| `0` (0) → `O` (24) | 65.4 | 446 | 82.8% |
| `I` (18) → `1` (1) | 31.7 | 136 | 65.1% |
| `1` (1) → `l` (47) | 30.3 | 453 | 90.6% |
| `S` (28) → `5` (5) | 18.7 | 262 | 91.0% |

Chosen pairs (all sources have ≥ 50 test samples, and each target is the source's most
common or second most common mistake):

| Role | Pair | Labels | m_cnt | c_src recall in M_NP |
|---|---|---|---|---|
| frequent (**main pair**: timing, availability, defense) | `O` → `0` | 24 → 0 | 72.3 | 75.2% (n = 299) |
| middle | `2` → `z` | 2 → 61 | 4.4 | 95.7% (n = 425) |
| infrequent | `A` → `h` | 10 → 43 | 1.6 | 92.5% (n = 73) |

The analyzer's top suggestion, `l` → `1`, was skipped. Even without an attack `l` is
recognized correctly only 33% of the time, because `l`, `1` and `I` look almost identical
in handwriting. That leaves little recall for an attack to destroy. `O` → `0` is the
same kind of visually confusable pair with a usable baseline. To use other pairs, run
`PAIRS="47:1 ..." MAIN_PAIR="47:1" ./run_all.sh`.

## Citing

```
@inproceedings{tolpegin2020data,
  title={Data Poisoning Attacks Against Federated Learning Systems},
  author={Tolpegin, Vale and Truex, Stacey and Gursoy, Mehmet Emre and Liu, Ling},
  booktitle={ESORICS},
  year={2020}
}
@article{caldas2018leaf,
  title={LEAF: A Benchmark for Federated Settings},
  author={Caldas, Sebastian and others},
  journal={arXiv:1812.01097},
  year={2018}
}
```
