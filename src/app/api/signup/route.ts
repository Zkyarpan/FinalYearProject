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
    console.log("Connecting to DB...");
    await connectDB();

    console.log("Parsing request body...");
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      console.log("Validation failed: Missing email or password");
      return NextResponse.json(
        createErrorResponse(400, "All fields are required"),
        { status: 400 }
      );
    }

    if (password.length < 8) {
      console.log("Validation failed: Password too short");
      return NextResponse.json(
        createErrorResponse(400, "Password must be at least 8 characters long"),
        { status: 400 }
      );
    }

    console.log("Checking if account already exists...");
    const existingAccount = await Account.findOne({ email });
    if (existingAccount) {
      console.log("Validation failed: Email already registered");
      return NextResponse.json(
        createErrorResponse(400, "Email is already registered"),
        { status: 400 }
      );
    }

    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = uuidv4().slice(0, 6);
    console.log("Generated verification code:", verificationCode);

    console.log("Creating new account...");
    const newAccount = new Account({
      email,
      password: hashedPassword,
      verificationCode,
      verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000),
    });

    console.log("Saving account to database...");
    await newAccount.save();

    console.log("Sending verification email...");
    const emailResult = await sendVerificationEmail(email, verificationCode);
    console.log("Email sending result:", emailResult);

    if (!emailResult.success) {
      console.log("Failed to send verification email");
      return NextResponse.json(
        createErrorResponse(500, "Failed to send verification email."),
        { status: 500 }
      );
    }

    console.log("Signup successful. Verification email sent.");
    return NextResponse.json(
      createSuccessResponse(201, {
        message: "Signup successful. Verification email sent.",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error occurred during signup process:", error);
    return NextResponse.json(
      createErrorResponse(500, "Internal Server Error"),
      { status: 500 }
    );
  }
}
