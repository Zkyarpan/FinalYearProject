"use server";

import { decrypt } from "@/lib/token"; 
import { NextRequest, NextResponse } from "next/server";
import TemporaryToken from "@/models/TemporaryToken"; 
import Account from "@/models/Account";
import bcrypt from "bcryptjs";
import connectDB from "@/db/db";

export async function POST(req: NextRequest) {
  try {
    connectDB();
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Verification code is required." },
        { status: 400 }
      );
    }

    const record = await TemporaryToken.findOne({ verificationCode: code });

    if (!record) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(record.verificationCodeExpiry)) {
      return NextResponse.json(
        { success: false, message: "Verification code has expired." },
        { status: 400 }
      );
    }

    const payload = await decrypt(record.token);

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Failed to decrypt token." },
        { status: 400 }
      );
    }

    const { email, password } = payload;

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Password is required." },
        { status: 400 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 12);

    const newAccount = new Account({
      email,
      password: hashedPassword,
      isVerified: true,
    });

    await newAccount.save();

    await TemporaryToken.deleteOne({ verificationCode: code });

    return NextResponse.json(
      { success: true, message: "Verified successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in verification:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
