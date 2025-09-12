import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Physics"
  classes: [{ type: Number }], // [11,12]
  slug: { type: String, unique: true } // e.g., "physics"
});

export default mongoose.models.Subject || mongoose.model("Subject", SubjectSchema);
