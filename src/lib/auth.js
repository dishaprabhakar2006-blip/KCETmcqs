import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function getUserFromToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    await dbConnect();
    const user = await User.findById(payload.id).lean();
    return user;
  } catch (err) {
    return null;
  }
}
