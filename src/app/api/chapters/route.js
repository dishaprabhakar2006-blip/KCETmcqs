import { NextResponse } from 'next/server';
import dbConnect from "@/lib/dbConnect";
import Question from "@/models/Question";

export async function GET(request) {
  try {
    await dbConnect();

    // Get subject and level from the request's URL query parameters
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const level = searchParams.get('level');

    // Check if the required parameters are provided
    if (!subject || !level) {
      return NextResponse.json(
        { error: 'Subject and level query parameters are required' },
        { status: 400 }
      );
    }

    // Find distinct chapters that MATCH the subject and level
    const chapters = await Question.distinct('chapter', { 
      subject: subject, 
      level: level 
    });
    
    return NextResponse.json(chapters);

  } catch (err) {
    console.error("❌ Chapters fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}