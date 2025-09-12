"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

// ✅ Force runtime rendering (no prerender build errors)
export const dynamic = "force-dynamic";

function getStudentId() {
  // If user is logged-in, use their id; else use a persistent guest id in localStorage
  let id = localStorage.getItem("studentId");
  if (!id) {
    id = "guest-" + Math.random().toString(36).slice(2, 9);
    localStorage.setItem("studentId", id);
  }
  return id;
}

export default function ChapterQuizPage() {
  const { slug, chapterId } = useParams();
  const [level, setLevel] = useState("easy");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  async function loadQuestions() {
    setLoading(true);
    try {
      // fetch random 10 questions for chosen level
      const res = await fetch(
        `/api/questions?subject=${slug}&chapter=${chapterId}&level=${level}&random=1&limit=10`
      );
      const data = await res.json();
      if (data.ok) setQuestions(data.questions);
      else alert("Failed to load questions");
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  const startQuiz = async () => {
    await loadQuestions();
    setStarted(true);
  };

  return (
    <main className="min-h-screen flex items-start justify-center p-8 bg-gray-900 text-white">
      <div className="w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-4">
          {slug ? slug.toUpperCase() : ""} — Chapter {chapterId || ""}
        </h2>

        {!started ? (
          <div className="space-y-4">
            <label>
              Difficulty:
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="ml-2 text-black p-1"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="challenger">Challenger (PYQ)</option>
              </select>
            </label>

            <div className="flex gap-3">
              <button
                onClick={startQuiz}
                className="bg-green-600 px-4 py-2 rounded"
              >
                Start Quiz
              </button>
              <button
                onClick={loadQuestions}
                className="bg-gray-700 px-4 py-2 rounded"
              >
                Load Preview
              </button>
              {loading && <span>Loading...</span>}
            </div>

            <p className="text-sm text-gray-300 mt-4">
              Note: You will be given 10 randomized questions from this
              chapter/level.
            </p>
          </div>
        ) : (
          <QuizRunner
            questions={questions}
            chapter={chapterId}
            subject={slug}
            level={level}
          />
        )}
      </div>
    </main>
  );
}

/* QuizRunner component */
function QuizRunner({ questions = [], chapter, subject, level }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]); // store { questionId, selectedIndex, correctIndex }

  useEffect(() => {
    // reset on new questions
    setIdx(0);
    setSelected(null);
    setScore(0);
    setAnswers([]);
  }, [questions]);

  if (!questions || questions.length === 0) {
    return <div>No questions loaded.</div>;
  }

  const q = questions[idx];

  const choose = (optionIndex) => {
    setSelected(optionIndex);
  };

  const next = () => {
    const correctIndex = q.correctAnswerIndex;
    const isCorrect = selected === correctIndex;
    if (isCorrect) setScore((s) => s + 1);

    setAnswers((a) => [
      ...a,
      {
        questionId: q._id || q.id,
        selectedIndex: selected,
        correctIndex,
        correct: isCorrect,
      },
    ]);

    setSelected(null);
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    // post attempt to server
    const studentId = getStudentId();
    const payload = {
      studentId,
      studentName: localStorage.getItem("studentName") || "Guest",
      subject,
      classYear: questions[0]?.classYear || undefined,
      chapter,
      chapterId: Number(chapter),
      level,
      totalQuestions: questions.length,
      details: answers,
    };

    // compute correctCount reliably
    payload.correctCount = answers.filter((a) => a.correct).length;

    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        console.error("Failed to record attempt", data);
      } else {
        console.log("Attempt recorded:", data.attempt);
      }
    } catch (err) {
      console.error("Network error", err);
    }

    // show final UI
    alert(
      `Quiz finished! Score ${payload.correctCount}/${payload.totalQuestions}`
    );
    // reload page or show results - here we reload to go back to start
    window.location.reload();
  };

  return (
    <div className="bg-gray-800 p-6 rounded space-y-4">
      <div>
        <div className="text-sm text-gray-300 mb-1">
          Q {idx + 1} / {questions.length}
        </div>
        <div className="text-lg font-semibold mb-2">{q.text}</div>
        <div className="grid gap-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => choose(i)}
              className={
                "text-left p-3 rounded " +
                (selected === i ? "bg-blue-600 text-white" : "bg-gray-700")
              }
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <div>Current score: {answers.filter((a) => a.correct).length}</div>
        <div>
          <button
            onClick={next}
            disabled={selected === null}
            className="bg-green-500 px-4 py-1 rounded"
          >
            {idx + 1 === questions.length ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
