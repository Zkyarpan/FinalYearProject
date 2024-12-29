import { NextRequest, NextResponse } from "next/server";
import connectDB from "@//db/db";
import Profile from "@/models/Profile";
import { createSuccessResponse, createErrorResponse } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId, name, address, phone, age, gender } = body;

    if (!userId || !name || !phone) {
      return NextResponse.json(
        createErrorResponse(400, "Required fields are missing"),
        {
          status: 400,
        }
      );
    }

    let profile = await Profile.findOne({ user: userId });
    if (!profile) {
      profile = new Profile({
        user: userId,
        name,
        address,
        phone,
        age,
        gender,
        profileCompleted: true,
      });
      await profile.save();
    } else {
      profile.name = name;
      profile.address = address;
      profile.phone = phone;
      profile.age = age;
      profile.gender = gender;
      profile.profileCompleted = true;
      await profile.save();
    }

    return NextResponse.json(
      createSuccessResponse(200, "Profile updated successfully"),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      createErrorResponse(500, "Internal Server Error"),
      { status: 500 }
    );
  }
}
