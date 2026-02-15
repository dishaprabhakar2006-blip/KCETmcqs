import { NextResponse } from 'next/server';
import dbConnect from "@/lib/dbConnect";
import Question from "@/models/Question";

export async function GET(request) {
  try {
    await dbConnect();
    console.log("✅ DB connected");

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const level = searchParams.get('level');

    console.log("📥 Incoming:", subject, level);

    if (!subject || !level) {
      return NextResponse.json(
        { error: 'Subject and level query parameters are required' },
        { status: 400 }
      );
    }

    const chapters = await Question.distinct('chapter', {
      subject: subject,
      level: level,
    });

    console.log("📚 Chapters found:", chapters);

    return NextResponse.json(chapters);

  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}
