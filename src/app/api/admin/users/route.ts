import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Psychologist from '@/models/Psychologist';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { hash } from 'bcryptjs';
import { Types } from 'mongoose';

// Define the default avatar constant
const DEFAULT_AVATAR = '/default-avatar.jpg';

export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        // Check if user is admin
        if (token.role !== 'admin') {
          return NextResponse.json(
            createErrorResponse(
              403,
              'Access denied. Admin privileges required.'
            ),
            { status: 403 }
          );
        }

        await connectDB();
        console.log('Connected to database for admin user management');

        // Parse query parameters
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || '';
        const role = url.searchParams.get('role') || '';
        const status = url.searchParams.get('status') || '';

        // Calculate pagination
        const skip = (page - 1) * limit;

        if (role === 'psychologist') {
          // For psychologists, query the Psychologist collection directly
          const psychologistMatchStage: any = {};

          if (search) {
            psychologistMatchStage.$or = [
              { email: { $regex: search, $options: 'i' } },
              { firstName: { $regex: search, $options: 'i' } },
              { lastName: { $regex: search, $options: 'i' } },
            ];
          }

          if (status === 'active') {
            psychologistMatchStage.approvalStatus = 'approved';
          } else if (status === 'inactive') {
            psychologistMatchStage.approvalStatus = { $ne: 'approved' };
          }

          console.log(
            'Psychologist match stage:',
            JSON.stringify(psychologistMatchStage)
          );

          // Use aggregation to get psychologists with pagination and proper formatting
          const pipeline = [
            { $match: psychologistMatchStage },
            { $sort: { createdAt: -1 as -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                email: 1,
                role: { $literal: 'psychologist' },
                isActive: { $eq: ['$approvalStatus', 'approved'] },
                isVerified: 1,
                createdAt: 1,
                updatedAt: 1,
                profileData: {
                  firstName: '$firstName',
                  lastName: '$lastName',
                  image: { $ifNull: ['$profilePhotoUrl', DEFAULT_AVATAR] },
                  phone: { $literal: '' },
                  age: { $literal: 0 },
                  gender: { $literal: '' },
                  briefBio: { $ifNull: ['$about', ''] },
                },
                psychologistData: {
                  email: '$email',
                  firstName: '$firstName',
                  lastName: '$lastName',
                  fullName: {
                    $ifNull: [
                      '$fullName',
                      { $concat: ['$firstName', ' ', '$lastName'] },
                    ],
                  },
                  approvalStatus: { $ifNull: ['$approvalStatus', 'pending'] },
                  profilePhotoUrl: {
                    $ifNull: ['$profilePhotoUrl', DEFAULT_AVATAR],
                  },
                  specializations: { $ifNull: ['$specializations', []] },
                  sessionFee: { $ifNull: ['$sessionFee', 0] },
                  languages: { $ifNull: ['$languages', []] },
                  licenseNumber: { $ifNull: ['$licenseNumber', ''] },
                  licenseType: { $ifNull: ['$licenseType', ''] },
                },
              },
            },
          ];

          const countPipeline = [
            { $match: psychologistMatchStage },
            { $count: 'total' },
          ];

          const psychologists = await Psychologist.aggregate(pipeline);
          const countResult = await Psychologist.aggregate(countPipeline);

          const totalUsers = countResult.length > 0 ? countResult[0].total : 0;
          const totalPages = Math.ceil(totalUsers / limit);

          console.log(
            `Found ${psychologists.length} psychologists via aggregation`
          );

          return NextResponse.json(
            createSuccessResponse(200, {
              users: psychologists,
              totalUsers,
              totalPages,
              currentPage: page,
            }),
            { status: 200 }
          );
        } else {
          // For regular users or all users, use a more comprehensive aggregation
          // that joins data from User, Profile, and Psychologist collections
          const matchStage: any = {};

          if (search) {
            matchStage.email = { $regex: search, $options: 'i' };
          }

          if (role) {
            matchStage.role = role;
          }

          if (status) {
            matchStage.isActive = status === 'active';
          }

          console.log('User match stage:', JSON.stringify(matchStage));

          // Main aggregation pipeline for users
          const pipeline = [
            { $match: matchStage },
            { $sort: { createdAt: -1 as const } },
            { $skip: skip },
            { $limit: limit },
            // Lookup profiles
            {
              $lookup: {
                from: 'profiles',
                localField: '_id',
                foreignField: 'user',
                as: 'profileArr',
              },
            },
            // Lookup psychologists (by email)
            {
              $lookup: {
                from: 'psychologists',
                localField: 'email',
                foreignField: 'email',
                as: 'psychologistArr',
              },
            },
            // Add processed profile and psychologist data
            {
              $addFields: {
                profile: { $arrayElemAt: ['$profileArr', 0] },
                psychologist: { $arrayElemAt: ['$psychologistArr', 0] },
              },
            },
            // Format the data for the response
            {
              $project: {
                _id: 1,
                email: 1,
                role: 1,
                isActive: 1,
                isVerified: 1,
                createdAt: 1,
                updatedAt: 1,
                profileData: {
                  $cond: {
                    if: { $gt: [{ $size: '$profileArr' }, 0] },
                    then: {
                      firstName: { $ifNull: ['$profile.firstName', ''] },
                      lastName: { $ifNull: ['$profile.lastName', ''] },
                      image: { $ifNull: ['$profile.image', DEFAULT_AVATAR] },
                      phone: { $ifNull: ['$profile.phone', ''] },
                      age: { $ifNull: ['$profile.age', 0] },
                      gender: { $ifNull: ['$profile.gender', ''] },
                      briefBio: { $ifNull: ['$profile.briefBio', ''] },
                    },
                    else: null,
                  },
                },
                psychologistData: {
                  $cond: {
                    if: { $gt: [{ $size: '$psychologistArr' }, 0] },
                    then: {
                      email: { $ifNull: ['$psychologist.email', ''] },
                      firstName: { $ifNull: ['$psychologist.firstName', ''] },
                      lastName: { $ifNull: ['$psychologist.lastName', ''] },
                      fullName: {
                        $ifNull: [
                          '$psychologist.fullName',
                          {
                            $concat: [
                              { $ifNull: ['$psychologist.firstName', ''] },
                              ' ',
                              { $ifNull: ['$psychologist.lastName', ''] },
                            ],
                          },
                        ],
                      },
                      approvalStatus: {
                        $ifNull: ['$psychologist.approvalStatus', 'pending'],
                      },
                      profilePhotoUrl: {
                        $ifNull: [
                          '$psychologist.profilePhotoUrl',
                          DEFAULT_AVATAR,
                        ],
                      },
                      specializations: {
                        $ifNull: ['$psychologist.specializations', []],
                      },
                      sessionFee: { $ifNull: ['$psychologist.sessionFee', 0] },
                      languages: { $ifNull: ['$psychologist.languages', []] },
                    },
                    else: null,
                  },
                },
              },
            },
            // Remove temporary fields
            {
              $project: {
                profileArr: 0,
                psychologistArr: 0,
                profile: 0,
                psychologist: 0,
              },
            },
          ];

          // Count pipeline for pagination
          const countPipeline = [{ $match: matchStage }, { $count: 'total' }];

          const users = await User.aggregate(pipeline);
          const countResult = await User.aggregate(countPipeline);

          const totalUsers = countResult.length > 0 ? countResult[0].total : 0;
          const totalPages = Math.ceil(totalUsers / limit);

          console.log(`Found ${users.length} users via aggregation`);

          return NextResponse.json(
            createSuccessResponse(200, {
              users,
              totalUsers,
              totalPages,
              currentPage: page,
            }),
            { status: 200 }
          );
        }
      } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin'] // Only allow admins
  );
}

