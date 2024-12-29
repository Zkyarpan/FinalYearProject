import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userData = req.headers.get("user-data"); // Middleware should set this header if token is valid
  if (!userData) {
    return NextResponse.json({ message: "No user data found. Middleware not working correctly!" });
  }

  const parsedData = JSON.parse(userData);
  return NextResponse.json({
    message: "Middleware tested successfully!",
    userData: parsedData,
  });
}
