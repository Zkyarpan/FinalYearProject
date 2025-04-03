'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Search,
  User,
  RefreshCw,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Calendar,
  Clock,
  DollarSign,
  MoreHorizontal,
  Info,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DEFAULT_AVATAR } from '@/constants';

// Define TypeScript interfaces
interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  image?: string;
}

interface Psychologist {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePhotoUrl?: string;
}

interface Appointment {
  _id: string;
  startTime: string;
  endTime: string;
  status: string;
  sessionFormat: string;
}

interface Payment {
  _id: string;
  userId: string;
  psychologistId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentId: string;
  stripePaymentIntentId?: string;
  appointmentId?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  psychologist?: Psychologist;
  appointment?: Appointment;
}

export default function PaymentsManagement(): React.ReactElement {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalPayments, setTotalPayments] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState<boolean>(false);
  const [showRefundDialog, setShowRefundDialog] = useState<boolean>(false);
  const [refundReason, setRefundReason] = useState<string>('');
  const [isProcessingRefund, setIsProcessingRefund] = useState<boolean>(false);

  const fetchPayments = async (
    page: number,
    status: string = statusFilter,
    search: string = searchTerm,
    sort: string = sortBy,
    order: string = sortOrder
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        status: status === 'all' ? '' : status,
        sortBy: sort,
        sortOrder: order,
      });

      const response = await fetch(
        `/api/admin/payments?${queryParams.toString()}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch payments (${response.status})`);
      }

      const data = await response.json();

      if (data.IsSuccess) {
        setPayments(data.Result.payments || []);
        setTotalPages(data.Result.totalPages || 1);
        setTotalPayments(data.Result.totalPayments || 0);
      } else {
        throw new Error(
          data.ErrorMessage?.[0]?.message || 'Failed to fetch payments'
        );
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(currentPage, statusFilter, searchTerm, sortBy, sortOrder);
  }, [currentPage, statusFilter, sortBy, sortOrder]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPayments(1, statusFilter, searchTerm, sortBy, sortOrder);
  };

  const handleRefundPayment = async () => {
    if (!selectedPayment) return;

    setIsProcessingRefund(true);
    try {
      const response = await fetch(
        `/api/admin/payments/${selectedPayment._id}/refund`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reason: refundReason }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to refund payment (${response.status})`);
      }

      const data = await response.json();

      if (data.IsSuccess) {
        toast.success('Payment refunded successfully');

        // Update payment in the list
        setPayments(
          payments.map(p =>
            p._id === selectedPayment._id
              ? { ...p, status: 'refunded', refundReason }
              : p
          )
        );

        // Close the dialogs
        setShowRefundDialog(false);
        setShowDetailsDialog(false);
        setRefundReason('');
      } else {
        throw new Error(
          data.ErrorMessage?.[0]?.message || 'Failed to refund payment'
        );
      }
    } catch (error) {
      console.error('Error refunding payment:', error);
      toast.error('Failed to process refund. Please try again.');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for a new sort field
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const viewPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailsDialog(true);
  };

  const confirmRefund = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowRefundDialog(true);
  };

  // Helper function to format amount with currency
  const formatAmount = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    return formatter.format(amount / 100); // Assuming amount is in cents
  };

  // Helper function to format date
  const formatDate = (dateString: string, includeTime: boolean = false) => {
    const date = new Date(dateString);
    if (includeTime) {
      return date.toLocaleString();
    }
    return date.toLocaleDateString();
  };

  // Helper to get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300"
          >
            Completed
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
      case 'failed':
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-300"
          >
            Failed
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

  // Helper to get user name
  const getUserName = (user?: User) => {
    if (!user) return 'Unknown User';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email.split('@')[0];
  };

  // Helper to get psychologist name
  const getPsychologistName = (psychologist?: Psychologist) => {
    if (!psychologist) return 'Unknown Psychologist';
    if (psychologist.firstName && psychologist.lastName) {
      return `${psychologist.firstName} ${psychologist.lastName}`;
    }
    return psychologist.email.split('@')[0];
  };

  // Helper to get user avatar
  const getUserAvatar = (user?: User) => {
    return user?.image || DEFAULT_AVATAR;
  };

  // Helper to get psychologist avatar
  const getPsychologistAvatar = (psychologist?: Psychologist) => {
    return psychologist?.profilePhotoUrl || DEFAULT_AVATAR;
  };

  // Helper to get initials for avatar fallback
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Payments Management</h1>
          <p className="text-sm text-muted-foreground">
            Total payments: {totalPayments} | Showing page {currentPage} of{' '}
            {totalPages}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              fetchPayments(
                currentPage,
                statusFilter,
                searchTerm,
                sortBy,
                sortOrder
              )
            }
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, or payment ID..."
                className="pl-8"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select
                value={statusFilter}
                onValueChange={value => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>

          {/* Payments Table */}
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading payments...
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSortChange('user.email')}
                    >
                      Patient
                      {sortBy === 'user.email' &&
                        (sortOrder === 'asc' ? (
                          <ArrowUp className="inline ml-1 h-4 w-4" />
                        ) : (
                          <ArrowDown className="inline ml-1 h-4 w-4" />
                        ))}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSortChange('psychologist.email')}
                    >
                      Psychologist
                      {sortBy === 'psychologist.email' &&
                        (sortOrder === 'asc' ? (
                          <ArrowUp className="inline ml-1 h-4 w-4" />
                        ) : (
                          <ArrowDown className="inline ml-1 h-4 w-4" />
                        ))}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSortChange('amount')}
                    >
                      Amount
                      {sortBy === 'amount' &&
                        (sortOrder === 'asc' ? (
                          <ArrowUp className="inline ml-1 h-4 w-4" />
                        ) : (
                          <ArrowDown className="inline ml-1 h-4 w-4" />
                        ))}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSortChange('status')}
                    >
                      Status
                      {sortBy === 'status' &&
                        (sortOrder === 'asc' ? (
                          <ArrowUp className="inline ml-1 h-4 w-4" />
                        ) : (
                          <ArrowDown className="inline ml-1 h-4 w-4" />
                        ))}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSortChange('createdAt')}
                    >
                      Date
                      {sortBy === 'createdAt' &&
                        (sortOrder === 'asc' ? (
                          <ArrowUp className="inline ml-1 h-4 w-4" />
                        ) : (
                          <ArrowDown className="inline ml-1 h-4 w-4" />
                        ))}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length > 0 ? (
                    payments.map(payment => (
                      <TableRow key={payment._id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={getUserAvatar(payment.user)}
                                alt={getUserName(payment.user)}
                              />
                              <AvatarFallback>
                                {getInitials(getUserName(payment.user))}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {getUserName(payment.user)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {payment.user?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={getPsychologistAvatar(
                                  payment.psychologist
                                )}
                                alt={getPsychologistName(payment.psychologist)}
                              />
                              <AvatarFallback>
                                {getInitials(
                                  getPsychologistName(payment.psychologist)
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {getPsychologistName(payment.psychologist)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {payment.psychologist?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatAmount(payment.amount, payment.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {payment.stripePaymentId.slice(0, 10)}...
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          <div>{formatDate(payment.createdAt)}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => viewPaymentDetails(payment)}
                              >
                                <Info className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              {payment.status === 'completed' && (
                                <DropdownMenuItem
                                  onClick={() => confirmRefund(payment)}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" /> Process
                                  Refund
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  window.open(
                                    `https://dashboard.stripe.com/payments/${payment.stripePaymentId}`,
                                    '_blank'
                                  );
                                }}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" /> View
                                in Stripe
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <DollarSign className="h-8 w-8 text-muted-foreground/60 mb-2" />
                          <p className="text-muted-foreground">
                            No payments found
                          </p>
                          {(searchTerm || statusFilter !== 'all') && (
                            <Button
                              variant="link"
                              onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                fetchPayments(1, 'all', '', sortBy, sortOrder);
                              }}
                            >
                              Clear filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={
                      currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                    }
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={pageNum === currentPage}
                        onClick={e => {
                          e.preventDefault();
                          setCurrentPage(pageNum);
                        }}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      if (currentPage < totalPages)
                        setCurrentPage(currentPage + 1);
                    }}
                    className={
                      currentPage >= totalPages
                        ? 'pointer-events-none opacity-50'
                        : ''
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      {selectedPayment && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Amount</span>
                  <span className="text-xl font-bold">
                    {formatAmount(
                      selectedPayment.amount,
                      selectedPayment.currency
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status</span>
                  <div>{getStatusBadge(selectedPayment.status)}</div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Date</span>
                  <span>{formatDate(selectedPayment.createdAt, true)}</span>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-2">Patient</h4>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={getUserAvatar(selectedPayment.user)}
                        alt={getUserName(selectedPayment.user)}
                      />
                      <AvatarFallback>
                        {getInitials(getUserName(selectedPayment.user))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {getUserName(selectedPayment.user)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedPayment.user?.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-2">Psychologist</h4>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={getPsychologistAvatar(
                          selectedPayment.psychologist
                        )}
                        alt={getPsychologistName(selectedPayment.psychologist)}
                      />
                      <AvatarFallback>
                        {getInitials(
                          getPsychologistName(selectedPayment.psychologist)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {getPsychologistName(selectedPayment.psychologist)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedPayment.psychologist?.email}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedPayment.appointment && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium mb-2">Appointment</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {formatDate(
                            selectedPayment.appointment.startTime,
                            false
                          )}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {new Date(
                            selectedPayment.appointment.startTime
                          ).toLocaleTimeString()}{' '}
                          -
                          {new Date(
                            selectedPayment.appointment.endTime
                          ).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline">
                          {selectedPayment.appointment.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPayment.status === 'refunded' &&
                  selectedPayment.refundReason && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium mb-2">
                        Refund Reason
                      </h4>
                      <p className="text-sm">{selectedPayment.refundReason}</p>
                    </div>
                  )}

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-2">
                    Stripe Information
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment ID:</span>
                      <span className="font-mono">
                        {selectedPayment.stripePaymentId}
                      </span>
                    </div>
                    {selectedPayment.stripePaymentIntentId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Intent ID:
                        </span>
                        <span className="font-mono">
                          {selectedPayment.stripePaymentIntentId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              {selectedPayment.status === 'completed' && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    confirmRefund(selectedPayment);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Process Refund
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  window.open(
                    `https://dashboard.stripe.com/payments/${selectedPayment.stripePaymentId}`,
                    '_blank'
                  );
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Stripe
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDetailsDialog(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Refund Confirmation Dialog */}
      {selectedPayment && (
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Refund</DialogTitle>
              <DialogDescription>
                Are you sure you want to refund {selectedPayment.user?.email}
                {"'"}s payment of{' '}
                {formatAmount(selectedPayment.amount, selectedPayment.currency)}
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="mb-4">
                <label
                  htmlFor="refundReason"
                  className="block text-sm font-medium mb-1"
                >
                  Reason for refund
                </label>
                <Input
                  id="refundReason"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="Enter reason for refund"
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
                <p className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>
                    This will refund the full payment amount and cancel any
                    associated appointment. The patient will be notified about
                    this refund.
                  </span>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRefundDialog(false);
                  setRefundReason('');
                }}
                disabled={isProcessingRefund}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRefundPayment}
                disabled={isProcessingRefund}
              >
                {isProcessingRefund ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  'Confirm Refund'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
