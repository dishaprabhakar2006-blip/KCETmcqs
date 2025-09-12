"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function QuizPage() {
  const { chapterId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  const minRequired = 20;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/questions/${chapterId}`);
        const data = await res.json();
        if (data.success) {
          setQuestions(data.questions);
        }
        setLoading(false);
      } catch (err) {
        console.error("❌ Error fetching questions:", err);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [chapterId]);

  const handleAnswer = (qid, ans) => {
    setAnswers({ ...answers, [qid]: ans });
  };

  const attempted = Object.keys(answers).length;

  const handleSubmit = () => {
    if (attempted < minRequired) {
      alert(
        `⚠️ You must attempt at least ${minRequired} questions. 
You’ve only done ${attempted}.`
      );
      return;
    }

    // Later: send answers to backend for evaluation
    alert("✅ Great job! Submitting your answers...");
  };

  if (loading) {
    return <p className="p-6 text-white">Loading questions...</p>;
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">
        📘 Quiz – Chapter {chapterId}
      </h1>

      {/* ✅ Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
        <div
          className="bg-green-500 h-4 rounded-full transition-all"
          style={{ width: `${(attempted / minRequired) * 100}%` }}
        />
      </div>
      <p className="mb-4">
        Attempted: <b>{attempted}</b> / {minRequired} required
      </p>

      {/* ✅ Render Questions */}
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q._id} className="bg-gray-800 p-4 rounded-lg">
            <p className="mb-2">
              Q{idx + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(q._id, opt)}
                  className={`block w-full p-2 rounded ${
                    answers[q._id] === opt ? "bg-green-600" : "bg-gray-700"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Submit Button */}
      <button
        onClick={handleSubmit}
        className="mt-6 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
      >
        Submit
      </button>
    </div>
  );
}
