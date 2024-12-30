"use server";

import { encrypt } from "@/lib/token"; 
import { NextRequest, NextResponse } from "next/server";
import { sendVerificationEmail } from "@/helpers/sendEmailVerification";
import TemporaryToken from "@/models/TemporaryToken"; 
import Account from "@/models/Account";
import { v4 as uuidv4 } from "uuid";
import connectDB from "@/db/db";

export async function POST(req: NextRequest) {
  try {
    connectDB();
    const body = await req.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Check if the email is already registered in the Account collection
    const existingAccount = await Account.findOne({ email });
    if (existingAccount) {
      return NextResponse.json(
        { success: false, message: "Email is already registered. Please login." },
        { status: 400 }
      );
    }

    // Check if there's an active temporary token for the email
    const existingTempToken = await TemporaryToken.findOne({ email });
    if (existingTempToken) {
      return NextResponse.json(
        { success: false, message: "A verification code has already been sent. Please verify your email." },
        { status: 400 }
      );
    }

    // Generate a verification code
    const verificationCode = uuidv4().slice(0, 6);

    // Encrypt email and password into a token
    const token = await encrypt({ email, password });

    // Save the token and verification code in the TemporaryToken collection
    await TemporaryToken.create({
      email,
      token,
      verificationCode,
      verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000), // Expire in 15 minutes
    });

    // Send the verification email
    const emailResult = await sendVerificationEmail(email, verificationCode);

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, message: "Failed to send verification email." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Verification email sent successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in signup:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
