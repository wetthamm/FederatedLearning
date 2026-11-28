// Builds the two gold/blue decks in the style of the team's workshop and demo presentations.
//   node build_gold.js short <out.pptx>   -> 8-slide talk (workshop structure)
//   node build_gold.js full  <out.pptx>   -> full deck (demo structure)
// Charts come from writeup/deck_charts/gold/ (charts*.py with the gold palette).
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");

const MODE = process.argv[2], OUT = process.argv[3];
const CH = __dirname + "/gold/";

// palette and type, matched to the team decks
const NAVY = "051E39", GOLD = "B39051", GOLD_D = "8F713D", MUTED = "687787", MUTED2 = "526579";
const CARD = "F4F6F8", BORDER = "DCE3E9", CREAM = "F4EFE6", ICE = "EAF0F5", WHITE = "FFFFFF";
const FONT = "Aptos", MONO = "Consolas";
const W = 13.333, MX = 0.65;
const FOOTER = "FEMNIST | Federated Label-Flipping Attack & Defense";
const SHADOW = () => ({ type: "outer", blur: 4, offset: 1.5, angle: 90, color: "000000", opacity: 0.14 });

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
let page = 0;

// ---------- helpers ----------
function header(s, title, tag, sub) {
  page += 1;
  s.background = { color: WHITE };
  s.addText(title, { x: MX, y: 0.32, w: 10.2, h: 0.62, fontFace: FONT, fontSize: 26, bold: true, color: NAVY, margin: 0, valign: "middle" });
  s.addShape(pres.shapes.RECTANGLE, { x: MX + 0.03, y: 1.0, w: 1.1, h: 0.06, fill: { color: GOLD }, line: { color: GOLD } });
  if (tag) s.addText(tag.toUpperCase(), { x: 10.3, y: 0.4, w: 2.4, h: 0.3, fontFace: FONT, fontSize: 9, bold: true, color: GOLD_D, align: "right", margin: 0, charSpacing: 1 });
  if (sub) s.addText(sub, { x: MX, y: 1.12, w: 12.0, h: 0.32, fontFace: FONT, fontSize: 11.5, color: MUTED, margin: 0 });
  if (MODE === "full") s.addText(FOOTER, { x: MX, y: 7.05, w: 6, h: 0.25, fontFace: FONT, fontSize: 8, color: MUTED, margin: 0 });
  s.addText(MODE === "full" ? String(page).padStart(2, "0") : String(page), { x: 12.2, y: 7.03, w: 0.5, h: 0.25, fontFace: FONT, fontSize: 9, bold: true, color: GOLD_D, align: "right", margin: 0 });
}

function card(s, x, y, w, h, title, body, opts = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: opts.fill || CARD }, line: { color: BORDER, width: 0.75 }, shadow: SHADOW() });
  s.addShape(pres.shapes.RECTANGLE, { x, y: y + 0.02, w: 0.07, h: h - 0.04, fill: { color: opts.bar || GOLD_D }, line: { color: opts.bar || GOLD_D } });
  s.addText(title, { x: x + 0.25, y: y + 0.14, w: w - 0.4, h: 0.36, fontFace: FONT, fontSize: opts.tsize || 13.5, bold: true, color: opts.tcolor || NAVY, margin: 0, valign: "middle" });
  const lines = Array.isArray(body) ? body : [body];
  s.addText(lines.map((t, i) => ({ text: t, options: { bullet: opts.bullets ? { code: "2022" } : false, breakLine: i < lines.length - 1 } })),
    { x: x + 0.25, y: y + 0.55, w: w - 0.42, h: h - 0.65, fontFace: FONT, fontSize: opts.size || 11.5, color: NAVY, margin: 0, valign: "top", paraSpaceAfter: 3 });
}

function tile(s, x, y, w, h, label, value, sub, fill = CREAM, vcolor = GOLD) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: fill }, line: { color: BORDER, width: 0.75 }, shadow: SHADOW() });
  s.addText(label.toUpperCase(), { x: x + 0.18, y: y + 0.12, w: w - 0.3, h: 0.25, fontFace: FONT, fontSize: 8.5, bold: true, color: MUTED, margin: 0 });
  s.addText(value, { x: x + 0.18, y: y + 0.38, w: w - 0.3, h: 0.55, fontFace: FONT, fontSize: 24, bold: true, color: vcolor, margin: 0, valign: "middle" });
  s.addText(sub, { x: x + 0.18, y: y + 0.95, w: w - 0.3, h: h - 1.0, fontFace: FONT, fontSize: 9, color: NAVY, margin: 0, valign: "top" });
}

function outlineTile(s, x, y, w, h, value, sub) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: WHITE }, line: { color: GOLD, width: 1 }, shadow: SHADOW() });
  s.addText(value, { x, y: y + 0.18, w, h: 0.55, fontFace: FONT, fontSize: 22, bold: true, color: NAVY, align: "center", margin: 0 });
  s.addText(sub, { x: x + 0.1, y: y + 0.75, w: w - 0.2, h: 0.35, fontFace: FONT, fontSize: 10, color: GOLD_D, align: "center", margin: 0 });
}

function goldLine(s, text, y = 6.55) {
  s.addText(text, { x: MX, y, w: W - 2 * MX, h: 0.35, fontFace: FONT, fontSize: 11.5, bold: true, color: GOLD_D, margin: 0 });
}

function navyBand(s, text, y = 6.35) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y, w: W - 2 * MX, h: 0.5, rectRadius: 0.06, fill: { color: NAVY }, line: { color: NAVY }, shadow: SHADOW() });
  s.addText(text, { x: MX + 0.2, y, w: W - 2 * MX - 0.4, h: 0.5, fontFace: FONT, fontSize: 13, bold: true, color: WHITE, valign: "middle", margin: 0 });
}

function note(s, text, y = 6.6) {
  s.addText(text, { x: MX, y, w: W - 2 * MX, h: 0.3, fontFace: FONT, fontSize: 9.5, color: MUTED, margin: 0 });
}

function code(s, x, y, w, h, text, size = 11) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.14, fill: { color: NAVY }, line: { color: NAVY }, shadow: SHADOW() });
  s.addText(text, { x: x + 0.3, y: y + 0.2, w: w - 0.5, h: h - 0.4, fontFace: MONO, fontSize: size, color: "F3F5F8", margin: 0, valign: "top" });
}

function kicker(s, x, y, w, text, color = GOLD_D) {
  s.addText(text.toUpperCase(), { x, y, w, h: 0.28, fontFace: FONT, fontSize: 9, bold: true, color, margin: 0, charSpacing: 1 });
}

function table(s, rows, x, y, w, colW, opts = {}) {
  const head = rows[0].map(t => ({ text: t, options: { bold: true, color: WHITE, fill: { color: NAVY } } }));
  const body = rows.slice(1).map((r, i) => r.map(t => ({ text: String(t), options: { fill: { color: opts.stripe ? (i % 2 ? ICE : CREAM) : (i % 2 ? WHITE : CARD) } } })));
  s.addTable([head, ...body], { x, y, w, colW, fontFace: FONT, fontSize: opts.size || 11, color: NAVY, border: { type: "solid", pt: 0.5, color: BORDER }, rowH: opts.rowH || 0.34, margin: [0.03, 0.08, 0.03, 0.08], align: opts.align || "left" });
}

async function img(s, file, x, y, w, h) {
  const m = await sharp(CH + file).metadata();
  const r = m.width / m.height; let iw = w, ih = w / r;
  if (ih > h) { ih = h; iw = h * r; }
  s.addImage({ path: CH + file, x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih });
}

