'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Loader from '@/components/common/Loader';

// Define TypeScript interfaces
interface Psychologist {
  _id: string;
  title?: string;
  firstName: string;
  lastName: string;
  email: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  specialization?: string;
  licenseNumber?: string;
  location?: string;
  yearsOfExperience?: number;
  createdAt?: string;
}

type StatusType = 'pending' | 'approved' | 'rejected' | 'all';

export default function ManagePsychologists(): JSX.Element {
  const [activeTab, setActiveTab] = useState<StatusType>('pending');
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

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
        // Enhanced error logging
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

  // Handle approve/reject actions
  const handleStatusChange = async (
    id: string,
    newStatus: 'approved' | 'rejected' | 'pending'
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
    } catch (error) {
      console.error(`Error ${newStatus} psychologist:`, error);
      toast.error(`Failed to ${newStatus} psychologist. Please try again.`);
    }
  };

  const handleViewDetails = (id: string): void => {
    router.push(`/dashboard/admin/psychologist/${id}`);
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

        {/* Single TabsContent that updates based on the active tab */}
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
                          {psychologist.title || ''} {psychologist.firstName}{' '}
                          {psychologist.lastName}
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
                        {psychologist.specialization || 'Clinical psychologist'}
                      </p>
                      <div className="mt-4 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Email:</span>{' '}
                          {psychologist.email}
                        </p>
                        {psychologist.licenseNumber && (
                          <p className="text-sm">
                            <span className="font-medium">License:</span>{' '}
                            {psychologist.licenseNumber}
                          </p>
                        )}
                        {psychologist.location && (
                          <p className="text-sm">
                            <span className="font-medium">Location:</span>{' '}
                            {psychologist.location}
                          </p>
                        )}
                        {psychologist.yearsOfExperience && (
                          <p className="text-sm">
                            <span className="font-medium">Experience:</span>{' '}
                            {psychologist.yearsOfExperience} years
                          </p>
                        )}
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
    </div>
  );
}
