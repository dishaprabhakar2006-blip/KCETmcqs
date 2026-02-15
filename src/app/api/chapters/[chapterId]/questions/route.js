import { NextResponse } from 'next/server';
import dbConnect from "@/lib/dbConnect";
import Question from "@/models/Question";

export async function GET(request, context) {
  console.log("\n--- NEW REQUEST TO FETCH QUESTIONS ---");

  try {
    const { chapterId } = await context.params;

    await dbConnect();

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

    const questions = await Question.find({
      chapter: decodedChapter,
      level: difficulty,
    });

    console.log(`[API LOG] Found ${questions.length} questions`);

    return NextResponse.json(questions);

  } catch (err) {
    console.error("❌ API ERROR:", err);
    return NextResponse.json(
      { error: "Server error while fetching questions" },
      { status: 500 }
    );
  }
}
