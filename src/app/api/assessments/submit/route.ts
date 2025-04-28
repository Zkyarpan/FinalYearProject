'use server';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/db/db';
import UserAssessment from '@/models/UserAssessment';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

export async function POST(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      // Parse the request body
      const data = await req.json();
      const {
        answers,
        result,
        questions,
        assessmentType = 'mental-health',
      } = data;

      if (!answers || !result) {
        return NextResponse.json(
          createErrorResponse(400, 'Missing required data'),
          { status: 400 }
        );
      }

      // Format detailed answers with both question text and answer text
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, value]: [string, any]) => {
          const question = questions.find((q: any) => q.id === questionId);
          const option = question?.options.find((o: any) => o.value === value);

          return {
            questionId,
            questionText: question?.text || 'Unknown question',
            answer: value,
            answerText: option?.text || `Value: ${value}`,
          };
        }
      );

      // Create a new assessment record
      const assessment = new UserAssessment({
        userId: token.id,
        answers: formattedAnswers,
        totalScore: result.totalScore,
        maxPossible: result.maxPossible,
        percentage: result.percentage,
        severity: result.severity,
        feedback: result.feedback,
        assessmentType,
      });

      // Save to database
      await assessment.save();

      // Return success with assessment ID
      return NextResponse.json({
        success: true,
        message: 'Assessment saved successfully',
        assessmentId: assessment._id,
      });
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      return NextResponse.json(
        createErrorResponse(500, error.message || 'Failed to save assessment'),
        { status: 500 }
      );
    }
  }, req);
}
