import fs from "fs";

// Load your PhysicsQuestions.txt
const raw = fs.readFileSync("PhysicsQuestions.txt", "utf-8");

// Split by question blocks
const blocks = raw.split("\n\n");

let valid = 0;
let invalid = [];

blocks.forEach((block, i) => {
  const hasQuestion = block.includes("**Question:**");
  const hasOptions = block.includes("A.") && block.includes("B.") && block.includes("C.") && block.includes("D.");
  const hasAnswer = block.includes("**Correct Answer:");

  if (hasQuestion && hasOptions && hasAnswer) {
    valid++;
  } else {
    invalid.push({ index: i + 1, text: block });
  }
});

console.log(`✅ Valid questions: ${valid}`);
console.log(`❌ Invalid questions: ${invalid.length}`);
if (invalid.length > 0) {
  console.log("Here are the invalid ones:\n");
  invalid.forEach((q) => {
    console.log(`--- Question ${q.index} ---`);
    console.log(q.text);
    console.log("\n");
  });
}
