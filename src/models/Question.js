import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  chapter: {
    type: String,
    required: true,
  },
  text: { // Changed from 'question' to 'text'
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
  },
  answer: { // Changed from 'correctAnswer' to 'answer'
    type: String,
    required: true,
  },
  level: {
    type: String,
    enum: ["easy", "medium", "hard", "pyq"],
    required: true,
  },
});

export default mongoose.models.Question || mongoose.model("Question", QuestionSchema);