function bulletsText(s, items, x, y, w, h, size = 12) {
  s.addText(items.map((t, i) => Array.isArray(t)
    ? { text: t[0], options: { bold: true, color: t[1] || NAVY, fontSize: size + 1.5, breakLine: true, paraSpaceBefore: i ? 8 : 0 } }
    : { text: t, options: { bullet: { code: "2022" }, breakLine: i < items.length - 1 } }),
    { x, y, w, h, fontFace: FONT, fontSize: size, color: NAVY, margin: 0, valign: "top", paraSpaceAfter: 4 });
}

// ---------- shared content blocks ----------
const DEF_ROWS = [["Malicious", "Test 1  ‘O’ → ‘0’", "Test 2  ‘A’ → ‘h’"],
  ["0%", "nobody flagged", "nobody flagged"], ["2% (1)", "not flagged*", "1/1 caught, +1 honest"],
  ["4% (2)", "not flagged*", "2/2 caught, +1 honest"], ["10% (5)", "5/5 caught, +3 honest", "5/5 caught, +1 honest"],
  ["20% (10)", "10/10 caught, +0 honest", "10/10 caught, +0 honest"]];

// =====================================================================
async function shortDeck() {
  let s;
  // 1 title (workshop style)
  s = pres.addSlide(); page += 1; s.background = { color: WHITE };
  s.addShape(pres.shapes.RECTANGLE, { x: 0.75, y: 0.85, w: 1.25, h: 0.08, fill: { color: GOLD }, line: { color: GOLD } });
  s.addText("Label-Flipping Attacks\nin Federated Learning", { x: 0.8, y: 1.55, w: 11.7, h: 1.6, fontFace: FONT, fontSize: 40, bold: true, color: NAVY, margin: 0, valign: "top" });
  s.addText("An Experimental Study on FEMNIST: ‘O’ → ‘0’ and ‘A’ → ‘h’", { x: 0.85, y: 3.55, w: 10.7, h: 0.55, fontFace: FONT, fontSize: 18, color: GOLD_D, margin: 0 });
  s.addText("200 communication rounds   |   50 participants   |   62 character classes", { x: 0.85, y: 5.75, w: 9, h: 0.45, fontFace: FONT, fontSize: 13, color: MUTED2, margin: 0 });
  s.addText("Federated Learning Security Project", { x: 0.85, y: 6.55, w: 6, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: NAVY, margin: 0 });
  s.addText("01", { x: 12.0, y: 6.85, w: 0.5, h: 0.25, fontFace: FONT, fontSize: 10, bold: true, color: GOLD_D, margin: 0, align: "right" });
  s.addNotes("About 20 seconds. My part of the project: label-flipping attacks on federated learning, tested on FEMNIST, a dataset of handwritten digits and letters. Two attacks: one on letters that look alike, O to zero, and one on letters that do not, A to h.");

  // 2 setup
  s = pres.addSlide(); header(s, "1. Experimental Setup", "Data & model");
  card(s, 0.75, 1.45, 3.75, 1.65, "Dataset", ["LEAF FEMNIST: 62 handwritten character classes", "73,425 training / 8,341 test images", "378 writers (LEAF’s 10% sample)"]);
  card(s, 4.8, 1.45, 3.75, 1.65, "Federated split", ["50 participants, IID (equal random shares)", "≈1,468 training images each", "5 picked at random every round"]);
  card(s, 8.85, 1.45, 3.75, 1.65, "Model & training", ["Small CNN: 2 convolution layers", "200 communication rounds, FedAvg", "1 local epoch, batch size 4"]);
  s.addText("Runs in the attack experiments", { x: 0.85, y: 3.5, w: 11.7, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: NAVY, margin: 0 });
  outlineTile(s, 1.0, 4.1, 2.9, 1.15, "86.0%", "accuracy without any attack");
  outlineTile(s, 4.2, 4.1, 2.9, 1.15, "0–50%", "of participants malicious");
  outlineTile(s, 7.4, 4.1, 2.9, 1.15, "3 runs", "per attack level (10 clean)");
  goldLine(s, "The server never sees the data, so it cannot check the labels.", 5.75);
  s.addNotes("About 40 seconds. 50 participants each hold an equal random share of FEMNIST. Each round, 5 of them train a small convolutional network on their own data for one epoch, and the server averages the 5 models. After 200 rounds the model reaches 86 percent accuracy. The server never sees anyone's data, so it has no way to check the labels.");

  // 3 attack design
  s = pres.addSlide(); header(s, "2. Label-Flipping Attack Design", "Attack");
  card(s, 0.75, 1.45, 3.75, 1.65, "Adversary", ["0–50% of the 50 participants are malicious", "Chosen at random for each run", "Otherwise train exactly like honest ones"]);
  card(s, 4.8, 1.45, 3.75, 1.65, "Test 1:  ‘O’ → ‘0’", ["Every ‘O’ relabeled as ‘0’", "Letters the model already mixes up", "Clean model: 72 of 299 test ‘O’s → ‘0’"]);
  card(s, 8.85, 1.45, 3.75, 1.65, "Test 2:  ‘A’ → ‘h’", ["Every ‘A’ relabeled as ‘h’", "Letters it almost never mixes up", "Clean model: 1.6 of 73 test ‘A’s → ‘h’"], { bar: NAVY });
  s.addText("Poisoned training data (example run, 10% malicious)", { x: 0.85, y: 3.5, w: 6.5, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: NAVY, margin: 0 });
  tile(s, 0.95, 4.05, 2.85, 1.55, "Honest participant #0", "45 ‘O’", "and 69 ‘0’ images, labels untouched", ICE, NAVY);
  tile(s, 4.0, 4.05, 2.85, 1.55, "Malicious participant #5", "0 ‘O’", "and 113 ‘0’: its ‘O’s are now labeled ‘0’", CREAM, GOLD);
  s.addText("Important implementation detail", { x: 7.6, y: 3.5, w: 5, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: GOLD_D, margin: 0 });
  s.addText("Only labels change; the images are untouched. Each attacker relabels every source image it holds (≈53 ‘O’ or ≈13 ‘A’ per participant), not a fraction of them.",
    { x: 7.6, y: 3.95, w: 5.0, h: 1.4, fontFace: FONT, fontSize: 12, color: NAVY, margin: 0, valign: "top" });
  goldLine(s, "Therefore, the attack targets one letter; the rest of the model trains normally.", 5.95);
  s.addNotes("About 40 seconds. A share of the participants, from 0 to 50 percent, trains on deliberately wrong labels. In test 1 they turn every O into a zero, letters the model already confuses. In test 2 they turn every A into an h, letters it almost never confuses. Here is one example run: the malicious participant now holds no O's at all, they have all become zeros.");

  // 4 main results
  s = pres.addSlide(); header(s, "3. Main Results: The Attacked Letter Collapses", "Results");
  await img(s, "c4_head2head.png", 0.6, 1.35, 7.6, 4.85);
  card(s, 8.55, 1.5, 4.1, 1.45, "Test 1:  ‘O’ → ‘0’", ["‘O’ recall at 50% attackers: 75% → 7%", "Loss: −68 points"]);
  card(s, 8.55, 3.15, 4.1, 1.45, "Test 2:  ‘A’ → ‘h’", ["‘A’ recall at 50% attackers: 92% → 31%", "Loss: −62 points"], { bar: NAVY });
  s.addText("Look-alike or not, the damage is about the same at 20–40% attackers.", { x: 8.6, y: 4.85, w: 4.1, h: 0.8, fontFace: FONT, fontSize: 14, bold: true, color: NAVY, margin: 0, valign: "top" });
  goldLine(s, "1–2 attackers out of 50 stay within run-to-run noise; the damage becomes clear from 20%.", 6.4);
  s.addNotes("About 50 seconds. This is the main result. Each bar is how much of the attacked letter the model stops recognising. With one or two attackers out of 50, nothing measurable happens. From 20 percent the damage climbs fast, and at 50 percent the model has lost most of the attacked letter. The surprise: between 20 and 40 percent, both attacks do almost the same damage, although the model already confused O with zero 45 times more often than A with h.");

  // 5 where images go
  s = pres.addSlide(); header(s, "4. Sample-Level Analysis: Where the Images Go", "Analysis");
  card(s, 0.75, 1.45, 5.85, 1.3, "‘O’ → ‘0’ at 50% attackers", ["92% of ‘O’ test images are labeled ‘0’; under 1% go anywhere else"]);
  card(s, 6.85, 1.45, 5.75, 1.3, "‘A’ → ‘h’ at 50% attackers", ["58% of ‘A’ test images are labeled ‘h’; about 11% scatter to other letters"], { bar: NAVY });
  await img(s, "c6_where.png", 0.75, 2.95, 11.85, 3.3);
  goldLine(s, "The model learns exactly the lie it was taught.", 6.45);
  s.addNotes("About 35 seconds. Here is where the test images of the attacked letter end up. Grey is still correct. In test 1, every O the model loses is labelled zero, nothing else: the attack is surgical. In test 2, most lost A images become h, but at high attacker shares about one in ten lands on some other letter.");

  // 6 accuracy
  s = pres.addSlide(); header(s, "5. Accuracy Barely Moves, So Nobody Notices", "Analysis");
  await img(s, "c7_accshare.png", 0.6, 1.35, 7.4, 4.75);
  tile(s, 8.4, 1.45, 2.05, 1.6, "Test 1 at 50%", "−1.9 pts", "global accuracy (86.0 → 84.2)", CREAM, GOLD);
  tile(s, 10.6, 1.45, 2.05, 1.6, "Test 2 at 50%", "−0.5 pts", "‘A’ is under 1% of the test set", ICE, NAVY);
  card(s, 8.4, 3.3, 4.25, 2.35, "The rule", ["Accuracy drop ≈ class share × recall lost", "Largest FEMNIST class is 5.4% of the test set, so a one-letter attack costs at most ~5 pts", "Below 30% attackers the drop is inside normal noise"], { bullets: true, size: 11 });
  navyBand(s, "With 62 small classes, accuracy can’t reveal the attack: defenses must check each class.");
  s.addNotes("About 40 seconds. Despite wiping out most of a letter, overall accuracy drops by under 2 points, and by half a point in test 2. The cost is simply the attacked letter's share of the test set times how much of it was lost, the dashed lines. No class in FEMNIST is more than 5.4 percent of the test set, so attacking any one letter can cost at most about 5 points.");

  // 7 defense
  s = pres.addSlide(); header(s, "6. Defense: Spotting Attackers in Their Updates", "Defense");
  await img(s, "d2_participants.png", 0.6, 1.35, 7.3, 3.6);
  s.addText("How it works", { x: 0.75, y: 5.05, w: 7, h: 0.3, fontFace: FONT, fontSize: 13, bold: true, color: GOLD_D, margin: 0 });
  s.addText("The server looks only at the attacked letter’s 1,568 output weights in each update, compresses them with PCA (the paper’s Algorithm 1), averages each participant over its rounds, and flags the odd group if the split is clear.",
    { x: 0.75, y: 5.38, w: 7.1, h: 0.95, fontFace: FONT, fontSize: 11.5, color: NAVY, margin: 0, valign: "top" });
  s.addText("Detection results", { x: 8.3, y: 1.4, w: 4.3, h: 0.3, fontFace: FONT, fontSize: 13, bold: true, color: NAVY, margin: 0 });
  table(s, DEF_ROWS, 8.3, 1.8, 4.35, [0.85, 1.75, 1.75], { size: 9.5, rowH: 0.36 });
  s.addText("* Split not clear enough to act (silhouette below 0.65).", { x: 8.3, y: 4.05, w: 4.35, h: 0.25, fontFace: FONT, fontSize: 9, color: MUTED, margin: 0 });
  s.addText("Works better for ‘A’: honest updates on a well-learned letter are quiet, so attackers stand out.", { x: 8.3, y: 4.45, w: 4.35, h: 0.9, fontFace: FONT, fontSize: 11.5, color: NAVY, margin: 0, valign: "top" });
  goldLine(s, "Every attacker was flagged whenever there were enough to do damage; clean runs flagged nobody.", 6.45);
  s.addNotes("About 40 seconds. Can the server catch them? It looks only at the attacked letter's output weights in each update. Attackers push them the opposite way from honest participants, so after averaging each participant's rounds they end up at one end, the crosses. The automatic rule flags every attacker whenever there are enough to do damage, and never flags anyone in the clean runs. It works even better for A, because honest updates barely touch a letter the model already knows well.");

  // 8 conclusion
  s = pres.addSlide(); header(s, "7. Conclusion and Limitations", "Takeaways");
  const concl = [["Targeted", "‘O’ recall 75% → 7%, ‘A’ 92% → 31% at 50% attackers; other classes move only by run-to-run noise."],
    ["Needs a crowd", "1–2 attackers of 50 do nothing measurable; damage is clear from 20%. Look-alike letters matter only at the extremes."],
    ["Invisible in accuracy", "At most 1.9 pts lost even at 50%. The result also swings with who trained in the last round."],
    ["Detectable", "Checking the attacked letter’s weights flags every damaging attacker (‘A’ attackers from the first)."]];
  concl.forEach(([t, b], i) => card(s, 0.75 + i * 2.99, 1.45, 2.82, 2.25, t, b, { size: 11, bar: i === 3 ? NAVY : GOLD_D }));
  s.addText("Limitations to keep in mind", { x: 0.85, y: 4.0, w: 11.7, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: NAVY, margin: 0 });
  bulletsText(s, ["3 runs per attack level (2 at 50%), and one run per level for the defense.",
    "IID split and LEAF’s 10% sample of FEMNIST (its class mix matches the full dataset).",
    "Two letter pairs; the defense’s decision rule and threshold are ours, set after seeing the clean runs."], 0.85, 4.45, 11.7, 1.3, 12);
  goldLine(s, "Next step: re-run key settings on the full FEMNIST with a writer-based (non-IID) split.", 6.1);
  s.addNotes("About 35 seconds. Four conclusions. The attack is targeted: the model loses most of the attacked letter and nothing else changes beyond noise. It needs a crowd: damage is clear only from 20 percent. It is invisible in accuracy: under 2 points even at 50 percent. And it is detectable if the server looks at the attacked letter's weights in each update. The limits: few runs, an even data split, and two letter pairs. Thank you.");
}

