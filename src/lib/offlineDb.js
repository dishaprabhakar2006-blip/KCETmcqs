// src/lib/offlineDb.js
import fs from 'fs';
import path from 'path';

// Memory cache for parsed questions and chapters
const dbCache = {
  questions: {}, // subject_level_chapter -> [questions]
  chapters: {},  // subject_level -> [chapters]
  allParsed: {}  // subject -> boolean
};

const subjectMap = {
  physics: 'Physics',
  chemistry: 'Chemistry',
  maths: 'Maths',
  biology: 'Biology',
  Physics: 'Physics',
  Chemistry: 'Chemistry',
  Maths: 'Maths',
  Biology: 'Biology'
};

/**
 * Normalizes subject string
 */
function getNormalizedSubject(subject) {
  return subjectMap[subject] || subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();
}

/**
 * Synchronously parses a subject's text file and builds cache
 */
function parseSubjectFile(subject) {
  const normSubject = getNormalizedSubject(subject);
  
  if (dbCache.allParsed[normSubject]) {
    return;
  }

  const filename = `${normSubject}Questions.txt`;
  // We look in src/ncert_text inside project root
  const filePath = path.join(process.cwd(), 'src', 'ncert_text', filename);

  console.log(`[OfflineDB] Loading questions from: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`[OfflineDB] File not found: ${filePath}`);
    dbCache.allParsed[normSubject] = true;
    return;
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split(/\r?\n/);
    
    let currentChapter = 'Unknown';
    let currentLevel = 'easy';
    let currentQuestion = null;
    let questionIndex = 0;
    
    const parsedQuestions = [];
    const chapterSet = {
      easy: new Set(),
      medium: new Set(),
      hard: new Set(),
      pyq: new Set()
    };

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Handle '&& ChapterName'
      if (trimmedLine.startsWith('&&')) {
        if (currentQuestion && currentQuestion.answer) {
          parsedQuestions.push(currentQuestion);
        }
        const chapterTitle = trimmedLine.replace('&&', '').trim();
        currentChapter = chapterTitle.replace(/ /g, '_').replace(' MCQs', '');
        currentQuestion = null;
      }
      // Handle Difficulty levels '#### level'
      else if (trimmedLine.startsWith('####')) {
        if (currentQuestion && currentQuestion.answer) {
          parsedQuestions.push(currentQuestion);
        }
        currentLevel = trimmedLine.replace(/#/g, '').trim().toLowerCase();
        // Fallback or safety check for valid enum
        if (!['easy', 'medium', 'hard', 'pyq'].includes(currentLevel)) {
          currentLevel = 'easy';
        }
        currentQuestion = null;
      }
      // Handle Question Start '**N.** Question'
      else if (trimmedLine.startsWith('**') && !trimmedLine.startsWith('**Correct Answer:')) {
        if (currentQuestion && currentQuestion.answer) {
          parsedQuestions.push(currentQuestion);
        }
        
        // Extract question text
        const dotIndex = trimmedLine.indexOf('.');
        let qText = '';
        if (dotIndex !== -1) {
          qText = trimmedLine.substring(dotIndex + 1).trim();
        } else {
          qText = trimmedLine.replace(/\*\*/g, '').trim();
        }

        questionIndex++;
        currentQuestion = {
          _id: `${normSubject}_${currentChapter}_${currentLevel}_${questionIndex}`,
          subject: normSubject,
          chapter: currentChapter,
          level: currentLevel,
          text: qText,
          options: [],
          answer: '',
        };
      }
      // Handle Options
      else if (
        trimmedLine.startsWith('A.') || 
        trimmedLine.startsWith('B.') || 
        trimmedLine.startsWith('C.') || 
        trimmedLine.startsWith('D.')
      ) {
        if (currentQuestion) {
          // Clean options: if it has "A. Option Value", we can strip "A. "
          let optionText = trimmedLine.substring(2).trim();
          currentQuestion.options.push(optionText);
        }
      }
      // Handle Correct Answer
      else if (trimmedLine.startsWith('**Correct Answer:')) {
        if (currentQuestion) {
          const parts = trimmedLine.split(':');
          if (parts.length > 1) {
            const answerLetter = parts[1].replace(/\*/g, '').trim();
            currentQuestion.answer = answerLetter; // e.g. "B"
          }
        }
      }
    }

    // Push the very last question
    if (currentQuestion && currentQuestion.answer) {
      parsedQuestions.push(currentQuestion);
    }

    // Sort into cache keys
    parsedQuestions.forEach(q => {
      const cacheKey = `${normSubject}_${q.level}_${q.chapter}`;
      if (!dbCache.questions[cacheKey]) {
        dbCache.questions[cacheKey] = [];
      }
      dbCache.questions[cacheKey].push(q);
      
      // Track distinct chapters for levels
      if (chapterSet[q.level]) {
        chapterSet[q.level].add(q.chapter);
      }
    });

    // Save distinct chapters to cache
    Object.keys(chapterSet).forEach(level => {
      const cacheKey = `${normSubject}_${level}`;
      dbCache.chapters[cacheKey] = Array.from(chapterSet[level]);
    });

    dbCache.allParsed[normSubject] = true;
    console.log(`[OfflineDB] Successfully parsed ${parsedQuestions.length} questions for ${normSubject}.`);

  } catch (err) {
    console.error(`[OfflineDB] Error parsing file for subject ${normSubject}:`, err);
  }
}

/**
 * Returns distinct chapters for a subject and level
 */
export function getOfflineChapters(subject, level) {
  const normSubject = getNormalizedSubject(subject);
  const normLevel = (level || 'easy').toLowerCase();
  
  parseSubjectFile(normSubject);
  
  const cacheKey = `${normSubject}_${normLevel}`;
  return dbCache.chapters[cacheKey] || [];
}

/**
 * Returns questions for a subject, chapter, and level
 */
export function getOfflineQuestions(subject, chapter, level) {
  const normSubject = getNormalizedSubject(subject);
  const normLevel = (level || 'easy').toLowerCase();
  
  parseSubjectFile(normSubject);
  
  const cacheKey = `${normSubject}_${normLevel}_${chapter}`;
  return dbCache.questions[cacheKey] || [];
}

/**
 * Returns summary stats for the dashboard (e.g. total questions)
 */
export function getOfflineStats() {
  const subjects = ['Physics', 'Chemistry', 'Maths', 'Biology'];
  let totalQuestions = 0;
  let totalChapters = 0;
  
  subjects.forEach(sub => {
    parseSubjectFile(sub);
  });
  
  Object.keys(dbCache.questions).forEach(key => {
    totalQuestions += dbCache.questions[key].length;
  });
  
  Object.keys(dbCache.chapters).forEach(key => {
    totalChapters += dbCache.chapters[key].length;
  });

  return {
    totalQuestions,
    totalChapters: Math.round(totalChapters / 3), // Divided by levels approx
    subjectsLoaded: subjects.filter(sub => dbCache.allParsed[sub])
  };
}
