'use server';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/db/db';
import Assessment from '@/models/Assessment';
import UserAssessment from '@/models/UserAssessment';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import mongoose from 'mongoose';

interface Params {
  params: {
    id: string;
  };
}

// Submit an assessment
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      const { id } = params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid assessment ID'),
          { status: 400 }
        );
      }

      await connectDB();

      // Get the assessment
      const assessment = await Assessment.findById(id);

      if (!assessment) {
        return NextResponse.json(
          createErrorResponse(404, 'Assessment not found'),
          { status: 404 }
        );
      }

      // Parse the request body
      const { answers } = await req.json();

      if (!answers || !Array.isArray(answers)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid answers format'),
          { status: 400 }
        );
      }

      // Calculate scores
      const { totalScore, maxPossibleScore, categoryResults } =
        calculateAssessmentScore(assessment, answers);

      // Determine interpretation based on scoring ranges
      const { interpretation, recommendations } = getInterpretation(
        assessment.scoringRanges,
        totalScore,
        maxPossibleScore
      );

      // Create user assessment record
      const userAssessment = new UserAssessment({
        userId: token.id,
        assessmentId: id,
        answers: answers.map((answer: any) => ({
          questionId: answer.questionId,
          answer: answer.answer,
          score: answer.score,
        })),
        totalScore,
        maxPossibleScore,
        categoryResults,
        interpretation,
        recommendations,
        completedAt: new Date(),
      });

      await userAssessment.save();

      return NextResponse.json(
        createSuccessResponse(201, {
          message: 'Assessment submitted successfully',
          result: {
            assessmentId: id,
            userAssessmentId: userAssessment._id,
            totalScore,
            maxPossibleScore,
            percentageScore: Math.round((totalScore / maxPossibleScore) * 100),
            categoryResults,
            interpretation,
            recommendations,
          },
        }),
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Error submitting assessment:', error);
      return NextResponse.json(
        createErrorResponse(500, error.message || 'Internal Server Error'),
        { status: 500 }
      );
    }
  }, req);
}

// Helper functions for scoring and interpretation
function calculateAssessmentScore(assessment: any, userAnswers: any[]) {
  let totalScore = 0;
  let maxPossibleScore = 0;
  const categoryResults: any[] = [];

  // Process each category
  assessment.categories.forEach((category: any) => {
    let categoryScore = 0;
    let categoryMaxScore = 0;

    // Process questions in this category
    category.questions.forEach((question: any) => {
      const userAnswer = userAnswers.find(
        a => a.questionId.toString() === question._id.toString()
      );

      if (userAnswer) {
        // Calculate score based on question type
        let score = 0;

        if (question.questionType === 'multiple-choice') {
          // Find the selected option
          const option = question.options?.find(
            (opt: any) =>
              opt._id.toString() === userAnswer.answer.toString() ||
              opt.text === userAnswer.answer.toString()
          );

          if (option) {
            score = option.value;
            userAnswer.score = score;
          }
        } else if (question.questionType === 'slider') {
          // For slider, the answer is the numeric value
          score = Number(userAnswer.answer);
          userAnswer.score = score;
        }
        // For text questions, no score is calculated

        categoryScore += score;

        // Calculate max possible score for this question
        if (question.questionType === 'multiple-choice') {
          const maxOption = Math.max(
            ...(question.options?.map((opt: any) => opt.value) || [0])
          );
          categoryMaxScore += maxOption;
        } else if (question.questionType === 'slider') {
          categoryMaxScore += question.maxValue || 0;
        }
      }
    });

    // Add to total scores
    totalScore += categoryScore;
    maxPossibleScore += categoryMaxScore;

    // Add category result
    categoryResults.push({
      categoryId: category._id,
      categoryName: category.name,
      score: categoryScore,
      maxPossibleScore: categoryMaxScore,
      interpretation: getCategoryInterpretation(
        categoryScore,
        categoryMaxScore
      ),
    });
  });

  return {
    totalScore,
    maxPossibleScore,
    categoryResults,
  };
}

// Helper function to get category interpretation
function getCategoryInterpretation(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;

  if (percentage >= 80) {
    return 'Excellent';
  } else if (percentage >= 60) {
    return 'Good';
  } else if (percentage >= 40) {
    return 'Average';
  } else if (percentage >= 20) {
    return 'Below Average';
  } else {
    return 'Poor';
  }
}

// Helper function to get interpretation from scoring ranges
function getInterpretation(
  scoringRanges: any[],
  score: number,
  maxScore: number
) {
  // Calculate percentage score
  const percentageScore = (score / maxScore) * 100;

  // Find matching scoring range
  let matchingRange = scoringRanges.find(
    range =>
      percentageScore >= range.minScore && percentageScore <= range.maxScore
  );

  // Use default if no range is found
  if (!matchingRange) {
    matchingRange = {
      label: 'No interpretation available',
      description:
        'Please consult a mental health professional for interpretation.',
      recommendations: 'Consider discussing your results with a professional.',
    };
  }

  return {
    interpretation: `${matchingRange.label}: ${matchingRange.description}`,
    recommendations: matchingRange.recommendations,
  };
}
