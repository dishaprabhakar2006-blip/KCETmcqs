import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Attempt from "@/models/Attempt";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const dateStr = url.searchParams.get("date"); // optional, YYYY-MM-DD
    const from = dateStr ? new Date(dateStr + "T00:00:00Z") : new Date(new Date().toDateString());
    const to = new Date(from); to.setDate(from.getDate() + 1);

    // total attempts today
    const totalAttempts = await Attempt.countDocuments({ createdAt: { $gte: from, $lt: to } });

    // group by student and compute average score and categories
    const agg = await Attempt.aggregate([
      { $match: { createdAt: { $gte: from, $lt: to } } },
      { $group: {
          _id: "$studentId",
          avgScorePercent: { $avg: { $multiply: [{ $divide: ["$correctCount","$totalQuestions"] }, 100] } },
          attempts: { $sum: 1 }
      }},
    ]);

    const studentsAbove = agg.filter(a => a.avgScorePercent >= 70).length;
    const studentsAverage = agg.filter(a => a.avgScorePercent >= 40 && a.avgScorePercent < 70).length;
    const studentsBelow = agg.filter(a => a.avgScorePercent > 0 && a.avgScorePercent < 40).length;
    const studentsZero = agg.filter(a => a.avgScorePercent === 0).length;

    return NextResponse.json({
      ok:true,
      totalAttempts,
      studentsOverall: agg.length,
      studentsAbove,
      studentsAverage,
      studentsBelow,
      studentsZero,
    });
  } catch (err) {
    console.error("Error /api/analytics/overview:", err);
    return NextResponse.json({ ok:false, error:"Failed to compute analytics" }, { status:500 });
  }
}
