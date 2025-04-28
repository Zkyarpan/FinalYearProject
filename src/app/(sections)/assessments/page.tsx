'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  Clock,
  ClipboardCheck,
  AlertCircle,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

// HARDCODED ASSESSMENTS DATA - No API needed
const HARDCODED_ASSESSMENTS = [
  {
    _id: 'mental-health-1',
    title: 'Mental Health Assessment',
    description:
      'Evaluate your overall mental wellbeing with this comprehensive assessment.',
    type: 'mental-health',
    totalQuestions: 8,
    estimatedTimeMinutes: 5,
    createdAt: '2023-01-01',
    questions: [
      {
        id: 'q1',
        text: 'Over the past 2 weeks, how often have you felt down, depressed, or hopeless?',
        type: 'multiple-choice',
        options: [
          { id: 'q1-a1', text: 'Not at all', value: 0 },
          { id: 'q1-a2', text: 'Several days', value: 1 },
          { id: 'q1-a3', text: 'More than half the days', value: 2 },
          { id: 'q1-a4', text: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'q2',
        text: 'Over the past 2 weeks, how often have you had little interest or pleasure in doing things?',
        type: 'multiple-choice',
        options: [
          { id: 'q2-a1', text: 'Not at all', value: 0 },
          { id: 'q2-a2', text: 'Several days', value: 1 },
          { id: 'q2-a3', text: 'More than half the days', value: 2 },
          { id: 'q2-a4', text: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'q3',
        text: 'How would you rate your sleep quality overall?',
        type: 'slider',
        minValue: 0,
        maxValue: 10,
      },
      {
        id: 'q4',
        text: 'Over the past 2 weeks, how often have you felt tired or had little energy?',
        type: 'multiple-choice',
        options: [
          { id: 'q4-a1', text: 'Not at all', value: 0 },
          { id: 'q4-a2', text: 'Several days', value: 1 },
          { id: 'q4-a3', text: 'More than half the days', value: 2 },
          { id: 'q4-a4', text: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'q5',
        text: 'How often do you feel overwhelmed by worries or anxious thoughts?',
        type: 'multiple-choice',
        options: [
          { id: 'q5-a1', text: 'Never or rarely', value: 0 },
          { id: 'q5-a2', text: 'Sometimes', value: 1 },
          { id: 'q5-a3', text: 'Often', value: 2 },
          { id: 'q5-a4', text: 'Nearly all the time', value: 3 },
        ],
      },
      {
        id: 'q6',
        text: 'Is there anything specific that has been affecting your mental health recently?',
        type: 'text',
      },
      {
        id: 'q7',
        text: 'On a scale of 0-10, how would you rate your overall stress level right now?',
        type: 'slider',
        minValue: 0,
        maxValue: 10,
      },
      {
        id: 'q8',
        text: 'How often do you engage in activities specifically to support your mental wellbeing?',
        type: 'multiple-choice',
        options: [
          { id: 'q8-a1', text: 'Never', value: 0 },
          { id: 'q8-a2', text: 'Rarely (once a month or less)', value: 1 },
          { id: 'q8-a3', text: 'Sometimes (a few times a month)', value: 2 },
          { id: 'q8-a4', text: 'Often (weekly)', value: 3 },
          { id: 'q8-a5', text: 'Daily or almost daily', value: 4 },
        ],
      },
    ],
  },
  {
    _id: 'anxiety-1',
    title: 'Anxiety Screening',
    description:
      'Assess your anxiety levels and identify potential anxiety-related concerns.',
    type: 'anxiety',
    totalQuestions: 7,
    estimatedTimeMinutes: 4,
    createdAt: '2023-01-02',
    questions: [
      {
        id: 'anx-q1',
        text: 'How often do you feel nervous, anxious, or on edge?',
        type: 'multiple-choice',
        options: [
          { id: 'anx-q1-a1', text: 'Not at all', value: 0 },
          { id: 'anx-q1-a2', text: 'Several days', value: 1 },
          { id: 'anx-q1-a3', text: 'More than half the days', value: 2 },
          { id: 'anx-q1-a4', text: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'anx-q2',
        text: 'How often do you have trouble relaxing?',
        type: 'multiple-choice',
        options: [
          { id: 'anx-q2-a1', text: 'Not at all', value: 0 },
          { id: 'anx-q2-a2', text: 'Several days', value: 1 },
          { id: 'anx-q2-a3', text: 'More than half the days', value: 2 },
          { id: 'anx-q2-a4', text: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'anx-q3',
        text: 'How often do you worry too much about different things?',
        type: 'multiple-choice',
        options: [
          { id: 'anx-q3-a1', text: 'Not at all', value: 0 },
          { id: 'anx-q3-a2', text: 'Several days', value: 1 },
          { id: 'anx-q3-a3', text: 'More than half the days', value: 2 },
          { id: 'anx-q3-a4', text: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'anx-q4',
        text: 'On a scale from 0-10, how would you rate your current anxiety level?',
        type: 'slider',
        minValue: 0,
        maxValue: 10,
      },
      {
        id: 'anx-q5',
        text: 'How often do you find yourself avoiding situations due to anxiety?',
        type: 'multiple-choice',
        options: [
          { id: 'anx-q5-a1', text: 'Never', value: 0 },
          { id: 'anx-q5-a2', text: 'Rarely', value: 1 },
          { id: 'anx-q5-a3', text: 'Sometimes', value: 2 },
          { id: 'anx-q5-a4', text: 'Often', value: 3 },
          { id: 'anx-q5-a5', text: 'Always', value: 4 },
        ],
      },
      {
        id: 'anx-q6',
        text: 'How often do you experience physical symptoms of anxiety (racing heart, sweating, etc.)?',
        type: 'multiple-choice',
        options: [
          { id: 'anx-q6-a1', text: 'Never', value: 0 },
          { id: 'anx-q6-a2', text: 'Rarely', value: 1 },
          { id: 'anx-q6-a3', text: 'Sometimes', value: 2 },
          { id: 'anx-q6-a4', text: 'Often', value: 3 },
          { id: 'anx-q6-a5', text: 'Always', value: 4 },
        ],
      },
      {
        id: 'anx-q7',
        text: 'What specific situations or thoughts trigger your anxiety most often?',
        type: 'text',
      },
    ],
  },
  {
    _id: 'depression-1',
    title: 'Depression Screening',
    description:
      'Evaluate symptoms of depression and determine if further assessment is needed.',
    type: 'depression',
    totalQuestions: 7,
    estimatedTimeMinutes: 4,
    createdAt: '2023-01-03',
    questions: [
      {
        id: 'dep-q1',
        text: 'How often have you felt little interest or pleasure in doing things?',
        type: 'multiple-choice',
        options: [
          { id: 'dep-q1-a1', text: 'Not at all', value: 0 },
          { id: 'dep-q1-a2', text: 'Several days', value: 1 },
          { id: 'dep-q1-a3', text: 'More than half the days', value: 2 },
          { id: 'dep-q1-a4', text: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'dep-q2',
        text: 'How often have you felt down, depressed, or hopeless?',
        type: 'multiple-choice',
        options: [
          { id: 'dep-q2-a1', text: 'Not at all', value: 0 },
          { id: 'dep-q2-a2', text: 'Several days', value: 1 },
          { id: 'dep-q2-a3', text: 'More than half the days', value: 2 },
          { id: 'dep-q2-a4', text: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'dep-q3',
        text: 'How often have you had trouble falling or staying asleep, or sleeping too much?',
        type: 'multiple-choice',
        options: [
          { id: 'dep-q3-a1', text: 'Not at all', value: 0 },
          { id: 'dep-q3-a2', text: 'Several days', value: 1 },
          { id: 'dep-q3-a3', text: 'More than half the days', value: 2 },
          { id: 'dep-q3-a4', text: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'dep-q4',
        text: 'How often have you felt tired or had little energy?',
        type: 'multiple-choice',
        options: [
          { id: 'dep-q4-a1', text: 'Not at all', value: 0 },
          { id: 'dep-q4-a2', text: 'Several days', value: 1 },
          { id: 'dep-q4-a3', text: 'More than half the days', value: 2 },
          { id: 'dep-q4-a4', text: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'dep-q5',
        text: 'How often have you felt bad about yourself or that you are a failure?',
        type: 'multiple-choice',
        options: [
          { id: 'dep-q5-a1', text: 'Not at all', value: 0 },
          { id: 'dep-q5-a2', text: 'Several days', value: 1 },
          { id: 'dep-q5-a3', text: 'More than half the days', value: 2 },
          { id: 'dep-q5-a4', text: 'Nearly every day', value: 3 },
        ],
      },
      {
        id: 'dep-q6',
        text: 'On a scale of 0-10, how would you rate your current mood?',
        type: 'slider',
        minValue: 0,
        maxValue: 10,
      },
      {
        id: 'dep-q7',
        text: 'Is there anything specific that has been affecting your mood recently?',
        type: 'text',
      },
    ],
  },
];

export default function AssessmentList() {
  const router = useRouter();

  // State
  const [assessments, setAssessments] = useState(HARDCODED_ASSESSMENTS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedAssessment, setSelectedAssessment] = useState<
    (typeof HARDCODED_ASSESSMENTS)[0] | null
  >(null);
  const [currentView, setCurrentView] = useState('list'); // list, questions, results
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Filter assessments based on search and filter
  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch =
      searchTerm === '' ||
      assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === 'all' || assessment.type === filterType;

    return matchesSearch && matchesFilter;
  });

  // Handle search
  const handleSearch = e => {
    e.preventDefault();
    // Search is handled by the filteredAssessments
  };

  // Handle filter change
  const handleFilterChange = value => {
    setFilterType(value);
  };

  // Start an assessment
  const handleStartAssessment = assessment => {
    setSelectedAssessment(assessment);
    setCurrentView('questions');
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  // Format assessment type for display
  const formatAssessmentType = type => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get assessment type badge color
  const getAssessmentTypeColor = type => {
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

  // Calculate progress through current assessment
  const calculateProgress = () => {
    if (!selectedAssessment) return 0;
    return Math.round(
      (Object.keys(answers).length / selectedAssessment.questions.length) * 100
    );
  };

  // Handle selecting an answer for multiple choice questions
  const handleSelectOption = (questionId, optionId) => {
    setAnswers({ ...answers, [questionId]: optionId });
  };

  // Handle slider value change
  const handleSliderChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  // Handle text input change
  const handleTextChange = (questionId, text) => {
    setAnswers({ ...answers, [questionId]: text });
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (!selectedAssessment) return;
    if (currentQuestionIndex < selectedAssessment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitAssessment();
    }
  };

  // Handle previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Handle submit assessment
  const handleSubmitAssessment = () => {
    setSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setCurrentView('results');
      toast.success('Assessment completed successfully!');
    }, 1000);
  };

  // Handle retake assessment
  const handleRetakeAssessment = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setCurrentView('questions');
  };

  // Return to list view
  const handleBackToList = () => {
    setSelectedAssessment(null);
    setCurrentView('list');
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  // Calculate score for results
  const calculateScore = () => {
    if (!selectedAssessment) return { score: 0, maxScore: 0, percentage: 0 };

    let totalPoints = 0;
    let maxPoints = 0;

    selectedAssessment.questions.forEach(question => {
      if (question.type !== 'text' && question.options) {
        const answer = answers[question.id];
        if (answer) {
          const option = question.options.find(opt => opt.id === answer);
          if (option) {
            totalPoints += option.value;
          }
        }

        // Add maximum for this question
        if (question.options.length > 0) {
          maxPoints += Math.max(...question.options.map(opt => opt.value));
        }
      }

      if (question.type === 'slider') {
        const value = parseInt(answers[question.id] || 0);
        totalPoints += value;
        maxPoints += question.maxValue || 10;
      }
    });

    const percentage = Math.round((totalPoints / Math.max(1, maxPoints)) * 100);

    let severity = '';
    let feedback = '';

    if (percentage <= 25) {
      severity = 'Low';
      feedback =
        'Your results suggest low levels of distress. Continue with healthy habits.';
    } else if (percentage <= 50) {
      severity = 'Mild';
      feedback =
        'Your results suggest mild levels of distress. Consider adding more self-care.';
    } else if (percentage <= 75) {
      severity = 'Moderate';
      feedback =
        'Your results suggest moderate levels of distress. Consider speaking with a professional.';
    } else {
      severity = 'High';
      feedback =
        'Your results suggest high levels of distress. We recommend speaking with a mental health professional.';
    }

    return {
      score: totalPoints,
      maxScore: maxPoints,
      percentage,
      severity,
      feedback,
    };
  };

  // Get score color based on percentage
  const getScoreColor = percentage => {
    if (percentage <= 25) return 'text-green-500';
    if (percentage <= 50) return 'text-blue-500';
    if (percentage <= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Render the current question
  const renderQuestionContent = () => {
    if (!selectedAssessment) return null;
    const currentQuestion = selectedAssessment.questions[currentQuestionIndex];
    if (!currentQuestion) return null;

    if (currentQuestion.type === 'slider') {
      const value =
        answers[currentQuestion.id] !== undefined
          ? answers[currentQuestion.id]
          : currentQuestion.minValue || 0;

      return (
        <div className="mb-8">
          <input
            type="range"
            min={currentQuestion.minValue || 0}
            max={currentQuestion.maxValue || 10}
            step={1}
            value={value}
            onChange={e =>
              handleSliderChange(currentQuestion.id, parseInt(e.target.value))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />

          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{currentQuestion.minValue || 0}</span>
            <span>{currentQuestion.maxValue || 10}</span>
          </div>

          <div className="text-center mt-4">
            <span className="text-2xl font-bold">{value}</span>
          </div>
        </div>
      );
    }

    if (currentQuestion.type === 'text') {
      return (
        <textarea
          rows={4}
          placeholder="Type your answer here..."
          value={answers[currentQuestion.id] || ''}
          onChange={e => handleTextChange(currentQuestion.id, e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-8"
        />
      );
    }

    // Default: multiple choice
    return (
      <div className="space-y-3 mb-8">
        {currentQuestion.options?.map(option => {
          const isSelected = answers[currentQuestion.id] === option.id;

          return (
            <div
              key={option.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50 border-blue-300'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
              onClick={() => handleSelectOption(currentQuestion.id, option.id)}
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
    );
  };

  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    if (!selectedAssessment) return false;

    const currentQuestion = selectedAssessment.questions[currentQuestionIndex];
    if (!currentQuestion) return false;

    // Text questions are optional
    if (currentQuestion.type === 'text') return true;

    return answers[currentQuestion.id] !== undefined;
  };

  // RENDER VIEWS

  // QUESTIONS VIEW
  if (currentView === 'questions' && selectedAssessment) {
    const currentQuestion = selectedAssessment.questions[currentQuestionIndex];

    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{selectedAssessment.title}</h1>
              <p className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of{' '}
                {selectedAssessment.questions.length}
              </p>
            </div>
            <Badge className={getAssessmentTypeColor(selectedAssessment.type)}>
              {formatAssessmentType(selectedAssessment.type)}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <Progress value={calculateProgress()} className="h-full" />
          </div>

          <Card className="p-6">
            {/* Question */}
            <h2 className="text-xl font-semibold mb-6">
              {currentQuestion.text}
            </h2>

            {/* Answer options */}
            {renderQuestionContent()}

            {/* Navigation buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBackToList}
                className="mr-auto"
              >
                Back to List
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>

                <Button
                  onClick={handleNextQuestion}
                  disabled={
                    !isCurrentQuestionAnswered() ||
                    (currentQuestionIndex ===
                      selectedAssessment.questions.length - 1 &&
                      submitting)
                  }
                >
                  {currentQuestionIndex <
                  selectedAssessment.questions.length - 1 ? (
                    <>
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : submitting ? (
                    <>
                      Submitting...{' '}
                      <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      Complete Assessment{' '}
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // RESULTS VIEW
  if (currentView === 'results' && selectedAssessment) {
    const result = calculateScore();

    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Assessment Results</h1>
              <p className="text-sm text-gray-500">
                {selectedAssessment.title}
              </p>
            </div>
            <Badge className={getAssessmentTypeColor(selectedAssessment.type)}>
              {formatAssessmentType(selectedAssessment.type)}
            </Badge>
          </div>

          <Card className="p-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Your Assessment Score</h2>
              <div
                className={`text-5xl font-bold mt-6 mb-2 ${getScoreColor(result.percentage)}`}
              >
                {result.percentage}%
              </div>
              <Badge className="mb-2">{result.severity}</Badge>
              <p className="text-sm text-gray-500">
                Score: {result.score} out of {result.maxScore}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-800 mb-2">Feedback:</h3>
              <p className="text-blue-700">{result.feedback}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-3">Recommendations:</h3>
              <ul className="space-y-2 pl-5 list-disc">
                <li>Practice mindfulness meditation for 10 minutes daily</li>
                <li>Ensure you're getting 7-8 hours of sleep each night</li>
                <li>
                  Stay physically active with at least 30 minutes of exercise
                  daily
                </li>
                <li>Connect with friends and family regularly</li>
                {result.percentage > 50 && (
                  <li>Consider speaking with a mental health professional</li>
                )}
              </ul>
            </div>

            <div className="flex gap-4 flex-col sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleBackToList}
              >
                Back to List
              </Button>

              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRetakeAssessment}
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

            <p className="text-xs text-gray-500 text-center mt-6">
              This assessment is for informational purposes only and does not
              constitute medical advice or a diagnosis.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // LIST VIEW (default)
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mental Health Assessments</h1>
            <p className="text-sm text-gray-500">
              Take self-assessments to better understand your mental wellbeing
            </p>
          </div>
          <div className="p-2 rounded-full bg-blue-100">
            <Brain className="h-6 w-6 text-blue-500" />
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search assessments..."
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={filterType} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="mental-health">Mental Health</SelectItem>
                <SelectItem value="anxiety">Anxiety</SelectItem>
                <SelectItem value="depression">Depression</SelectItem>
                <SelectItem value="stress">Stress</SelectItem>
                <SelectItem value="wellbeing">Wellbeing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* History button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => router.push('/assessments/history')}
          >
            <ClipboardCheck className="mr-2 h-4 w-4" />
            View Your Assessment History
          </Button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((_, index) => (
              <Card key={index} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredAssessments.length === 0 && (
          <Card className="p-6 text-center">
            <div className="text-blue-500 mb-4">
              <ClipboardCheck className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Assessments Found</h3>
            <p className="text-gray-600 mb-4">
              {filterType !== 'all'
                ? `No ${formatAssessmentType(filterType)} assessments are currently available.`
                : 'No assessments match your search criteria.'}
            </p>
            {filterType !== 'all' && (
              <Button onClick={() => setFilterType('all')}>
                View All Assessments
              </Button>
            )}
          </Card>
        )}

        {/* Assessment grid */}
        {!loading && filteredAssessments.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAssessments.map(assessment => (
              <Card
                key={assessment._id}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium">{assessment.title}</h3>
                  <Badge className={getAssessmentTypeColor(assessment.type)}>
                    {formatAssessmentType(assessment.type)}
                  </Badge>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {assessment.description}
                </p>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <div className="flex items-center mr-4">
                    <ClipboardCheck className="h-4 w-4 mr-1" />
                    <span>{assessment.totalQuestions} questions</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{assessment.estimatedTimeMinutes} min</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleStartAssessment(assessment)}
                >
                  Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Info section */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold text-blue-800 mb-4">
            About Mental Health Assessments
          </h2>
          <div className="space-y-3 text-blue-700">
            <p>
              These self-assessment questionnaires are designed to help you
              better understand your mental health and wellbeing.
            </p>
            <p>
              Your responses are confidential and stored securely. The results
              can help you track your mental health over time and identify areas
              where you might benefit from additional support.
            </p>
            <p className="text-sm text-blue-600 italic">
              Note: These assessments are for informational purposes only and do
              not constitute a medical diagnosis. Please consult with a
              healthcare professional for clinical advice.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
