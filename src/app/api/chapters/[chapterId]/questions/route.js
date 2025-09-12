import { NextResponse } from 'next/server';
import dbConnect from "@/lib/dbconnect"; // Ensure this path is correct for your project
import Question from "@/models/Question";

export async function GET(request, { params }) {
  console.log("\n--- NEW REQUEST TO FETCH QUESTIONS ---");

  try {
    await dbConnect();
    
    const decodedChapter = decodeURIComponent(params.chapterId);
    console.log(`[API LOG] Decoded Chapter from URL: "${decodedChapter}"`);

    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty");
    console.log(`[API LOG] Difficulty from URL: "${difficulty}"`);

    if (!decodedChapter || !difficulty) {
        console.error("[API ERROR] Missing chapter or difficulty in the request.");
        return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const limit = parseInt(searchParams.get("limit") || "10");

    console.log(`[API LOG] Executing DB query with: chapter="${decodedChapter}", level="${difficulty}"`);

    // This is the database query
    // ... inside /api/chapters/[chapterId]/questions/route.js

// We can use the simpler .find() method now
const questions = await Question.find({ 
  chapter: decodedChapter, 
  level: difficulty 
});

// ...

    console.log(`[API LOG] DB query finished. Found ${questions.length} questions.`);

    // If the array is empty, the $match found nothing!
    if (questions.length === 0) {
        console.warn("[API WARN] The query returned 0 questions. Check if the chapter and level values exactly match your database records (case-sensitive).");
    }

    return NextResponse.json(questions);

  } catch (err) {
    // This will print the actual database or code error to your terminal
    console.error("❌ [API CATCH BLOCK] A critical error occurred:", err);
    return NextResponse.json(
      { error: "A server error occurred while fetching questions." },
      { status: 500 }
    );
  }
}