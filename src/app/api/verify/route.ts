"use server";

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db/db";
import Account from "@/models/Account";
import { createSuccessResponse, createErrorResponse } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        createErrorResponse(400, "Email and verification code are required."),
        { status: 400 }
      );
    }

    const user = await Account.findOne({ email });
    if (!user) {
      return NextResponse.json(
        createErrorResponse(404, "User not found."),
        { status: 404 }
      );
    }

    if (
      user.verificationCode !== code ||
      new Date() > new Date(user.verificationCodeExpiry)
    ) {
      return NextResponse.json(
        createErrorResponse(400, "Invalid or expired verification code."),
        { status: 400 }
      );
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiry = null;
    await user.save();

    return NextResponse.json(
      createSuccessResponse(200, {
        message: "Email verified successfully.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify Code Error:", error);
    return NextResponse.json(
      createErrorResponse(500, "Internal server error."),
      { status: 500 }
    );
  }
}
