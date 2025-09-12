"use client";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ChaptersPage() {
  const { slug } = useParams();  // 👈 will now be "physics", "chemistry" etc.

  const chapters = [
    { id: 1, title: "Chapter 1" },
    { id: 2, title: "Chapter 2" },
    { id: 3, title: "Chapter 3" },
  ];

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-lg w-[28rem] text-center">
        <h1 className="text-2xl font-bold mb-4">{slug.toUpperCase()} Chapters</h1>
        <div className="flex flex-col gap-3">
          {chapters.map((ch) => (
            <Link
              key={ch.id}
              href={`/student/subjects/${slug}/chapters/${ch.id}`} // 👈 slug used here
              className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600"
            >
              {ch.title}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
