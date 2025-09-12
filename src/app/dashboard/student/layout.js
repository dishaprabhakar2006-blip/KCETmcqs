export default function StudentLayout({ children }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col p-4">
        <h2 className="text-2xl font-bold mb-8">Student Panel</h2>
        <nav className="flex flex-col gap-4">
          <a href="/dashboard/student" className="hover:text-blue-300">🏠 Home</a>
          <a href="/dashboard/student/syllabus" className="hover:text-blue-300">📘 Syllabus</a>
          <a href="/dashboard/student/quizzes" className="hover:text-blue-300">📝 Quizzes</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100 p-6">
        {/* Header */}
        <header className="bg-white shadow p-4 mb-6 rounded-lg">
          <h1 className="text-xl font-semibold">Student Dashboard</h1>
        </header>

        {children}
      </main>
    </div>
  );
}
