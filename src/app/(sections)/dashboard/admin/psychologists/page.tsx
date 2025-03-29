'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import Loader from '@/components/common/Loader';

// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

// Define TypeScript interfaces
interface Education {
  degree: string;
  university: string;
  graduationYear: number;
  _id?: string;
}

interface AvailabilitySlot {
  id: string;
  startTime: string;
  originalStartTime: string;
  endTime: string;
  originalEndTime: string;
  date: string;
  duration: number;
  timePeriods: string[];
  isBooked?: boolean;
}

interface AvailabilityDay {
  available: boolean;
  startTime?: string;
  endTime?: string;
  slots?: AvailabilitySlot[];
}

interface Availability {
  monday: AvailabilityDay;
  tuesday: AvailabilityDay;
  wednesday: AvailabilityDay;
  thursday: AvailabilityDay;
  friday: AvailabilityDay;
  saturday: AvailabilityDay;
  sunday: AvailabilityDay;
}

interface Psychologist {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  country: string;
  city: string;
  streetAddress: string;
  about: string;

  role: 'admin' | 'psychologist' | 'user';
  licenseNumber: string;
  licenseType: string;

  profilePhotoUrl?: string;
  certificateOrLicenseUrl?: string;
  isVerified: boolean;

  approvalStatus: 'pending' | 'approved' | 'rejected';
  adminFeedback?: string;
  approvedAt?: string;
  rejectedAt?: string;

  education: Education[];
  specializations: string[];
  yearsOfExperience: number;
  languages: string[];

  sessionDuration: string;
  sessionFee: number;
  sessionFormats: string[];

  acceptsInsurance: boolean;
  insuranceProviders?: string[];
  acceptingNewClients: boolean;
  ageGroups: string[];

  availability?: Availability;

  createdAt: string;
  updatedAt: string;
}

type StatusType = 'pending' | 'approved' | 'rejected' | 'all';

