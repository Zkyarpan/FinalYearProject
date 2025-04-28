'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';

// Question option type
interface QuestionOption {
  id: string;
  text: string;
  value: number;
}

// Question type
interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'slider' | 'text';
  required: boolean;
  options?: QuestionOption[];
  minValue?: number;
  maxValue?: number;
  step?: number;
}

// Answer type
interface Answer {
  questionId: string;
  answer: any;
}

interface AssessmentQuestionnaireProps {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Answer[];
  onAnswer: (questionId: string, answer: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isLastQuestion: boolean;
  isSubmitting: boolean;
  progress: number;
  totalQuestions: number;
}

export default function AssessmentQuestionnaire({
  questions,
  currentQuestionIndex,
  answers,
  onAnswer,
  onNext,
  onPrevious,
  onSubmit,
  isLastQuestion,
  isSubmitting,
  progress,
  totalQuestions,
}: AssessmentQuestionnaireProps) {
  const currentQuestion = questions[currentQuestionIndex];

  // Check if current question is answered
  const isCurrentQuestionAnswered = currentQuestion
    ? answers.some(a => a.questionId === currentQuestion.id)
    : false;

  // Get the current answer value
  const getCurrentAnswer = (questionId: string) => {
    const answer = answers.find(a => a.questionId === questionId);
    return answer ? answer.answer : null;
  };

  // Render different question types
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    const currentAnswer = getCurrentAnswer(currentQuestion.id);

    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3 mb-8">
            {currentQuestion.options?.map(option => (
              <div
                key={option.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  currentAnswer === option.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
                onClick={() => onAnswer(currentQuestion.id, option.id)}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                      currentAnswer === option.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {currentAnswer === option.id && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span>{option.text}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'slider':
        return (
          <div className="mb-8">
            <div className="mb-6">
              <input
                type="range"
                min={currentQuestion.minValue || 0}
                max={currentQuestion.maxValue || 10}
                step={currentQuestion.step || 1}
                value={
                  currentAnswer !== null
                    ? currentAnswer
                    : currentQuestion.minValue || 0
                }
                onChange={e =>
                  onAnswer(currentQuestion.id, parseInt(e.target.value))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />

              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{currentQuestion.minValue || 0}</span>
                <span>{currentQuestion.maxValue || 10}</span>
              </div>
            </div>

            <div className="text-center">
              <span className="text-lg font-medium">
                {currentAnswer !== null
                  ? currentAnswer
                  : currentQuestion.minValue || 0}
              </span>
            </div>
          </div>
        );

      case 'text':
        return (
          <textarea
            rows={4}
            placeholder="Enter your answer here..."
            value={currentAnswer || ''}
            onChange={e => onAnswer(currentQuestion.id, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-8"
          ></textarea>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </p>
        <p className="text-sm text-gray-500">{progress}% complete</p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <Progress value={progress} className="h-full" />
      </div>

      {/* Question card */}
      <Card className="p-6">
        {/* Question text */}
        <div className="mb-6">
          <h2 className="text-lg font-medium">{currentQuestion?.text}</h2>
          {currentQuestion?.required && (
            <span className="text-xs text-red-500">* Required</span>
          )}
        </div>

        {/* Question input */}
        {renderQuestionInput()}

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={onSubmit}
              disabled={!isCurrentQuestionAnswered || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  Submitting...{' '}
                  <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  Complete Assessment <CheckCircle className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={currentQuestion?.required && !isCurrentQuestionAnswered}
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
