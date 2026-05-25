import { NextResponse } from 'next/server';
import dbConnect from "@/lib/dbConnect";
import Question from "@/models/Question";

export async function GET(request, context) {
  console.log("\n--- NEW REQUEST TO FETCH QUESTIONS ---");

  try {
    const { chapterId } = await context.params;
    const decodedChapter = decodeURIComponent(chapterId);
    console.log(`[API LOG] Decoded Chapter from URL: "${decodedChapter}"`);

    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty");
    console.log(`[API LOG] Difficulty from URL: "${difficulty}"`);

    if (!decodedChapter || !difficulty) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    try {
      await dbConnect();
      const questions = await Question.find({
        chapter: decodedChapter,
        level: difficulty,
      });

      console.log(`[API LOG] Found ${questions.length} questions via MongoDB`);
      return NextResponse.json(questions);

    } catch (dbError) {
      console.warn("⚠️ MongoDB fetch failed. Falling back to local offline text files...", dbError.message);
      
      const { getOfflineQuestions } = await import('@/lib/offlineDb');
      
      // Since subject is not in the URL, search across all 4 subjects to find the matching chapter
      const subjects = ['Physics', 'Chemistry', 'Maths', 'Biology'];
      let questions = [];
      
      for (const subject of subjects) {
        const found = getOfflineQuestions(subject, decodedChapter, difficulty);
        if (found && found.length > 0) {
          questions = found;
          console.log(`[API LOG] Found ${questions.length} questions in offline file for subject: ${subject}`);
          break;
        }
      }
      
      return NextResponse.json(questions);
    }

  } catch (err) {
    console.error("❌ API ERROR:", err);
    return NextResponse.json(
      { error: "Server error while fetching questions" },
      { status: 500 }
    );
  }
}

