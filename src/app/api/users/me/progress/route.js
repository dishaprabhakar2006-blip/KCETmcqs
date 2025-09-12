import dbConnect from "@/lib/dbconnect";
import Attempt from "@/models/Attempt";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req) {
  await dbConnect();
  const token = req.headers.get("authorization") || "";
  const user = await getUserFromToken(token);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const start = new Date();
  start.setHours(0,0,0,0);
  const end = new Date();
  end.setHours(23,59,59,999);

  const todaysAttempts = await Attempt.countDocuments({ user: user._id, createdAt: { $gte: start, $lte: end }});
  const correctCount = await Attempt.countDocuments({ user: user._id, correct: true, createdAt: { $gte: start, $lte: end }});

  return new Response(JSON.stringify({ todaysAttempts, correctCount }), { status: 200 });
}
