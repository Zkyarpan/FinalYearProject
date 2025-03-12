'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import SpinnerLoader from '@/components/SpinnerLoader';

// Define types for psychologist data
interface Education {
  degree: string;
  university: string;
  graduationYear: number | string;
}

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface Psychologist {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  licenseType: string;
  licenseNumber: string;
  city: string;
  country: string;
  streetAddress: string;
  yearsOfExperience: number;
  languages: string[];
  sessionFee: number;
  sessionFormats: string[];
  ageGroups: string[];
  education: Education[];
  specializations: string[];
  about: string;
  profilePhotoUrl?: string;
  certificateOrLicenseUrl?: string;
  approvalStatus: ApprovalStatus;
  adminFeedback?: string;
}

const PsychologistPage = () => {
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState<boolean>(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState<boolean>(false);
  const [selectedPsychologist, setSelectedPsychologist] =
    useState<Psychologist | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('pending');

  useEffect(() => {
    fetchPsychologists();
  }, [activeTab]);

  const fetchPsychologists = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/psychologists?status=${activeTab}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch psychologists');
      }
      const data = await response.json();
      setPsychologists(data.Result);
    } catch (error) {
      console.error('Error fetching psychologists:', error);
      toast.error('Failed to load psychologists');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (): Promise<void> => {
    if (!selectedPsychologist) return;

    try {
      const response = await fetch(
        `/api/admin/psychologists/${selectedPsychologist._id}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve psychologist');
      }

      toast.success(
        `Dr. ${selectedPsychologist.firstName} ${selectedPsychologist.lastName} has been approved`
      );
      setApproveDialogOpen(false);
      fetchPsychologists();
    } catch (error) {
      console.error('Error approving psychologist:', error);
      toast.error('Failed to approve psychologist');
    }
  };

  const handleReject = async (): Promise<void> => {
    if (!selectedPsychologist) return;

    try {
      if (!rejectionFeedback.trim()) {
        toast.error('Please provide feedback for rejection');
        return;
      }

      const response = await fetch(
        `/api/admin/psychologists/${selectedPsychologist._id}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ feedback: rejectionFeedback }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reject psychologist');
      }

      toast.success(
        `Dr. ${selectedPsychologist.firstName} ${selectedPsychologist.lastName} has been rejected`
      );
      setRejectDialogOpen(false);
      setRejectionFeedback('');
      fetchPsychologists();
    } catch (error) {
      console.error('Error rejecting psychologist:', error);
      toast.error('Failed to reject psychologist');
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
          >
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          >
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
          >
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const openDetails = (psychologist: Psychologist): void => {
    setSelectedPsychologist(psychologist);
    setDetailsOpen(true);
  };

  const openApproveDialog = (psychologist: Psychologist): void => {
    setSelectedPsychologist(psychologist);
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (psychologist: Psychologist): void => {
    setSelectedPsychologist(psychologist);
    setRejectDialogOpen(true);
  };

  if (loading) {
    return <SpinnerLoader isLoading={loading} />;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Manage Psychologists</h1>

      <Tabs
        defaultValue="pending"
        className="w-full mb-6"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'rejected'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {psychologists.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  No {tab} psychologists found
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {psychologists.map(psych => (
                  <Card key={psych._id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">
                          {psych.fullName ||
                            `Dr. ${psych.firstName} ${psych.lastName}`}
                        </CardTitle>
                        {getStatusBadge(psych.approvalStatus)}
                      </div>
                      <CardDescription>
                        {psych.licenseType.replace(/_/g, ' ')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-semibold">Email:</span>{' '}
                          {psych.email}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">License:</span>{' '}
                          {psych.licenseNumber}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Location:</span>{' '}
                          {psych.city}, {psych.country}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Experience:</span>{' '}
                          {psych.yearsOfExperience} years
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetails(psych)}
                      >
                        <Eye className="mr-1 h-4 w-4" /> Details
                      </Button>
                      <div className="space-x-2">
                        {tab === 'pending' && (
                          <>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openRejectDialog(psych)}
                            >
                              <XCircle className="mr-1 h-4 w-4" /> Reject
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openApproveDialog(psych)}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" /> Approve
                            </Button>
                          </>
                        )}
                        {tab === 'rejected' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openApproveDialog(psych)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" /> Approve
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Psychologist Details Dialog */}
      {selectedPsychologist && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPsychologist.fullName ||
                  `Dr. ${selectedPsychologist.firstName} ${selectedPsychologist.lastName}`}
                <span className="ml-3">
                  {getStatusBadge(selectedPsychologist.approvalStatus)}
                </span>
              </DialogTitle>
              <DialogDescription>
                {selectedPsychologist.licenseType.replace(/_/g, ' ')} • License:{' '}
                {selectedPsychologist.licenseNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div>
                <h3 className="font-semibold mb-2">Personal Information</h3>
                <div className="space-y-1">
                  <p>
                    <span className="font-medium">Email:</span>{' '}
                    {selectedPsychologist.email}
                  </p>
                  <p>
                    <span className="font-medium">Location:</span>{' '}
                    {selectedPsychologist.streetAddress},{' '}
                    {selectedPsychologist.city}, {selectedPsychologist.country}
                  </p>
                </div>

                <h3 className="font-semibold mt-4 mb-2">
                  Professional Details
                </h3>
                <div className="space-y-1">
                  <p>
                    <span className="font-medium">Experience:</span>{' '}
                    {selectedPsychologist.yearsOfExperience} years
                  </p>
                  <p>
                    <span className="font-medium">Languages:</span>{' '}
                    {selectedPsychologist.languages.join(', ')}
                  </p>
                  <p>
                    <span className="font-medium">Session Fee:</span> $
                    {selectedPsychologist.sessionFee}/hour
                  </p>
                  <p>
                    <span className="font-medium">Formats:</span>{' '}
                    {selectedPsychologist.sessionFormats.join(', ')}
                  </p>
                  <p>
                    <span className="font-medium">Age Groups:</span>{' '}
                    {selectedPsychologist.ageGroups.join(', ')}
                  </p>
                </div>

                <h3 className="font-semibold mt-4 mb-2">Education</h3>
                <div className="space-y-2">
                  {selectedPsychologist.education.map((edu, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="font-medium">{edu.degree}</p>
                      <p>
                        {edu.university}, {edu.graduationYear}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Specializations</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedPsychologist.specializations.map((spec, idx) => (
                    <Badge key={idx} variant="secondary">
                      {spec.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>

                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm">{selectedPsychologist.about}</p>

                <div className="mt-4 space-y-2">
                  <h3 className="font-semibold">Verification Documents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedPsychologist.profilePhotoUrl && (
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Profile Photo
                        </p>
                        <a
                          href={selectedPsychologist.profilePhotoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Profile Photo
                        </a>
                      </div>
                    )}
                    {selectedPsychologist.certificateOrLicenseUrl && (
                      <div>
                        <p className="text-sm font-medium mb-1">
                          License/Certificate
                        </p>
                        <a
                          href={selectedPsychologist.certificateOrLicenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View License/Certificate
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPsychologist.adminFeedback && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" /> Rejection
                      Feedback
                    </h3>
                    <p className="text-sm mt-1">
                      {selectedPsychologist.adminFeedback}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>

              {selectedPsychologist.approvalStatus === 'pending' && (
                <div className="space-x-2">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDetailsOpen(false);
                      openRejectDialog(selectedPsychologist);
                    }}
                  >
                    <XCircle className="mr-1 h-4 w-4" /> Reject
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      setDetailsOpen(false);
                      openApproveDialog(selectedPsychologist);
                    }}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" /> Approve
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approve Confirmation Dialog */}
      {selectedPsychologist && (
        <AlertDialog
          open={approveDialogOpen}
          onOpenChange={setApproveDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Psychologist</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to approve{' '}
                {selectedPsychologist.fullName ||
                  `Dr. ${selectedPsychologist.firstName} ${selectedPsychologist.lastName}`}
                ? This will allow them to access the platform and be visible to
                clients.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApprove}>
                Approve
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Reject Dialog */}
      {selectedPsychologist && (
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Psychologist</DialogTitle>
              <DialogDescription>
                Please provide feedback on why the application was rejected.
                This will be shared with {selectedPsychologist.firstName}{' '}
                {selectedPsychologist.lastName}.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Please provide specific feedback on why the application was rejected..."
              value={rejectionFeedback}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setRejectionFeedback(e.target.value)
              }
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Reject Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PsychologistPage;
