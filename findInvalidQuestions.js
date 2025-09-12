import fs from "fs";

const filePath = "./src/ncert_text/PhysicsQuestions.txt";
const content = fs.readFileSync(filePath, "utf8");

const blocks = content.split(/\n\s*\n/); // split by blank lines

let invalid = [];

blocks.forEach((block, i) => {
  const lines = block.trim().split("\n");
  if (lines.length === 0) return;

  const hasQuestion = /\*\*\d+\.\*\*/.test(lines[0]) || /^\d+\./.test(lines[0]);
  const hasOptions =
    lines.some((l) => l.trim().startsWith("A.")) &&
    lines.some((l) => l.trim().startsWith("B.")) &&
    lines.some((l) => l.trim().startsWith("C.")) &&
    lines.some((l) => l.trim().startsWith("D."));
  const hasAnswer = lines.some((l) =>
    l.toLowerCase().includes("correct answer")
  );

  if (!(hasQuestion && hasOptions && hasAnswer)) {
    invalid.push({ index: i + 1, text: block });
  }
});

console.log(`❌ Found ${invalid.length} invalid/malformed questions`);
invalid.forEach((q, i) => {
  console.log(`\n--- Question block #${q.index} ---\n${q.text}\n`);
});
