// src/app/api/subjects/[slug]/chapters/route.js
import dbConnect from "@/lib/dbconnect";
import Subject from "@/models/Subject";
import Chapter from "@/models/Chapter";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { slug } = params;

    const subject = await Subject.findOne({ slug }).lean();
    if (!subject) {
      return new Response(JSON.stringify({ error: "Subject not found" }), { status: 404 });
    }

    const chapters = await Chapter.find({ subject: subject._id }).lean();
    return new Response(JSON.stringify(chapters), { status: 200 });
  } catch (err) {
    console.error("❌ Chapters fetch error:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch chapters" }), { status: 500 });
  }
}
