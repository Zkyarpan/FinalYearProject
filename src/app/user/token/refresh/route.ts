import { NextRequest, NextResponse } from "next/server";
import { decrypt, generateAccessToken } from "@/lib/token";
import config from "@//config/config";

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 400 }
      );
    }

    // Verify refresh token
    const payload = await decrypt(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Generate new access token
    const newAccessToken = await generateAccessToken(payload.sub);

    // Set new access token in cookie
    const response = NextResponse.json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });

    response.cookies.set({
      name: "accessToken",
      value: newAccessToken,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 30, // 30 minutes
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
