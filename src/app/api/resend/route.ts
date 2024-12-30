"use server";

import { NextRequest, NextResponse } from "next/server";
import Account from "@/models/Account";
import { sendVerificationEmail } from "@/helpers/sendEmailVerification";
import { v4 as uuidv4 } from "uuid";
import { createSuccessResponse, createErrorResponse } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        createErrorResponse(400, "Email is required."),
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

    const newCode = uuidv4().slice(0, 6); 
    user.verificationCode = newCode;
    user.verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // Code valid for 15 minutes
    await user.save();

    const emailResult = await sendVerificationEmail(email, newCode);

    if (!emailResult.success) {
      return NextResponse.json(
        createErrorResponse(500, emailResult.message),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(200, "Verification code resent successfully."),
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json(
      createErrorResponse(500, "Internal server error."),
      { status: 500 }
    );
  }
}
