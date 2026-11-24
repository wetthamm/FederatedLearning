# FEMNIST results vs. Tolpegin et al. (ESORICS 2020)

The paper's numbers are from its Tables 2–4 and Sec. 3.2–3.3. The FEMNIST numbers are
for `O` → `0` with 3 runs per attack level (2 at 50%) and a 10-run baseline.

## Loss in source-class recall (paper Table 2 format)

| Pair | Baseline m_cnt | 2% | 4% | 10% | 20% | 30% | 40% | 50% |
|---|---|---|---|---|---|---|---|---|
| CIFAR-10 0→2 | 16 | 1.42 | 2.93 | 10.2 | 14.1 | 48.3 | 73.0 | 70.5 |
| CIFAR-10 1→9 | 56 | 0.69 | 3.75 | 6.04 | 15.0 | 36.3 | 49.2 | 54.7 |
| CIFAR-10 5→3 | 200 | 0 | 3.21 | 7.92 | 25.4 | 49.5 | 69.2 | 69.2 |
| F-MNIST 1→3 | 18 | 0.12 | 0.42 | 2.27 | 2.41 | 40.3 | 45.4 | 42.0 |
| F-MNIST 4→6 | 51 | 0.61 | 7.16 | 16.0 | 29.2 | 28.7 | 37.1 | 58.9 |
| F-MNIST 6→0 | 118 | −1 | 2.19 | 7.34 | 9.81 | 19.9 | 39.0 | 43.4 |
| **FEMNIST O→0** | **72** | **−2.2** | **−0.2** | **6.4** | **7.4** | **17.2** | **42.8** | **68.0** |

## Targeted nature (Table 3, m = 10%)

| Pair | Δ src recall | Δ target recall | Σ Δ other classes |
|---|---|---|---|
| CIFAR-10 (3 pairs) | −6.1 to −6.3 | +1.6 to +3.0 | 0.16 to 0.34 (8 classes) |
| F-MNIST (3 pairs) | −2.2 to −10.0 | +0.3 to +2.6 | 0.01 to 0.20 (8 classes) |
| **FEMNIST O→0** | **−6.4** | **+5.6** | **+2.8 (60 classes, ≈ +0.05 per class)** |

## Malicious participants in the final round (Table 4 idea, applied to full-length attacks)

| m | Final `O` recall, ≥ 1 malicious in round 200 | Final `O` recall, none in round 200 |
|---|---|---|
| 10–30% (9 runs) | 62.2 (6 runs) | 70.2 (3 runs) |
| 40–50% (5 runs) | 22.3 (all 5 runs) | — |

Baseline M_NP: 75.2. Round-to-round std of `O` recall over the last 50 rounds: 2.7 without
an attack, 9–23 with one.
