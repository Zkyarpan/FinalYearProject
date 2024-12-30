import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/token";

const protectedRoutes = ["/dashboard", "/profile"];
const publicRoutes = ["/login", "/signup"];
const adminRoutes = ["/admin", "/admin/dashboard"];
const verificationRoute = "/verify"; // Route for email verification

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("accessToken")?.value;

  // Decrypt the session from the cookie
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  // If the user is trying to access a protected route but is not logged in
  if (!session?.id && protectedRoutes.includes(path)) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // If the user is logged in but their email is not verified, redirect to verification page
  if (session?.id && !session.isVerified && protectedRoutes.includes(path)) {
    return NextResponse.redirect(new URL(verificationRoute, req.nextUrl));
  }

  // If the user is logged in and trying to access public routes like login or signup, redirect to their appropriate dashboard
  if (session?.id && publicRoutes.includes(path)) {
    if (session.role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.nextUrl));
    } else {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  // If a non-admin user tries to access admin routes, redirect them to their dashboard
  if (
    adminRoutes.some((route) => path.startsWith(route)) &&
    session?.role !== "admin"
  ) {
    console.log(
      "Non-admin tried to access Admin Route, redirecting to /dashboard"
    );
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // If the user is already verified and is on the verification page, redirect to dashboard
  if (session?.isVerified && path === verificationRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/dashboard",
    "/profile",
    "/admin/:path*",
    "/verify", // Include the verification route
  ],
};
