import { NextResponse } from 'next/server';
import dbConnect from "@/lib/dbConnect";
import Question from "@/models/Question";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const chapter = searchParams.get("chapter");
    const level = searchParams.get("level");

    console.log("Subject:", subject);
    console.log("Chapter:", chapter);
    console.log("Level:", level);

    const questions = await Question.find({
      subject,
      chapter,
      level,
    });

    return NextResponse.json(questions);

  } catch (error) {
    console.error("Questions API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
