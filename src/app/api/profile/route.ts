'use server';

import connectDB from '@/db/db';
import Profile from '@/models/Profile';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/authMiddleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { uploadToCloudinary, deleteFromCloudinary } from '@/utils/fileUpload';

export async function GET(req: NextRequest) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();
      const profile = await Profile.findOne({ user: user.id }).exec();

      if (!profile) {
        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Profile not found',
            profile: {
              firstName: null,
              lastName: null,
              image: null,
              profileCompleted: false,
            },
          })
        );
      }

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Profile fetched successfully',
          profile: {
            id: profile._id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            image: profile.image,
            address: profile.address,
            phone: profile.phone,
            age: profile.age,
            gender: profile.gender,
            emergencyContact: profile.emergencyContact,
            emergencyPhone: profile.emergencyPhone,
            therapyHistory: profile.therapyHistory,
            preferredCommunication: profile.preferredCommunication,
            struggles: profile.struggles,
            briefBio: profile.briefBio,
            profileCompleted: profile.profileCompleted,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          },
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Server Error:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error'),
        { status: 500 }
      );
    }
  }, req);
}

export async function PUT(req: NextRequest) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();

      const formData = await req.formData();
      const updateData: any = {};

      for (const [key, value] of formData.entries()) {
        if (key === 'image' && value instanceof Blob) {
          try {
            const buffer = Buffer.from(await value.arrayBuffer());

            const filename = `updatedprofile-${user.id}-${Date.now()}`;

            const imageUrl = await uploadToCloudinary({
              fileBuffer: buffer,
              folder: 'profile-images',
              filename: filename,
              mimetype: value.type,
            });

            updateData[key] = imageUrl;

            const existingProfile = await Profile.findOne({
              user: user.id,
            }).exec();
            if (existingProfile?.image) {
              const publicId = existingProfile.image
                .split('/')
                .slice(-1)[0]
                .split('.')[0];
              try {
                await deleteFromCloudinary(`profile-images/${publicId}`);
              } catch (deleteError) {
                console.error('Error deleting old image:', deleteError);
              }
            }
          } catch (uploadError) {
            console.error('Image upload error:', uploadError);
            return NextResponse.json(
              createErrorResponse(400, 'Failed to upload image'),
              { status: 400 }
            );
          }
        } else if (key === 'struggles') {
          updateData[key] = JSON.parse(value as string);
        } else {
          updateData[key] = value;
        }
      }

      const existingProfile = await Profile.findOne({ user: user.id }).exec();

      if (!existingProfile) {
        return NextResponse.json(
          createErrorResponse(404, 'Profile not found'),
          { status: 404 }
        );
      }

      const allowedFields = [
        'firstName',
        'lastName',
        'image',
        'address',
        'phone',
        'age',
        'gender',
        'emergencyContact',
        'emergencyPhone',
        'therapyHistory',
        'preferredCommunication',
        'struggles',
        'briefBio',
        'profileCompleted',
      ];

      const sanitizedUpdateData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {} as any);

      const updatedProfile = await Profile.findOneAndUpdate(
        { user: user.id },
        {
          $set: sanitizedUpdateData,
          updatedAt: new Date(),
        },
        { new: true }
      ).exec();

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Profile updated successfully',
          profile: {
            id: updatedProfile._id,
            firstName: updatedProfile.firstName,
            lastName: updatedProfile.lastName,
            image: updatedProfile.image,
            address: updatedProfile.address,
            phone: updatedProfile.phone,
            age: updatedProfile.age,
            gender: updatedProfile.gender,
            emergencyContact: updatedProfile.emergencyContact,
            emergencyPhone: updatedProfile.emergencyPhone,
            therapyHistory: updatedProfile.therapyHistory,
            preferredCommunication: updatedProfile.preferredCommunication,
            struggles: updatedProfile.struggles,
            briefBio: updatedProfile.briefBio,
            profileCompleted: updatedProfile.profileCompleted,
            createdAt: updatedProfile.createdAt,
            updatedAt: updatedProfile.updatedAt,
          },
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Server Error:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error'),
        { status: 500 }
      );
    }
  }, req);
}
