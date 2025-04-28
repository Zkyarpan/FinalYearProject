'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  Calendar,
  ChevronRight,
  RefreshCw,
  Brain,
  BarChart,
  Clock,
  Search,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';


// Define assessment result type
interface AssessmentResult {
  _id: string;
  assessmentType: string;
  totalScore: number;
  maxPossible: number;
  percentage: number;
  severity: string;
  feedback: string;
  recommendations?: string;
  completedAt: string;
  assessmentTitle?: string; // This might be added by the API
}

export default function AssessmentHistory() {
  const router = useRouter();

  // State
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  });

  // Fetch assessment history
  useEffect(() => {
    fetchAssessmentHistory();
  }, [pagination.page, filter]);

  const fetchAssessmentHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      let queryString = `page=${pagination.page}&limit=${pagination.limit}`;

      if (filter !== 'all') {
        queryString += `&type=${filter}`;
      }

      const response = await fetch(`/api/assessments/history?${queryString}`);

      if (!response.ok) {
        throw new Error('Failed to fetch assessment history');
      }

      const data = await response.json();

      if (data.success) {
        setAssessments(data.assessments || []);
        setPagination(
          data.pagination || {
            page: 1,
            limit: 5,
            total: 0,
            totalPages: 1,
          }
        );
      } else {
        throw new Error(data.message || 'Failed to fetch assessment history');
      }
    } catch (err: any) {
      console.error('Error fetching assessment history:', err);
      setError(
        err.message ||
          'An error occurred while fetching your assessment history'
      );

      toast.error(err.message || 'Failed to load assessment history');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Minimal':
        return 'bg-green-100 text-green-800';
      case 'Mild':
        return 'bg-blue-100 text-blue-800';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Moderately Severe':
        return 'bg-orange-100 text-orange-800';
      case 'Severe':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // View assessment details
  const viewAssessmentDetails = (id: string) => {
    router.push(`/assessments/results/${id}`);
  };

  // Calculate average score from all assessments
  const calculateAverageScore = () => {
    if (assessments.length === 0) return 0;

    const sum = assessments.reduce(
      (total, assessment) => total + assessment.percentage,
      0
    );
    return Math.round(sum / assessments.length);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Assessment History</h1>
            <p className="text-sm text-gray-500">
              View and track your mental health assessments over time
            </p>
          </div>
          <div className="p-2 rounded-full bg-blue-100">
            <ClipboardCheck className="h-6 w-6 text-blue-500" />
          </div>
        </div>

        {/* Filters and New Assessment button */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={filter} onValueChange={handleFilterChange}>
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

          <Button onClick={() => router.push('/assessments')}>
            <Brain className="mr-2 h-4 w-4" /> Take New Assessment
          </Button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="mt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full mt-2" />
                </div>
                <div className="mt-4 flex justify-end">
                  <Skeleton className="h-9 w-28 rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <Card className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              Error Loading Assessment History
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchAssessmentHistory}>
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && assessments.length === 0 && (
          <Card className="p-6 text-center">
            <div className="text-blue-500 mb-4">
              <ClipboardCheck className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Assessment History</h3>
            <p className="text-gray-600 mb-4">
              {filter !== 'all'
                ? `You haven't taken any ${formatAssessmentType(filter)} assessments yet.`
                : "You haven't taken any assessments yet. Regular assessments can help you track your mental health over time."}
            </p>
            <Button onClick={() => router.push('/assessments')}>
              Take Your First Assessment
            </Button>
          </Card>
        )}

        {/* Assessment list */}
        {!loading && !error && assessments.length > 0 && (
          <>
            <div className="space-y-4">
              {assessments.map(assessment => (
                <Card
                  key={assessment._id}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row justify-between">
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium">
                          {assessment.assessmentTitle ||
                            formatAssessmentType(
                              assessment.assessmentType
                            )}{' '}
                          Assessment
                        </h3>
                        <Badge
                          className={`ml-2 ${getAssessmentTypeColor(assessment.assessmentType)}`}
                        >
                          {formatAssessmentType(assessment.assessmentType)}
                        </Badge>
                      </div>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDate(assessment.completedAt)}</span>
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-0 flex items-center">
                      <span className="text-lg font-medium mr-2">
                        {assessment.percentage}%
                      </span>
                      <Badge className={getSeverityColor(assessment.severity)}>
                        {assessment.severity}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-700 line-clamp-2">
                    <p>{assessment.feedback}</p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewAssessmentDetails(assessment._id)}
                    >
                      View Details <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  )
                    .filter(
                      page =>
                        page === 1 ||
                        page === pagination.totalPages ||
                        Math.abs(page - pagination.page) <= 1
                    )
                    .map((page, index, array) => (
                      <>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span key={`ellipsis-${page}`} className="px-2">
                            ...
                          </span>
                        )}
                        <Button
                          key={page}
                          variant={
                            page === pagination.page ? 'default' : 'outline'
                          }
                          size="sm"
                          className="w-9 h-9 p-0"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      </>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Statistics card */}
        {!loading && !error && assessments.length > 0 && (
          <Card className="p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-blue-500" />
              Assessment Insights
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-1">
                  <ClipboardCheck className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="font-medium">Total Assessments</h3>
                </div>
                <p className="text-2xl font-bold">{pagination.total}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-1">
                  <BarChart className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="font-medium">Average Score</h3>
                </div>
                <p className="text-2xl font-bold">{calculateAverageScore()}%</p>
                <p className="text-sm text-gray-500">Across all assessments</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-1">
                  <Clock className="h-5 w-5 text-purple-500 mr-2" />
                  <h3 className="font-medium">Last Assessment</h3>
                </div>
                <p className="text-lg font-medium truncate">
                  {assessments[0]?.assessmentTitle ||
                    formatAssessmentType(assessments[0]?.assessmentType)}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(assessments[0]?.completedAt)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Regular assessments help you track changes in your mental
                wellbeing over time. Consider taking assessments every 2-4 weeks
                for the most accurate tracking.
              </p>
            </div>
          </Card>
        )}

        {/* Disclaimer */}
        <div className="text-center text-xs text-gray-500 mt-6">
          <p>
            Assessment results are stored securely in your account and are only
            accessible to you and healthcare professionals you explicitly grant
            access to.
          </p>
        </div>
      </div>
    </div>
  );
}
