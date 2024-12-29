"use server";

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db/db";
import Account from "@/models/Account";
import bcrypt from "bcryptjs";
import { createSuccessResponse, createErrorResponse } from "@/lib/response";
import { sendVerificationEmail } from "@/helpers/sendEmailVerification";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        createErrorResponse(400, "All fields are required"),
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        createErrorResponse(400, "Password must be at least 8 characters long"),
        { status: 400 }
      );
    }

    // Check if email is already registered
    const existingAccount = await Account.findOne({ email });
    if (existingAccount) {
      return NextResponse.json(
        createErrorResponse(400, "Email is already registered"),
        { status: 400 }
      );
    }

    // Generate a hashed password and verification code
    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = uuidv4().slice(0, 6); // 6-character code
    const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // Code valid for 15 minutes

    // Create a new account
    const newAccount = new Account({
      email,
      password: hashedPassword,
      verificationCode,
      verificationCodeExpiry,
      isVerified: false, // Default to not verified
    });

    await newAccount.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationCode);
    if (!emailResult.success) {
      return NextResponse.json(
        createErrorResponse(500, emailResult.message),
        { status: 500 }
      );
    }

    // Respond with success
    return NextResponse.json(
      createSuccessResponse(201, {
        message: "Signup successful. Please verify your email.",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      createErrorResponse(500, "Internal Server Error"),
      { status: 500 }
    );
  }
}
