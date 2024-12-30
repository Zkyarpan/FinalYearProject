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

    const existingAccount = await Account.findOne({ email });
    if (existingAccount) {
      return NextResponse.json(
        createErrorResponse(400, "Email is already registered"),
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = uuidv4().slice(0, 6);

    const newAccount = new Account({
      email,
      password: hashedPassword,
      verificationCode,
      verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000),
    });

    await newAccount.save();

    const emailResult = await sendVerificationEmail(email, verificationCode);
    console.log("Email sending result:", emailResult);

    if (!emailResult.success) {
      return NextResponse.json(
        createErrorResponse(500, "Failed to send verification email."),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(201, {
        message: "Signup successful. Verification email sent.",
      }),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(500, "Internal Server Error"),
      { status: 500 }
    );
  }
}
