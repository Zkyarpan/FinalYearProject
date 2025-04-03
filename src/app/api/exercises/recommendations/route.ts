'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import PsychologistRecommendation from '@/models/PsychologistRecommendation';
import Exercise from '@/models/Exercise';
import User from '@/models/User';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

// Get user's recommended exercises (for patients)
export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const userId = token.userId;
        
        // Fetch all recommendations for this user
        const recommendations = await PsychologistRecommendation.find({
          patient: userId,
        })
          .populate('exercise')
          .populate('psychologist', 'email')
          .sort({ createdAt: -1 })
          .lean();

        return NextResponse.json(
          createSuccessResponse(200, { recommendations }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error fetching recommendations:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['user', 'admin', 'psychologist']
  );
}

// Create a new recommendation (for psychologists)
export async function POST(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        if (token.role !== 'psychologist' && token.role !== 'admin') {
          return NextResponse.json(
            createErrorResponse(403, 'Unauthorized'),
            { status: 403 }
          );
        }

        const { patientId, exerciseId, note, dueDate } = await req.json();

        if (!patientId || !exerciseId) {
          return NextResponse.json(
            createErrorResponse(400, 'Patient ID and Exercise ID are required'),
            { status: 400 }
          );
        }

        // Verify that patient and exercise exist
        const patientExists = await User.exists({ _id: patientId, role: 'user' });
        if (!patientExists) {
          return NextResponse.json(
            createErrorResponse(404, 'Patient not found'),
            { status: 404 }
          );
        }

        const exerciseExists = await Exercise.exists({ _id: exerciseId });
        if (!exerciseExists) {
          return NextResponse.json(
            createErrorResponse(404, 'Exercise not found'),
            { status: 404 }
          );
        }

        // Create recommendation
        const recommendation = await PsychologistRecommendation.create({
          psychologist: token.userId,
          patient: patientId,
          exercise: exerciseId,
          note: note || '',
          dueDate: dueDate || undefined,
        });

        return NextResponse.json(
          createSuccessResponse(201, {
            message: 'Recommendation created successfully',
            recommendation,
          }),
          { status: 201 }
        );
      } catch (error: any) {
        console.error('Error creating recommendation:', error);
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