"use server";

import { NextRequest, NextResponse } from "next/server";
import Account from "@/models/Account";
import { createSuccessResponse, createErrorResponse } from "@/lib/response";

export async function POST(req: NextRequest) {
    try {
      const { code } = await req.json();
  
      if (!code) {
        return NextResponse.json(
          createErrorResponse(400, "Verification code is required."),
          { status: 400 }
        );
      }
  
      const user = await Account.findOne({ verificationCode: code });
  
      if (!user) {
        return NextResponse.json(
          createErrorResponse(400, "Invalid verification code."),
          { status: 400 }
        );
      }
  
      // Check if the code is expired
      if (new Date() > new Date(user.verificationCodeExpiry)) {
        return NextResponse.json(
          createErrorResponse(400, "Verification code has expired."),
          { status: 400 }
        );
      }
  
      // Mark user as verified
      user.isVerified = true;
      user.verificationCode = null;
      user.verificationCodeExpiry = null;
      await user.save();
  
      return NextResponse.json(
        createSuccessResponse(200, { message: "Email verified successfully." }),
        { status: 200 }
      );
    } catch (error) {
      console.error("Error verifying code:", error);
      return NextResponse.json(
        createErrorResponse(500, "Internal server error."),
        { status: 500 }
      );
    }
  }
  
