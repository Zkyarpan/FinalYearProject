"use server";

import { NextRequest, NextResponse } from "next/server";
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

    const newCode = uuidv4().slice(0, 6); 

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
