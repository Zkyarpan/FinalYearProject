'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Calendar,
  User,
  Clock,
  Info,
  Search,
  Filter,
  FileText,
  XCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Loader from '@/components/common/Loader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define TypeScript interfaces
interface Appointment {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  psychologistId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  startTime: string;
  endTime: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'canceled' | 'no-show';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  notes?: string;
  createdAt: string;
}

type StatusType = 'all' | 'scheduled' | 'completed' | 'canceled' | 'no-show';

export default function ManageAppointments(): JSX.Element {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusType>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showAppointmentDetails, setShowAppointmentDetails] =
    useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');

  const fetchAppointments = async (
    page: number,
    status: StatusType,
    search: string = ''
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/appointments?page=${page}&limit=10&status=${status}&search=${search}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        console.error(
          `API Error (${response.status}): Failed to fetch appointments`
        );
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
        throw new Error(`Failed to fetch appointments (${response.status})`);
      }

      const data = await response.json();
      setAppointments(data.Result.appointments || []);
      setTotalPages(data.Result.totalPages || 1);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(currentPage, statusFilter, searchTerm);
  }, [currentPage, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAppointments(1, statusFilter, searchTerm);
  };

  const viewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  const confirmCancel = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelDialog(true);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const response = await fetch(
        `/api/admin/appointments/${selectedAppointment._id}/cancel`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reason: cancelReason }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `API Error (${response.status}): Failed to cancel appointment`
        );
        console.error(`Error details: ${errorText}`);
        throw new Error(`Failed to cancel appointment (${response.status})`);
      }

      const data = await response.json();
      toast.success(
        data.Result?.message || 'Appointment canceled successfully'
      );

      // Update the appointment status in the list
      setAppointments(
        appointments.map(appt =>
          appt._id === selectedAppointment._id
            ? { ...appt, status: 'canceled' as const }
            : appt
        )
      );

      // Close dialogs
      setShowCancelDialog(false);
      setShowAppointmentDetails(false);
      setCancelReason('');
    } catch (error) {
      console.error('Error canceling appointment:', error);
      toast.error('Failed to cancel appointment. Please try again.');
    }
  };

  const markAsCompleted = async (appointmentId: string) => {
    try {
      const response = await fetch(
        `/api/admin/appointments/${appointmentId}/complete`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `API Error (${response.status}): Failed to mark appointment as completed`
        );
        console.error(`Error details: ${errorText}`);
        throw new Error(
          `Failed to update appointment status (${response.status})`
        );
      }

      const data = await response.json();
      toast.success(data.Result?.message || 'Appointment marked as completed');

      // Update the appointment status in the list
      setAppointments(
        appointments.map(appt =>
          appt._id === appointmentId
            ? { ...appt, status: 'completed' as const }
            : appt
        )
      );

      // Close details dialog if open
      if (selectedAppointment && selectedAppointment._id === appointmentId) {
        setShowAppointmentDetails(false);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status. Please try again.');
    }
  };

  const markAsNoShow = async (appointmentId: string) => {
    try {
      const response = await fetch(
        `/api/admin/appointments/${appointmentId}/no-show`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to mark as no-show (${response.status})`);
      }

      const data = await response.json();
      toast.success(data.Result?.message || 'Appointment marked as no-show');

      // Update the appointment status
      setAppointments(
        appointments.map(appt =>
          appt._id === appointmentId
            ? { ...appt, status: 'no-show' as const }
            : appt
        )
      );

      // Close details dialog if open
      if (selectedAppointment && selectedAppointment._id === appointmentId) {
        setShowAppointmentDetails(false);
      }
    } catch (error) {
      console.error('Error marking as no-show:', error);
      toast.error('Failed to update appointment status. Please try again.');
    }
  };

  // Helper to format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Helper to get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 border-blue-300"
          >
            Scheduled
          </Badge>
        );
      case 'completed':
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300"
          >
            Completed
          </Badge>
        );
      case 'canceled':
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-300"
          >
            Canceled
          </Badge>
        );
      case 'no-show':
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            No Show
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper to get payment status badge
  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300"
          >
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            Pending
          </Badge>
        );
      case 'refunded':
        return (
          <Badge
            variant="outline"
            className="bg-purple-100 text-purple-800 border-purple-300"
          >
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Appointments</h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or email..."
              className="pl-8 w-64"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={statusFilter}
        onValueChange={value => {
          setStatusFilter(value as StatusType);
          setCurrentPage(1);
        }}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="canceled">Canceled</TabsTrigger>
          <TabsTrigger value="no-show">No Show</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Psychologist</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.length > 0 ? (
                    appointments.map(appointment => (
                      <TableRow key={appointment._id}>
                        <TableCell>
                          <div className="font-medium">
                            {appointment.userId.firstName}{' '}
                            {appointment.userId.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.userId.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {appointment.psychologistId.firstName}{' '}
                            {appointment.psychologistId.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.psychologistId.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(appointment.startTime)}
                        </TableCell>
                        <TableCell>{appointment.duration} minutes</TableCell>
                        <TableCell>
                          {getStatusBadge(appointment.status)}
                        </TableCell>
                        <TableCell>
                          {getPaymentBadge(appointment.paymentStatus)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => viewDetails(appointment)}
                              >
                                <Info className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>

                              {appointment.status === 'scheduled' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      markAsCompleted(appointment._id)
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />{' '}
                                    Mark as Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      markAsNoShow(appointment._id)
                                    }
                                  >
                                    <AlertCircle className="h-4 w-4 mr-2" />{' '}
                                    Mark as No-Show
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => confirmCancel(appointment)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" /> Cancel
                                    Appointment
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No appointments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="py-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          className={
                            currentPage === 1
                              ? 'pointer-events-none opacity-50'
                              : ''
                          }
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        page => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          className={
                            currentPage === totalPages
                              ? 'pointer-events-none opacity-50'
                              : ''
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      {selectedAppointment && (
        <Dialog
          open={showAppointmentDetails}
          onOpenChange={setShowAppointmentDetails}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Session Information</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Time</p>
                    <p className="font-medium">
                      {formatDateTime(selectedAppointment.startTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Time</p>
                    <p className="font-medium">
                      {formatDateTime(selectedAppointment.endTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {selectedAppointment.duration} minutes
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedAppointment.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Payment Status
                    </p>
                    <div className="mt-1">
                      {getPaymentBadge(selectedAppointment.paymentStatus)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Booking Date
                    </p>
                    <p className="font-medium">
                      {new Date(
                        selectedAppointment.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold">Patient</h3>
                  </div>
                  <p className="font-medium">
                    {selectedAppointment.userId.firstName}{' '}
                    {selectedAppointment.userId.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.userId.email}
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold">Psychologist</h3>
                  </div>
                  <p className="font-medium">
                    {selectedAppointment.psychologistId.firstName}{' '}
                    {selectedAppointment.psychologistId.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.psychologistId.email}
                  </p>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold">Session Notes</h3>
                  </div>
                  <p className="text-sm whitespace-pre-line">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {selectedAppointment.status === 'scheduled' && (
                <>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      markAsCompleted(selectedAppointment._id);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Mark as Completed
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      markAsNoShow(selectedAppointment._id);
                    }}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" /> Mark as No-Show
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowAppointmentDetails(false);
                      confirmCancel(selectedAppointment);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Cancel Appointment
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => setShowAppointmentDetails(false)}
                className={
                  selectedAppointment.status === 'scheduled' ? 'sm:ml-auto' : ''
                }
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4">
              <label
                htmlFor="cancelReason"
                className="block text-sm font-medium mb-1"
              >
                Reason for cancellation (optional)
              </label>
              <Input
                id="cancelReason"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCancelAppointment}>
              Yes, Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
