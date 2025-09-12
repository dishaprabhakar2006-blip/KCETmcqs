// src/app/dashboard/student/layout.js
export default function StudentLayout({ children }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Student Panel</h2>
        <ul>
          <li><a href="/dashboard/student">Home</a></li>
          <li><a href="/dashboard/student/Upload syllabus">Upload Syllabus</a></li>
          <li><a href="/dashboard/student/Manage Questions">Manage Questions</a></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-100">{children}</main>
    </div>
  );
}
