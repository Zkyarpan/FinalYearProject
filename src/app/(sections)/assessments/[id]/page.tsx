'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  Brain,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Clock,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// Define the types
interface AssessmentOption {
  _id: string;
  text: string;
  value: number;
}

interface AssessmentQuestion {
  _id: string;
  questionText: string;
  questionType: 'multiple-choice' | 'slider' | 'text';
  required: boolean;
  order: number;
  options?: AssessmentOption[];
  minValue?: number;
  maxValue?: number;
  step?: number;
}

interface AssessmentCategory {
  _id: string;
  name: string;
  description?: string;
  order: number;
  questions: AssessmentQuestion[];
}

interface ScoringRange {
  _id: string;
  minScore: number;
  maxScore: number;
  label: string;
  description: string;
  recommendations?: string;
}

interface Assessment {
  _id: string;
  title: string;
  description: string;
  type: string;
  categories: AssessmentCategory[];
  scoringRanges: ScoringRange[];
  totalQuestions: number;
  estimatedTimeMinutes: number;
  createdAt: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface Answer {
  questionId: string;
  answer: any;
  score?: number;
}

interface AssessmentResult {
  assessmentId: string;
  userAssessmentId: string;
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  categoryResults: any[];
  interpretation: string;
  recommendations: string;
}

export default function AssessmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // State
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<
    'intro' | 'questions' | 'results'
  >('intro');
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Derived values
  const currentCategory = assessment?.categories[currentCategoryIndex];
  const currentQuestion = currentCategory?.questions[currentQuestionIndex];

  const totalQuestions =
    assessment?.categories.reduce(
      (total, category) => total + category.questions.length,
      0
    ) || 0;

  const answeredQuestions = answers.length;

  const progress = totalQuestions
    ? Math.round((answeredQuestions / totalQuestions) * 100)
    : 0;

  const isCurrentQuestionAnswered = currentQuestion
    ? answers.some(a => a.questionId === currentQuestion._id)
    : false;

  const isCategoryComplete = currentCategory
    ? currentCategory.questions.every(
        q => !q.required || answers.some(a => a.questionId === q._id)
      )
    : false;

  // Fetch assessment data
  useEffect(() => {
    fetchAssessment();
  }, []);

  const fetchAssessment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assessments/${params.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch assessment');
      }

      const data = await response.json();

