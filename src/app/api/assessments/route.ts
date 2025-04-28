import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/db/db';
import Assessment from '@/models/Assessment';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

// Get all published assessments
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = new URL(req.url).searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const all = searchParams.get('all') === 'true';
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { isPublished: true };

    // Add search condition if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Add type condition if provided
    if (type) {
      query.type = type;
    }

    // If all=true is specified and this is an admin request, include unpublished assessments
    if (all) {
      // The route will handle authentication inside
      return withAuth(
        async (req: NextRequest, token: any) => {
          if (token.role === 'admin' || token.role === 'psychologist') {
            // For admins and psychologists, allow viewing all assessments
            if (token.role === 'admin') {
              delete query.isPublished; // Show all assessments
            } else if (token.role === 'psychologist') {
              // Psychologists can see their own unpublished assessments and all published ones
              query.$or = [
                { isPublished: true },
                { createdBy: token.id, isPublished: false },
              ];
            }

            const assessments = await Assessment.find(query)
              .select(
                'title description totalQuestions type createdAt createdBy isPublished'
              )
              .populate('createdBy', 'firstName lastName email')
              .skip(skip)
              .limit(limit)
              .sort({ createdAt: -1 })
              .lean();

            const total = await Assessment.countDocuments(query);

            return NextResponse.json(
              createSuccessResponse(200, {
                assessments,
                pagination: {
                  total,
                  page,
                  limit,
                  totalPages: Math.ceil(total / limit),
                },
              }),
              { status: 200 }
            );
          } else {
            // Regular users can only see published assessments
            return NextResponse.json(
              createErrorResponse(
                403,
                'Access denied. Admin or psychologist privileges required.'
              ),
              { status: 403 }
            );
          }
        },
        req,
        ['admin', 'psychologist']
      );
    }

    // Standard query for published assessments (no auth required)
    const assessments = await Assessment.find(query)
      .select('title description totalQuestions type createdAt')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Assessment.countDocuments(query);

    return NextResponse.json(
      createSuccessResponse(200, {
        assessments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      createErrorResponse(500, error.message || 'Internal Server Error'),
      { status: 500 }
    );
  }
}

// Create a new assessment (only for psychologists and admins)
export async function POST(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        if (!['psychologist', 'admin'].includes(token.role)) {
          return NextResponse.json(
            createErrorResponse(
              403,
              'Access denied. Only psychologists and admins can create assessments.'
            ),
            { status: 403 }
          );
        }

        await connectDB();

        const data = await req.json();

        // Validate required fields
        if (!data.title || !data.description || !data.categories) {
          return NextResponse.json(
            createErrorResponse(400, 'Missing required fields'),
            { status: 400 }
          );
        }

        // Create the assessment
        const assessment = new Assessment({
          ...data,
          createdBy: token.id,
        });

        await assessment.save();

        return NextResponse.json(
          createSuccessResponse(201, {
            message: 'Assessment created successfully',
            assessmentId: assessment._id,
          }),
          { status: 201 }
        );
      } catch (error: any) {
        console.error('Error creating assessment:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['psychologist', 'admin']
  );
}
