"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const subjects = ['Physics', 'Chemistry', 'Maths', 'Biology'];
  const levels = ['easy', 'medium', 'hard'];

  const [selectedSubject, setSelectedSubject] = useState('Physics');
  const [selectedLevel, setSelectedLevel] = useState('easy');
  const [chapters, setChapters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gamification & Progress States (Persisted in LocalStorage)
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [history, setHistory] = useState([]);
  const [showAchievementsDrawer, setShowAchievementsDrawer] = useState(false);
  const [stats, setStats] = useState({ totalQuestions: 4000, totalChapters: 80 });

  // Calculate Level based on XP (e.g. 100 XP per level)
  const userLevel = Math.floor(xp / 100) + 1;
  const currentLevelXp = xp % 100;
  const xpNeededForNext = 100;

  // Load gamification data on mount
  useEffect(() => {
    const storedXp = localStorage.getItem('kcet_xp');
    const storedStreak = localStorage.getItem('kcet_streak');
    const storedAchievements = localStorage.getItem('kcet_achievements');
    const storedHistory = localStorage.getItem('kcet_history');
    const lastActiveStr = localStorage.getItem('kcet_last_active');

    if (storedXp) setXp(parseInt(storedXp, 10));
    if (storedAchievements) setAchievements(JSON.parse(storedAchievements));
    if (storedHistory) setHistory(JSON.parse(storedHistory));

    // Handle daily streak logic
    if (storedStreak) {
      const activeStreak = parseInt(storedStreak, 10);
      if (lastActiveStr) {
        const lastActiveDate = new Date(lastActiveStr);
        const today = new Date();
        
        // Reset times to compare dates
        lastActiveDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        
        const diffTime = Math.abs(today - lastActiveDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Keep streak active (will be updated when they finish a quiz)
          setStreak(activeStreak);
        } else if (diffDays > 1) {
          // Streak broken
          setStreak(0);
          localStorage.setItem('kcet_streak', '0');
        } else {
          setStreak(activeStreak);
        }
      } else {
        setStreak(0);
      }
    }

    // Fetch DB/Offline question statistics
    async function fetchStats() {
      try {
        const res = await fetch('/api/chapters?subject=stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.warn("Failed to load statistics: ", err);
      }
    }
    fetchStats();
  }, []);

  // Fetch Chapters when subject or level changes
  useEffect(() => {
    async function fetchChapters() {
      if (!selectedSubject || !selectedLevel) return;

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/chapters?subject=${selectedSubject}&level=${selectedLevel}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch chapters for ${selectedSubject}`);
        }
        const data = await res.json();
        setChapters(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setChapters([]);
      } finally {
        setLoading(false);
      }
    }

    fetchChapters();
  }, [selectedSubject, selectedLevel]);

  // Determine Daily Challenge Chapter based on current date
  const getDailyChallenge = () => {
    if (chapters.length === 0) return null;
    const dateNum = new Date().getDate();
    const index = dateNum % chapters.length;
    return chapters[index];
  };

  const dailyChallengeChapter = getDailyChallenge();

  // Filter chapters based on search query
  const filteredChapters = chapters.filter(chapter => 
    chapter.toLowerCase().replace(/_/g, ' ').includes(searchQuery.toLowerCase())
  );

  const badgeDetails = [
    { id: 'first_quiz', name: 'First Quest', desc: 'Completed your first KCET practice session', icon: '🎯', xp: 50 },
    { id: 'perfect_score', name: 'Elite Genius', desc: 'Scored 100% on any practice set', icon: '🏆', xp: 150 },
    { id: 'streak_3', name: 'Consistent Scholar', desc: 'Maintained a 3-day active practice streak', icon: '🔥', xp: 100 },
    { id: 'subject_master', name: 'All-Round Master', desc: 'Completed a quiz in Physics, Chemistry, Maths & Biology', icon: '👑', xp: 200 },
    { id: 'speedster', name: 'Lightning Reflexes', desc: 'Completed a quiz with more than 50% time left', icon: '⚡', xp: 75 }
  ];

  return (
    <div className="relative min-height-screen bg-[#05050a] text-gray-200 overflow-hidden font-sans pb-16">
      
      {/* Decorative Orbs */}
      <div className="glow-orb w-[400px] h-[400px] bg-cyan-500/20 top-[-100px] left-[-100px] animate-pulse-slow"></div>
      <div className="glow-orb w-[400px] h-[400px] bg-pink-500/20 bottom-[-100px] right-[-100px] animate-pulse-slow"></div>

      {/* TOP HEADER / LOGO BAR */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#05050a]/80 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">KCET Master</h1>
            <p className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">Interactive Prep Academy</p>
          </div>
        </div>

        {/* GAMIFIED HERO STATS */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* LEVEL WIDGET */}
          <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 border-white/10 hover:border-white/20 transition-all">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-400">
              {userLevel}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Level Progress</p>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" 
                    style={{ width: `${(currentLevelXp / xpNeededForNext) * 100}%` }}
                  ></div>
                </div>
                <span className="text-[11px] font-bold text-indigo-300">{xp} XP</span>
              </div>
            </div>
          </div>

          {/* STREAK WIDGET */}
          <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 border-white/10 hover:border-white/20 transition-all">
            <span className="text-2xl animate-float">🔥</span>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Daily Streak</p>
              <p className="text-sm font-black text-amber-500 leading-tight">{streak} Days</p>
            </div>
          </div>

          {/* ACHIEVEMENTS BUTTON */}
          <button 
            onClick={() => setShowAchievementsDrawer(true)}
            className="glass px-4 py-2 rounded-xl flex items-center gap-3 border-indigo-500/20 text-indigo-400 hover:text-indigo-300 hover:border-indigo-400/50 hover:bg-indigo-500/10 transition-all cursor-pointer"
          >
            <span className="text-xl">🏆</span>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Badges</p>
              <p className="text-sm font-black leading-tight">{achievements.length} / {badgeDetails.length}</p>
            </div>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT COLUMN: DAILY CHALLENGE & STATS */}
        <section className="lg:col-span-1 flex flex-col gap-6">
          
          {/* DAILY CHALLENGE CARD */}
          {dailyChallengeChapter && (
            <div className="glass p-5 rounded-2xl border-amber-500/30 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full flex items-center justify-center border-l border-b border-amber-500/20">
                <span className="text-2xl animate-bounce">⚡</span>
              </div>
              <span className="inline-block px-2.5 py-1 text-[10px] uppercase tracking-wider font-extrabold text-amber-400 bg-amber-500/10 rounded-full border border-amber-500/30 mb-4">
                Daily double-XP challenge
              </span>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                {dailyChallengeChapter.replace(/_/g, ' ')}
              </h3>
              <p className="text-xs text-gray-400 mt-2">
                Conquer this chapter today and receive <strong>2x Experience Points</strong> to level up twice as fast!
              </p>
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Subject: {selectedSubject}</span>
                <Link
                  href={`/quiz?subject=${selectedSubject}&chapter=${encodeURIComponent(dailyChallengeChapter)}&level=${selectedLevel}&challenge=true`}
                  className="px-3.5 py-1.5 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg hover:shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Start Now
                </Link>
              </div>
            </div>
          )}

          {/* TOTAL POOL STATS */}
          <div className="glass p-5 rounded-2xl border-white/10">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Platform Database</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-bright p-3.5 rounded-xl border-white/5 text-center">
                <span className="text-2xl font-black text-indigo-400 block">{stats.totalQuestions}</span>
                <span className="text-[10px] uppercase text-gray-500 tracking-wider">KCET Questions</span>
              </div>
              <div className="glass-bright p-3.5 rounded-xl border-white/5 text-center">
                <span className="text-2xl font-black text-cyan-400 block">{stats.totalChapters}</span>
                <span className="text-[10px] uppercase text-gray-500 tracking-wider">NCERT Chapters</span>
              </div>
            </div>
          </div>

          {/* HISTORICAL LOG */}
          <div className="glass p-5 rounded-2xl border-white/10 flex-1 min-h-[250px] flex flex-col">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Practice Log</span>
              <span className="text-xs text-indigo-400 font-semibold lowercase">({history.length} sets completed)</span>
            </h3>
            {history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <svg className="w-8 h-8 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-xs text-gray-500">Your practice results will show up here as you complete tests.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                {history.map((item, idx) => (
                  <div key={idx} className="glass-bright p-3 rounded-xl border-white/5 hover:border-white/10 transition-all flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[140px]">
                        {item.chapter.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                          item.subject === 'Physics' ? 'bg-cyan-500' :
                          item.subject === 'Chemistry' ? 'bg-emerald-500' :
                          item.subject === 'Maths' ? 'bg-amber-500' : 'bg-pink-500'
                        }`}></span>
                        {item.subject} • {item.difficulty}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-indigo-300 block">{item.score} / {item.total}</span>
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest">{Math.round((item.score / item.total) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: CORE DASHBOARD */}
        <section className="lg:col-span-3 flex flex-col gap-8">
          
          {/* HERO BANNER */}
          <div className="glass p-8 rounded-3xl border-white/10 bg-gradient-to-r from-indigo-950/40 via-slate-950/40 to-cyan-950/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 max-w-xl">
              <span className="px-3 py-1 text-[10px] uppercase tracking-widest font-extrabold text-indigo-400 bg-indigo-500/10 rounded-full border border-indigo-500/30">
                KCET Mock Examination Engine
              </span>
              <h2 className="text-3xl font-black text-white leading-tight mt-4">
                Challenge Yourself. Level Up. Ace the KCET.
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                Gain massive experience points (XP), build daily study streaks, and unlock achievements. Practice chapters one-by-one under simulated exam timer pressure to secure top ranks.
              </p>
            </div>
          </div>

          {/* DYNAMIC FILTERS & PICKERS */}
          <div className="glass p-6 rounded-2xl border-white/10 flex flex-col gap-6">
            
            {/* LEVEL SELECTOR (SEGMENTED SLIDER) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">1. Select Target Difficulty</h3>
                <p className="text-xs text-gray-500">Pick the level matching your preparation stage</p>
              </div>
              <div className="bg-[#0b0c14] p-1 rounded-xl border border-white/5 flex gap-1 w-full md:w-auto">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`flex-1 md:flex-initial px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      selectedLevel === level
                        ? level === 'easy' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                          : level === 'medium' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                          : 'bg-red-500 text-black shadow-lg shadow-red-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-white/5" />

            {/* SUBJECT GRID PICKER */}
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">2. Choose Your Subject</h3>
                <p className="text-xs text-gray-500 font-medium">Unique neon grids designed for active review</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {subjects.map((subject) => {
                  const isActive = selectedSubject === subject;
                  let gradient = '';
                  let cardClass = '';
                  let subColor = '';
                  let icon = null;

                  if (subject === 'Physics') {
                    gradient = 'from-cyan-500/20 via-cyan-950/20 to-transparent';
                    cardClass = 'subject-card-physics';
                    subColor = 'text-cyan-400 border-cyan-400/20';
                    icon = (
                      <svg className="w-8 h-8 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    );
                  } else if (subject === 'Chemistry') {
                    gradient = 'from-emerald-500/20 via-emerald-950/20 to-transparent';
                    cardClass = 'subject-card-chemistry';
                    subColor = 'text-emerald-400 border-emerald-400/20';
                    icon = (
                      <svg className="w-8 h-8 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    );
                  } else if (subject === 'Maths') {
                    gradient = 'from-amber-500/20 via-amber-950/20 to-transparent';
                    cardClass = 'subject-card-maths';
                    subColor = 'text-amber-400 border-amber-400/20';
                    icon = (
                      <svg className="w-8 h-8 text-amber-400 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    );
                  } else {
                    gradient = 'from-pink-500/20 via-pink-950/20 to-transparent';
                    cardClass = 'subject-card-biology';
                    subColor = 'text-pink-400 border-pink-400/20';
                    icon = (
                      <svg className="w-8 h-8 text-pink-400 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    );
                  }

                  return (
                    <button
                      key={subject}
                      onClick={() => setSelectedSubject(subject)}
                      className={`glass p-5 rounded-2xl text-left border relative overflow-hidden transition-all duration-300 group cursor-pointer ${cardClass} ${
                        isActive ? `bg-gradient-to-b ${gradient} active scale-[1.02]` : 'border-white/5 hover:bg-white/5 hover:scale-[1.01]'
                      }`}
                    >
                      {icon}
                      <span className="text-lg font-bold text-white block mt-1">{subject}</span>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Explore Units</span>
                      
                      {/* Selection Glow dot */}
                      {isActive && (
                        <span className={`absolute top-3 right-3 w-2 h-2 rounded-full animate-ping ${
                          subject === 'Physics' ? 'bg-cyan-400' :
                          subject === 'Chemistry' ? 'bg-emerald-400' :
                          subject === 'Maths' ? 'bg-amber-400' : 'bg-pink-400'
                        }`}></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CHAPTERS ENGINE */}
          <div className="glass p-6 rounded-2xl border-white/10 flex flex-col gap-6">
            
            {/* SEARCH AND TITLE BAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className={`w-2 h-6 rounded-full inline-block ${
                    selectedSubject === 'Physics' ? 'bg-cyan-500' :
                    selectedSubject === 'Chemistry' ? 'bg-emerald-500' :
                    selectedSubject === 'Maths' ? 'bg-amber-500' : 'bg-pink-500'
                  }`}></span>
                  {selectedSubject} Chapters
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Target difficulty level: <span className="font-semibold uppercase text-indigo-400">{selectedLevel}</span></p>
              </div>

              {/* SEARCH BAR */}
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Filter chapters dynamically..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-[#0b0c14] border border-white/5 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
                <svg className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* CHAPTER CARDS GRID */}
            <div>
              {loading && (
                <div className="py-16 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Syncing syllabus...</p>
                </div>
              )}
              
              {error && (
                <div className="py-12 text-center text-red-400 glass border-red-500/20 rounded-xl">
                  <p className="font-bold text-sm">Synchronization Error</p>
                  <p className="text-xs text-gray-500 mt-1">{error}</p>
                </div>
              )}

              {!loading && !error && (
                filteredChapters.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredChapters.map((chapterName) => {
                      const formattedName = chapterName.replace(/_/g, ' ');
                      const isDaily = dailyChallengeChapter === chapterName;

                      return (
                        <div 
                          key={chapterName}
                          className={`glass-bright p-5 rounded-xl border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all duration-300 flex flex-col justify-between gap-4 group hover:scale-[1.01] ${
                            isDaily ? 'border-amber-500/20 bg-amber-500/[0.02]' : ''
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                selectedSubject === 'Physics' ? 'bg-cyan-500' :
                                selectedSubject === 'Chemistry' ? 'bg-emerald-500' :
                                selectedSubject === 'Maths' ? 'bg-amber-500' : 'bg-pink-500'
                              }`}></span>
                              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">{selectedSubject}</span>
                              
                              {isDaily && (
                                <span className="text-[9px] uppercase tracking-wider bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-black animate-pulse">
                                  2x XP Challenge
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight">
                              {formattedName}
                            </h3>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className="inline-block text-[10px] font-bold text-indigo-300 uppercase tracking-widest bg-indigo-500/10 border border-indigo-400/20 px-2.5 py-0.5 rounded-md">
                              {selectedLevel}
                            </span>
                            
                            <Link 
                              href={`/quiz?subject=${selectedSubject}&chapter=${encodeURIComponent(chapterName)}&level=${selectedLevel}${isDaily ? '&challenge=true' : ''}`}
                              className="px-4 py-2 text-xs font-bold bg-[#0d0e18] border border-white/10 hover:border-indigo-400/50 hover:bg-indigo-500 hover:text-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm group-hover:shadow-indigo-500/10"
                            >
                              <span>Enter Arena</span>
                              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center glass border-white/5 rounded-xl">
                    <svg className="w-12 h-12 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">No matching units found</p>
                    <p className="text-xs text-gray-500 mt-1">Try modifying your subject or search keywords.</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ACHIEVEMENTS DRAWER MODAL */}
      {showAchievementsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md h-full bg-[#07070e] border-l border-white/10 p-6 shadow-2xl flex flex-col justify-between z-50 animate-slide-in">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">Academy Badges</h3>
                    <p className="text-xs text-gray-400">Unlock milestones, gain prestige XP</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAchievementsDrawer(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-4 mt-6 overflow-y-auto max-h-[70vh] pr-1">
                {badgeDetails.map((badge) => {
                  const isUnlocked = achievements.includes(badge.id);

                  return (
                    <div 
                      key={badge.id}
                      className={`glass p-4 rounded-xl border relative transition-all ${
                        isUnlocked 
                          ? 'border-indigo-500/30 bg-indigo-500/[0.02]' 
                          : 'border-white/5 bg-transparent opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${
                          isUnlocked 
                            ? 'bg-indigo-500/10 border-indigo-400/30 animate-pulse' 
                            : 'bg-gray-800/20 border-white/5'
                        }`}>
                          {isUnlocked ? badge.icon : '🔒'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white">{badge.name}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-black tracking-widest uppercase ${
                              isUnlocked ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-500'
                            }`}>
                              +{badge.xp} XP
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{badge.desc}</p>
                        </div>
                      </div>
                      
                      {isUnlocked && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Total Unlocked Progress</span>
                <span className="text-sm font-black text-indigo-400">{Math.round((achievements.length / badgeDetails.length) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${(achievements.length / badgeDetails.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide in animation utility */}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

    </div>
  );
}