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
  const P2 = "2E6DB4";
  const img = async (slide, file, x, y, w, h, alt) => {
    const meta = await sharp(CH + file).metadata();
    const r = meta.width / meta.height; let iw = w, ih = w / r;
    if (ih > h) { ih = h; iw = h * r; }
    slide.addImage({ path: CH + file, x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih, altText: alt, objectName: alt });
  };
  // one big takeaway band at the bottom of a slide
  const takeaway = (slide, text) => {
    slide.addShape(pres.shapes.RECTANGLE, { x: MX, y: 6.05, w: 0.08, h: 0.6, fill: { color: C.accent1 }, line: { color: C.accent1 }, objectName: "Takeaway bar" });
    slide.addText(text, { x: MX + 0.25, y: 6.0, w: W - 2 * MX - 0.25, h: 0.7, fontSize: 20, bold: true, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: "Takeaway" });
  };
  const side = (slide, items, x, y, w) => {
    let yy = y;
    items.forEach(([big, small, color]) => {
      slide.addText(big, { x, y: yy, w, h: 0.85, fontSize: 44, bold: true, color, fontFace: "+mj-lt", margin: 0, isTextBox: true });
      slide.addText(small, { x, y: yy + 0.85, w, h: 0.75, fontSize: 16, color: C.text1, margin: 0, valign: "top", isTextBox: true });
      yy += 1.85;
    });
  };
  let s;

  // ===== 1. Model and attack
  s = pres.addSlide({ masterName: "Content" });
  s.addText("The setup: federated learning on handwriting", { placeholder: "title" });
  const steps = [
    [ic.users, C.accent5, "50 participants", "each holds a share of the FEMNIST images (62 classes)"],
    [ic.random, C.accent5, "5 train per round", "a small CNN, on their own data only"],
    [ic.layers, C.accent5, "Server averages", "the 5 models, 200 rounds in total"],
  ];
  steps.forEach(([im, col, head, body], i) => {
    const x = MX + i * 4.1;
    iconCircle(s, im, x, 1.6, 0.85, col, head);
    s.addText(head, { x: x + 1.05, y: 1.6, w: 2.8, h: 0.45, fontSize: 20, bold: true, color: C.text1, margin: 0, isTextBox: true });
    s.addText(body, { x: x + 1.05, y: 2.05, w: 2.8, h: 0.8, fontSize: 15, color: C.text2, margin: 0, valign: "top", isTextBox: true });
    if (i < 2) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 3.75, y: 1.85, w: 0.3, h: 0.35, fill: { color: C.accent6 }, line: { color: C.accent6 }, objectName: "Step arrow " + (i + 1) });
  });
  s.addText([{ text: "86%", options: { fontSize: 54, bold: true, color: C.accent2, fontFace: "+mj-lt", breakLine: true } }, { text: "accuracy without any attack", options: { fontSize: 16, color: C.text1 } }],
    { x: MX, y: 3.35, w: 3.6, h: 1.7, margin: 0, valign: "top", isTextBox: true });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.7, y: 3.3, w: W - MX - 4.7, h: 2.45, rectRadius: 0.1, fill: { color: "FBE9E2" }, line: { color: "FBE9E2" }, objectName: "Attack card" });
  s.addText("The attack: some participants train on wrong labels", { x: 5.0, y: 3.45, w: 7.4, h: 0.5, fontSize: 20, bold: true, color: C.accent1, margin: 0, isTextBox: true });
  s.addText([
    { text: "Test 1:  every ‘O’ labeled ‘0’", options: { bold: true, color: C.accent1, breakLine: true } },
    { text: "letters the model already mixes up", options: { color: C.text2, fontSize: 15, breakLine: true } },
    { text: "Test 2:  every ‘A’ labeled ‘h’", options: { bold: true, color: P2, breakLine: true } },
    { text: "letters it never mixes up", options: { color: C.text2, fontSize: 15 } },
  ], { x: 5.0, y: 4.0, w: 4.4, h: 1.65, fontSize: 18, margin: 0, valign: "top", paraSpaceAfter: 2, isTextBox: true });
  dotGrid(s, 9.75, 4.05, 0.2, 0.08, [3, 17, 22, 38, 44, 9, 31], C.accent2, "Participants");
  s.addText("0–50% attackers", { x: 9.75, y: 5.4, w: 2.8, h: 0.3, fontSize: 13, color: C.text2, margin: 0, isTextBox: true });
  takeaway(s, "The server never sees the data, so it cannot check the labels.");
  s.addNotes("About 1 minute. We trained a model with federated learning on FEMNIST, a dataset of handwritten digits and letters, 62 classes. 50 participants each hold part of the data. Each round, 5 of them train a small convolutional network on their own data and the server averages the 5 models. After 200 rounds the model reaches 86 percent accuracy. The attack: a share of the participants, from 0 to 50 percent, trains on deliberately wrong labels. In test 1 they turn every O into a zero, letters the model already confuses. In test 2 they turn every A into an h, letters it never confuses. The server never sees anyone's data, so it has no way to check.");

  // ===== 2. Damage
  s = pres.addSlide({ masterName: "Content" });
  s.addText("The attacked letter collapses at 20%+ attackers", { placeholder: "title" });
  await img(s, "c4_head2head.png", MX, 1.35, 8.2, 4.55, "Recall loss by attacker share");
  side(s, [["−68 pts", "‘O’ recall at 50% attackers (75% → 7%)", C.accent1], ["−62 pts", "‘A’ recall at 50% attackers (92% → 31%)", P2]], 9.2, 1.6, 3.55);
  takeaway(s, "Look-alike or not, the damage is about the same at 20–40% attackers.");
  s.addNotes("About 1.5 minutes. This is the main result. Each bar is how much of the attacked letter the model stops recognising. With one or two attackers out of 50, nothing measurable happens. From 20 percent the damage climbs fast, and at 50 percent the model has lost most of the attacked letter. The surprise: between 20 and 40 percent, both attacks do almost the same damage, although the model already confused O with zero 45 times more often than A with h. The attacker does not need letters that look alike. Only at the extremes do look-alikes fall further.");

  // ===== 3. Where images go
  s = pres.addSlide({ masterName: "Content" });
  s.addText("The model learns exactly the lie it was taught", { placeholder: "title" });
  await img(s, "c6_where.png", MX, 1.35, W - 2 * MX, 4.55, "Where source images go");
  takeaway(s, "‘O’ images go only to ‘0’. ‘A’ images mostly go to ‘h’, and a few scatter to other letters.");
  s.addNotes("About 1 minute. Here is where the test images of the attacked letter end up. Grey is still correct. In test 1, every O the model loses is labelled zero, nothing else: the attack is surgical. In test 2, most lost A images become h, but at high attacker shares about one in ten lands on some other letter. Forcing an unrelated label also makes A harder to recognise in general.");

  // ===== 4. Rounds
  s = pres.addSlide({ masterName: "Content" });
  s.addText("Under attack, the model never settles", { placeholder: "title" });
  await img(s, "c5_rounds.png", MX, 1.35, W - 2 * MX, 4.55, "Recall by round");
  takeaway(s, "Recall swings 20–40 pts depending on whether attackers were picked that round.");
  s.addNotes("About 45 seconds. This follows the attacked letter through all 200 rounds. Without an attack, in grey, the model learns the letter within a few dozen rounds and stays there. With attackers, it rises when only honest participants are picked and falls whenever an attacker is among the five. It never settles, and the final result depends on who happened to train last.");

  // ===== 5. Why nobody notices
  s = pres.addSlide({ masterName: "Content" });
  s.addText("Overall accuracy barely moves, so nobody notices", { placeholder: "title" });
  await img(s, "c7_accshare.png", MX, 1.35, 7.8, 4.55, "Accuracy drop vs recall loss");
  side(s, [["−1.9 pts", "accuracy at 50% attackers in test 1", C.accent1], ["−0.5 pts", "in test 2: ‘A’ is under 1% of the test set", P2]], 9.2, 1.6, 3.55);
  takeaway(s, "With 62 small classes, accuracy can’t reveal the attack: defenses must check each class.");
  s.addNotes("About 1 minute 15. Despite wiping out most of a letter, overall accuracy drops by under 2 points, and by half a point in test 2. The cost is simply the attacked letter's share of the test set times how much of it was lost, the dashed lines. No class in FEMNIST is more than 5.4 percent of the test set, so attacking any one letter can cost at most about 5 points, and below 30 percent attackers the drop hides inside normal run-to-run variation. So on a dataset with many classes, overall accuracy cannot reveal this attack: a defense has to look at each class, or at the participants' updates. Thank you.");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
