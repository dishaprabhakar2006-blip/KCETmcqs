// src/models/Attempt.js
import mongoose from "mongoose";

const AttemptSchema = new mongoose.Schema({
  studentId: { type: String, required: true },      // guest-... or real user id
  studentName: { type: String },
  subject: { type: String, required: true },
  classYear: { type: Number },
  chapter: { type: String, required: true },        // chapter slug
  level: { type: String, enum: ["easy","medium","hard","pyq"], required: true },
  totalQuestions: { type: Number, required: true },
  correctCount: { type: Number, required: true },
  details: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      selectedText: String,
      correctText: String,
      correct: Boolean,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Attempt || mongoose.model("Attempt", AttemptSchema);