// Create new user
export async function POST(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        // Check if user is admin
        if (token.role !== 'admin') {
          return NextResponse.json(
            createErrorResponse(
              403,
              'Access denied. Admin privileges required.'
            ),
            { status: 403 }
          );
        }

        await connectDB();

        // Get request body
        const {
          email,
          password,
          role,
          firstName,
          lastName,
          isActive,
          sendWelcomeEmail,
        } = await req.json();

        // Validate required fields
        if (!email || !password) {
          return NextResponse.json(
            createErrorResponse(400, 'Email and password are required'),
            { status: 400 }
          );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return NextResponse.json(
            createErrorResponse(409, 'User with this email already exists'),
            { status: 409 }
          );
        }

        // Hash password
        const hashedPassword = await hash(password, 10);

        // Create new user
        const newUser = await User.create({
          email,
          password: hashedPassword,
          role: role || 'user',
          isActive: isActive !== undefined ? isActive : true,
          isVerified: true, // Admins can create pre-verified accounts
        });

        // Create profile if first and last name are provided
        let profile: any = null;
        if (firstName && lastName) {
          profile = await Profile.create({
            user: newUser._id,
            firstName,
            lastName,
            image: DEFAULT_AVATAR,
            phone: '',
            age: 0,
            emergencyContact: '',
            emergencyPhone: '',
            therapyHistory: 'no',
            preferredCommunication: 'video',
            struggles: [],
            briefBio: '',
            profileCompleted: false,
          });
        }

        // If role is psychologist, create psychologist record
        if (role === 'psychologist') {
          await Psychologist.create({
            email: email,
            userId: newUser._id,
            firstName: firstName || '',
            lastName: lastName || '',
            approvalStatus: 'pending',
            specializations: [],
            yearsOfExperience: 0,
            profilePhotoUrl: DEFAULT_AVATAR,
            bio: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // TODO: Implement welcome email if sendWelcomeEmail is true
        if (sendWelcomeEmail) {
          // Send welcome email logic here
          console.log(`Welcome email would be sent to ${email}`);
        }

        return NextResponse.json(
          createSuccessResponse(201, {
            message: 'User created successfully',
            user: {
              _id: newUser._id,
              email: newUser.email,
              role: newUser.role,
              isActive: newUser.isActive,
              isVerified: newUser.isVerified,
              createdAt: newUser.createdAt,
              profile: profile
                ? {
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                  }
                : null,
            },
          }),
          { status: 201 }
        );
      } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin'] // Only allow admins
  );
}
