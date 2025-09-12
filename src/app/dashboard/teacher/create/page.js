"use client";
import { useEffect, useState } from "react";

const SUBJECTS = ["Physics", "Chemistry", "Math", "Biology"];
const DIFFICULTIES = ["easy", "medium", "hard", "jee", "neet"];

export default function CreateQuestion() {
  const [subject, setSubject] = useState("Physics");
  const [clazz, setClazz] = useState("11");
  const [chapters, setChapters] = useState([]);
  const [chapter, setChapter] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [msg, setMsg] = useState("");

  // load chapters when subject/class changes
  useEffect(() => {
    fetch(`/api/syllabus?subject=${encodeURIComponent(subject)}&class=${clazz}`)
      .then((r) => r.json())
      .then((data) => {
        setChapters(data.chapters || []);
        setChapter((data.chapters || [])[0] || "");
      })
      .catch(() => setChapters([]));
  }, [subject, clazz]);

  const changeOpt = (i, val) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("Saving...");
    const payload = {
      subject,
      clazz: Number(clazz),
      chapter,
      difficulty,
      question,
      options,
      correctAnswer: Number(correct),
    };

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      setMsg("✅ Saved!");
      // clear question & options
      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrect(0);
    } else
