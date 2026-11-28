# Presentation requirements: where each item is covered

There are two decks. Both use the team's gold-and-blue style.

* `FEMNIST_label_flipping.pptx` (21 slides) has the same structure as the team's demo
  presentation and holds all the required items below.
* `FEMNIST_label_flipping_8slides.pptx` is the talk for your part of the project, with the
  same structure as the team's workshop presentation. Its speaker notes are timed to about
  5 minutes.

Slide numbers below refer to the 21-slide deck. Items marked **YOU** need your input.

## (1) Demo: workflow, input data, processing, output

| Requirement | Slide(s) | Notes |
|---|---|---|
| Screenshots or video of the workflow | 9 | Real console output of a short run, with the input, processing and output called out. **YOU:** a video, if the rubric asks for one (commands below). |
| Data source URL | 3, 21 | NIST SD19 → LEAF FEMNIST. Links are on slide 21. |
| Size and structure of the data | 3 | 81,766 images, 378 writers, 28×28 grayscale, 62 classes. |
| Samples per class, train and test | 3, 11 | Per-class ranges, plus 'O' and 'A' counts. The full list is in `analysis/femnist_class_counts.json`. |
| 5–10 training examples | 3 | 10 real training images. |
| Train : test ratio | 3 | 90 : 10 within each writer (73,425 : 8,341). |
| Processing components you contributed | 5–8, 21 | Code walkthroughs, pipeline, and the appendix table of additions. |
| Code walkthrough | 5, 6, 7 | Attack implementation, core defense, training and evaluation. |
| Output results and statistics | 12–19 | Attack results, sample analysis, defense. |
| Latency and throughput | 11 | 0.36 ms per image; 7,074 images/s (1 thread) to 25,940 images/s (4 threads); 7.3 s per round; 24 min per run. |
| Confidence of the top-1 class and the remaining classes | 16 | Top-1, next 4, and the other 58 classes, for clean and attacked models. |

## (2) System architecture

| Requirement | Slide(s) | Notes |
|---|---|---|
| How the dataset, components and models fit together | 8 | Experiment flow. |
| Algorithms and configuration | 7, 10, 11 | Training loop, CNN and training settings, metrics. |
| What you modified to improve training results | 10, 21 | Hyperparameters were deliberately **not** tuned (the original study's settings, for comparability). Say this explicitly if the rubric expects tuning. |
| Download links and acknowledgements | 21 | Paper, DataPoisoning_FL, LEAF, NIST SD19, libraries. No pre-trained models were used. |

## (3) What the project added on top of open source

| Requirement | Slide(s) | Notes |
|---|---|---|
| Summary of additions | 21 | 1,590 lines added and 235 removed across 24 code files. |
| New test datasets you created | 17 | FEMNIST easy/hard split and a font-rendered set of 1,984 images. |
| Comparison over multiple models | 17 | Clean vs. the two attacked models on easy, hard and self-made data. |

## What only you can provide

1. **Names and roles** on the title slides.
2. **AI-assistance disclosure.** The code changes, experiments, charts and slides in this
   repository were produced with Claude Code (an AI assistant). If your course policy asks
   for a disclosure, add a line to slide 21.
3. **Video (optional):**
   ```bash
   FL_CONSOLE_LOG_LEVEL=INFO python3 label_flipping_attack.py --source 24 --target 0 \
       --malicious-pct 10 --num-exp 1 --rounds 3 --output-dir demo_out
   python3 demo.py --model results_models/label_flipping/0_to_0/m0/3000_final_model.pt \
       --model results_models/label_flipping/24_to_0/m50/3000_final_model.pt --index 3196
   ```
4. **Your own handwriting (optional):** photograph a few handwritten characters and run
   `python3 demo.py --model ... --image my_letter.png`.

## Building the decks

The charts are in `writeup/deck_charts/gold/`, made by `charts.py`, `charts_defense.py` and
`charts_system.py --models` in that folder. Both decks are built with
`node writeup/deck_charts/build_gold.js short|full <out.pptx>`, which needs pptxgenjs and sharp.
Text is set in Aptos, as in the team decks. It is the default font in current PowerPoint; on
machines without it, PowerPoint substitutes another font.
