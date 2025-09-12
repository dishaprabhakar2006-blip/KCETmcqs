import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req) {
  const token = req.cookies.get("token")?.value;
  const url = req.nextUrl.clone();

  // Protected routes → require token
  if (url.pathname.startsWith("/student") || url.pathname.startsWith("/teacher")) {
    if (!token) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    try {
      // ✅ Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Role-based protection
      if (url.pathname.startsWith("/student") && decoded.role !== "student") {
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
      if (url.pathname.startsWith("/teacher") && decoded.role !== "teacher") {
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }

      // ✅ If valid, allow access
      return NextResponse.next();
    } catch (err) {
      console.error("❌ Invalid token:", err.message);
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// ✅ Apply middleware only to student & teacher routes
export const config = {
  matcher: ["/student/:path*", "/teacher/:path*"],
};
