import { NextRequest, NextResponse } from "next/server";
import connectDB from "@//db/db";
import Account from "@/models/Account"; // Updated model name
import { createSuccessResponse, createErrorResponse } from "@/lib/response";

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        createErrorResponse(400, "Account ID is required"),
        { status: 400 }
      );
    }

    const account = await Account.findByIdAndDelete(id);
    if (!account) {
      return NextResponse.json(createErrorResponse(404, "Account not found"), {
        status: 404,
      });
    }

    return NextResponse.json(
      createSuccessResponse(200, {
        message: "Account deleted successfully",
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
