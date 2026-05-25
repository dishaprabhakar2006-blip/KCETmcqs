import { NextResponse } from 'next/server';
import dbConnect from "@/lib/dbConnect";
import Question from "@/models/Question";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const level = searchParams.get('level');

    // Custom stats endpoint for the gamified dashboard
    if (subject === 'stats') {
      try {
        const { getOfflineStats } = await import('@/lib/offlineDb');
        return NextResponse.json(getOfflineStats());
      } catch (err) {
        console.error("Stats fallback failed:", err);
        return NextResponse.json({ totalQuestions: 4000, totalChapters: 80, subjectsLoaded: ['Physics', 'Chemistry', 'Maths', 'Biology'] });
      }
    }

    if (!subject || !level) {
      return NextResponse.json(
        { error: 'Subject and level query parameters are required' },
        { status: 400 }
      );
    }

    try {
      await dbConnect();
      console.log("✅ DB connected successfully");

      const chapters = await Question.distinct('chapter', {
        subject: subject,
        level: level,
      });

      console.log("📚 Chapters found via MongoDB:", chapters);
      return NextResponse.json(chapters);

    } catch (dbError) {
      console.warn("⚠️ MongoDB connection failed. Falling back to local offline text files...", dbError.message);
      
      const { getOfflineChapters } = await import('@/lib/offlineDb');
      const chapters = getOfflineChapters(subject, level);
      
      console.log(`📚 Chapters found via Offline DB (${subject}, ${level}):`, chapters);
      return NextResponse.json(chapters);
    }

  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}

