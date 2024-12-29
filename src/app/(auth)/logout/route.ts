import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/token";
import { createSuccessResponse, createErrorResponse } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    await clearSessionCookie();

    return NextResponse.json(
      createSuccessResponse(200, {
        message: "Logged out successfully",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(createErrorResponse(500, "Something went wrong"), {
      status: 500,
    });
  }
}
