"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from 'next/navigation';

// This is the main component with all the quiz logic
function QuizComponent() {
  const searchParams = useSearchParams();
  const subject = searchParams.get('subject');
  const chapter = searchParams.get('chapter');
  const level = searchParams.get('level');

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New state to hold all user answers { questionId: "selectedAnswerLetter" }
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    async function fetchQuestions() {
      if (!subject || !chapter || !level) {
        setLoading(false);
        setError("Invalid quiz URL: Missing parameters.");
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        // The "limit" parameter is no longer needed
        const response = await fetch(
          `/api/chapters/${encodeURIComponent(chapter)}/questions?difficulty=${level}`
        );
        
        if (!response.ok) throw new Error("Failed to fetch questions");
        
        const data = await response.json();
        setQuestions(data);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchQuestions();
  }, [subject, chapter, level]);

  // This function now just records the answer for a specific question
  const handleAnswerSelect = (questionId, answerLetter) => {
    setAnswers({
      ...answers,
      [questionId]: answerLetter,
    });
  };

  // The main scoring logic is now in here
  const handleSubmit = () => {
    let finalScore = 0;
    questions.forEach(question => {
      // Check if the user's answer for this question matches the correct one
      if (answers[question._id] === question.answer.trim().charAt(0)) {
        finalScore++;
      }
    });
    setScore(finalScore);
    setShowScore(true); // Now we show the score page
  };

  if (loading) return <div>Loading questions...</div>;
  if (error) return <div>Error: {error}</div>;

  // Final Score Page
  if (showScore) {
    return (
      <div style={{ padding: '2rem', background: '#1a1a1a', minHeight: '100vh', color: '#e0e0e0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ffffff' }}>Quiz Finished!</h1>
        <p style={{ fontSize: '2rem', marginTop: '2rem' }}>You scored {score} out of {questions.length} questions.</p>
        
        <div style={{ textAlign: 'left', maxWidth: '800px', margin: '2rem auto' }}>
            <h2 style={{ color: '#cccccc' }}>Review Your Answers:</h2>
            {questions.map((q, index) => {
                const correctLetter = q.answer.trim().charAt(0);
                // Get the index (A=0, B=1, etc.) to find the answer text
                const correctIndex = correctLetter.charCodeAt(0) - 'A'.charCodeAt(0);
                const correctAnswerText = q.options[correctIndex];
                const userAnswerLetter = answers[q._id];
                const isCorrect = userAnswerLetter === correctLetter;

                return (
                    <div key={q._id} style={{ background: '#2a2a2a', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <p><strong>{index + 1}. {q.text}</strong></p>
                        <p style={{ color: isCorrect ? '#4CAF50' : '#f44336' }}>
                            Your answer: {userAnswerLetter || "Not Answered"}
                        </p>
                        {/* This is the new part that shows the correct answer text if you were wrong */}
                        {!isCorrect && (
                            <p style={{ color: '#4CAF50' }}>
                                Correct: {correctLetter}. {correctAnswerText}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    );
  }

  // Quiz questions display
  return (
    <div style={{ padding: '2rem', background: '#1a1a1a', minHeight: '100vh', color: '#e0e0e0' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ffffff' }}>{subject} - {chapter.replace(/_/g, ' ')} ({level}) Quiz</h1>
      
      <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.5rem' }}>
        {questions.map((currentQuestion, index) => (
          <div key={currentQuestion._id} style={{ background: '#2a2a2a', padding: '1.5rem', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
            <p style={{ fontWeight: '600', fontSize: '1.25rem', color: '#ffffff', marginBottom: '1rem' }}>
              {index + 1}. {currentQuestion.text}
            </p>
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
              {currentQuestion.options.map((option, i) => {
                const answerLetter = String.fromCharCode(65 + i);
                const isSelected = answers[currentQuestion._id] === answerLetter;

                return (
                  <li 
                    key={i} 
                    onClick={() => handleAnswerSelect(currentQuestion._id, answerLetter)} 
                    style={{ 
                      marginBottom: '0.75rem', 
                      fontSize: '1.1rem', 
                      color: '#e0e0e0', 
                      backgroundColor: isSelected ? '#0070f3' : '#333', // Highlight selected answer
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #fff' : '2px solid transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ fontWeight: 'bold', marginRight: '0.5rem', color: '#9999ff' }}>{answerLetter}.</span> {option}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* A single submit button at the end */}
      <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
        <button
          onClick={handleSubmit}
          style={{
            padding: '1rem 2.5rem',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#ffffff',
            backgroundColor: '#4CAF50',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
}

// The main export must wrap the component in Suspense for useSearchParams to work reliably
export default function QuizPage() {
  return (
    <Suspense fallback={<div>Loading Quiz...</div>}>
      <QuizComponent />
    </Suspense>
  );
}