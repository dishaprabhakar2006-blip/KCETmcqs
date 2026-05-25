import { NextResponse } from 'next/server';
import dbConnect from "@/lib/dbConnect";
import Question from "@/models/Question";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const chapter = searchParams.get("chapter");
    const level = searchParams.get("level");

    console.log("Subject:", subject);
    console.log("Chapter:", chapter);
    console.log("Level:", level);

    if (!subject || !chapter || !level) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    try {
      await dbConnect();
      const questions = await Question.find({
        subject,
        chapter,
        level,
      });
      return NextResponse.json(questions);

    } catch (dbError) {
      console.warn("⚠️ MongoDB connection failed. Falling back to local offline text files...", dbError.message);
      
      const { getOfflineQuestions } = await import('@/lib/offlineDb');
      const questions = getOfflineQuestions(subject, chapter, level);
      
      return NextResponse.json(questions);
    }

  } catch (error) {
    console.error("Questions API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