      if (data.success) {
        setAssessment(data.data.assessment);

        // Initialize answers array with empty data
        const initialAnswers: Answer[] = [];
        setAnswers(initialAnswers);
      } else {
        throw new Error(data.message || 'Failed to fetch assessment');
      }
    } catch (err: any) {
      console.error('Error fetching assessment:', err);
      setError(
        err.message || 'An error occurred while fetching the assessment'
      );

      toast.error(err.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  // Handle starting the assessment
  const handleStartAssessment = () => {
    setCurrentView('questions');
    setCurrentCategoryIndex(0);
    setCurrentQuestionIndex(0);
  };

  // Handle answering a question
  const handleAnswer = (questionId: string, answer: any) => {
    // Check if this question has already been answered
    const existingAnswerIndex = answers.findIndex(
      a => a.questionId === questionId
    );

    if (existingAnswerIndex >= 0) {
      // Update existing answer
      const updatedAnswers = [...answers];
      updatedAnswers[existingAnswerIndex] = {
        ...updatedAnswers[existingAnswerIndex],
        answer,
      };
      setAnswers(updatedAnswers);
    } else {
      // Add new answer
      setAnswers([...answers, { questionId, answer }]);
    }
  };

  // Handle moving to the next question
  const handleNextQuestion = () => {
    if (!currentCategory || !currentQuestion) return;

    // If there are more questions in this category
    if (currentQuestionIndex < currentCategory.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
    // If there are more categories
    else if (currentCategoryIndex < (assessment?.categories.length || 0) - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
      setCurrentQuestionIndex(0);
    }
    // If we're at the end of the assessment
    else {
      handleSubmitAssessment();
    }
  };

  // Handle moving to the previous question
  const handlePreviousQuestion = () => {
    if (!currentCategory) return;

    // If there are previous questions in this category
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
    // If there are previous categories
    else if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
      const previousCategory = assessment?.categories[currentCategoryIndex - 1];
      setCurrentQuestionIndex((previousCategory?.questions.length || 1) - 1);
    }
  };

  // Handle submitting the assessment
  const handleSubmitAssessment = async () => {
    if (!assessment) return;

    // Check if all required questions are answered
    const allRequiredAnswered = assessment.categories.every(category =>
      category.questions.every(
        question =>
          !question.required || answers.some(a => a.questionId === question._id)
      )
    );

    if (!allRequiredAnswered) {
      toast.error('Please answer all required questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/assessments/${params.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      const data = await response.json();

      if (data.success) {
        setResult(data.data.result);
        setCurrentView('results');

        toast.success('Assessment Complete', {
          description: 'Your assessment has been submitted successfully.',
        });
      } else {
        throw new Error(data.message || 'Failed to submit assessment');
      }
    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      setError(
        err.message || 'An error occurred while submitting the assessment'
      );

      toast.error(err.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle retaking the assessment
  const handleRetake = () => {
    setAnswers([]);
    setResult(null);
    setCurrentCategoryIndex(0);
    setCurrentQuestionIndex(0);
    setCurrentView('intro');
  };

  // Format assessment type for display
  const formatAssessmentType = (type: string) => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get assessment type badge color
  const getAssessmentTypeColor = (type: string) => {
    switch (type) {
      case 'mental-health':
        return 'bg-blue-100 text-blue-800';
      case 'anxiety':
        return 'bg-yellow-100 text-yellow-800';
      case 'depression':
        return 'bg-purple-100 text-purple-800';
      case 'stress':
        return 'bg-red-100 text-red-800';
      case 'wellbeing':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get score color
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-blue-500';
    if (percentage >= 40) return 'text-yellow-500';
    if (percentage >= 20) return 'text-orange-500';
    return 'text-red-500';
  };

  // Calculate which question number we're on overall
  const calculateOverallQuestionNumber = () => {
    if (!assessment) return 1;

    let questionNumber = 1;

    for (let i = 0; i < currentCategoryIndex; i++) {
      questionNumber += assessment.categories[i].questions.length;
    }

    questionNumber += currentQuestionIndex;

    return questionNumber;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>

          <Card className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-6" />

            <div className="space-y-4 mb-6">
              <div className="flex items-start">
                <Skeleton className="h-8 w-8 mr-3 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>

              <div className="flex items-start">
                <Skeleton className="h-8 w-8 mr-3 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            </div>

            <Skeleton className="h-10 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-3xl">
          <Card className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Error Loading Assessment
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchAssessment}>
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // No assessment found
  if (!assessment) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-3xl">
          <Card className="p-6 text-center">
            <div className="text-gray-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Assessment Not Found</h2>
            <p className="text-gray-600 mb-4">
              The assessment you're looking for doesn't exist or may have been
              removed.
            </p>
            <Button onClick={() => router.push('/assessments')}>
              View All Assessments
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // INTRO VIEW - Assessment introduction and start screen
  if (currentView === 'intro') {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{assessment.title}</h1>
              <p className="text-sm text-gray-500">
                {formatAssessmentType(assessment.type)} Assessment
              </p>
            </div>
            <div className="p-2 rounded-full bg-blue-100">
              <Brain className="h-6 w-6 text-blue-500" />
            </div>
          </div>

          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold">About This Assessment</h2>
              <Badge className={getAssessmentTypeColor(assessment.type)}>
                {formatAssessmentType(assessment.type)}
              </Badge>
            </div>

            <p className="text-gray-600 mb-6">{assessment.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center">
                <div className="text-gray-500 mb-1">
                  <ClipboardCheck className="h-5 w-5 mx-auto" />
                </div>
                <p className="font-medium text-center">
                  {assessment.totalQuestions} Questions
                </p>
                <p className="text-sm text-gray-500 text-center">
                  Across {assessment.categories.length} categories
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center">
                <div className="text-gray-500 mb-1">
                  <Clock className="h-5 w-5 mx-auto" />
                </div>
                <p className="font-medium text-center">
                  {assessment.estimatedTimeMinutes} Minutes
                </p>
                <p className="text-sm text-gray-500 text-center">
                  Estimated completion time
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start">
                <div className="p-2 rounded-full bg-blue-100 mr-3">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-medium">Evidence-based</h3>
                  <p className="text-sm text-gray-500">
                    Based on scientifically validated assessment tools
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="p-2 rounded-full bg-green-100 mr-3">
                  <Info className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium">Personalized feedback</h3>
                  <p className="text-sm text-gray-500">
                    Receive instant results and recommendations
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="p-2 rounded-full bg-yellow-100 mr-3">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-medium">Not a clinical diagnosis</h3>
                  <p className="text-sm text-gray-500">
                    This tool does not replace professional medical advice
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleStartAssessment} className="w-full">
              Begin Assessment <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              By continuing, you agree that your responses will be stored
              securely in your personal account for future reference.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // QUESTIONS VIEW - Taking the assessment
  if (currentView === 'questions' && currentCategory && currentQuestion) {
    const overallQuestionNumber = calculateOverallQuestionNumber();

    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">{assessment.title}</h1>
              <p className="text-sm text-gray-500">
                Question {overallQuestionNumber} of {totalQuestions}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                Progress:
              </span>
              <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                <Progress value={progress} className="h-full" />
              </div>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
          </div>

          <Card className="p-6">
            {/* Category header */}
            <div className="mb-6">
              <Badge className="mb-2">{currentCategory.name}</Badge>
              <h2 className="text-lg font-medium">
                {currentQuestion.questionText}
              </h2>
              {currentQuestion.required && (
                <span className="text-xs text-red-500">* Required</span>
              )}
            </div>

            {/* Question content */}
            <div className="mb-8">
              {currentQuestion.questionType === 'multiple-choice' &&
                currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map(option => {
                      const isSelected = answers.some(
                        a =>
                          a.questionId === currentQuestion._id &&
                          a.answer === option._id
                      );

                      return (
                        <div
                          key={option._id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 border-blue-300'
                              : 'hover:bg-gray-50 border-gray-200'
                          }`}
                          onClick={() =>
                            handleAnswer(currentQuestion._id, option._id)
                          }
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <span>{option.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              {currentQuestion.questionType === 'slider' && (
                <div className="mt-4">
                  <div className="mb-6">
                    <input
                      type="range"
                      min={currentQuestion.minValue || 0}
                      max={currentQuestion.maxValue || 10}
                      step={currentQuestion.step || 1}
                      value={
                        answers.find(a => a.questionId === currentQuestion._id)
                          ?.answer ||
                        currentQuestion.minValue ||
                        0
                      }
                      onChange={e =>
                        handleAnswer(
                          currentQuestion._id,
                          parseInt(e.target.value)
                        )
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
                      {answers.find(a => a.questionId === currentQuestion._id)
                        ?.answer ||
                        currentQuestion.minValue ||
                        0}
                    </span>
                  </div>
                </div>
              )}

              {currentQuestion.questionType === 'text' && (
                <textarea
                  rows={4}
                  placeholder="Enter your answer here..."
                  value={
                    answers.find(a => a.questionId === currentQuestion._id)
                      ?.answer || ''
                  }
                  onChange={e =>
                    handleAnswer(currentQuestion._id, e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={
                  currentCategoryIndex === 0 && currentQuestionIndex === 0
                }
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>

              <Button
                onClick={handleNextQuestion}
                disabled={
                  currentQuestion.required && !isCurrentQuestionAnswered
                }
              >
                {currentCategoryIndex === assessment.categories.length - 1 &&
                currentQuestionIndex ===
                  currentCategory.questions.length - 1 ? (
                  submitting ? (
                    <>
                      Submitting...{' '}
                      <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      Complete Assessment{' '}
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )
                ) : (
                  <>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // RESULTS VIEW - Showing assessment results
  if (currentView === 'results' && result) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Assessment Results</h1>
              <p className="text-sm text-gray-500">{assessment.title}</p>
            </div>
            <div className="p-2 rounded-full bg-blue-100">
              <CheckCircle className="h-6 w-6 text-blue-500" />
            </div>
          </div>

          <Card className="p-6">
            {/* Score summary */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold">Your Assessment Score</h2>
              <div
                className={`text-5xl font-bold mt-4 ${getScoreColor(result.percentageScore)}`}
              >
                {result.percentageScore}%
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Score: {result.totalScore} out of {result.maxPossibleScore}
              </p>
            </div>

            {/* Interpretation */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-800 mb-2">
                Assessment Feedback:
              </h3>
              <p className="text-blue-800">{result.interpretation}</p>
            </div>

            {/* Category results */}
            {result.categoryResults && result.categoryResults.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Detailed Results:</h3>
                <div className="space-y-4">
                  {result.categoryResults.map(category => (
                    <div
                      key={category.categoryId}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 p-3 border-b">
                        <div className="flex justify-between">
                          <h4 className="font-medium">
                            {category.categoryName}
                          </h4>
                          <span>
                            {Math.round(
                              (category.score / category.maxPossibleScore) * 100
                            )}
                            %
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{
                              width: `${(category.score / category.maxPossibleScore) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {category.interpretation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && (
              <div className="border-t pt-6 mb-6">
                <h3 className="font-medium mb-3">Recommendations:</h3>
                <div className="space-y-3">
                  {result.recommendations.split('\n').map(
                    (recommendation, index) =>
                      recommendation.trim() && (
                        <div key={index} className="flex items-start">
                          <ChevronRight className="h-5 w-5 text-blue-500 mr-2 shrink-0 mt-0.5" />
                          <p className="text-gray-700">{recommendation}</p>
                        </div>
                      )
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRetake}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Retake Assessment
              </Button>

              <Button
                className="flex-1"
                onClick={() => router.push('/appointments')}
              >
                Book Appointment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* View history link */}
            <div className="flex justify-center mt-6">
              <Button
                variant="ghost"
                onClick={() => router.push('/assessments/history')}
                className="text-sm"
              >
                View Assessment History
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              This assessment is for informational purposes only and does not
              constitute medical advice or a diagnosis.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Fallback
  return <div>Something went wrong. Please try refreshing the page.</div>;
}
