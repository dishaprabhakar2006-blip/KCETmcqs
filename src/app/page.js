"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  // ✅ STEP 1: Define all your subjects
  const subjects = ['Physics', 'Chemistry', 'Maths' , 'Biology'];
  const levels = ['easy', 'medium', 'hard'];

  // ✅ STEP 2: Add state for the selected subject
  const [selectedSubject, setSelectedSubject] = useState('Physics'); // Default to Physics
  const [selectedLevel, setSelectedLevel] = useState('easy');
  const [chapters, setChapters] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ STEP 3: useEffect now depends on selectedSubject as well
  useEffect(() => {
    async function fetchChapters() {
      if (!selectedSubject || !selectedLevel) return;

      setLoading(true);
      setError(null);
      try {
        // Use the state variables to build the API URL
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
  }, [selectedSubject, selectedLevel]); // Re-run when subject or level changes

  return (
    <div style={{ padding: '2rem', background: '#1a1a1a', minHeight: '100vh', color: '#e0e0e0' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ffffff', marginBottom: '1.5rem' }}>Welcome to Your Quiz App!</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#cccccc', marginBottom: '0.5rem' }}>Select a Difficulty Level:</h2>
        <select 
          onChange={(e) => setSelectedLevel(e.target.value)}
          value={selectedLevel}
          style={{ padding: '0.5rem', backgroundColor: '#2a2a2a', color: '#e0e0e0', border: '1px solid #444', borderRadius: '4px' }}
        >
          {levels.map((level) => (
            <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
          ))}
        </select>
      </div>
      
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#cccccc', marginBottom: '1rem' }}>Select a Subject to begin:</h2>
      
      {/* ✅ STEP 4: Render buttons for each subject */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {subjects.map((subject) => (
          <button 
            key={subject} 
            onClick={() => setSelectedSubject(subject)}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              border: '2px solid #555',
              borderRadius: '8px',
              // Highlight the selected button
              backgroundColor: selectedSubject === subject ? '#9999ff' : '#2a2a2a',
              color: selectedSubject === subject ? '#000' : '#fff',
            }}
          >
            {subject}
          </button>
        ))}
      </div>

      {/* ✅ STEP 5: Display the chapters for the selected subject */}
      <div>
        <h3 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#9999ff', marginBottom: '0.5rem'}}>{selectedSubject}</h3>
        {loading && <p>Loading chapters...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && (
          chapters.length > 0 ? (
            <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {chapters.map((chapterName) => (
                <li key={chapterName}>
                  <Link 
                    href={`/quiz?subject=${selectedSubject}&chapter=${encodeURIComponent(chapterName)}&level=${selectedLevel}`}
                    style={{ display: 'block', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px', color: '#ffffff', textDecoration: 'none', transition: 'background-color 0.2s', border: '1px solid #444' }}
                  >
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{chapterName}</h3>
                    <p style={{ color: '#aaa', marginTop: '0.25rem' }}>Level: {selectedLevel}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#aaa' }}>No chapters found for this subject and difficulty.</p>
          )
        )}
      </div>
    </div>
  );
}