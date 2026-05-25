"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from 'next/navigation';

function QuizComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subject = searchParams.get('subject') || 'Subject';
  const chapter = searchParams.get('chapter') || '';
  const level = searchParams.get('level') || 'easy';
  const isChallenge = searchParams.get('challenge') === 'true';

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Focus Mode vs List Mode
  const [focusMode, setFocusMode] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Quiz state
  const [answers, setAnswers] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [timerActive, setTimerActive] = useState(true);
  const initialTimeRef = useRef(0);

  // Confetti particles
  const [confetti, setConfetti] = useState([]);
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [xpGained, setXpGained] = useState(0);

  // Load questions and set up timer
  useEffect(() => {
    async function fetchQuestions() {
      if (!subject || !chapter || !level) {
        setLoading(false);
        setError("Invalid quiz parameters.");
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/chapters/${encodeURIComponent(chapter)}/questions?difficulty=${level}`
        );
        
        if (!response.ok) throw new Error("Failed to fetch questions");
        
        const data = await response.json();
        setQuestions(data);

        // Standard 2 minutes per question
        const seconds = data.length * 120;
        setTimeLeft(seconds);
        initialTimeRef.current = seconds;

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchQuestions();
  }, [subject, chapter, level]);

  // Countdown timer effect
  useEffect(() => {
    if (loading || error || showScore || !timerActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time expired! Auto submit
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, showScore, timerActive, timeLeft]);

  // Keyboard navigation & controls
  useEffect(() => {
    if (loading || error || showScore) return;

    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      
      // Answer selection (A, B, C, D)
      if (['A', 'B', 'C', 'D'].includes(key) && questions[currentIndex]) {
        e.preventDefault();
        handleAnswerSelect(questions[currentIndex]._id, key);
      }
      
      // Question navigation in Focus Mode
      if (focusMode) {
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
          e.preventDefault();
          setCurrentIndex((prev) => prev - 1);
        }
        if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
          e.preventDefault();
          setCurrentIndex((prev) => prev + 1);
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            // Last question, ask to submit
            const confirmSubmit = window.confirm("You have reached the final question. Would you like to submit your answers?");
            if (confirmSubmit) handleSubmit();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, error, showScore, currentIndex, questions, focusMode, answers]);

  const handleAnswerSelect = (questionId, answerLetter) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerLetter,
    }));
  };

  const toggleBookmark = (idx) => {
    setBookmarks((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Convert seconds to MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Submit and compute gamified rewards
  const handleSubmit = () => {
    let finalScore = 0;
    questions.forEach(question => {
      if (answers[question._id] === question.answer.trim().charAt(0)) {
        finalScore++;
      }
    });
    setScore(finalScore);
    setShowScore(true);

    // Gamification Calculations
    const baseXP = finalScore * 10;
    const challengeMultiplier = isChallenge ? 2 : 1;
    const calculatedXPGained = baseXP * challengeMultiplier;
    setXpGained(calculatedXPGained);

    // 1. Save XP in LocalStorage
    const storedXp = localStorage.getItem('kcet_xp');
    const currentXp = storedXp ? parseInt(storedXp, 10) : 0;
    const newXp = currentXp + calculatedXPGained;
    localStorage.setItem('kcet_xp', newXp.toString());

    // 2. Daily Streak Logic
    const storedStreak = localStorage.getItem('kcet_streak');
    const lastActiveStr = localStorage.getItem('kcet_last_active');
    let currentStreak = storedStreak ? parseInt(storedStreak, 10) : 0;
    const todayStr = new Date().toDateString();

    if (lastActiveStr) {
      const lastActiveDate = new Date(lastActiveStr);
      const today = new Date();
      lastActiveDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);

      const diffDays = Math.ceil(Math.abs(today - lastActiveDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    
    localStorage.setItem('kcet_streak', currentStreak.toString());
    localStorage.setItem('kcet_last_active', new Date().toISOString());

    // 3. Unlocked Badges Checks
    const storedAchievements = localStorage.getItem('kcet_achievements');
    let unlockedList = storedAchievements ? JSON.parse(storedAchievements) : [];
    const newlyUnlocked = [];

    // Milestone: First Quiz
    if (!unlockedList.includes('first_quiz')) {
      newlyUnlocked.push('first_quiz');
      unlockedList.push('first_quiz');
    }

    // Milestone: Perfect Score
    if (finalScore === questions.length && questions.length > 0 && !unlockedList.includes('perfect_score')) {
      newlyUnlocked.push('perfect_score');
      unlockedList.push('perfect_score');
    }

    // Milestone: 3-day Streak
    if (currentStreak >= 3 && !unlockedList.includes('streak_3')) {
      newlyUnlocked.push('streak_3');
      unlockedList.push('streak_3');
    }

    // Milestone: Speedster (Finish with >50% time left)
    const timeSpent = initialTimeRef.current - timeLeft;
    if (timeSpent < (initialTimeRef.current / 2) && !unlockedList.includes('speedster')) {
      newlyUnlocked.push('speedster');
      unlockedList.push('speedster');
    }

    // Save history attempt
    const storedHistory = localStorage.getItem('kcet_history');
    let historyList = storedHistory ? JSON.parse(storedHistory) : [];
    historyList.unshift({
      subject,
      chapter,
      difficulty: level,
      score: finalScore,
      total: questions.length,
      date: new Date().toLocaleDateString()
    });
    localStorage.setItem('kcet_history', JSON.stringify(historyList.slice(0, 30)));

    // All-Rounder Check (complete quiz in all 4 subjects)
    const distinctSubjectsCompleted = new Set(historyList.map(h => h.subject));
    if (distinctSubjectsCompleted.has('Physics') && 
        distinctSubjectsCompleted.has('Chemistry') && 
        distinctSubjectsCompleted.has('Maths') && 
        distinctSubjectsCompleted.has('Biology') && 
        !unlockedList.includes('subject_master')) {
      newlyUnlocked.push('subject_master');
      unlockedList.push('subject_master');
    }

    localStorage.setItem('kcet_achievements', JSON.stringify(unlockedList));
    setUnlockedBadges(newlyUnlocked);

    // Launch CSS SVGs Confetti particles
    if (finalScore > (questions.length / 2)) {
      const particles = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        color: ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1'][Math.floor(Math.random() * 5)]
      }));
      setConfetti(particles);
    }
  };

  const badgeIcons = {
    first_quiz: '🎯',
    perfect_score: '🏆',
    streak_3: '🔥',
    subject_master: '👑',
    speedster: '⚡'
  };

  const badgeNames = {
    first_quiz: 'First Quest Badge',
    perfect_score: 'Elite Genius Badge',
    streak_3: 'Consistent Scholar Badge',
    subject_master: 'All-Round Master Badge',
    speedster: 'Lightning Reflexes Badge'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a] flex flex-col items-center justify-center text-gray-200">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="font-bold text-sm uppercase tracking-widest text-indigo-400">Loading Exam Arena...</h3>
        <p className="text-xs text-gray-500 mt-1">Configuring questions and loading math packages</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#05050a] flex flex-col items-center justify-center text-gray-200 p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-500 text-3xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-white">Failed to enter exam arena</h3>
        <p className="text-sm text-gray-400 max-w-md mt-1">{error}</p>
        <button 
          onClick={() => router.push('/')}
          className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // POST-EXAM SCORE SCREEN
  if (showScore) {
    const scorePercent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    
    // SVG Circular Progress Constants
    const radius = 60;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

    return (
      <div className="relative min-h-screen bg-[#05050a] text-gray-200 px-6 py-12 overflow-hidden font-sans">
        
        {/* Offline Confetti SVGs */}
        {confetti.map(p => (
          <div 
            key={p.id} 
            className="absolute top-0 w-3 h-3 rounded-full pointer-events-none animate-confetti-fall"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              backgroundColor: p.color,
              zIndex: 99
            }}
          ></div>
        ))}

        <div className="max-w-4xl mx-auto flex flex-col gap-8 relative z-10">
          
          {/* HEADER BACK TO DASHBOARD */}
          <div className="flex justify-between items-center pb-6 border-b border-white/5">
            <div>
              <h1 className="text-2xl font-black text-white">Quiz Completed!</h1>
              <p className="text-xs text-gray-400 mt-1">{subject} • {chapter.replace(/_/g, ' ')}</p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="px-5 py-2 text-xs font-bold text-black bg-white hover:bg-gray-200 rounded-xl transition-all cursor-pointer shadow-md"
            >
              Back to Academy Dashboard
            </button>
          </div>

          {/* LEVEL REWARDS SUMMARY CARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* RADIAL SCORE WHEEL */}
            <div className="glass p-6 rounded-2xl border-white/10 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Overall Score</span>
              
              <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Underlay */}
                  <circle 
                    cx="72" cy="72" r={radius} 
                    stroke="rgba(255,255,255,0.03)" 
                    strokeWidth={strokeWidth} 
                    fill="transparent" 
                  />
                  {/* Progress */}
                  <circle 
                    cx="72" cy="72" r={radius} 
                    stroke="url(#scoreGrad)" 
                    strokeWidth={strokeWidth} 
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round" 
                    fill="transparent" 
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-black text-white">{scorePercent}%</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">{score} / {questions.length}</span>
                </div>
              </div>

              <h2 className="text-base font-extrabold text-white">
                {scorePercent === 100 ? "🏆 Perfect Score!" :
                 scorePercent >= 80 ? "🔥 Superb Work!" :
                 scorePercent >= 50 ? "👍 Good Attempt!" : "📚 Keep Reviewing!"}
              </h2>
              <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
                {scorePercent >= 80 ? "Your mastery over this chapter is highly competitive!" : "Practice makes perfect. Review the explanations below."}
              </p>
            </div>

            {/* EXPERIENCE GAINED */}
            <div className="glass p-6 rounded-2xl border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block">XP Rewards</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-5xl font-black text-indigo-400">+{xpGained}</span>
                  <span className="text-sm font-bold text-indigo-300">XP</span>
                </div>
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                  Earned +10 XP for each correct answer. {isChallenge && <strong>Challenge multiplier applied (2x XP)!</strong>}
                </p>
              </div>
              <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-indigo-300">
                <span className="text-lg">⭐</span>
                <span>Experience has been added to your profile!</span>
              </div>
            </div>

            {/* UNLOCKED ACHIEVEMENTS */}
            <div className="glass p-6 rounded-2xl border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block">Unlocked Badges</span>
                {unlockedBadges.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <span className="text-3xl block mb-2 opacity-30">🏆</span>
                    <p className="text-xs">No new badges unlocked in this session.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {unlockedBadges.map(badgeId => (
                      <div key={badgeId} className="glass-bright px-3 py-2 rounded-xl border border-indigo-500/20 flex items-center gap-2.5 animate-pulse">
                        <span className="text-xl">{badgeIcons[badgeId]}</span>
                        <div>
                          <h4 className="text-xs font-black text-indigo-300">{badgeNames[badgeId]}</h4>
                          <p className="text-[9px] text-gray-400 uppercase font-semibold">Unlocked + Level Bonus!</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-white/5 text-[10px] text-gray-500">
                Check the profile drawer on the dashboard to see all badges!
              </div>
            </div>

          </div>

          {/* REVIEW EXPLAINER LIST */}
          <div className="glass p-6 rounded-2xl border-white/10">
            <h3 className="text-lg font-bold text-white mb-6">Review Exam Answers</h3>
            
            <div className="flex flex-col gap-6">
              {questions.map((q, index) => {
                const correctLetter = q.answer.trim().charAt(0);
                const correctIndex = correctLetter.charCodeAt(0) - 'A'.charCodeAt(0);
                const correctAnswerText = q.options[correctIndex] || '';
                
                const userAnswerLetter = answers[q._id];
                const isCorrect = userAnswerLetter === correctLetter;

                return (
                  <div key={q._id} className="p-5 rounded-xl border border-white/5 bg-[#0b0c14]/50 flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-sm font-bold text-white leading-relaxed">
                        <span className="text-gray-500 mr-1.5">{index + 1}.</span>
                        {q.text}
                      </h4>
                      <span className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-extrabold ${
                        isCorrect ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    {/* OPTIONS DISPLAY */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {q.options.map((opt, oIdx) => {
                        const optLetter = String.fromCharCode(65 + oIdx);
                        const isCorrectOption = optLetter === correctLetter;
                        const isSelectedByStudent = optLetter === userAnswerLetter;

                        let borderClass = 'border-white/5 bg-transparent';
                        if (isCorrectOption) {
                          borderClass = 'border-emerald-500/40 bg-emerald-500/[0.03] text-emerald-300';
                        } else if (isSelectedByStudent && !isCorrect) {
                          borderClass = 'border-red-500/40 bg-red-500/[0.03] text-red-300';
                        }

                        return (
                          <div key={oIdx} className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 transition-all ${borderClass}`}>
                            <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                              isCorrectOption ? 'bg-emerald-500/20 text-emerald-400' :
                              isSelectedByStudent ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'
                            }`}>
                              {optLetter}
                            </span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* EXPLANATION / SOLUTION PREVIEW */}
                    <div className="mt-2 pt-4 border-t border-white/5 text-xs text-gray-400 flex flex-col gap-1.5">
                      <p className="flex items-center gap-1.5">
                        <span className="font-extrabold text-emerald-400 uppercase tracking-widest text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded">Correct Answer</span>
                        <span className="font-bold text-gray-200">{correctLetter}. {correctAnswerText}</span>
                      </p>
                      <p className="flex items-center gap-1.5 mt-1">
                        <span className="font-extrabold text-indigo-400 uppercase tracking-widest text-[9px] bg-indigo-500/10 px-1.5 py-0.5 rounded">Your Response</span>
                        <span className={`font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                          {userAnswerLetter ? `${userAnswerLetter}. ${q.options[userAnswerLetter.charCodeAt(0) - 65] || ''}` : 'Not Answered'}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* CSS SVG CONFETTI FALL STYLING */}
        <style jsx global>{`
          @keyframes confettiFall {
            0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
          }
          .animate-confetti-fall {
            animation: confettiFall 4s linear forwards;
          }
        `}</style>

      </div>
    );
  }

  // ACTIVE EXAM SESSION DISPLAY
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;
  
  return (
    <div className="min-h-screen bg-[#05050a] text-gray-200 overflow-hidden font-sans pb-24">
      
      {/* Decorative Orbs */}
      <div className="glow-orb w-[300px] h-[300px] bg-indigo-500/10 top-[-50px] right-[-50px] animate-pulse-slow"></div>

      {/* STICKY EXAM NAVIGATION BAR */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#05050a]/90 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              const confirmQuit = window.confirm("Are you sure you want to abandon the quiz? Your score and streak will not be saved.");
              if (confirmQuit) router.push('/');
            }}
            className="p-2 rounded-xl border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-white flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                subject === 'Physics' ? 'bg-cyan-500 shadow-cyan-500/40' :
                subject === 'Chemistry' ? 'bg-emerald-500 shadow-emerald-500/40' :
                subject === 'Maths' ? 'bg-amber-500 shadow-amber-500/40' : 'bg-pink-500 shadow-pink-500/40'
              }`}></span>
              {subject} Quiz
            </h1>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase truncate max-w-[220px]">
              {chapter.replace(/_/g, ' ')} • <span className="text-indigo-400">{level}</span>
            </p>
          </div>
        </div>

        {/* TIMER BAR */}
        <div className="flex items-center gap-4">
          
          {/* TIMER WIDGET */}
          <div className={`glass px-4 py-2 rounded-xl flex items-center gap-2.5 border-white/10 transition-all ${
            timeLeft < 60 ? 'border-red-500/40 bg-red-500/[0.03] animate-pulse text-red-400' : 'text-gray-300'
          }`}>
            <span className="text-lg">⏱️</span>
            <span className="font-mono font-bold text-sm tracking-widest">{formatTime(timeLeft)}</span>
            <button 
              onClick={() => setTimerActive(!timerActive)}
              className="ml-1 p-0.5 rounded hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
            >
              {timerActive ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              )}
            </button>
          </div>

          {/* VIEW SWITCHER */}
          <div className="bg-[#0b0c14] p-1 rounded-xl border border-white/5 flex gap-1">
            <button
              onClick={() => setFocusMode(true)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                focusMode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Focus Mode
            </button>
            <button
              onClick={() => setFocusMode(false)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !focusMode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All Overview
            </button>
          </div>

        </div>

      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-6 mt-8">
        
        {/* LIVE TOP PROGRESS STATUS */}
        <div className="glass px-5 py-3.5 rounded-2xl border-white/5 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Quiz Completion</span>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-indigo-400">{progressPercent}%</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="text-xs text-gray-500 uppercase tracking-widest block font-bold">Answered</span>
              <span className="text-sm font-black text-indigo-400">{Object.keys(answers).length} / {totalQuestions}</span>
            </div>
            <div className="w-px h-6 bg-white/5"></div>
            <div className="text-center">
              <span className="text-xs text-gray-500 uppercase tracking-widest block font-bold">Flagged</span>
              <span className="text-sm font-black text-amber-500">{Object.keys(bookmarks).filter(k => bookmarks[k]).length}</span>
            </div>
          </div>
        </div>

        {/* FOCUS VIEW CONTAINER */}
        {focusMode ? (
          totalQuestions > 0 && currentQuestion ? (
            <div className="flex flex-col gap-6">
              
              {/* CENTRAL VIEWPORT QUESTION CARD */}
              <div className="glass p-8 rounded-3xl border-white/10 bg-gradient-to-b from-indigo-950/[0.03] to-slate-950/20 shadow-xl relative overflow-hidden transition-all duration-300">
                
                {/* Header Flag / Bookmark toggler */}
                <div className="flex justify-between items-center mb-6">
                  <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-md text-xs font-bold text-gray-400">
                    Question {currentIndex + 1} of {totalQuestions}
                  </span>
                  
                  <button 
                    onClick={() => toggleBookmark(currentIndex)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      bookmarks[currentIndex] 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                        : 'border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{bookmarks[currentIndex] ? '🚩 Flagged' : '🏳️ Flag for Review'}</span>
                  </button>
                </div>

                {/* QUESTION TEXT */}
                <h2 className="text-xl font-bold text-white leading-relaxed mb-8">
                  {currentQuestion.text}
                </h2>

                {/* OPTIONS LIST */}
                <div className="flex flex-col gap-4">
                  {currentQuestion.options.map((optionText, oIdx) => {
                    const optLetter = String.fromCharCode(65 + oIdx);
                    const isSelected = answers[currentQuestion._id] === optLetter;

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleAnswerSelect(currentQuestion._id, optLetter)}
                        className={`p-4.5 rounded-2xl border text-left text-sm flex items-center justify-between group transition-all duration-300 hover:scale-[1.01] cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/10 border-indigo-400 shadow-lg shadow-indigo-500/[0.04]'
                            : 'bg-transparent border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                            isSelected 
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                              : 'bg-indigo-950/20 text-indigo-400 border border-indigo-400/20 group-hover:bg-indigo-600 group-hover:text-black group-hover:border-transparent'
                          }`}>
                            {optLetter}
                          </span>
                          <span className={isSelected ? 'text-indigo-200 font-bold' : 'text-gray-300'}>
                            {optionText}
                          </span>
                        </div>
                        
                        {/* Keyboard Badge hint */}
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest px-2 py-0.5 rounded border border-white/5 opacity-50 group-hover:opacity-100 transition-opacity">
                          Key {optLetter}
                        </span>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* FLOATING ACTION BOTTOM CONTROLLER */}
              <div className="flex justify-between items-center gap-4 mt-2">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className={`px-5 py-3 rounded-2xl font-extrabold text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                    currentIndex === 0 
                      ? 'bg-gray-800/10 border border-white/5 text-gray-600 cursor-not-allowed' 
                      : 'bg-white hover:bg-gray-200 text-black'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Prev Question</span>
                </button>

                {currentIndex < totalQuestions - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-extrabold text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/10"
                  >
                    <span>Next Question</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/20 text-black font-black rounded-2xl text-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Submit Examination</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">No questions loaded.</div>
          )
        ) : (
          /* CLASSIC LIST VIEW */
          <div className="flex flex-col gap-6">
            {questions.map((q, index) => (
              <div key={q._id} className="glass p-6 rounded-2xl border-white/10 flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-base font-bold text-white leading-relaxed">
                    <span className="text-gray-500 mr-1.5">{index + 1}.</span>
                    {q.text}
                  </h3>
                  <button 
                    onClick={() => toggleBookmark(index)}
                    className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      bookmarks[index] 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                        : 'border-white/5 text-gray-500 hover:text-white'
                    }`}
                  >
                    🚩 Flag
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {q.options.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isSelected = answers[q._id] === letter;

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleAnswerSelect(q._id, letter)}
                        className={`p-3.5 rounded-xl border text-left text-xs flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600/10 border-indigo-400 text-indigo-300 font-bold' 
                            : 'bg-transparent border-white/5 hover:border-white/15'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {letter}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            
            <div className="text-center py-6">
              <button
                onClick={handleSubmit}
                className="px-10 py-4 bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-black rounded-2xl text-base shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.01] cursor-pointer"
              >
                Submit Exam
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM QUICK NAVIGATION BALL GRID (Exam Bubble Index) */}
        {totalQuestions > 0 && (
          <div className="glass p-5 rounded-2xl border-white/5 mt-8">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-3.5 block">Quick Navigation Console</span>
            <div className="flex flex-wrap gap-2.5">
              {questions.map((_, idx) => {
                const qId = questions[idx]._id;
                const isAnswered = !!answers[qId];
                const isBookmarked = !!bookmarks[idx];
                const isActive = focusMode && currentIndex === idx;

                let stateClass = 'bg-transparent border-white/10 hover:border-white/30 text-gray-400';
                if (isActive) {
                  stateClass = 'bg-indigo-600 border-indigo-400 text-white font-bold ring-2 ring-indigo-500/40 ring-offset-2 ring-offset-[#05050a] scale-110';
                } else if (isBookmarked) {
                  stateClass = 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-md shadow-amber-500/5';
                } else if (isAnswered) {
                  stateClass = 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setFocusMode(true);
                      setCurrentIndex(idx);
                    }}
                    className={`w-9 h-9 rounded-xl border text-xs flex items-center justify-center transition-all cursor-pointer ${stateClass}`}
                  >
                    <span>{idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </main>

    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#05050a] flex flex-col items-center justify-center text-gray-200">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="font-bold text-sm uppercase tracking-widest text-indigo-400">Loading Exam Arena...</h3>
      </div>
    }>
      <QuizComponent />
    </Suspense>
  );
}