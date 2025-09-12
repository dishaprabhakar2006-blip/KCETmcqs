"use client";
import Link from "next/link";

const subjects = [
  { name: "Physics", slug: "physics" },
  { name: "Chemistry", slug: "chemistry" },
  { name: "Math", slug: "math" },
  { name: "Biology", slug: "biology" },
];

export default function StudentDashboard() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-green-900 text-white">
      <div className="bg-green-700 p-6 rounded-lg w-[28rem] text-center">
        <h1 className="text-3xl font-bold mb-6">🎓 Student Dashboard</h1>
        <p className="mb-4">Select a subject:</p>
        <div className="grid grid-cols-2 gap-4">
          {subjects.map((subj) => (
            <Link
              key={subj.slug}
              href={`/student/subjects/${subj.slug}`}
              className="p-4 rounded-lg bg-green-600 hover:bg-green-800 font-semibold"
            >
              {subj.name}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