export default function ManagePsychologists(): JSX.Element {
  const [activeTab, setActiveTab] = useState<StatusType>('pending');
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedPsychologist, setSelectedPsychologist] =
    useState<Psychologist | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Function to fetch psychologists based on status
  const fetchPsychologists = async (status: StatusType): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/psychologists?status=${status}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        console.error(
          `API Error (${response.status}): Failed to fetch psychologists`
        );
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
        throw new Error(`Failed to fetch psychologists (${response.status})`);
      }

      const data = await response.json();
      setPsychologists(data.Result || []);
    } catch (error) {
      console.error('Error fetching psychologists:', error);
      toast.error('Failed to load psychologists. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string): void => {
    setActiveTab(value as StatusType);
    fetchPsychologists(value as StatusType);
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchPsychologists(activeTab);
  }, []);

  // Fetch psychologist details
  const fetchPsychologistDetails = async (id: string): Promise<void> => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/admin/psychologists/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `API Error (${response.status}): Failed to fetch psychologist details`
        );
        console.error(`Error details: ${errorText}`);
        throw new Error(
          `Failed to fetch psychologist details (${response.status})`
        );
      }

      const data = await response.json();
      setSelectedPsychologist(data.Result);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching psychologist details:', error);
      toast.error('Failed to load psychologist details. Please try again.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle viewing details - opens dialog
  const handleViewDetails = (id: string): void => {
    fetchPsychologistDetails(id);
  };

  // Format date string
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle approve/reject actions
  const handleStatusChange = async (
    id: string,
    newStatus: 'approved' | 'rejected'
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/psychologists/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `API Error (${response.status}): Failed to update psychologist status`
        );
        console.error(`Error details: ${errorText}`);
        throw new Error(
          `Failed to ${newStatus} psychologist (${response.status})`
        );
      }

      const data = await response.json();
      toast.success(
        data.Result?.message || `Psychologist ${newStatus} successfully`
      );

      // Refresh the current tab data
      fetchPsychologists(activeTab);

      // If the dialog is open, update the psychologist status
      if (
        isDialogOpen &&
        selectedPsychologist &&
        selectedPsychologist._id === id
      ) {
        setSelectedPsychologist({
          ...selectedPsychologist,
          approvalStatus: newStatus,
          approvedAt:
            newStatus === 'approved'
              ? new Date().toISOString()
              : selectedPsychologist.approvedAt,
          rejectedAt:
            newStatus === 'rejected'
              ? new Date().toISOString()
              : selectedPsychologist.rejectedAt,
        });
      }
    } catch (error) {
      console.error(`Error ${newStatus} psychologist:`, error);
      toast.error(`Failed to ${newStatus} psychologist. Please try again.`);
    }
  };

  // Format license type for display
  const formatLicenseType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Manage Psychologists</h1>

      <Tabs
        defaultValue="pending"
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        {/* TabsContent that updates based on the active tab */}
        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader />
            </div>
          ) : psychologists.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              No {activeTab} psychologists found
            </div>
          ) : (
            psychologists.map(psychologist => (
              <Card key={psychologist._id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {psychologist.fullName ||
                            `${psychologist.firstName} ${psychologist.lastName}`}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            psychologist.approvalStatus === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : psychologist.approvalStatus === 'rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}
                        >
                          {psychologist.approvalStatus.charAt(0).toUpperCase() +
                            psychologist.approvalStatus.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatLicenseType(psychologist.licenseType) ||
                          'Psychologist'}
                      </p>
                      <div className="mt-4 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Email:</span>{' '}
                          {psychologist.email}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">License:</span>{' '}
                          {psychologist.licenseNumber}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Location:</span>{' '}
                          {psychologist.city}, {psychologist.country}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Experience:</span>{' '}
                          {psychologist.yearsOfExperience} years
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(psychologist._id)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> Details
                      </Button>

                      {/* Show approve button for pending or rejected psychologists */}
                      {(activeTab === 'pending' ||
                        activeTab === 'rejected') && (
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() =>
                            handleStatusChange(psychologist._id, 'approved')
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      )}

                      {/* Show reject button for pending or approved psychologists */}
                      {(activeTab === 'pending' ||
                        activeTab === 'approved') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleStatusChange(psychologist._id, 'rejected')
                          }
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Psychologist Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex justify-between items-center">
              <span>Psychologist Details</span>
            </DialogTitle>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex justify-center items-center p-12">
              <Loader />
            </div>
          ) : selectedPsychologist ? (
            <div className="space-y-6">
              {/* Header Section with Profile Image and Basic Info */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden">
                    {selectedPsychologist.profilePhotoUrl ? (
                      <img
                        src={selectedPsychologist.profilePhotoUrl}
                        alt={selectedPsychologist.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No Image
                      </div>
                    )}
                  </div>
                </div>

                {/* Basic Info */}
                <div className="flex-grow space-y-3">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      {selectedPsychologist.fullName ||
                        `${selectedPsychologist.firstName} ${selectedPsychologist.lastName}`}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          selectedPsychologist.approvalStatus === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : selectedPsychologist.approvalStatus === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}
                      >
                        {selectedPsychologist.approvalStatus
                          .charAt(0)
                          .toUpperCase() +
                          selectedPsychologist.approvalStatus.slice(1)}
                      </span>
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {formatLicenseType(selectedPsychologist.licenseType)}
                      {selectedPsychologist.isVerified && (
                        <span className="ml-2 text-green-600">• Verified</span>
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <p className="text-sm">
                      <span className="font-medium">Email:</span>{' '}
                      {selectedPsychologist.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">License #:</span>{' '}
                      {selectedPsychologist.licenseNumber}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Location:</span>{' '}
                      {selectedPsychologist.city},{' '}
                      {selectedPsychologist.country}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Experience:</span>{' '}
                      {selectedPsychologist.yearsOfExperience} years
                    </p>
                  </div>
                </div>
              </div>

              {/* Two Columns Layout for Main Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-5">
                  {/* About Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">About</h3>
                    <p className="text-sm">{selectedPsychologist.about}</p>
                  </div>

                  {/* Education */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Education</h3>
                    {selectedPsychologist.education &&
                    selectedPsychologist.education.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {selectedPsychologist.education.map((edu, index) => (
                          <li key={index} className="text-sm">
                            {edu.degree} from {edu.university} (
                            {edu.graduationYear})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No education information available
                      </p>
                    )}
                  </div>

                  {/* Specializations */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Specializations
                    </h3>
                    {selectedPsychologist.specializations &&
                    selectedPsychologist.specializations.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedPsychologist.specializations.map(
                          (spec, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full"
                            >
                              {spec}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No specializations listed
                      </p>
                    )}
                  </div>

                  {/* Languages */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Languages</h3>
                    {selectedPsychologist.languages &&
                    selectedPsychologist.languages.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedPsychologist.languages.map((lang, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No languages listed
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  {/* Session Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Session Information
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Duration:</span>{' '}
                        {selectedPsychologist.sessionDuration} minutes
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Fee:</span> $
                        {selectedPsychologist.sessionFee}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Format:</span>{' '}
                        {selectedPsychologist.sessionFormats.join(', ')}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">
                          Accepting New Clients:
                        </span>{' '}
                        {selectedPsychologist.acceptingNewClients
                          ? 'Yes'
                          : 'No'}
                      </p>
                    </div>
                  </div>

                  {/* Insurance Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Insurance Information
                    </h3>
                    <p className="text-sm">
                      <span className="font-medium">Accepts Insurance:</span>{' '}
                      {selectedPsychologist.acceptsInsurance ? 'Yes' : 'No'}
                    </p>
                    {selectedPsychologist.acceptsInsurance &&
                      selectedPsychologist.insuranceProviders &&
                      selectedPsychologist.insuranceProviders.length > 0 && (
                        <div className="mt-1">
                          <p className="text-sm font-medium">
                            Accepted Providers:
                          </p>
                          <ul className="list-disc pl-5">
                            {selectedPsychologist.insuranceProviders.map(
                              (provider, index) => (
                                <li key={index} className="text-sm">
                                  {provider}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>

                  {/* Age Groups */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Age Groups</h3>
                    {selectedPsychologist.ageGroups &&
                    selectedPsychologist.ageGroups.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedPsychologist.ageGroups.map((age, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full"
                          >
                            {age.charAt(0).toUpperCase() + age.slice(1)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No age groups specified
                      </p>
                    )}
                  </div>

                  {/* Verification & Document */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Verification</h3>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Status:</span>{' '}
                        {selectedPsychologist.isVerified
                          ? 'Verified'
                          : 'Not Verified'}
                      </p>
                      {selectedPsychologist.certificateOrLicenseUrl && (
                        <div>
                          <p className="text-sm font-medium mb-1">
                            License Document:
                          </p>
                          <a
                            href={selectedPsychologist.certificateOrLicenseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Registration Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Registration Info
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Registered:</span>{' '}
                        {formatDate(selectedPsychologist.createdAt)}
                      </p>
                      {selectedPsychologist.approvalStatus === 'approved' &&
                        selectedPsychologist.approvedAt && (
                          <p className="text-sm">
                            <span className="font-medium">Approved:</span>{' '}
                            {formatDate(selectedPsychologist.approvedAt)}
                          </p>
                        )}
                      {selectedPsychologist.approvalStatus === 'rejected' &&
                        selectedPsychologist.rejectedAt && (
                          <p className="text-sm">
                            <span className="font-medium">Rejected:</span>{' '}
                            {formatDate(selectedPsychologist.rejectedAt)}
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Feedback Section */}
              {selectedPsychologist.adminFeedback && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">Admin Feedback</h3>
                  <p className="text-sm">
                    {selectedPsychologist.adminFeedback}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                {selectedPsychologist.approvalStatus !== 'approved' && (
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() =>
                      handleStatusChange(selectedPsychologist._id, 'approved')
                    }
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                  </Button>
                )}

                {selectedPsychologist.approvalStatus !== 'rejected' && (
                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleStatusChange(selectedPsychologist._id, 'rejected')
                    }
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </Button>
                )}

                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 text-muted-foreground">
              No psychologist details found
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
