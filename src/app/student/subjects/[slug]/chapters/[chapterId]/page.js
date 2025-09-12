"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MathJax from "react-mathjax2";

function getStudentId(){
  let id = localStorage.getItem("studentId");
  if (!id) { id = "guest-" + Math.random().toString(36).slice(2,9); localStorage.setItem("studentId", id); }
  return id;
}

export default function ChapterQuizPage(){
  const { slug, chapterId } = useParams(); // slug = subject, chapterId = chapter slug or id
  const [level, setLevel] = useState("easy");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const minRequired = 20;

  const studentId = getStudentId();

  useEffect(() => {
    setQuestions([]);
  }, [slug, chapterId, level]);

  async function loadQuestions(){
    setLoading(true);
    try {
      const res = await fetch(`/api/questions?subject=${encodeURIComponent(slug)}&chapter=${encodeURIComponent(chapterId)}&level=${encodeURIComponent(level)}&limit=50&studentId=${encodeURIComponent(studentId)}`);
      const data = await res.json();
      if (data.questions) setQuestions(data.questions);
      else { console.error("API error", data); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function choose(qid, opt){
    setAnswers(prev => ({ ...prev, [qid]: opt }));
  }

  async function submitAttempt(){
    const attempted = Object.keys(answers).length;
    if (attempted < minRequired) {
      alert(`You must attempt at least ${minRequired} questions. You've done ${attempted}.`);
      return;
    }
    const details = Object.entries(answers).map(([qid, selectedText])=>({ questionId: qid, selectedText }));
    const payload = {
      studentId,
      studentName: localStorage.getItem("studentName") || "Guest",
      subject: slug,
      chapter: chapterId,
      level,
      totalQuestions: details.length,
      details
    };
    try {
      const res = await fetch("/api/attempts", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      const j = await res.json();
      if (j.ok) {
        alert(`Submitted. Score: ${j.attempt.correctCount}/${j.attempt.totalQuestions}`);
        // refresh: remove attempted Qs (or reload)
        window.location.reload();
      } else {
        console.error(j);
        alert("Failed to submit");
      }
    } catch (err){ console.error(err); alert("Network error"); }
  }

  return (
    <div className="p-6 min-h-screen bg-gray-900 text-white">
      <h1 className="text-2xl mb-4">{slug} — Chapter {chapterId}</h1>

      <div className="mb-4">
        <label>Level: </label>
        <select value={level} onChange={e=>setLevel(e.target.value)} className="text-black ml-2">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="pyq">Challenger (PYQ)</option>
        </select>
        <button onClick={loadQuestions} className="ml-3 bg-green-600 px-3 py-1 rounded">Load Questions</button>
      </div>

      <div className="mb-4">
        <div className="w-full bg-gray-700 h-4 rounded">
          <div className="bg-green-500 h-4 rounded" style={{ width: `${(Object.keys(answers).length / minRequired) * 100}%` }} />
        </div>
        <p className="mt-2">Attempted: <b>{Object.keys(answers).length}</b> / {minRequired} required</p>
      </div>

      {loading ? <p>Loading...</p> : (
        <>
          {questions.length === 0 ? <p>No questions available (or all attempted).</p> : (
            <MathJax.Context input="tex">
              <div className="space-y-6">
                {questions.map((q, idx) => (
                  <div key={q._id} className="bg-gray-800 p-4 rounded">
                    <div className="mb-3">
                      <MathJax.Node>{q.question}</MathJax.Node>
                    </div>
                    <div className="grid gap-2">
                      {q.options.map((opt,i)=>(
                        <button key={i} onClick={()=>choose(q._id, opt)}
                          className={`text-left p-2 rounded ${answers[q._id]===opt ? "bg-blue-600" : "bg-gray-700"}`}>
                          <MathJax.Node inline>{opt}</MathJax.Node>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </MathJax.Context>
          )}
        </>
      )}

      <div className="mt-6">
        <button onClick={submitAttempt} className="bg-blue-600 px-4 py-2 rounded">Submit Attempt</button>
      </div>
    </div>
  );
}
