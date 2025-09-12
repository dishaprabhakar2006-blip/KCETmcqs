import dotenv from "dotenv";
dotenv.config({ path: "../../../.env.local" });
import dbConnect from "./dbConnect.js";
import Question from "../models/Question.js";
import fs from "fs";
import path from "path";

const textDir = "./src/ncert_text";

/**
 * Parses a text file and extracts question data.
 * @param {string} text - The content of the text file.
 * @param {string} subject - The subject (e.g., "Physics").
 * @returns {Array<Object>} An array of question objects.
 */
function parseQuestions(text, subject) {
  const questions = [];
  const lines = text.split('\n');
  let currentLevel = 'easy';
  let currentChapter = 'Unknown';
  let currentQuestion = null;

  for (const line of lines) {
    if (!line || !line.trim()) {
      continue;
    }

    const trimmedLine = line.trim();

    // Now correctly handles the '&& ChapterName' format
    if (trimmedLine.startsWith('&&')) {
      if (currentQuestion && currentQuestion.answer) {
        questions.push(currentQuestion);
      }
      const chapterTitle = trimmedLine.replace('&&', '').trim();
      currentChapter = chapterTitle.replace(/ /g, '_').replace(' MCQs', '');
      currentQuestion = null;
    } 
    // Keep '####' for difficulty levels
    else if (trimmedLine.startsWith('####')) {
      if (currentQuestion && currentQuestion.answer) {
        questions.push(currentQuestion);
      }
      currentLevel = trimmedLine.replace(/#/g, '').trim().toLowerCase();
      currentQuestion = null;
    } else if (trimmedLine.startsWith('**') && !trimmedLine.startsWith('**Correct Answer:')) {
      if (currentQuestion && currentQuestion.answer) {
        questions.push(currentQuestion);
      }
      const qText = trimmedLine.substring(trimmedLine.indexOf('.') + 1).trim();
      currentQuestion = {
        subject: subject,
        chapter: currentChapter,
        level: currentLevel,
        text: qText,
        options: [],
        answer: '',
      };
    } else if (trimmedLine.startsWith('A.') || trimmedLine.startsWith('B.') || trimmedLine.startsWith('C.') || trimmedLine.startsWith('D.')) {
      if (currentQuestion) {
        currentQuestion.options.push(trimmedLine);
      }
    } else if (trimmedLine.startsWith('**Correct Answer:')) {
      if (currentQuestion) {
        const answerValue = trimmedLine.split(': ')[1]?.trim();
        if (answerValue) {
          currentQuestion.answer = answerValue;
        }
      }
    }
  }

  if (currentQuestion && currentQuestion.answer) {
    questions.push(currentQuestion);
  }

  return questions;
}
/**
 * Connects to the database and seeds the questions from the text files.
 */
async function seed() {
    await dbConnect();
    
    try {
        await Question.deleteMany({});
    } catch (dbError) {
        console.error("❌ Error deleting existing questions:", dbError.message);
        process.exit(1);
    }

    let totalQuestionsInserted = 0;

    const files = fs.readdirSync(textDir);
    const textFiles = files.filter(file => file.endsWith('.txt') || file.endsWith('.md'));

    if (textFiles.length === 0) {
        console.log("⚠️ No text files found in the directory.");
        process.exit();
    }

    for (const filename of textFiles) {
        const filePath = path.join(textDir, filename);
        const subject = filename.replace('Questions.txt', '');

        try {
            const fileContent = fs.readFileSync(filePath, "utf8");
            const questions = parseQuestions(fileContent, subject);

            if (questions.length > 0) {
                const validQuestions = questions.filter(q => q.answer);
                if (validQuestions.length > 0) {
                    try {
                        await Question.insertMany(validQuestions);
                        console.log(`✅ Inserted ${validQuestions.length} questions from ${filename}.`);
                        totalQuestionsInserted += validQuestions.length;
                    } catch (dbError) {
                        console.error(`❌ Database insertion failed for ${filename}:`, dbError.message);
                    }
                } else {
                    console.log(`⚠️ No valid questions with answers found in ${filename}.`);
                }
            } else {
                console.log(`⚠️ No questions found in ${filename}.`);
            }
        } catch (fileError) {
            console.error(`❌ Could not process the file ${filename}:`, fileError.message);
        }
    }
    console.log(`🎉 Seeding completed! Total questions inserted: ${totalQuestionsInserted}.`);
    process.exit();
}

seed();