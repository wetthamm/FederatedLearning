# Presentation requirements: where each item is covered

Slide numbers refer to `FEMNIST_label_flipping.pptx` (31 slides). Items marked **YOU** need your
input; everything else is already in the deck.

## (1) Demo: workflow, input data, processing, output

| Requirement | Slide(s) | Notes |
|---|---|---|
| Screenshots or video of the workflow | 23, 25 | Real console output of a 3-round run and of `demo.py`. **YOU:** a video, if your rubric asks for one rather than screenshots (script below). |
| Data source URL | 3, 30 | NIST SD19 → LEAF FEMNIST. Links are on slide 30. |
| Size and structure of the data | 3, 8 | 378 writers, 81,766 images, 28×28 grayscale, labels 0–61, JSON grouped by writer. |
| Samples per class, train and test | 3 | Bar chart of all 62 classes, plus a min–max table by group. The full list is in `analysis/femnist_class_counts.json`. |
| 5–10 training examples | 4 | 10 real training images with their labels. |
| Train : test ratio | 4 | 90 : 10 (73,425 : 8,341), split per writer by LEAF. |
| Processing components you contributed | 6, 29 | The architecture slide color-codes: open source as is / modified / written by us. |
| Code walkthrough | 7, 20 | Label-flip attack and update recorder; the defense's participant rule. |
| Output results and statistics | 10–18, 21, 25 | Attack results, defense results, output statistics. |
| Latency and throughput | 25 | 0.36 ms per image; 7,074 images/s (1 thread) to 25,940 images/s (4 threads); 7.3 s per FL round; 24 min per run. |
| Confidence of the top-1 class and the remaining classes | 24, 25 | Per-image bars (top-1, next 4, the other 58), plus mean top-1 confidence and the mean mass on the other 61 classes. |

## (2) System architecture

| Requirement | Slide(s) | Notes |
|---|---|---|
| How the dataset, components and models fit together | 6 | Three lanes: data, federated training, analysis and outputs. |
| Analysis and training procedure, algorithms, configuration | 2, 5, 8, 19–20 | FedAvg, SGD settings, CNN layers, run design, the defense algorithm. |
| What you modified to improve training results | 5, 29 | We deliberately **did not** tune hyperparameters: we kept the original study's settings so the results stay comparable, and slide 5 says so. If your rubric expects tuning, say this explicitly, or ask me to run a small learning-rate or epoch sweep. |
| Download links and acknowledgements for existing code and pre-trained models | 30 | Paper, DataPoisoning_FL (commit 467eca0), LEAF (commit 09ec454), NIST SD19, libraries. No pre-trained models were used; every model is trained from scratch. |

## (3) What the project added on top of open source

| Requirement | Slide(s) | Notes |
|---|---|---|
| Summary of additions | 29 | 8 groups of additions: 1,590 lines added and 235 removed across 24 code files. |
| New test datasets you created | 26 | FEMNIST easy/hard split (by look-alike classes, fixed before testing), and a font-rendered set of 1,984 images outside FEMNIST (`tools/make_test_sets.py`). |
| Comparison over multiple models on easy, hard and your own data | 26 | Clean model vs. the `O`→`0` and `A`→`h` models (50% malicious): accuracy, confidence, attacked-letter recall. |

## What only you can provide

1. **Names and roles.** The title slide has no names, and slides 6 and 29 say "we". If this is a
   group project, add your names and say who did what.
2. **AI-assistance disclosure.** The code changes, experiments, charts and slides in this
   repository were produced with Claude Code (an AI assistant) working in this repository.
   Check your course policy. If it asks for a disclosure, add a line to slide 30 (for example,
   "Implementation and analysis assisted by Claude Code").
3. **Video (optional).** If the rubric needs a video, screen-record about 60 seconds:
   ```bash
   FL_CONSOLE_LOG_LEVEL=INFO python3 label_flipping_attack.py --source 24 --target 0 \
       --malicious-pct 10 --num-exp 1 --rounds 3 --output-dir demo_out
   python3 demo.py --model results_models/label_flipping/0_to_0/m0/3000_final_model.pt \
       --model results_models/label_flipping/24_to_0/m50/3000_final_model.pt --index 3196
   python3 demo.py --model results_models/label_flipping/0_to_0/m0/3000_final_model.pt --benchmark
   ```
   This needs the LEAF data and `data_loaders/` on your machine (see README). The three models
   are committed under `results_models/`.
4. **Your own handwriting (optional, strengthens item 3).** Write a few `O`, `0`, `A` and `h` on
   paper, photograph each one (dark ink on light paper, any size), and run
   `python3 demo.py --model ... --image my_O.png`. `demo.py` crops, centers and scales the
   image to FEMNIST's format. A slide comparing the clean and attacked models on your own
   writing would be a strong test case. Send me the photos and I can add it.

## The two decks

* `FEMNIST_label_flipping.pptx` (31 slides) keeps everything together, including all the
  required items above.
* `FEMNIST_label_flipping_5slides.pptx` is the 5-minute talk for your part of the project: a
  quick overview, then the test results and the conclusions. Speaker notes are timed to
  about 5 minutes:
  1. Setup: model and attack (1:00)
  2. The attacked letter collapses at 20%+ attackers (1:15)
  3. The model learns exactly the lie it was taught (0:45)
  4. Overall accuracy barely moves (1:00)
  5. What we can conclude (1:00)