// =====================================================================
async function fullDeck() {
  let s;
  // 1 title (demo style)
  s = pres.addSlide(); page += 1; s.background = { color: WHITE };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.16, h: 7.5, fill: { color: GOLD }, line: { color: GOLD } });
  kicker(s, 0.85, 1.25, 8, "Federated learning • security study");
  s.addText("Label-Flipping Attacks and Defense\nin FEMNIST", { x: 0.85, y: 1.85, w: 11, h: 1.7, fontFace: FONT, fontSize: 38, bold: true, color: NAVY, margin: 0, valign: "top" });
  s.addText("An empirical study of ‘O’ → ‘0’ and ‘A’ → ‘h’ label flipping against FedAvg with 50 IID participants, and a defense based on Algorithm 1",
    { x: 0.88, y: 4.1, w: 8.8, h: 0.9, fontFace: FONT, fontSize: 16, color: NAVY, margin: 0, valign: "top" });
  s.addText("Based on the project repository, notebook and experiment runs", { x: 0.88, y: 6.45, w: 7, h: 0.3, fontFace: FONT, fontSize: 10, color: MUTED, margin: 0 });
  s.addText("2026", { x: 11.9, y: 6.85, w: 0.8, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: GOLD_D, margin: 0, align: "right" });
  s.addNotes("We ran label-flipping attacks against federated learning on FEMNIST, a 62-class handwriting dataset, following Tolpegin et al. (ESORICS 2020). Every number in this deck comes from our own runs.");

  // 2 overview
  s = pres.addSlide(); header(s, "Research question & headline findings", "Overview", "Can a minority of participants who flip one letter’s labels damage a federated model unnoticed—and can the server spot them?");
  card(s, MX, 1.7, 3.85, 1.65, "Attack effectiveness", "At 50% attackers the attacked letter mostly disappears: ‘O’ recall 75% → 7%, ‘A’ 92% → 31%.", { fill: WHITE });
  card(s, MX + 4.12, 1.7, 3.85, 1.65, "Stealth", "Global accuracy drops by at most 1.9 points; below 30% attackers it stays inside run-to-run noise.", { fill: WHITE });
  card(s, MX + 8.24, 1.7, 3.85, 1.65, "Defense effectiveness", "Averaging each participant’s update on the attacked letter flags every attacker at 10%+ (‘A’ attackers from the first).", { fill: WHITE });
  tile(s, MX + 0.15, 3.85, 2.8, 1.45, "Test 1 • ‘O’ recall", "7.2%", "at 50% attackers | clean 75.2%", CREAM, GOLD);
  tile(s, MX + 3.15, 3.85, 2.8, 1.45, "Test 2 • ‘A’ recall", "30.8%", "at 50% attackers | clean 92.5%", ICE, NAVY);
  tile(s, MX + 6.15, 3.85, 2.8, 1.45, "Accuracy drop", "1.9 / 0.5", "points at 50%, test 1 / test 2", CREAM, GOLD);
  tile(s, MX + 9.15, 3.85, 2.8, 1.45, "Defense", "All", "attackers flagged at 10–20%", ICE, NAVY);
  s.addNotes("The question and the three answers. The attack works: at 50 percent attackers most of the target letter is gone. It is stealthy: accuracy barely moves. And a server-side check on the attacked letter's weights catches every attacker once there are enough of them to matter.");

  // 3 dataset
  s = pres.addSlide(); header(s, "Dataset and federated setup", "Experiment setup", "LEAF’s FEMNIST sample is pooled, shuffled once, and dealt evenly to 50 participants (IID).");
  tile(s, MX, 1.65, 2.85, 1.4, "LEAF sample", "81,766", "28×28 grayscale images; 62 character classes", CREAM, GOLD);
  tile(s, MX + 3.07, 1.65, 2.85, 1.4, "Writers", "378", "LEAF’s 10% writer sample of FEMNIST", ICE, GOLD_D);
  tile(s, MX + 6.14, 1.65, 2.85, 1.4, "Train pool", "73,425", "90% of each writer’s images", CREAM, GOLD);
  tile(s, MX + 9.21, 1.65, 2.85, 1.4, "Held-out test", "8,341", "10% per writer; every image, every round", ICE, GOLD_D);
  card(s, MX, 3.3, 5.95, 1.6, "IID federated setup", ["50 participants, ≈1,468 training images each", "5 picked at random per round, 200 rounds", "Same seed ⇒ same split and picks for clean and attacked runs"], { bullets: true, size: 11, fill: WHITE });
  card(s, MX + 6.1, 3.3, 5.95, 1.6, "Class imbalance", ["Digits: 3,338–3,993 training images per class; letters: 208–2,629", "‘O’: 299 test images (3.6%); ‘A’: 73 (0.9%)", "Largest class (‘1’): 5.4% of the test set"], { bullets: true, size: 11, fill: WHITE });
  await img(s, "e2_train_examples.png", MX, 5.1, W - 2 * MX, 1.45);
  note(s, "Ten real training images with label and class index. Data: NIST SD19 via the LEAF benchmark (preprocess.sh -s niid --sf 0.1 -k 0 -t sample --tf 0.9).", 6.62);
  s.addNotes("Our data is LEAF's standard 10 percent sample of FEMNIST: 378 writers and about 82 thousand images. Each writer's images are split 90 to 10 into train and test. We shuffle the training images and give each of the 50 participants an equal share. Classes are very unbalanced: digits have about 3,600 training images each, some lowercase letters about 200.");

  // 4 threat model
  s = pres.addSlide(); header(s, "Threat model and poisoning implementation", "Attack design", "Malicious participants relabel one letter in their own data and otherwise train honestly.");
  card(s, MX, 1.65, 3.85, 1.6, "Attacker control", ["0–50% of 50 participants (0–25)", "Chosen at random for each run", "Same training code as honest ones"], { bullets: true, size: 11, fill: WHITE });
  card(s, MX + 4.12, 1.65, 3.85, 1.6, "Target mapping", ["62 classes", "Test 1: ‘O’ (24) → ‘0’ (0)", "Test 2: ‘A’ (10) → ‘h’ (43)"], { bullets: true, size: 11, fill: WHITE });
  card(s, MX + 8.24, 1.65, 3.85, 1.6, "Poisoned labels", ["Every source image relabeled", "≈53 ‘O’ / ≈13 ‘A’ per participant", "Images untouched"], { bullets: true, size: 11, fill: WHITE });
  code(s, MX, 3.55, 7.0, 2.6, "malicious = choose_malicious(NUM_CLIENTS, num_malicious)\nclient_data = [\n    (X, label_flip(Y, source, target)) if i in malicious\n    else (X, Y)\n    for i, (X, Y) in enumerate(client_data)\n]\n# source = 24 ('O'), target = 0 ('0')", 11.5);
  kicker(s, 8.0, 3.6, 4.7, "Important implementation scope");
  s.addText("A targeted, single-source attack: only ‘O’ (or ‘A’) labels change, so every other class trains normally.\n\nExample run (10%): malicious #5 holds 113 ‘0’ and 0 ‘O’; honest #0 holds 69 ‘0’ and 45 ‘O’.",
    { x: 8.0, y: 3.95, w: 4.7, h: 2.2, fontFace: FONT, fontSize: 12, bold: false, color: NAVY, margin: 0, valign: "top" });
  s.addNotes("The threat model. A random share of participants relabels every image of one letter in their own data and otherwise behaves honestly. Only labels change, never images. In the example run, malicious participant 5 has no O's left: they all became zeros.");

  // 5 code: attack
  s = pres.addSlide(); header(s, "How the label flip is introduced", "Code | Attack", "The attack happens before training: malicious participants’ labels are rewritten once, then they train normally.");
  code(s, MX, 1.65, 7.3, 4.55, "class LabelFlip:\n    def __init__(self, source_class, target_class):\n        self.source_class = int(source_class)\n        self.target_class = int(target_class)\n\n    def __call__(self, targets, target_set):\n        for idx in range(len(targets)):\n            if targets[idx] == self.source_class:\n                targets[idx] = self.target_class\n        return targets\n\n# in poison_data():\nfor worker_idx in range(num_workers):\n    if worker_idx in poisoned_worker_ids:\n        apply_class_label_replacement(X, Y, LabelFlip(24, 0))", 11);
  kicker(s, 8.3, 1.7, 4.4, "What this code does");
  s.addText(["1. Source: every label equal to the source class (‘O’ = 24) is found.", "2. Target: it is overwritten with the target class (‘0’ = 0).", "3. Poisoning: only the participants drawn as malicious get the flipped labels."].map((t, i) => ({ text: t, options: { breakLine: i < 2 } })),
    { x: 8.3, y: 2.05, w: 4.4, h: 2.4, fontFace: FONT, fontSize: 12, color: NAVY, margin: 0, valign: "top", paraSpaceAfter: 8 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.3, y: 4.75, w: 4.4, h: 1.2, rectRadius: 0.1, fill: { color: CREAM }, line: { color: GOLD, width: 0.75 } });
  s.addText("The original code had one hand-written function per digit pair; LabelFlip works for any of FEMNIST’s 62 classes.", { x: 8.45, y: 4.82, w: 4.1, h: 1.05, fontFace: FONT, fontSize: 11, bold: true, color: GOLD_D, margin: 0, valign: "middle" });
  note(s, "federated_learning/utils/class_flipping_methods.py and poison_data.py (excerpts).", 6.45);
  s.addNotes("The attack in code. A small callable class flips any source label to any target; it replaces dozens of hard-coded functions from the original code. It is applied once, to the malicious participants' data, before training starts.");

  // 6 code: defense
  s = pres.addSlide(); header(s, "From updates to a flagged participant", "Code | Defense", "Algorithm 1 compresses each update’s source-class weights; our rule turns the plot into a decision.");
  code(s, MX, 1.65, 7.3, 4.55, "# X: one row per update (1,568 source-row weights)\npts = PCA(n_components=2).fit_transform(\n          StandardScaler().fit_transform(X))\npc1 = pts[:, 0]\n\ndef participant_rule(pc1, workers, min_sil=0.65):\n    ids = sorted(set(workers.tolist()))\n    avg = numpy.array([pc1[workers == w].mean()\n                       for w in ids]).reshape(-1, 1)\n    lab = KMeans(n_clusters=2, n_init=10).fit(avg).labels_\n    sil = silhouette_score(avg, lab)\n    small = numpy.argmin(numpy.bincount(lab))\n    return (lab == small) & (sil >= min_sil)", 11);
  kicker(s, 8.3, 1.7, 4.4, "Read the algorithm in 3 steps");
  [["A", "Compress updates", "Standardise + PCA: 955 updates → 2 numbers each (paper’s Algorithm 1)"],
   ["B", "Average per participant", "Cancels the 6–12× size drift between early and late rounds (ours)"],
   ["C", "Flag the odd group", "Split in two; act only if silhouette ≥ 0.65, flag the smaller group"]].forEach(([l, h1, b], i) => {
    const y = 2.1 + i * 1.3;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.3, y, w: 4.4, h: 1.15, rectRadius: 0.08, fill: { color: WHITE }, line: { color: BORDER, width: 0.75 }, shadow: SHADOW() });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.42, y: y + 0.2, w: 0.45, h: 0.45, rectRadius: 0.06, fill: { color: GOLD }, line: { color: GOLD } });
    s.addText(l, { x: 8.42, y: y + 0.2, w: 0.45, h: 0.45, fontFace: FONT, fontSize: 13, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    s.addText([{ text: h1, options: { bold: true, breakLine: true } }, { text: b, options: { fontSize: 10, color: MUTED2 } }], { x: 9.0, y: y + 0.08, w: 3.6, h: 1.0, fontFace: FONT, fontSize: 12, color: NAVY, margin: 0, valign: "middle" });
  });
  note(s, "defense_eval.py. A first version clustered single updates and split early from late rounds instead (147 false flags in a clean run).", 6.45);
  s.addNotes("The defense's decision step. The paper's algorithm standardises the source-row updates and projects them onto two principal components. Our addition averages each participant over all its rounds, which removes the size difference between early and late updates that fooled our first attempt. We split the averages in two and only act if the split is clear.");

  // 7 code: training & evaluation
  s = pres.addSlide(); header(s, "Where the attack enters—and how its effect is measured", "Code | Training & eval", "The same loop runs every experiment; only the malicious share and the flipped pair change.");
  kicker(s, MX, 1.6, 6, "Federated training loop • server.py");
  [["Select", "5 of 50 participants at random (seeded by the run id)"], ["Local SGD", "Each trains 1 epoch on its own (possibly flipped) data"], ["Record", "UpdateRecorder keeps the source-row change θ_local − θ_global"], ["FedAvg", "Server averages the 5 models and broadcasts the result"], ["Evaluate", "Accuracy and per-class recall on all 8,341 test images"]].forEach(([h1, b], i) => {
    const y = 1.95 + i * 0.86;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y, w: 5.9, h: 0.72, rectRadius: 0.08, fill: { color: WHITE }, line: { color: BORDER, width: 0.75 }, shadow: SHADOW() });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX + 0.12, y: y + 0.14, w: 0.44, h: 0.44, rectRadius: 0.06, fill: { color: NAVY }, line: { color: NAVY } });
    s.addText(String(i + 1), { x: MX + 0.12, y: y + 0.14, w: 0.44, h: 0.44, fontFace: FONT, fontSize: 12, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    s.addText([{ text: h1, options: { bold: true, breakLine: true } }, { text: b, options: { fontSize: 10, color: MUTED2 } }], { x: MX + 0.75, y, w: 5.05, h: 0.72, fontFace: FONT, fontSize: 12, color: NAVY, margin: 0, valign: "middle" });
  });
  kicker(s, 7.0, 1.6, 5.7, "Source recall • analyze.py");
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.0, y: 1.95, w: 5.7, h: 1.6, rectRadius: 0.12, fill: { color: NAVY }, line: { color: NAVY }, shadow: SHADOW() });
  s.addText([{ text: "Source recall =", options: { color: GOLD, bold: true, breakLine: true } }, { text: "source test images still predicted as the source  ÷  all source test images × 100", options: { color: WHITE, bold: true } }],
    { x: 7.25, y: 2.05, w: 5.2, h: 1.4, fontFace: FONT, fontSize: 14, margin: 0, valign: "middle" });
  s.addText("Global accuracy is what a server would normally watch. Source recall is the damage. The full confusion matrix shows where the lost images go.\n\nThe recorder keeps 1,568 numbers per update instead of saving every model: 900 MB → 5 MB per run.",
    { x: 7.0, y: 3.75, w: 5.7, h: 2.1, fontFace: FONT, fontSize: 12, color: NAVY, margin: 0, valign: "top" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.0, y: 5.75, w: 5.7, h: 0.6, rectRadius: 0.08, fill: { color: CREAM }, line: { color: GOLD, width: 0.75 } });
  s.addText("Seeded runs: clean and attacked runs share data splits and picks, so differences are the attack’s.", { x: 7.15, y: 5.75, w: 5.45, h: 0.6, fontFace: FONT, fontSize: 10.5, bold: true, color: GOLD_D, margin: 0, valign: "middle" });
  s.addNotes("One loop runs every experiment. Five participants are picked, train locally, the recorder stores the attacked letter's weight changes, the server averages, and the new global model is tested on the full test set. Source recall, the share of the attacked letter still recognised, measures the damage.");

  // 8 pipeline
  s = pres.addSlide(); header(s, "Federated label-flipping experiment flow", "Pipeline", "Data preparation, federated training, and analysis, reconstructed from the repository.");
  const flow = [["FEMNIST (LEAF)", "62 classes"], ["50 participants", "IID shares"], ["m% flip labels", "‘O’→‘0’ or ‘A’→‘h’"], ["Local CNN", "1 epoch, 5 per round"], ["Server", "FedAvg × 200 rounds"]];
  flow.forEach(([a, b], i) => {
    const x = MX + 0.2 + i * 2.45;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.0, w: 2.0, h: 0.95, rectRadius: 0.12, fill: { color: i === 2 ? CREAM : CARD }, line: { color: i === 2 ? GOLD : BORDER, width: 1 }, shadow: SHADOW() });
    s.addText([{ text: a, options: { bold: true, breakLine: true } }, { text: b, options: { fontSize: 9.5, color: MUTED } }], { x, y: 2.0, w: 2.0, h: 0.95, fontFace: FONT, fontSize: 12, color: NAVY, align: "center", valign: "middle", margin: 0 });
    if (i < 4) s.addShape(pres.shapes.LINE, { x: x + 2.0, y: 2.475, w: 0.45, h: 0, line: { color: GOLD, width: 1.5, endArrowType: "triangle" } });
  });
  [["Evaluation", "accuracy, per-class recall, confusion", 4.2], ["Defense", "source-row updates → PCA → flag", 7.6]].forEach(([a, b, x]) => {
    s.addShape(pres.shapes.LINE, { x: 11.05, y: 2.95, w: x + 1.0 - 11.05, h: 0.9, line: { color: GOLD, width: 1.25, endArrowType: "triangle" }, flipH: false });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 3.85, w: 2.4, h: 0.85, rectRadius: 0.12, fill: { color: WHITE }, line: { color: GOLD, width: 1 }, shadow: SHADOW() });
    s.addText([{ text: a, options: { bold: true, breakLine: true } }, { text: b, options: { fontSize: 9.5, color: MUTED } }], { x, y: 3.85, w: 2.4, h: 0.85, fontFace: FONT, fontSize: 12, color: NAVY, align: "center", valign: "middle", margin: 0 });
  });
  s.addText("Every run: 200 rounds with the same initial weights; the global model is tested on all 8,341 test images after every round, and attacked runs record each update’s source-class weight change.",
    { x: 1.2, y: 5.25, w: 10.9, h: 0.8, fontFace: FONT, fontSize: 13, bold: true, color: NAVY, align: "center", margin: 0 });
  s.addNotes("The whole pipeline. LEAF prepares the data; our loader deals it to 50 participants; the malicious share flips one letter's labels; participants train locally and the server averages, 200 times. Every round is evaluated, and attacked runs also record updates for the defense.");

  // 8b demo
  s = pres.addSlide(); header(s, "Demo: one experiment, from input to output", "Demo", "Real console output of a 3-round run (a full run is the same command without --rounds 3).");
  await img(s, "term_run.png", MX, 1.6, W - 2 * MX, 3.4);
  [["Input", "FEMNIST data loaders and the attack settings: source ‘O’ (24) → target ‘0’, 10% malicious."],
   ["Processing", "5 participants poisoned; each round 5 of 50 train locally, then FedAvg averages them."],
   ["Output", "Accuracy every round, plus per-run files: per-class results, confusion matrix, participant picks, settings."]].forEach(([t, b], i) =>
    card(s, MX + i * 4.1, 5.25, 3.9, 1.35, t, b, { fill: WHITE, size: 10.5, bar: i === 1 ? GOLD_D : NAVY }));
  s.addNotes("The system running. The command picks the attack, O to zero, with 10 percent malicious participants. The log shows the five poisoned participants: participant 5 now holds 113 zeros and no O's, while honest participant 0 still has 45 O's. Each round five participants train and the server reports accuracy; at the end the run writes its result files.");

  // 9 CNN
  s = pres.addSlide(); header(s, "CNN model architecture", "Model", "A compact CNN maps a 28×28 grayscale character image to 62 class scores (110,622 parameters).");
  const blocks = [["Input", "1 × 28 × 28"], ["Conv2D 5×5", "16 filters + BN + ReLU"], ["MaxPool", "14 × 14"], ["Conv2D 5×5", "32 filters + BN + ReLU"], ["MaxPool", "7 × 7"], ["Flatten", "1,568"], ["FC / Output", "62 classes"]];
  blocks.forEach(([a, b], i) => {
    const x = MX + i * 1.74, f = (i === 0 || i === 6) ? CREAM : CARD;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.85, w: 1.55, h: 1.15, rectRadius: 0.1, fill: { color: f }, line: { color: i === 6 ? GOLD : BORDER, width: 1 }, shadow: SHADOW() });
    s.addText([{ text: a, options: { bold: true, breakLine: true } }, { text: b, options: { fontSize: 9, color: MUTED } }], { x, y: 1.85, w: 1.55, h: 1.15, fontFace: FONT, fontSize: 11.5, color: NAVY, align: "center", valign: "middle", margin: 0 });
    if (i < 6) s.addShape(pres.shapes.LINE, { x: x + 1.55, y: 2.425, w: 0.19, h: 0, line: { color: GOLD, width: 1.25, endArrowType: "triangle" } });
  });
  card(s, MX, 3.45, 3.85, 1.75, "Feature extraction", "Two convolution blocks learn stroke and shape features; max pooling halves the resolution twice.", { fill: WHITE });
  card(s, MX + 4.12, 3.45, 3.85, 1.75, "Classification", "fc.weight[c] holds the 1,568 weights of class c: exactly what the defense inspects.", { fill: WHITE });
  card(s, MX + 8.24, 3.45, 3.85, 1.75, "Training", ["SGD, lr 0.001, momentum 0.9", "×0.1 every 10 local epochs", "Batch 4; same θ₀ for every run"], { fill: WHITE, bullets: true, size: 11 });
  note(s, "The paper’s Fashion-MNIST network with the output layer widened from 10 to 62 classes; settings not re-tuned for FEMNIST.", 5.5);
  s.addNotes("The model is the original study's Fashion-MNIST network, with 62 outputs instead of 10. The last layer matters for the defense: each class has its own row of 1,568 weights, and the server inspects the attacked letter's row.");

  // 10 metrics
  s = pres.addSlide(); header(s, "Evaluation protocol: metrics and speed", "Metrics", "Every run is scored on the full test set after each round; the final round is reported.");
  card(s, MX, 1.65, 5.95, 1.4, "Source-class recall", "Share of the attacked letter’s test images still predicted correctly: the damage.", { fill: WHITE });
  card(s, MX + 6.1, 1.65, 5.95, 1.4, "Global accuracy and confidence", "Accuracy is what a server would normally watch; softmax confidence shows how sure each prediction is.", { fill: WHITE });
  tile(s, MX, 3.35, 2.85, 1.4, "‘O’ test images", "299", "3.6% of the test set", CREAM, GOLD);
  tile(s, MX + 3.07, 3.35, 2.85, 1.4, "‘A’ test images", "73", "0.9%; 1 image = 1.37 recall pts", ICE, GOLD_D);
  tile(s, MX + 6.14, 3.35, 2.85, 1.4, "Runs per level", "3", "10 for the clean baseline (2 at 50%)", CREAM, GOLD);
  tile(s, MX + 9.21, 3.35, 2.85, 1.4, "Noise band", "±0.27", "3σ of clean accuracy (σ = 0.09)", ICE, GOLD_D);
  tile(s, MX, 5.0, 2.85, 1.4, "Latency", "0.36 ms", "1 image, 1 CPU thread (p95 0.45)", ICE, GOLD_D);
  tile(s, MX + 3.07, 5.0, 2.85, 1.4, "Throughput", "7,074/s", "batch 64, 1 thread; 25,940/s on 4", CREAM, GOLD);
  tile(s, MX + 6.14, 5.0, 2.85, 1.4, "One FL round", "7.3 s", "5 local epochs + full test, 1 thread", ICE, GOLD_D);
  tile(s, MX + 9.21, 5.0, 2.85, 1.4, "One full run", "24 min", "200 rounds, 4-core Xeon 2.1 GHz", CREAM, GOLD);
  s.addNotes("How we measure. Source recall is the damage; global accuracy is what a server would see. The test set is small for rare letters, so for A one image is more than a point. Speed: one prediction takes a third of a millisecond; training is the slow part, 24 minutes per run.");

  // 11 test 1
  s = pres.addSlide(); header(s, "Results: Test 1, ‘O’ → ‘0’", "Test 1", "Accuracy holds while ‘O’ recall collapses.");
  await img(s, "c2_test1.png", MX, 1.6, 7.6, 4.8);
  card(s, 8.55, 1.7, 4.1, 1.6, "−1.9 pts", "global accuracy at 50% malicious (86.0 → 84.2). Within 0.3 pts up to 30%.", { fill: WHITE, tcolor: GOLD, tsize: 18 });
  card(s, 8.55, 3.5, 4.1, 1.6, "−68 pts", "‘O’ recall at 50% malicious (75 → 7): 92% of ‘O’ images are read as ‘0’.", { fill: WHITE, tcolor: GOLD, tsize: 18 });
  note(s, "Final model after 200 rounds. Baseline: 10 runs. Attack levels: 3 runs each (2 at 50%).", 6.6);
  s.addNotes("Test 1. The grey line is what a server would watch: it barely moves. The gold line is the damage: slow until 20 percent attackers, then steep. At 50 percent almost every O is read as zero, for a 1.9 point accuracy cost.");

  // 12 test 2
  s = pres.addSlide(); header(s, "Results: Test 2, ‘A’ → ‘h’", "Test 2", "The same collapse, even quieter.");
  await img(s, "c3_test2.png", MX, 1.6, 7.6, 4.8);
  card(s, 8.55, 1.7, 4.1, 1.6, "−0.5 pts", "global accuracy at 50% malicious (86.0 → 85.6). Within 0.2 pts up to 30%.", { fill: WHITE, tcolor: NAVY, tsize: 18, bar: NAVY });
  card(s, 8.55, 3.5, 4.1, 1.6, "−62 pts", "‘A’ recall at 50% malicious (92 → 31): 58% of ‘A’ images are read as ‘h’.", { fill: WHITE, tcolor: NAVY, tsize: 18, bar: NAVY });
  note(s, "Same baseline runs and seeds as test 1. Attack levels: 3 runs each (2 at 50%).", 6.6);
  s.addNotes("Test 2, letters that do not look alike. The model has no natural lean toward h, yet the attack still drives A recall from 92 to 31 percent. Accuracy moves only half a point because A is under 1 percent of the test set.");

  // 13 comparison
  s = pres.addSlide(); header(s, "Test 1 vs Test 2: similar damage, except at the extremes", "Comparison", "Loss in source-class recall vs the shared 10-run baseline (‘O’ 75.2%, ‘A’ 92.5%).");
  table(s, [["", "Test 1  ‘O’ → ‘0’", "Test 2  ‘A’ → ‘h’"], ["Pair type", "frequent, look-alike", "infrequent, unrelated"], ["Clean model sends source → target", "72.3 images", "1.6 images"],
    ["Source share of the test set", "3.6%", "0.9%"], ["Recall loss at 10 / 20 / 30%", "6.4 / 7.4 / 17.2", "3.0 / 9.8 / 17.6"], ["Recall loss at 40 / 50%", "42.8 / 68.0", "43.6 / 61.6"],
    ["Target recall change at 50%", "+14.6", "+1.4"], ["Accuracy drop at 50%", "1.9", "0.5"]], MX, 1.65, 7.4, [3.0, 2.2, 2.2], { stripe: true, size: 11.5, rowH: 0.42 });
  card(s, 8.35, 1.65, 4.35, 1.4, "Below 10%: nothing measurable", "1–2 attackers of 50 stay inside run-to-run noise in both tests.", { fill: WHITE, size: 11 });
  card(s, 8.35, 3.2, 4.35, 1.4, "20–40%: the pair hardly matters", "Losses within 2.5 pts, although the clean model confuses ‘O’/‘0’ 45× more often.", { fill: WHITE, size: 11 });
  card(s, 8.35, 4.75, 4.35, 1.4, "Extremes: look-alikes fall further", "10%: 6.4 vs 3.0 pts. 50%: ‘O’ keeps 7%, ‘A’ keeps 31%.", { fill: WHITE, size: 11 });
  s.addNotes("Side by side. Small attacks do nothing measurable in either test. In the middle range the two attacks do almost the same damage, so how alike the letters are hardly matters. Only at the extremes do look-alikes fall further. The target only gains when it was losing images to the source: zero gains 15 points, h barely moves.");

  // 14 where images go
  s = pres.addSlide(); header(s, "Sample analysis: where the flipped images go", "Sample evidence", "The model learns exactly the lie it was taught (mean final confusion matrices).");
  await img(s, "c6_where.png", MX, 1.6, 8.2, 4.8);
  card(s, 9.0, 1.7, 3.7, 1.95, "‘O’ → ‘0’", "Every ‘O’ the model loses is labeled ‘0’; the ‘other classes’ share stays under 1% at every level.", { fill: WHITE, size: 11 });
  card(s, 9.0, 3.85, 3.7, 1.95, "‘A’ → ‘h’", "Most lost ‘A’s become ‘h’, but the share going to other letters rises from 5% to 11%.", { fill: WHITE, size: 11, bar: NAVY });
  note(s, "Test 1: 299 ‘O’ test images. Test 2: 73 ‘A’ test images.", 6.6);
  s.addNotes("Inside the confusion matrix. In test 1, every O the model loses goes to zero and nowhere else. In test 2 most A images go to h, but some scatter into other classes: the attack makes A less recognisable in general, not only more h-like.");

  // 15 confidence
  s = pres.addSlide(); header(s, "Sample analysis: confidently wrong, not uncertain", "Sample evidence", "Softmax confidence of the top-1 class, the next 4, and the remaining 58 classes (demo.py).");
  await img(s, "e3_confidence.png", MX, 1.55, W - 2 * MX, 3.7);
  card(s, MX, 5.35, 3.85, 1.25, "Clean model", "‘O’ #3196: 87% ‘O’, 9% ‘0’; the other 60 classes under 4% together.", { fill: WHITE, size: 10.5, bar: "8A94A6" });
  card(s, MX + 4.12, 5.35, 3.85, 1.25, "After ‘O’ → ‘0’", "Same image: 76% ‘0’. Over all 299 ‘O’s, confidence in ‘0’ rises 26% → 81%.", { fill: WHITE, size: 10.5 });
  card(s, MX + 8.24, 5.35, 3.85, 1.25, "After ‘A’ → ‘h’", "‘A’ #3117: 86% ‘h’. Over all 73 ‘A’s, confidence in ‘h’ rises 3% → 49%.", { fill: WHITE, size: 10.5, bar: NAVY });
  s.addNotes("For every image the model outputs a probability for all 62 classes. After the attack the same O is 76 percent zero: the attacked model does not become uncertain, it becomes confidently wrong, so confidence alone would not reveal the attack.");

  // 16 easy / hard / fonts
  s = pres.addSlide(); header(s, "Sample analysis: easy, hard and self-made test data", "Sample evidence", "Three final models (seed 3000) on FEMNIST easy/hard classes and a font-rendered set we created.");
  await img(s, "e4_comparison.png", MX, 1.55, W - 2 * MX, 3.65);
  [["Easy vs hard", "Clean model: 93% on easy classes vs 79% on look-alike classes."],
   ["Our font test set", "1,984 printed characters, never seen in training: 60%. Even the clean model reads printed ‘O’ as ‘0’."],
   ["‘O’ → ‘0’ model", "−4 pts on hard, <1 on easy. ‘O’ recall 0% on both sets, yet slightly more confident."],
   ["‘A’ → ‘h’ model", "‘A’ recall 93→27% on FEMNIST and 75→31% on fonts: the attack carries over to new data."]].forEach(([t, b], i) =>
    card(s, MX + i * 3.06, 5.3, 2.9, 1.4, t, b, { fill: WHITE, size: 10, tsize: 12, bar: i === 3 ? NAVY : GOLD_D }));
  s.addNotes("We compared three models on three test sets. Easy and hard split FEMNIST's test set in advance by whether a class has a look-alike. The font set is our own: every character rendered from 16 computer fonts in FEMNIST's format. Accuracy barely separates the models; the difference is all in the attacked letter, and it carries over to the font set.");

  // 17 discussion
  s = pres.addSlide(); header(s, "Why did the attack succeed—and why so quietly?", "Discussion", "Interpretation grounded in the run design, final metrics and per-round results.");
  card(s, MX, 1.65, 5.95, 2.25, "Why the attack succeeds", ["Attackers push the same letter the same way every time they are picked; FedAvg averages that push in.", "From 20% attackers, at least one is in 69% of rounds (93% at 40%), so honest rounds rarely undo it."], { fill: WHITE, bullets: true, size: 11 });
  card(s, MX + 6.1, 1.65, 5.95, 2.25, "Why accuracy hides it", ["Accuracy drop ≈ class share × recall lost (predicts 1.66 vs 1.85 and 0.53 vs 0.48 observed).", "No FEMNIST class is over 5.4% of the test set, so a one-letter attack costs at most ~5 pts."], { fill: WHITE, bullets: true, size: 11 });
  card(s, MX, 4.1, 5.95, 2.25, "Why 1–2 attackers do nothing", ["One attacker is picked in only 10% of rounds (two: 19%).", "Each poisoned update is averaged with 4 honest ones, and holds only ~1/50 of the source images."], { fill: WHITE, bullets: true, size: 11, bar: NAVY });
  card(s, MX + 6.1, 4.1, 5.95, 2.25, "Why results swing", ["Recall swings 20–40 pts round to round under attack; runs with an attacker in the last round end lower (r ≈ −0.55).", "Other classes move by luck, identically in both tests (r ≈ 0.9), not because of the attack."], { fill: WHITE, bullets: true, size: 11, bar: NAVY });
  s.addNotes("Why it works, and why nobody notices. Attackers keep pushing one letter, and from 20 percent they are in most rounds. Accuracy hides it because the cost is just that letter's share of the test set. Very small attacks are drowned out. And the final number depends on who trained last, while changes in other letters are luck, not the attack.");

  // 18 defense
  s = pres.addSlide(); header(s, "Defense experiment: every damaging attacker is flagged", "Defense", "One run per level (seed 3000), source-class updates from rounds 10–200.");
  await img(s, "d2_participants.png", MX, 1.55, 7.5, 3.7);
  s.addText("Why it works better for ‘A’", { x: MX, y: 5.35, w: 7.4, h: 0.3, fontFace: FONT, fontSize: 13, bold: true, color: GOLD_D, margin: 0 });
  s.addText("Honest ‘A’ updates are quiet (size 0.038, the letter is already learned), so attackers are 1.6–3.0× larger. Honest ‘O’ updates are loud (0.084; ‘O’/‘0’ still confused), so attackers are only 1.2–1.7× larger.",
    { x: MX, y: 5.7, w: 7.4, h: 0.9, fontFace: FONT, fontSize: 11, color: NAVY, margin: 0, valign: "top" });
  table(s, DEF_ROWS, 8.3, 1.65, 4.4, [0.9, 1.75, 1.75], { size: 9.5, rowH: 0.4, stripe: true });
  s.addText("* Split not clear enough to act. Using only rounds 10–50 gives the same picture, so the server could act early. The rule is ours (silhouette ≥ 0.65), set after seeing the clean runs.",
    { x: 8.3, y: 4.35, w: 4.4, h: 1.2, fontFace: FONT, fontSize: 11, color: NAVY, margin: 0, valign: "top" });
  s.addNotes("The defense. Each dot is a participant; crosses are attackers. In every attacked run the attackers are the most extreme. The rule catches every A attacker even when there is just one, and every O attacker from 10 percent; clean runs are never flagged. For O, honest participants are still correcting the O/zero confusion, so their updates are loud and a lone attacker blends in.");

  // 19 conclusion
  s = pres.addSlide(); header(s, "Conclusion, limitations, and next steps", "Takeaways", "What the current evidence supports—and what should not be overclaimed.");
  card(s, MX, 1.65, 5.95, 2.05, "Main conclusion", "A minority of label-flipping participants can wipe out one letter (‘O’ 75% → 7%, ‘A’ 92% → 31% at 50%) while global accuracy drops under 2 pts. Checking the attacked letter’s weights flags every damaging attacker.", { fill: WHITE, size: 11 });
  card(s, MX + 6.1, 1.65, 5.95, 2.05, "Limitations to disclose", ["3 runs per level (2 at 50%); 1 run per level for the defense", "IID split; LEAF’s 10% sample (class mix matches full FEMNIST)", "Two letter pairs; settings not tuned for FEMNIST"], { fill: WHITE, bullets: true, size: 11 });
  card(s, MX, 3.9, 5.95, 2.05, "Interpretation limits", "The defense rule and threshold are ours and were set after seeing the clean runs; we did not re-train with flagged participants removed, so recovery is an estimate.", { fill: WHITE, size: 11, bar: NAVY });
  card(s, MX + 6.1, 3.9, 5.95, 2.05, "Recommended next steps", ["1. 10 runs per level and more letter pairs", "2. Writer-based (non-IID) split on the full FEMNIST", "3. Re-train with flagged participants removed"], { fill: WHITE, size: 11, bar: NAVY });
  s.addText("Takeaway: a quiet, targeted attack that accuracy can’t see—defenses must check each class, or each participant’s updates.", { x: MX, y: 6.2, w: W - 2 * MX, h: 0.5, fontFace: FONT, fontSize: 13, bold: true, color: NAVY, align: "center", margin: 0 });
  s.addNotes("To conclude: label flipping on FEMNIST destroys a chosen letter while global accuracy stays almost flat, and a check on that letter's weights catches the attackers. The numbers come from few runs on an even split, so the next steps are more runs, more pairs, and a writer-based split on the full dataset.");

  // 20 appendix
  s = pres.addSlide(); header(s, "Appendix: what we built, and acknowledgements", "Appendix");
  table(s, [["Our addition", "Files"], ["FEMNIST loader, 62-class CNN, generic label flip", "femnist.py, femnist_cnn.py, LabelFlip"], ["Bug fix: class list from all participants", "poison_data.py"],
    ["Seeded, parallel, resumable experiment runner", "experiment_cli.py, run_all.sh"], ["In-training update recorder, model saving, timing", "server.py"], ["Analysis, tables and charts", "analyze.py, charts*.py"],
    ["Defense decision rule and scoring", "defense_eval.py"], ["Easy/hard split and font test set", "tools/make_test_sets.py"], ["Demo, confidence report, model comparison", "demo.py, compare_models.py"]],
    MX, 1.4, 6.6, [3.8, 2.8], { size: 10, rowH: 0.42 });
  const ack = [["Method", "Tolpegin et al., Data Poisoning Attacks Against FL Systems, ESORICS 2020", "https://arxiv.org/abs/2007.08432"],
    ["Base code", "DataPoisoning_FL (commit 467eca0)", "https://github.com/git-disl/DataPoisoning_FL"],
    ["Data", "LEAF benchmark (commit 09ec454), Caldas et al., arXiv:1812.01097", "https://github.com/TalwalkarLab/leaf"],
    ["Raw images", "NIST Special Database 19", "https://www.nist.gov/srd/nist-special-database-19"],
    ["Libraries", "PyTorch, NumPy, scikit-learn, Matplotlib, Pillow, PptxGenJS. No pre-trained models.", ""]];
  ack.forEach(([k, t, u], i) => {
    const y = 1.4 + i * 0.95;
    kicker(s, 7.6, y, 5.1, k);
    const runs = [{ text: t, options: { breakLine: !!u } }];
    if (u) runs.push({ text: u, options: { hyperlink: { url: u }, color: GOLD_D, fontSize: 9.5 } });
    s.addText(runs, { x: 7.6, y: y + 0.27, w: 5.1, h: 0.62, fontFace: FONT, fontSize: 10.5, color: NAVY, margin: 0, valign: "top" });
  });
  note(s, "1,590 lines added and 235 removed across 24 code files, from the unmodified upstream import (git diff 7ca82d3).", 6.62);
  s.addNotes("For reference: what we added on top of the original authors' code, and where the method, code and data come from.");
}

(async () => {
  if (MODE === "short") await shortDeck(); else await fullDeck();
  await pres.writeFile({ fileName: OUT });
  console.log("wrote", OUT, page, "slides");
})();
