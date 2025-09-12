import mongoose from "mongoose";

const ChapterSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  title: { type: String, required: true },
  classYear: { type: Number, enum: [11,12], required: true },
  slug: { type: String, index: true },
  text: { type: String }, // full chapter text (optional)
  pdfRef: { type: String } // link to uploaded PDF in storage if needed
});

export default mongoose.models.Chapter || mongoose.model("Chapter", ChapterSchema);
