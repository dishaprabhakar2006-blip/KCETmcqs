// src/lib/generate_and_seed.js
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import dbConnect from "../lib/dbConnect.js";
import Question from "../models/Question.js";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) throw new Error("Missing OPENAI_API_KEY in .env.local");

const chaptersPath = path.join(process.cwd(), "src", "data", "chapters.json");
const chapters = JSON.parse(fs.readFileSync(chaptersPath, "utf8"));

const TARGET_PER_CHAPTER = 50; // change to 100 if you need; start with 50
const BATCH_SIZE = 10;
const DELAY_MS = 1200;

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
function normalizeText(s){ return s.replace(/\s+/g," ").trim().toLowerCase(); }

async function callOpenAI(prompt){
  const res = await fetch("https://api.openai.com/v1/chat/completions",{
    method: "POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization": `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2000
    })
  });
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? json;
}

function extractJSON(text){
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end > start) {
    const jsonText = text.slice(start, end+1);
    return JSON.parse(jsonText);
  }
  return JSON.parse(text);
}

function buildPrompt(subject, chapterName, batchSize){
  return `
You are an expert question-setter for NCERT + JEE/NEET style MCQs.
Generate exactly ${batchSize} unique multiple-choice questions for NCERT Class 11/12 ${subject.toUpperCase()}, chapter "${chapterName}".
Output ONLY a JSON array. Each element must be:
{
  "question": "...",           // prefer LaTeX for math, e.g., "$\\int_0^1 x^2 dx$"
  "options": ["A","B","C","D"],
  "correctAnswer": "A or exact option text",
  "level": "easy"|"medium"|"hard"|"pyq"
}
Rules:
- Use factual NCERT-level content. For "pyq" include JEE/NEET style.
- Options must be four and distinct.
- Correct answer must exactly match one option string.
- No commentary. Pure JSON only.
  `;
}

async function generateForChapter(subject, chapterSlug, chapterName){
  await dbConnect();
  console.log(`\n-> Generating for ${subject} / ${chapterSlug} (${chapterName})`);

  const existing = await Question.find({ subject, chapter: chapterSlug }).lean();
  const existingNorm = new Set(existing.map(q => normalizeText(q.question)));

  let inserted = 0;
  let tries = 0;
  while (existing.length + inserted < TARGET_PER_CHAPTER && tries < 200) {
    tries++;
    const need = Math.min(BATCH_SIZE, TARGET_PER_CHAPTER - (existing.length + inserted));
    const prompt = buildPrompt(subject, chapterName, need);
    let raw;
    try { raw = await callOpenAI(prompt); }
    catch(err){ console.error("OpenAI call failed:", err); await sleep(2000); continue; }

    let arr;
    try { arr = extractJSON(raw); if (!Array.isArray(arr)) throw new Error("not array"); }
    catch(err){ console.error("Parse failed. Raw:\n", raw); await sleep(1500); continue; }

    const docs = [];
    for (const item of arr) {
      const qText = (item.question || "").trim();
      if (!qText || !item.options || item.options.length !== 4 || !item.correctAnswer) continue;
      const norm = normalizeText(qText);
      if (existingNorm.has(norm)) continue; // duplicate
      // ensure correctAnswer matches exactly an option: if not, try normalization
      if (!item.options.includes(item.correctAnswer)) {
        const match = item.options.find(o => normalizeText(o) === normalizeText(item.correctAnswer));
        if (match) item.correctAnswer = match; else continue;
      }
      docs.push({
        subject,
        chapter: chapterSlug,
        chapterName,
        classYear: item.classYear || undefined,
        level: item.level || "medium",
        question: qText,
        options: item.options,
        correctAnswer: item.correctAnswer,
        source: "AI"
      });
      existingNorm.add(norm);
    }

    if (docs.length) {
      try {
        const res = await Question.insertMany(docs);
        inserted += res.length;
        console.log(`Inserted ${res.length} (total inserted: ${inserted})`);
      } catch (err) {
        console.error("DB insert error:", err);
      }
    } else {
      console.log("No valid docs in this batch (duplicates or invalid).");
    }

    await sleep(DELAY_MS);
  }

  console.log(`Done chapter ${chapterSlug}: inserted ${inserted}`);
  return inserted;
}

async function main(){
  let totalInserted = 0;
  for (const ch of chapters) {
    const inserted = await generateForChapter(ch.subject, ch.chapterSlug, ch.chapterName);
    totalInserted += inserted;
  }
  console.log("ALL DONE. totalInserted:", totalInserted);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
