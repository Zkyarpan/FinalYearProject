import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/token";

const protectedRoutes = ["/dashboard", "/profile"];
const publicRoutes = ["/login", "/signup"];
const adminRoutes = ["/admin", "/admin/dashboard"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("accessToken")?.value;
  console.log("Session Cookie in Middleware:", sessionCookie);

  const session = sessionCookie ? await decrypt(sessionCookie) : null;
  console.log("Decrypted Session:", session);

  if (!session?.id && protectedRoutes.includes(path)) {
    console.log("Unauthenticated user trying to access a protected route");
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (session?.role === "admin" && protectedRoutes.includes(path)) {
    console.log("Admin accessing user route, redirecting to /admin/dashboard");
    return NextResponse.redirect(new URL("/admin/dashboard", req.nextUrl));
  }

  if (session?.id && publicRoutes.includes(path)) {
    if (session.role === "admin") {
      console.log("Admin logged in, redirecting to /admin/dashboard");
      return NextResponse.redirect(new URL("/admin/dashboard", req.nextUrl));
    } else {
      console.log("User logged in, redirecting to /dashboard");
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  if (
    adminRoutes.some((route) => path.startsWith(route)) &&
    session?.role !== "admin"
  ) {
    console.log(
      "Non-admin tried to access Admin Route, redirecting to /dashboard"
    );
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/dashboard", "/profile", "/admin/:path*"],
};
