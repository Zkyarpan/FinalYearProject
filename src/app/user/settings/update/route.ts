import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@//db/db";
import Account from "@/models/Account";
import { createSuccessResponse, createErrorResponse } from "@/lib/response";

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, email, password } = body;

    if (!id) {
      return NextResponse.json(
        createErrorResponse(400, "Account ID is required"),
        { status: 400 }
      );
    }

    const account = await Account.findById(id);
    if (!account) {
      return NextResponse.json(createErrorResponse(404, "Account not found"), {
        status: 404,
      });
    }

    if (email) account.email = email;
    if (password) account.password = await bcrypt.hash(password, 10);

    await account.save();

    return NextResponse.json(
      createSuccessResponse(200, {
        message: "Account updated successfully",
        data: account,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      createErrorResponse(500, "Internal Server Error"),
      { status: 500 }
    );
  }
}
