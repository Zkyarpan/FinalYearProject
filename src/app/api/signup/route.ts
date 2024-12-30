"use server";

import { encrypt } from "@/lib/token";
import { NextRequest, NextResponse } from "next/server";
import { sendVerificationEmail } from "@/helpers/sendEmailVerification";
import TemporaryToken from "@/models/TemporaryToken";
import Account from "@/models/Account";
import { v4 as uuidv4 } from "uuid";
import connectDB from "@/db/db";
import { createSuccessResponse, createErrorResponse } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    await connectDB(); 

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        createErrorResponse(400, "All fields are required."),
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        createErrorResponse(400, "Password must be at least 8 characters long."),
        { status: 400 }
      );
    }

    const existingAccount = await Account.findOne({ email });
    if (existingAccount) {
      return NextResponse.json(
        createErrorResponse(400, "Email is already registered. Please login."),
        { status: 400 }
      );
    }

    const existingTempToken = await TemporaryToken.findOne({ email });
    if (existingTempToken) {
      return NextResponse.json(
        createErrorResponse(
          400,
          "A verification code has already been sent. Please verify your email."
        ),
        { status: 400 }
      );
    }

    const verificationCode = uuidv4().slice(0, 6);

    const token = await encrypt({ email, password });

    await TemporaryToken.create({
      email,
      token,
      verificationCode,
      verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000), 
    });

    const emailResult = await sendVerificationEmail(email, verificationCode);

    if (!emailResult.success) {
      return NextResponse.json(
        createErrorResponse(500, "Failed to send verification email."),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(200, "Verification email sent successfully."),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in signup:", error);
    return NextResponse.json(
      createErrorResponse(500, "Internal server error."),
      { status: 500 }
    );
  }
}
