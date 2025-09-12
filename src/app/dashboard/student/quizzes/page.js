"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function StudentQuizzes() {
  const sp = useSearchParams();
  const subject = sp.get("subject") || "Physics";
  const clazz = sp.get("class") || "11";

  const [chapters, setChapters] = useState([]);
  const [chapter, setChapter] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  // load chapters for subject/class
  useEffect(() => {
    fetch(`/api/syllabus?subject=${encodeURIComponent(subject)}&class=${clazz}`)
      .then((r) => r.json())
      .then((data) => {
        setChapters(data.chapters || []);
        setChapter((data.chapters || [])[0] || "");
      })
      .catch(() => setChapters([]));
  }, [subject, clazz]);

  const canStart = useMemo(() => chapter && difficulty, [chapter, difficulty]);

  const startQuiz = async () => {
    const url = `/api/questions?subject=${encodeURIComponent(subject)}&class=${clazz}&chapter=${encodeURIComponent(chapter)}&difficulty=${difficulty}&limit=20`;
    const res = await fetch(url);
    const data = await res.json();
    setQuestions(data || []);
    setIdx(0);
    setAnswers({});
    setScore(null);
  };

  const choose = (qId, optIndex) => {
    setAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const next = () => {
    if (idx < questions.length - 1) setIdx((i) => i + 1);
    else {
      // finish
      let sc = 0;
      for (const q of questions) {
        if (answers[q._id] === q.correctAnswer) sc++;
      }
      setScore(sc);
    }
  };

  if (!chapters.length) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Quizzes</h2>
        <p>Loading chapters… or none found for {subject} Class {clazz}.</p>
      </div>
    );
  }

  // Completed view
  if (score !== null) {
    return (
      <div style={{ padding: 24, maxWidth: 720 }}>
        <h2>Quiz Completed ✅</h2>
        <p style={{ marginTop: 8 }}>
          {subject} — Class {clazz} — {chapter} — <b>{difficulty.toUpperCase()}</b>
        </p>
        <h3 style={{ marginTop: 12 }}>Score: {score} / {questions.length}</h3>

        <div style={{ marginTop: 16 }}>
          <h4>Correct Answers</h4>
          <ol>
            {questions.map((q, i) => (
              <li key={q._id} style={{ marginBottom: 8 }}>
                <div><b>Q{i + 1}.</b> {q.question}</div>
                <div>Correct: {["A","B","C","D"][q.correctAnswer]} — {q.options[q.correctAnswer]}</div>
                <div>Your Ans: {answers[q._id] == null ? "—" : ["A","B","C","D"][answers[q._id]]}</div>
              </li>
            ))}
          </ol>
        </div>

        <button style={{ marginTop: 12 }} onClick={() => { setScore(null); setQuestions([]); }}>
          Back to selection
        </button>
      </div>
    );
  }

  // Selection view (before start)
  if (!questions.length) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Quizzes</h2>
        <p style={{ marginTop: 6 }}>
          Subject: <b>{subject}</b> &nbsp; | &nbsp; Class: <b>{clazz}</b>
        </p>

        <div style={{ marginTop: 16, display: "grid", gap: 12, maxWidth: 520 }}>
          <label>
            Chapter:
            <select value={chapter} onChange={(e) => setChapter(e.target.value)} style={{ marginLeft: 8 }}>
              {chapters.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label>
            Difficulty:
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="jee">JEE (PYQ)</option>
              <option value="neet">NEET (PYQ)</option>
            </select>
          </label>

          <button disabled={!canStart} onClick={startQuiz}>
            Start 20 Questions
          </button>
        </div>
      </div>
    );
  }

  // Quiz view
  const q = questions[idx];

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2>{subject} — Class {clazz} — {chapter} — <b>{difficulty.toUpperCase()}</b></h2>
      <div style={{ marginTop: 12 }}>
        <div><b>Question {idx + 1} / {questions.length}</b></div>
        <p style={{ marginTop: 8 }}>{q.question}</p>
        <ul style={{ marginTop: 8 }}>
          {q.options.map((opt, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
              <label>
                <input
                  type="radio"
                  name={`q-${q._id}`}
                  checked={answers[q._id] === i}
                  onChange={() => choose(q._id, i)}
                />{" "}
                {["A","B","C","D"][i]}. {opt}
              </label>
            </li>
          ))}
        </ul>
        <button onClick={next} style={{ marginTop: 8 }}>
          {idx === questions.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
