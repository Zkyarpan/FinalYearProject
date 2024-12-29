"use server";

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db/db";
import Psychologist from "@/models/Psychologist";
import bcrypt from "bcryptjs";
import { uploadToCloudinary } from "@/utils/fileUpload";
import Busboy from "busboy";
import { createErrorResponse, createSuccessResponse } from "@/lib/response";
import { encrypt } from "@/lib/token";

async function parseForm(
  req: NextRequest
): Promise<{ fields: any; files: any }> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: Object.fromEntries(req.headers.entries()),
    });

    const fields: Record<string, any> = {};
    const files: Record<string, any> = {};

    busboy.on("field", (fieldname, val) => {
      fields[fieldname] = val;
    });

    interface ParsedFiles {
      [key: string]: {
        buffer: Buffer;
        filename: string;
        mimetype: string;
      };
    }

    busboy.on(
      "file",
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        filename: string,
        encoding: string,
        mimetype: string
      ) => {
        const chunks: Buffer[] = [];
        file.on("data", (chunk: Buffer) => chunks.push(chunk));
        file.on("end", () => {
          (files as ParsedFiles)[fieldname] = {
            buffer: Buffer.concat(chunks),
            filename,
            mimetype,
          };
        });
      }
    );

    busboy.on("finish", () => {
      resolve({ fields, files });
    });

    busboy.on("error", (error) => reject(error));

    if (req.body) {
      const reader = req.body.getReader();
      const stream = new ReadableStream({
        start(controller) {
          function push() {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
              push();
            });
          }
          push();
        },
      });

      const nodeStream = require("stream").Readable.from(stream);
      nodeStream.pipe(busboy);
    } else {
      reject(new Error("Request body is null"));
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { fields, files } = await parseForm(req);

    const {
      username,
      firstName,
      lastName,
      email,
      country,
      streetAddress,
      city,
      stateOrProvince,
      postalCode,
      about,
      password,
    } = fields;

    const { profilePhoto, certificateOrLicense } = files;

    if (
      !username ||
      !firstName ||
      !lastName ||
      !email ||
      !country ||
      !streetAddress ||
      !city ||
      !stateOrProvince ||
      !postalCode ||
      !about ||
      !password
    ) {
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

    const existingPsychologist = await Psychologist.findOne({
      $or: [{ email }, { username }],
    });

    if (existingPsychologist) {
      return NextResponse.json(
        createErrorResponse(400, "Username or email already exists"),
        { status: 400 }
      );
    }

    let profilePhotoUrl = "";
    let certificateOrLicenseUrl = "";

    if (profilePhoto) {
      profilePhotoUrl = (await uploadToCloudinary({
        fileBuffer: profilePhoto.buffer,
        folder: "photos/profile-images",
        filename: profilePhoto.originalFilename,
        mimetype: profilePhoto.mimetype,
      })) as string;
    }

    if (certificateOrLicense) {
      certificateOrLicenseUrl = (await uploadToCloudinary({
        fileBuffer: certificateOrLicense.buffer,
        folder: "photos/certificates",
        filename: certificateOrLicense.originalFilename,
        mimetype: certificateOrLicense.mimetype,
      })) as string;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const psychologist = new Psychologist({
      username,
      firstName,
      lastName,
      email,
      country,
      streetAddress,
      city,
      stateOrProvince,
      postalCode,
      about,
      profilePhotoUrl,
      certificateOrLicenseUrl,
      password: hashedPassword,
    });

    await psychologist.save();

    const accessToken = await encrypt({
      id: psychologist._id,
      role: "psychologist",
    });

    const refreshToken = await encrypt({
      id: psychologist._id,
      type: "refresh",
    });

    const accessTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const response = NextResponse.json(
      createSuccessResponse(201, {
        message: "Account created successfully",
        accessToken,
        user_data: {
          id: psychologist._id,
          username: psychologist.username,
          email: psychologist.email,
        },
      }),
      { status: 201 }
    );

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: refreshTokenExpires,
    });

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: accessTokenExpires,
    });

    return response;
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      createErrorResponse(500, "Internal Server Error"),
      { status: 500 }
    );
  }
}
