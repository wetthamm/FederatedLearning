const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require("/root/.claude/skills/synced/c42677ab-b6a8-485a-a615-1decc50acf83_8f1654df-3954-464c-8b77-c207b511b634/pptx/scripts/apply_theme.js");
const curves = null;

const OUT = process.argv[2];

const THEME = {
  name: "Poisoned Ink",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1B2433", lt1: "FFFFFF", dk2: "4A5568", lt2: "EEF1F5",
    accent1: "D9480F", accent2: "1F8A70", accent3: "8A94A6", accent4: "E9A23B",
    accent5: "3D5A80", accent6: "B8C4D6", hlink: "3D5A80", folHlink: "6B4E9B",
  },
};
const HEX = THEME.colors;
const PAIR2 = "2E6DB4", FMN = "B7832A", CIF = "7D879A";
const ATTACK = HEX.accent1, HONEST = HEX.accent2, PAPER = HEX.accent3, INK = HEX.dk1, MUTED = HEX.dk2;

const W = 13.333, H = 7.5, MX = 0.6;

async function icon(Comp, color = "FFFFFF") {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "Label Flipping Attacks on Federated FEMNIST";
  pres.subject = "Replication of Tolpegin et al. (ESORICS 2020) on LEAF FEMNIST";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  // ---------- layouts
  pres.defineSlideMaster({
    title: "Title Dark",
    background: { color: C.text1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: MX, y: 2.3, w: 8.2, h: 1.9, fontSize: 40, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: MX, y: 4.45, w: 8.0, h: 2.2, fontSize: 18, color: C.accent6, valign: "top", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "Content",
    background: { color: C.background1 },
    margin: [0.5, 0.6, 0.6, 0.6],
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: MX, y: 0.35, w: W - 2 * MX, h: 0.85, fontSize: 32, bold: true, color: C.text1, valign: "middle", align: "left", margin: 0 }, text: "" } },
      { text: { text: "Label flipping on federated FEMNIST  ·  replication of Tolpegin et al., ESORICS 2020", options: { x: MX, y: 7.0, w: 9, h: 0.3, fontSize: 10, color: C.text2, margin: 0 } } },
    ],
    slideNumber: { x: W - MX - 0.6, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: C.text2, align: "right", margin: 0 },
  });

  const ic = {
    users: await icon(fa.FaUsers), eye: await icon(fa.FaEyeSlash), target: await icon(fa.FaBullseye),
    flag: await icon(fa.FaFlagCheckered), check: await icon(fa.FaCheck), cross: await icon(fa.FaTimes),
    shield: await icon(fa.FaShieldAlt), layers: await icon(fa.FaLayerGroup), random: await icon(fa.FaRandom),
    redo: await icon(fa.FaRedo), clock: await icon(fa.FaClock), sliders: await icon(fa.FaSlidersH),
  };
  const iconCircle = (slide, data, x, y, d, fill, name) => {
    slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill }, objectName: name + " circle" });
    const p = d * 0.25;
    slide.addImage({ data, x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, objectName: name + " icon", altText: name });
  };
  const chartText = { catAxisLabelColor: MUTED, valAxisLabelColor: MUTED, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
    catAxisLabelFontSize: 12, valAxisLabelFontSize: 12, legendFontFace: "+mn-lt", legendFontSize: 12, legendColor: INK,
    valGridLine: { color: "DDE2EA", size: 0.75 }, catGridLine: { style: "none" }, titleFontFace: "+mn-lt", titleColor: INK, titleFontSize: 14,
    catAxisTitleColor: MUTED, valAxisTitleColor: MUTED, catAxisTitleFontSize: 12, valAxisTitleFontSize: 12, catAxisTitleFontFace: "+mn-lt", valAxisTitleFontFace: "+mn-lt",
    catAxisLineShow: true, valAxisLineShow: false };
  const caption = (slide, text, y = 6.55) => slide.addText(text, { x: MX, y, w: W - 2 * MX, h: 0.35, fontSize: 11, italic: true, color: C.text2, margin: 0, isTextBox: true, objectName: "Source note" });

  // participant dot grid motif: 10 x 5, malicious ids drawn in attack color
  const dotGrid = (slide, x0, y0, d, gap, malicious, honestColor, name) => {
    for (let i = 0; i < 50; i++) {
      const r = Math.floor(i / 10), c = i % 10;
      const col = malicious.includes(i) ? C.accent1 : honestColor;
      slide.addShape(pres.shapes.OVAL, { x: x0 + c * (d + gap), y: y0 + r * (d + gap), w: d, h: d, fill: { color: col }, line: { color: col }, objectName: `${name} participant ${i + 1}` });
    }
  };
  const CH = __dirname + "/charts/";
  const img = async (slide, file, x, y, w, h, alt) => {
    const meta = await sharp(CH + file).metadata();
    const r = meta.width / meta.height; let iw = w, ih = w / r;
    if (ih > h) { ih = h; iw = h * r; }
    slide.addImage({ path: CH + file, x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih, altText: alt, objectName: alt });
  };
  const P2 = "2E6DB4";
  const bullets = (slide, items, x, y, w, h, fs = 15) => slide.addText(items.map((t, i) => {
    if (Array.isArray(t)) return { text: t[1], options: { bold: true, fontSize: fs + 2, color: t[0] === "1" ? C.accent1 : t[0] === "2" ? P2 : C.text1, breakLine: true, paraSpaceBefore: i ? 8 : 0 } };
    return { text: t, options: { bullet: true, breakLine: i < items.length - 1 } };
  }), { x, y, w, h, fontSize: fs, color: C.text1, paraSpaceAfter: 6, valign: "top", margin: 0, isTextBox: true });
  const card = (slide, x, y, w, h, big, small, color, name) => {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: name + " card" });
    slide.addText(big, { x: x + 0.3, y: y + 0.15, w: w - 0.6, h: 0.9, fontSize: 46, bold: true, color, margin: 0, fontFace: "+mj-lt", isTextBox: true });
    slide.addText(small, { x: x + 0.3, y: y + 1.05, w: w - 0.6, h: h - 1.15, fontSize: 14, color: C.text1, margin: 0, valign: "top", isTextBox: true });
  };
  let s;

  // 1 Title
  pres.addSection({ title: "Introduction" });
  s = pres.addSlide({ masterName: "Title Dark", sectionTitle: "Introduction" });
  s.addText("Poisoning federated learning on handwritten characters", { placeholder: "title" });
  s.addText("Two label-flipping experiments on LEAF FEMNIST: ‘O’ → ‘0’ (look-alikes) and ‘A’ → ‘h’ (unrelated letters). 50 federated training runs of 200 rounds each.", { placeholder: "body" });
  dotGrid(s, 9.35, 2.55, 0.26, 0.11, [4, 13, 27, 36, 48], C.accent6, "Title");
  s.addText([{ text: "50 participants, ", options: {} }, { text: "some malicious", options: { color: C.accent1, bold: true } }], { x: 9.35, y: 4.5, w: 3.6, h: 0.4, fontSize: 14, color: C.accent6, margin: 0, isTextBox: true });
  s.addNotes("We ran label-flipping attacks against federated learning on FEMNIST, a 62-class handwriting dataset. The setup follows Tolpegin et al. (ESORICS 2020), but every number in this talk comes from our own runs. Two attacks: one on letters that look alike, O to zero, and one on letters that do not, A to h.");

  // 2 What we did
  pres.addSection({ title: "Setup" });
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Setup" });
  s.addText("What the experiment does", { placeholder: "title" });
  dotGrid(s, MX, 1.75, 0.34, 0.12, [3, 17, 22, 38, 44], C.accent2, "Diagram");
  s.addText("1. 50 participants, each with an equal random share of the data", { x: MX, y: 4.15, w: 4.5, h: 0.6, fontSize: 14, color: C.text1, margin: 0, isTextBox: true });
  s.addShape(pres.shapes.RIGHT_ARROW, { x: 5.35, y: 2.55, w: 0.9, h: 0.5, fill: { color: C.accent6 }, line: { color: C.accent6 }, objectName: "Arrow to round" });
  [C.accent2, C.accent1, C.accent2, C.accent2, C.accent2].forEach((col, i) => s.addShape(pres.shapes.OVAL, { x: 6.5 + i * 0.5, y: 2.6, w: 0.4, h: 0.4, fill: { color: col }, line: { color: col }, objectName: "Selected participant " + (i + 1) }));
  s.addText("2. Each round, 5 are picked at random and train the global model on their own data for 1 epoch", { x: 6.4, y: 3.2, w: 2.7, h: 1.2, fontSize: 14, color: C.text1, margin: 0, isTextBox: true });
  s.addShape(pres.shapes.RIGHT_ARROW, { x: 9.15, y: 2.55, w: 0.9, h: 0.5, fill: { color: C.accent6 }, line: { color: C.accent6 }, objectName: "Arrow to server" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 10.25, y: 1.85, w: 2.45, h: 1.9, rectRadius: 0.12, fill: { color: C.text1 }, line: { color: C.text1 }, objectName: "Server" });
  s.addText([{ text: "Server", options: { bold: true, fontSize: 18, breakLine: true } }, { text: "averages the 5 models (FedAvg) into the next global model", options: { fontSize: 13 } }], { x: 10.4, y: 1.95, w: 2.15, h: 1.7, color: C.background1, valign: "middle", margin: 0, isTextBox: true });
  s.addText("3. Repeat for 200 rounds, then test the final model", { x: 10.25, y: 4.15, w: 2.5, h: 0.6, fontSize: 14, color: C.text1, margin: 0, isTextBox: true });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y: 5.05, w: W - 2 * MX, h: 1.25, rectRadius: 0.1, fill: { color: "FBE9E2" }, line: { color: "FBE9E2" }, objectName: "Attack callout" });
  iconCircle(s, ic.random, MX + 0.3, 5.3, 0.75, C.accent1, "Label flip");
  s.addText([{ text: "The attack: ", options: { bold: true, color: C.accent1 } }, { text: "malicious participants (red) relabel every ‘O’ in their data as ‘0’ (test 1) or every ‘A’ as ‘h’ (test 2). Images are untouched and training is otherwise honest. The server never sees the data, so it cannot check labels." }],
    { x: MX + 1.3, y: 5.15, w: W - 2 * MX - 1.6, h: 1.05, fontSize: 16, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
  s.addNotes("Each round the server picks 5 of 50 participants; they train locally and the server averages their models. Malicious participants train on deliberately wrong labels for one class. Nothing else about them is unusual, and the server never sees their data.");

  // 3 Params
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Setup" });
  s.addText("Model and training parameters", { placeholder: "title" });
  const hdr = (t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text1 } } });
  s.addTable([[hdr("Parameter"), hdr("Value")], ["Participants N / per round k", "50 / 5"], ["Rounds R", "200"], ["Local training", "1 epoch of SGD per selected participant"], ["Batch size", "4"], ["Learning rate / momentum", "0.001 / 0.9"], ["Learning-rate schedule", "×0.1 every 10 local epochs"], ["Aggregation", "FedAvg (plain average of the 5 models)"], ["Data split", "IID, equal share per participant"], ["Initial weights", "same θ₀ for every run"]],
    { x: MX, y: 1.55, w: 6.6, colW: [2.9, 3.7], fontSize: 14, color: C.text1, border: { type: "solid", pt: 0.75, color: "DDE2EA" }, fill: { color: C.background1 }, rowH: 0.42, margin: [0.04, 0.1, 0.04, 0.1], objectName: "Parameter table" });
  const bx = 7.75, bw = 4.95;
  s.addText("Network: two-layer CNN, 62 outputs", { x: bx, y: 1.55, w: bw, h: 0.4, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true });
  [["Input", "28 × 28 grayscale image", C.background2, C.text1], ["Conv 5×5, 16 filters", "+ batch norm, ReLU, 2×2 max-pool", C.accent6, C.text1], ["Conv 5×5, 32 filters", "+ batch norm, ReLU, 2×2 max-pool", C.accent6, C.text1], ["Fully connected 1568 → 62", "one output per class (0–9, A–Z, a–z)", C.accent5, C.background1]].forEach(([a, b, fill, col], i) => {
    const y = 2.1 + i * 1.05;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx, y, w: bw, h: 0.78, rectRadius: 0.08, fill: { color: fill }, line: { color: fill }, objectName: "CNN block " + (i + 1) });
    s.addText([{ text: a, options: { bold: true, breakLine: true } }, { text: b, options: { fontSize: 12 } }], { x: bx + 0.2, y, w: bw - 0.4, h: 0.78, fontSize: 15, color: col, valign: "middle", margin: 0, isTextBox: true });
    if (i < 3) s.addShape(pres.shapes.DOWN_ARROW, { x: bx + bw / 2 - 0.12, y: y + 0.8, w: 0.24, h: 0.23, fill: { color: C.accent3 }, line: { color: C.accent3 }, objectName: "CNN arrow " + (i + 1) });
  });
  caption(s, "Settings follow the original study’s Fashion-MNIST configuration; not re-tuned for FEMNIST.");
  s.addNotes("The model and settings are fixed across every run, so the only thing that changes between runs is the attack and the random seed.");

  // 4 Test design
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Setup" });
  s.addText("Dataset and test design", { placeholder: "title" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y: 1.55, w: 3.9, h: 4.8, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "Dataset card" });
  iconCircle(s, ic.layers, MX + 0.3, 1.8, 0.7, C.accent5, "Dataset");
  s.addText("LEAF FEMNIST", { x: MX + 1.15, y: 1.85, w: 2.6, h: 0.6, fontSize: 18, bold: true, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
  s.addText([
    { text: "73,425 training and 8,341 test images", options: { bullet: true, breakLine: true } },
    { text: "62 classes: digits, A–Z, a–z", options: { bullet: true, breakLine: true } },
    { text: "Unbalanced: 18 to 453 test images per class", options: { bullet: true, breakLine: true } },
    { text: "‘O’: 299 test images (3.6%)", options: { bullet: true, breakLine: true } },
    { text: "‘A’: 73 test images (0.9%)", options: { bullet: true } },
  ], { x: MX + 0.3, y: 2.75, w: 3.35, h: 3.4, fontSize: 15, color: C.text1, paraSpaceAfter: 8, valign: "top", margin: 0, isTextBox: true });
  const gx = 4.85;
  s.addText("Runs: share of malicious participants (m)", { x: gx, y: 1.55, w: 7.9, h: 0.4, fontSize: 18, bold: true, color: C.text1, margin: 0, isTextBox: true });
  const levels = [["0%", "0", "10"], ["2%", "1", "3 + 3"], ["4%", "2", "3 + 3"], ["10%", "5", "3 + 3"], ["20%", "10", "3 + 3"], ["30%", "15", "3 + 3"], ["40%", "20", "3 + 3"], ["50%", "25", "2 + 2"]];
  const cw = 0.93, cg = 0.065;
  levels.forEach(([m, n, r], i) => {
    const x = gx + i * (cw + cg); const fill = i === 0 ? C.accent2 : C.accent1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.1, w: cw, h: 1.45, rectRadius: 0.08, fill: { color: fill, transparency: i === 0 ? 0 : 60 - i * 7 }, line: { color: fill }, objectName: "Level " + m });
    s.addText([{ text: m, options: { bold: true, fontSize: 18, breakLine: true } }, { text: n + " of 50", options: { fontSize: 11, breakLine: true } }, { text: r + " runs", options: { fontSize: 11 } }], { x, y: 2.1, w: cw, h: 1.45, align: "center", valign: "middle", color: i === 0 ? C.background1 : C.text1, margin: 0, isTextBox: true });
  });
  s.addText("Green: no-attack baseline, shared by both tests. Red: attacked runs, test 1 + test 2. Seeds are shared, so run n of every level has the same data split and the same participant picks.", { x: gx, y: 3.65, w: 7.9, h: 0.65, fontSize: 12, color: C.text2, margin: 0, isTextBox: true });
  s.addText("Measured on the full test set", { x: gx, y: 4.45, w: 7.9, h: 0.4, fontSize: 18, bold: true, color: C.text1, margin: 0, isTextBox: true });
  s.addText([
    { text: "Global accuracy: ", options: { bold: true } }, { text: "what a server would normally monitor", options: { breakLine: true } },
    { text: "Source recall (‘O’ or ‘A’): ", options: { bold: true } }, { text: "share still labeled correctly (the damage)", options: { breakLine: true } },
    { text: "Every round and every class: ", options: { bold: true } }, { text: "how the damage develops and where it spreads" },
  ], { x: gx, y: 4.9, w: 7.9, h: 1.4, fontSize: 15, color: C.text1, paraSpaceAfter: 6, valign: "top", margin: 0, isTextBox: true });
  s.addNotes("50 runs: 10 clean baseline runs shared by both tests, and 20 attacked runs per test. The third run at 50% was cut off by a time limit in both tests. Because seeds are shared, the two tests see identical data splits and participant picks, which lets us separate the effect of the attack from luck.");

  // 5 Pairs
  pres.addSection({ title: "Results" });
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Results" });
  s.addText("‘O’ and ‘0’ are often confused, ‘A’ and ‘h’ almost never", { placeholder: "title" });
  await img(s, "c1_confusions.png", MX, 1.45, 7.4, 4.95, "Baseline confusion chart");
  s.addText([{ text: "86.0%", options: { fontSize: 50, bold: true, color: C.accent2, fontFace: "+mj-lt", breakLine: true } }, { text: "clean global accuracy (10 runs, ±0.09)", options: { fontSize: 14, color: C.text2 } }], { x: 8.45, y: 1.5, w: 4.3, h: 1.5, margin: 0, valign: "top", isTextBox: true });
  s.addText([{ text: "Test 1  ‘O’ → ‘0’", options: { bold: true, color: ATTACK, breakLine: true } }, { text: "look-alike pair: 72 of 299 ‘O’ images already go to ‘0’. ‘O’ recall 75.2%", options: { fontSize: 14 } }], { x: 8.45, y: 3.2, w: 4.3, h: 1.1, fontSize: 18, color: C.text1, margin: 0, valign: "top", isTextBox: true });
  s.addText([{ text: "Test 2  ‘A’ → ‘h’", options: { bold: true, color: P2, breakLine: true } }, { text: "unrelated pair: 1.6 of 73 ‘A’ images go to ‘h’. ‘A’ recall 92.5%", options: { fontSize: 14 } }], { x: 8.45, y: 4.45, w: 4.3, h: 1.1, fontSize: 18, color: C.text1, margin: 0, valign: "top", isTextBox: true });
  s.addText("‘l’ → ‘1’ was skipped: ‘l’ is only 33% correct without any attack.", { x: 8.45, y: 5.7, w: 4.3, h: 0.6, fontSize: 13, color: C.text2, margin: 0, isTextBox: true });
  caption(s, "Pairs picked from the clean model’s own mistakes: one it makes often, one it almost never makes.");
  s.addNotes("The clean model reaches 86 percent. We picked the pairs from its own mistakes: O to zero is one of the most common errors, A to h almost never happens. That gives us one attack that pushes the model where it already leans, and one that pushes it somewhere new.");

  // 6 Test 1
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Results" });
  s.addText("Test 1, ‘O’ → ‘0’: accuracy holds while ‘O’ recall collapses", { placeholder: "title" });
  await img(s, "c2_test1.png", MX, 1.45, 7.6, 5.0, "Test 1 accuracy vs recall chart");
  card(s, 8.5, 1.55, 4.25, 2.2, "−1.9 pts", "global accuracy at 50% malicious (86.0 → 84.2). Within 0.3 pts up to 30%.", C.accent2, "Accuracy drop");
  card(s, 8.5, 4.0, 4.25, 2.2, "−68 pts", "‘O’ recall at 50% malicious (75 → 7): 92% of ‘O’ images are read as ‘0’.", ATTACK, "Recall drop");
  caption(s, "Final model after 200 rounds. Baseline: 10 runs. Attack levels: 3 runs each (2 at 50%).");
  s.addNotes("Test 1. The green line is what a server would watch: it barely moves. The red line is the damage: slow until 20 percent attackers, then steep. At 50 percent almost every O is read as zero, for a 1.9 point accuracy cost.");

  // 7 Test 2
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Results" });
  s.addText("Test 2, ‘A’ → ‘h’: the same collapse, even quieter", { placeholder: "title" });
  await img(s, "c3_test2.png", MX, 1.45, 7.6, 5.0, "Test 2 accuracy vs recall chart");
  card(s, 8.5, 1.55, 4.25, 2.2, "−0.5 pts", "global accuracy at 50% malicious (86.0 → 85.6). Within 0.2 pts up to 30%.", C.accent2, "Test 2 accuracy drop");
  card(s, 8.5, 4.0, 4.25, 2.2, "−62 pts", "‘A’ recall at 50% malicious (92 → 31): 58% of ‘A’ images are read as ‘h’.", P2, "Test 2 recall drop");
  caption(s, "Same baseline runs and seeds as test 1. Attack levels: 3 runs each (2 at 50%).");
  s.addNotes("Test 2, letters that do not look alike. The model has no natural lean toward h, yet the attack still drives A recall from 92 to 31 percent. Accuracy moves only half a point because A is under 1 percent of the test set.");

  // 8 Head to head
  pres.addSection({ title: "Comparison" });
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Comparison" });
  s.addText("Test 1 vs test 2: similar damage, except at the extremes", { placeholder: "title" });
  await img(s, "c4_head2head.png", MX, 1.45, 7.9, 5.0, "Head to head chart");
  bullets(s, [["", "Below 10%: nothing measurable"], "1–2 attackers of 50 stay inside run-to-run noise in both tests.",
    ["", "20–40%: the pair hardly matters"], "Losses within 2.5 pts, although the clean model confuses ‘O’/‘0’ 45× more often.",
    ["", "Extremes: look-alikes fall further"], "10%: 6.4 vs 3.0 pts. 50%: ‘O’ keeps 7%, ‘A’ keeps 31%."], 8.85, 1.55, 3.9, 4.9, 14);
  caption(s, "Loss vs. the shared 10-run baseline (‘O’ 75.2%, ‘A’ 92.5%).");
  s.addNotes("Side by side as lost recall. Small attacks do nothing measurable in either test. In the middle range the two attacks do almost the same damage, so how alike the letters are hardly matters. Only at the extremes do look-alikes fall further.");

  // 9 Over rounds
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Comparison" });
  s.addText("Over 200 rounds, attacked models never settle", { placeholder: "title" });
  await img(s, "c5_rounds.png", MX, 1.4, 8.6, 5.05, "Recall by round chart");
  bullets(s, ["Clean runs settle within 20–50 rounds and then vary by 1–3 pts.",
    "Attacked runs swing 20–40 pts within a few rounds: down when attackers are picked, back up when they are not.",
    "Round-to-round spread at 40%: 22.7 pts (‘O’) and 18.5 pts (‘A’), vs 2.7 and 0.9 clean.",
    "So the final number depends heavily on the last few rounds."], 9.45, 1.6, 3.3, 4.8, 14);
  caption(s, "Mean source recall over runs, 5-round moving average.");
  s.addNotes("Across training, the clean runs flatten out early. Under attack, recall rises and falls with every round, because whether an attacker is among the 5 picked changes each round. The value we report at round 200 is one point on a very noisy curve.");

  // 10 Where images go
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Comparison" });
  s.addText("Where the flipped images go", { placeholder: "title" });
  await img(s, "c6_where.png", MX, 1.4, 8.6, 5.05, "Destination of source images chart");
  bullets(s, [["1", "Test 1: straight to ‘0’"], "‘O’ images lost go to ‘0’ only. ‘Other classes’ stays at 2 of 299 at every level.",
    ["2", "Test 2: mostly ‘h’, some scatter"], "At 40–50%, 11% of ‘A’ images land in third classes, up from 5% clean. Pushing ‘A’ toward an unrelated letter also blurs it."], 9.45, 1.6, 3.3, 4.8, 14);
  caption(s, "Mean of final confusion matrices. Test 1: 299 ‘O’ test images. Test 2: 73 ‘A’ test images.");
  s.addNotes("This looks inside the confusion matrix. In test 1, every O the model loses goes to zero and nowhere else. In test 2 most A images go to h, but some also scatter into other classes: the attack makes A less recognisable in general, not only more h-like.");

  // 11 Accuracy hides it
  pres.addSection({ title: "What our data shows" });
  s = pres.addSlide({ masterName: "Content", sectionTitle: "What our data shows" });
  s.addText("Accuracy cost follows a simple rule: class share × recall loss", { placeholder: "title" });
  await img(s, "c7_accshare.png", MX, 1.45, 7.4, 5.0, "Accuracy vs recall loss chart");
  bullets(s, [["", "The rule"], "Accuracy drop ≈ source share × source loss − target share × target gain. It predicts both tests within 0.2 pts (1.66 vs 1.85, 0.53 vs 0.48).",
    ["", "What it implies for FEMNIST"], "The largest class (‘1’) is 5.4% of the test set, so destroying any one class costs at most ~5 pts of accuracy.",
    "Accuracy leaves its noise band only at 30% attackers (test 1) and 40% (test 2)."], 8.4, 1.55, 4.35, 4.9, 14);
  caption(s, "Dashed lines: source share × loss. Baseline noise band: ±3σ of 10 clean runs (σ = 0.09).");
  s.addNotes("Why accuracy hides the attack. The accuracy cost is just the share of the test set that changes label. For O it is offset a little because zero gains images. Since no class in FEMNIST is more than 5.4 percent of the test set, even total destruction of one class would cost at most about 5 points, and below 30 percent attackers the cost is inside normal noise.");

  // 12 noise
  s = pres.addSlide({ masterName: "Content", sectionTitle: "What our data shows" });
  s.addText("Changes outside the pair come from luck, not the attack", { placeholder: "title" });
  await img(s, "c8_noise.png", MX, 1.45, 6.6, 5.0, "Other-class change scatter");
  bullets(s, ["Both tests share seeds, so they differ only in which class is flipped.",
    "The other 58 classes move almost identically in both tests: r = 0.92, 0.87, 0.82 at 10, 30, 50% malicious.",
    "If the attack caused these shifts they would differ between ‘O’ and ‘A’ attacks. They don’t: they come from which participants trained when.",
    "Small classes (‘p’, ‘u’, ‘z’) swing by up to ±16 pts from this alone."], 7.65, 1.55, 5.1, 4.9, 15);
  caption(s, "Each dot is one class not involved in either attack, change in final recall vs the clean baseline.");
  s.addNotes("A check that the damage really is confined to the pair. Because both tests use the same seeds, any change caused by randomness should appear in both, and any change caused by the attack should appear in only one. The uninvolved classes move the same way in both tests, so their changes are luck, and the attack is truly targeted.");

  // 13 timing
  s = pres.addSlide({ masterName: "Content", sectionTitle: "What our data shows" });
  s.addText("Who trains in the final round shapes the result", { placeholder: "title" });
  await img(s, "c9_lastround.png", MX, 1.45, 6.6, 5.0, "Last round attacker chart");
  const pt = [[hdr("Attackers of 50"), hdr("Chance ≥1 is picked in a round")], ["1 (2%)", "10%"], ["2 (4%)", "19%"], ["5 (10%)", "42%"], ["10 (20%)", "69%"], ["20 (40%)", "93%"], ["25 (50%)", "97%"]];
  s.addTable(pt, { x: 7.65, y: 1.55, w: 5.1, colW: [2.0, 3.1], fontSize: 14, color: C.text1, border: { type: "solid", pt: 0.75, color: "DDE2EA" }, fill: { color: C.background1 }, rowH: 0.38, margin: [0.03, 0.1, 0.03, 0.1], objectName: "Selection probability table" });
  s.addText("Within the same attack level, runs with an attacker in the final round(s) end lower (r ≈ −0.55 in both tests). From 20% attackers up, an attacker is in most rounds, so the model rarely gets a clean round to recover.",
    { x: 7.65, y: 4.4, w: 5.1, h: 1.9, fontSize: 15, color: C.text1, margin: 0, valign: "top", isTextBox: true });
  caption(s, "Few runs per group; treat the size of the gap as indicative.");
  s.addNotes("Timing matters. At the same attack level, runs where an attacker trained in the last round finish noticeably lower. The table shows why the curve steepens: with 10 or more attackers, almost every round contains one, so the honest participants never get to undo the damage.");

  // 14 shared vs unique
  s = pres.addSlide({ masterName: "Content", sectionTitle: "What our data shows" });
  s.addText("Shared patterns vs. findings unique to FEMNIST", { placeholder: "title" });
  const colX = [MX, 6.85], colW = 5.9;
  const shared = ["Damage grows with the attacker share: slowly at first, then steeply",
    "The attack is targeted: the source class loses, the rest of the model is untouched",
    "Global accuracy barely reacts, so it is a poor alarm",
    "Attackers present late in training matter most",
    "A pair the model already confuses is not required"];
  const unique = ["1–2 attackers of 50 have no measurable effect",
    "Accuracy cost follows class share × recall loss, capping any one-class attack at ~5 pts",
    "The target class only gains for look-alikes (‘0’ +14.6 pts, ‘h’ +1.4)",
    "An unrelated target also scatters the source into third classes",
    "Shared seeds prove the off-pair shifts are luck (r ≈ 0.9)"];
  [[shared, ic.check, C.accent2, "Patterns that match"], [unique, ic.target, C.accent1, "Unique to our FEMNIST data"]].forEach(([items, im, col, head], k) => {
    const x = colX[k];
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.55, w: colW, h: 4.85, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: head + " card" });
    iconCircle(s, im, x + 0.3, 1.8, 0.65, col, head);
    s.addText(head, { x: x + 1.15, y: 1.8, w: 4.6, h: 0.65, fontSize: 21, bold: true, color: col, valign: "middle", margin: 0, isTextBox: true });
    s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })), { x: x + 0.3, y: 2.7, w: colW - 0.6, h: 3.55, fontSize: 16, color: C.text1, paraSpaceAfter: 12, valign: "top", margin: 0, isTextBox: true });
  });
  s.addNotes("The left column lists patterns that match what the original study described qualitatively. The right column is what our FEMNIST data adds: a threshold below which the attack does nothing, a simple rule for how much accuracy it costs, the difference between look-alike and unrelated targets, and a seed-matched test that rules out side effects.");

  // D1 how the defense works
  pres.addSection({ title: "Defense" });
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Defense" });
  s.addText("The defense: look at each update’s ‘source letter’ weights", { placeholder: "title" });
  const steps = [["1", "Keep only the source-class row", "From each participant’s update (new model − global model), take the 1,568 weights feeding the ‘O’ (or ‘A’) output."],
    ["2", "Compress to 2 numbers", "Standardise, then PCA to 2 components, over all updates in rounds 10–200."],
    ["3", "Average per participant", "Each participant trains ~19 times. Average its PC 1 scores (our rule, not the paper’s)."],
    ["4", "Flag the odd group", "Split the 50 averages in two. If the split is clear (silhouette ≥ 0.65), exclude the smaller group."]];
  steps.forEach(([n, head, body], i) => {
    const y = 1.5 + i * 1.22;
    s.addShape(pres.shapes.OVAL, { x: MX, y: y + 0.05, w: 0.55, h: 0.55, fill: { color: C.accent5 }, line: { color: C.accent5 }, objectName: "Step " + n + " circle" });
    s.addText(n, { x: MX, y: y + 0.05, w: 0.55, h: 0.55, fontSize: 18, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(head, { x: MX + 0.75, y, w: 4.1, h: 0.4, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true });
    s.addText(body, { x: MX + 0.75, y: y + 0.4, w: 4.1, h: 0.8, fontSize: 13, color: C.text1, valign: "top", margin: 0, isTextBox: true });
  });
  await img(s, "d1_pca.png", 5.55, 1.4, 7.2, 5.1, "PCA scatter of source-row updates");
  caption(s, "Each point is one update (955 per run, 1 seed). Honest = gray dots, malicious = crosses. Axes are unitless PCA scores.");
  s.addNotes("How the defense works. A label flip only changes how a participant treats one letter, so the server looks only at the weights of that letter’s output node. Honest participants push those weights toward the letter’s features; attackers push them away. After PCA the attackers drift off to one side. With no attackers there is one round cloud. Because each participant trains about 19 times, we average its scores, which makes the separation much cleaner than looking at single updates.");

  // D2 detection results
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Defense" });
  s.addText("Every damaging attacker is flagged; ‘A’ from the very first", { placeholder: "title" });
  await img(s, "d2_participants.png", MX, 1.45, 8.3, 4.95, "Participant average PC1 chart");
  bullets(s, [["2", "Test 2  ‘A’ → ‘h’"], "Every attacker flagged at 2, 4, 10 and 20%, plus 1 honest participant.",
    ["1", "Test 1  ‘O’ → ‘0’"], "All attackers flagged at 10% (+3 honest) and 20% (+0). At 2–4% the split is not clear enough, so nobody is flagged.",
    ["", "No attackers"], "Neither clean run is flagged. Using only rounds 10–50 gives the same picture."], 9.15, 1.55, 3.6, 4.9, 14);
  caption(s, "One dot per participant. Ranking by average PC 1 puts every attacker above every honest participant in 7 of 8 attacked runs (one honest participant outranks one attacker in the 8th).");
  s.addNotes("This is the decision step. Each dot is a participant. In every attacked run the attackers are the most extreme, so the signal is there. The automatic rule catches every A attacker even when there is just one, and every O attacker from 10 percent. For O at 2 to 4 percent the attackers sit further out than honest participants, but the honest spread is wide enough that the rule does not trust the split. Clean runs are never flagged. The defense can also act early: rounds 10 to 50 give the same result.");

  // D3 why
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Defense" });
  s.addText("Why it works better for ‘A’: honest updates are quiet", { placeholder: "title" });
  card(s, MX, 1.55, 3.85, 2.3, "0.084", "average size of an honest ‘O’-row update. The model still confuses ‘O’ with ‘0’, so honest participants keep correcting it.", ATTACK, "O honest");
  card(s, MX + 4.05, 1.55, 3.85, 2.3, "0.038", "average size of an honest ‘A’-row update. ‘A’ is already learned (92% recall), so honest updates barely touch it.", P2, "A honest");
  card(s, MX, 4.05, 3.85, 2.3, "1.2–1.7×", "attacker update vs honest, ‘O’ row. The attacker blends into a loud honest crowd.", ATTACK, "O ratio");
  card(s, MX + 4.05, 4.05, 3.85, 2.3, "1.6–3.0×", "attacker update vs honest, ‘A’ row. Mislabeling well-known ‘A’s creates a large error, so a big update.", P2, "A ratio");
  bullets(s, [["", "Why the attacker is visible at all"], "Honest and attacker updates point in opposite directions (cosine −0.6 to −0.97): one pulls the letter in, the other pushes it out.",
    ["", "Why ‘O’ is harder"], "The look-alike pair makes honest ‘O’ updates large and varied, so 1–2 attackers do not stand out clearly.",
    ["", "Does it fix the attack?"], "Every attack level that caused damage (10%+) had all its attackers flagged. Excluding them should bring recall back to the clean level. This is an estimate: we did not re-train without them."], 8.85, 1.55, 3.9, 4.95, 13);
  caption(s, "Sizes are L2 norms over rounds 10–200, 1 seed per level. The decision rule and threshold are ours and were set after seeing the clean runs.");
  s.addNotes("Why the defense is not equally good for both pairs. It is not how many A images attackers have. It is how loud the honest background is. For A, the model is already confident, so honest participants hardly change the A weights, and an attacker who labels confident A images as h produces a big, opposite-pointing update that is easy to see. For O, the clean model still confuses O and zero, so honest participants are constantly correcting the O weights, the honest cloud is wide, and a lone attacker is less clearly separated. The good news is that the levels that actually hurt the model are also the ones the defense catches.");

  // 15 limits
  pres.addSection({ title: "Limits and next steps" });
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Limits and next steps" });
  s.addText("What this experiment does and does not show", { placeholder: "title" });
  const doesL = ["Measures label-flip damage across attacker shares from 2% to 50%", "Compares a look-alike pair with an unrelated pair under identical seeds", "Tracks every round and every class, not only the final accuracy", "Is reproducible: code, seeds and commands are in the repository"];
  const doesntL = ["Generalise beyond two pairs: a third (‘2’ → ‘z’) is scripted but not run", "Have many runs: 3 per level (2 at 50%), so spreads up to ±14 pts", "Use realistic per-writer (non-IID) data or tuned hyperparameters", "Re-train with flagged participants removed, or test timing-only attacks"];
  [[doesL, ic.check, C.accent2, "Does"], [doesntL, ic.cross, C.accent1, "Does not"]].forEach(([items, im, col, head], k) => {
    const x = colX[k];
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.55, w: colW, h: 4.85, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: head + " card" });
    iconCircle(s, im, x + 0.3, 1.8, 0.65, col, head);
    s.addText(head, { x: x + 1.15, y: 1.8, w: 4, h: 0.65, fontSize: 22, bold: true, color: col, valign: "middle", margin: 0, isTextBox: true });
    s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })), { x: x + 0.3, y: 2.75, w: colW - 0.6, h: 3.5, fontSize: 17, color: C.text1, paraSpaceAfter: 16, valign: "top", margin: 0, isTextBox: true });
  });
  s.addNotes("Scope. Two pairs is enough to show a contrast but not to generalise. Three runs per level make the trends clear but individual numbers imprecise. And the data split is a random shuffle rather than one writer per participant.");

  // 16 next steps
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Limits and next steps" });
  s.addText("How the experiment can be improved", { placeholder: "title" });
  const imp = [[ic.redo, "10 runs per level", "Narrows the ±14 pt spread at 40–50%. About 100 more runs (≈10 h on this 4-CPU machine, far less on a GPU)."],
    [ic.random, "More pairs", "Run ‘2’ → ‘z’ and several others to test whether ‘the pair hardly matters at 20–40%’ holds in general."],
    [ic.clock, "Close the defense loop", "Re-train with flagged participants removed, test more seeds, and try attacks only in early or late rounds."],
    [ic.users, "Realistic non-IID data", "Give each participant one writer’s handwriting, as LEAF intends, instead of an even shuffle."],
    [ic.sliders, "Tune for FEMNIST", "Check sensitivity to learning-rate schedule and local epochs."],
    [ic.shield, "Full dataset", "Use all of FEMNIST, not LEAF’s 10% sample, so rare classes like ‘A’ have more test images."]];
  imp.forEach(([im, head, body], i) => {
    const col = i % 2, row = Math.floor(i / 2); const x = MX + col * 6.15, y = 1.5 + row * 1.7;
    iconCircle(s, im, x, y + 0.1, 0.7, i < 3 ? C.accent5 : C.accent3, head);
    s.addText(head, { x: x + 0.95, y: y + 0.05, w: 5.0, h: 0.45, fontSize: 18, bold: true, color: C.text1, margin: 0, isTextBox: true });
    s.addText(body, { x: x + 0.95, y: y + 0.52, w: 5.0, h: 0.95, fontSize: 14, color: C.text1, valign: "top", margin: 0, isTextBox: true });
  });
  s.addNotes("In order of value: more runs to tighten the numbers, more pairs to test our pair-choice finding, then timing and defense. Longer term: realistic per-writer data and the full dataset.");

  // 17 conclusion
  pres.addSection({ title: "Conclusion" });
  s = pres.addSlide({ masterName: "Title Dark", sectionTitle: "Conclusion" });
  s.addText("A quiet, targeted attack, and accuracy can’t see it", { placeholder: "title" });
  s.addText([
    { text: "At 50% attackers: ‘O’ recall 75% → 7%, ‘A’ recall 92% → 31%, accuracy −1.9 and −0.5 pts.", options: { bullet: true, breakLine: true } },
    { text: "Look-alike or not, damage is similar at 20–40% attackers; 1–2 attackers do nothing.", options: { bullet: true, breakLine: true } },
    { text: "On FEMNIST no single-class attack can cost more than ~5 pts of accuracy.", options: { bullet: true, breakLine: true } },
    { text: "Checking the source letter’s weights flags every damaging attacker; ‘A’ attackers even from 1.", options: { bullet: true } },
  ], { placeholder: "body", paraSpaceAfter: 6 });
  dotGrid(s, 9.35, 2.55, 0.26, 0.11, [0,1,2,3,4,10,11,12,13,14,20,21,22,23,24,30,31,32,33,34,40,41,42,43,44], C.accent6, "Conclusion");
  s.addText([{ text: "50% malicious: ", options: { color: C.accent1, bold: true } }, { text: "accuracy −0.5 to −1.9 pts" }], { x: 9.35, y: 4.5, w: 3.6, h: 0.4, fontSize: 14, color: C.accent6, margin: 0, isTextBox: true });
  s.addNotes("To conclude: label flipping on FEMNIST destroys a chosen class while global accuracy stays almost flat, whether or not the letters look alike. Because FEMNIST has 62 small classes, accuracy is structurally unable to reveal this kind of attack, so a defense has to look at per-class behaviour or at the updates themselves.");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
