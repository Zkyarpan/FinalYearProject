'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Search,
  User,
  Mail,
  Calendar,
  Lock,
  Ban,
  Unlock,
  MoreHorizontal,
  RefreshCw,
  ArrowDown,
  Check,
  X,
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DEFAULT_AVATAR } from '@/constants';

// Define TypeScript interfaces
interface UserProfile {
  firstName: string;
  lastName: string;
  image: string;
  phone?: string;
  age?: number;
  gender?: string;
  briefBio?: string;
}

interface PsychologistData {
  email: string;
  fullName?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  profilePhotoUrl?: string;
}

interface User {
  _id: string;
  email: string;
  role: 'user' | 'admin' | 'psychologist';
  isActive: boolean;
  createdAt: string;
  profileData?: UserProfile | null;
  psychologistData?: PsychologistData | null;
  displayName?: string;
  profileImage?: string | null;
  psychologistImage?: string | null;
}

export default function UsersPage(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [showUserDetailsDialog, setShowUserDetailsDialog] =
    useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailsTab, setDetailsTab] = useState<string>('basic');
  const [approvalFeedback, setApprovalFeedback] = useState<string>('');
  const [showFeedbackDialog, setShowFeedbackDialog] = useState<boolean>(false);
  const [approvalAction, setApprovalAction] = useState<
    'approve' | 'reject' | null
  >(null);

  const fetchUsers = async (
    page: number,
    search: string = '',
    role: string = roleFilter,
    status: string = statusFilter
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        role,
        status,
      });

      const response = await fetch(
        `/api/admin/users?${queryParams.toString()}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch users (${response.status})`);
      }

      const data = await response.json();

      if (data.Result) {
        setUsers(data.Result.users || []);
        setTotalPages(data.Result.totalPages || 1);
        setTotalUsers(data.Result.totalUsers || 0);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, searchTerm, roleFilter, statusFilter);
  }, [currentPage, roleFilter, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers(1, searchTerm, roleFilter, statusFilter);
  };

  const handleStatusChange = async (
    id: string,
    isActive: boolean
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${isActive ? 'activate' : 'deactivate'} user (${response.status})`
        );
      }

      const data = await response.json();
      toast.success(
        data.Result?.message ||
          `User ${isActive ? 'activated' : 'deactivated'} successfully`
      );

      // Update the user in the list
      setUsers(
        users.map(user => (user._id === id ? { ...user, isActive } : user))
      );

      // If user details dialog is open, update the selected user
      if (selectedUser && selectedUser._id === id) {
        setSelectedUser({ ...selectedUser, isActive });
      }
    } catch (error) {
      console.error(`Error updating user status:`, error);
      toast.error(`Failed to update user status. Please try again.`);
    }
  };

  const handlePsychologistApproval = async (
    userId: string,
    action: 'approve' | 'reject',
    feedback: string = ''
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, feedback }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${action} psychologist (${response.status})`
        );
      }

      const data = await response.json();
      toast.success(
        data.Result?.message || `Psychologist ${action}ed successfully`
      );

      // Refresh user list
      fetchUsers(currentPage, searchTerm, roleFilter, statusFilter);

      // Close the dialog
      setShowFeedbackDialog(false);
      setApprovalFeedback('');
      setApprovalAction(null);

      // If the user details dialog is open, update the psychologist data
      if (selectedUser && selectedUser._id === userId) {
        const updatedPsychologistData = {
          ...selectedUser.psychologistData,
          approvalStatus: action === 'approve' ? 'approved' : 'rejected',
          adminFeedback: feedback,
        };

        setSelectedUser({
          ...selectedUser,
          psychologistData: updatedPsychologistData as PsychologistData,
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing psychologist:`, error);
      toast.error(`Failed to ${action} psychologist. Please try again.`);
    }
  };

  const resetPassword = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/admin/users/${userId}/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to reset password (${response.status})`);
      }

      const data = await response.json();
      toast.success(
        data.Result?.message || 'Password reset email sent successfully'
      );
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password. Please try again.');
    }
  };

  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserDetailsDialog(true);

    // Set appropriate tab based on user role and data
    if (user.role === 'psychologist') {
      setDetailsTab('psychologist');
    } else if (user.profileData) {
      setDetailsTab('profile');
    } else {
      setDetailsTab('basic');
    }
  };

  const startApprovalProcess = (action: 'approve' | 'reject') => {
    setApprovalAction(action);
    setApprovalFeedback('');
    setShowFeedbackDialog(true);
  };

  const getUserImage = (user: User) => {
    if (user.profileImage) return user.profileImage;
    if (user.role === 'psychologist' && user.psychologistImage)
      return user.psychologistImage;
    return DEFAULT_AVATAR;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'psychologist':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users Management</h1>
          <p className="text-sm text-muted-foreground">
            Total users: {totalUsers} | Showing page {currentPage} of{' '}
            {totalPages}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 h-9"
            onClick={() =>
              fetchUsers(currentPage, searchTerm, roleFilter, statusFilter)
            }
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>

          <Button variant="outline" size="sm" className="gap-1 h-9">
            <ArrowDown className="h-3.5 w-3.5" />
            <span>Export</span>
          </Button>

          <Button variant="default" size="sm" className="gap-1 h-9">
            <span>Add User</span>
          </Button>
        </div>
      </div>

      <Card className="border-border/40">
        <CardContent className="p-4 space-y-4">
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-grow items-center gap-2">
              <div className="relative flex-grow w-full max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by email..."
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-md border focus:ring-1 focus:ring-primary focus:outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
              <Button
                onClick={handleSearch}
                variant="secondary"
                size="sm"
                className="h-9"
              >
                Search
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={roleFilter}
                onValueChange={value => {
                  setRoleFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="psychologist">Psychologist</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={value => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users table */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader />
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Joined Date
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map(user => (
                      <TableRow key={user._id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                              <img
                                src={getUserImage(user)}
                                alt={user.displayName || 'User'}
                                className="h-full w-full object-cover"
                                onError={e => {
                                  e.currentTarget.src = DEFAULT_AVATAR;
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-medium">
                                {user.displayName}
                              </div>
                              {user.role === 'psychologist' &&
                                user.psychologistData && (
                                  <Badge
                                    variant={
                                      user.psychologistData.approvalStatus ===
                                      'approved'
                                        ? 'default'
                                        : user.psychologistData
                                              .approvalStatus === 'rejected'
                                          ? 'destructive'
                                          : 'outline'
                                    }
                                    className="mt-1 text-xs"
                                  >
                                    {user.psychologistData.approvalStatus}
                                  </Badge>
                                )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isActive ? 'default' : 'destructive'}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => viewUserDetails(user)}
                              >
                                <User className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => resetPassword(user._id)}
                              >
                                <Lock className="h-4 w-4 mr-2" /> Reset Password
                              </DropdownMenuItem>

                              {user.role === 'psychologist' &&
                                user.psychologistData?.approvalStatus ===
                                  'pending' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        startApprovalProcess('approve')
                                      }
                                      className="text-green-500"
                                    >
                                      <Check className="h-4 w-4 mr-2" /> Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        startApprovalProcess('reject')
                                      }
                                      className="text-red-500"
                                    >
                                      <X className="h-4 w-4 mr-2" /> Reject
                                    </DropdownMenuItem>
                                  </>
                                )}

                              <DropdownMenuSeparator />
                              {user.isActive ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(user._id, false)
                                  }
                                  className="text-red-500"
                                >
                                  <Ban className="h-4 w-4 mr-2" /> Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(user._id, true)
                                  }
                                  className="text-green-500"
                                >
                                  <Unlock className="h-4 w-4 mr-2" /> Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-10 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <User className="h-8 w-8 text-muted-foreground/60" />
                          <p>No users found</p>
                          {(searchTerm ||
                            roleFilter !== 'all' ||
                            statusFilter !== 'all') && (
                            <Button
                              variant="link"
                              onClick={() => {
                                setSearchTerm('');
                                setRoleFilter('all');
                                setStatusFilter('all');
                                fetchUsers(1, '', 'all', 'all');
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
            <div className="flex justify-center py-4">
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
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show a window of 5 pages centered on current page
                    let pageNum;
                    if (totalPages <= 5) {
                      // Less than 5 pages, show all
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      // Near start, show first 5
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // Near end, show last 5
                      pageNum = totalPages - 4 + i;
                    } else {
                      // In middle, show window around current
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          isActive={pageNum === currentPage}
                          onClick={() => setCurrentPage(pageNum)}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      className={
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog
          open={showUserDetailsDialog}
          onOpenChange={setShowUserDetailsDialog}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> User Details
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <div className="flex justify-center mb-6">
                <div className="flex flex-col items-center">
                  <div className="h-20 w-20 rounded-full bg-muted overflow-hidden mb-2">
                    <img
                      src={getUserImage(selectedUser)}
                      alt={selectedUser.displayName || 'User'}
                      className="h-full w-full object-cover"
                      onError={e => {
                        e.currentTarget.src = DEFAULT_AVATAR;
                      }}
                    />
                  </div>
                  <h2 className="text-xl font-semibold">
                    {selectedUser.displayName || 'User'}
                  </h2>

                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                      {selectedUser.role}
                    </Badge>

                    <Badge
                      variant={
                        selectedUser.isActive ? 'default' : 'destructive'
                      }
                    >
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </Badge>

                    {selectedUser.role === 'psychologist' &&
                      selectedUser.psychologistData && (
                        <Badge
                          variant={
                            selectedUser.psychologistData.approvalStatus ===
                            'approved'
                              ? 'default'
                              : selectedUser.psychologistData.approvalStatus ===
                                  'rejected'
                                ? 'destructive'
                                : 'outline'
                          }
                        >
                          {selectedUser.psychologistData.approvalStatus}
                        </Badge>
                      )}
                  </div>
                </div>
              </div>

              {/* Tabs for different sections */}
              <Tabs
                value={detailsTab}
                onValueChange={setDetailsTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  {selectedUser.profileData && (
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                  )}
                  {selectedUser.role === 'psychologist' && (
                    <TabsTrigger value="psychologist">Psychologist</TabsTrigger>
                  )}
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Joined Date</p>
                    <p className="font-medium">
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </p>
                  </div>
                </TabsContent>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4 mt-4">
                  {selectedUser.profileData ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">
                            {selectedUser.profileData.phone || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Age</p>
                          <p className="font-medium">
                            {selectedUser.profileData.age || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="font-medium capitalize">
                          {selectedUser.profileData.gender || 'Not provided'}
                        </p>
                      </div>

                      {selectedUser.profileData.briefBio && (
                        <div>
                          <p className="text-sm text-muted-foreground">Bio</p>
                          <p className="text-sm mt-1">
                            {selectedUser.profileData.briefBio}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6">
                      <p className="text-muted-foreground">
                        No profile information available
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Psychologist Tab */}
                <TabsContent value="psychologist" className="space-y-4 mt-4">
                  {selectedUser.psychologistData ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">
                          {selectedUser.psychologistData.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Approval Status
                        </p>
                        <Badge
                          variant={
                            selectedUser.psychologistData.approvalStatus ===
                            'approved'
                              ? 'default'
                              : selectedUser.psychologistData.approvalStatus ===
                                  'rejected'
                                ? 'destructive'
                                : 'outline'
                          }
                        >
                          {selectedUser.psychologistData.approvalStatus}
                        </Badge>
                      </div>

                      {selectedUser.psychologistData.approvalStatus ===
                        'pending' && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => startApprovalProcess('approve')}
                          >
                            <Check className="h-4 w-4 mr-2" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            onClick={() => startApprovalProcess('reject')}
                          >
                            <X className="h-4 w-4 mr-2" /> Reject
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6">
                      <p className="text-muted-foreground">
                        No psychologist information available
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 justify-between sm:justify-between">
              <Button
                variant={selectedUser.isActive ? 'destructive' : 'default'}
                onClick={() => {
                  handleStatusChange(selectedUser._id, !selectedUser.isActive);
                }}
              >
                {selectedUser.isActive ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" /> Deactivate
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" /> Activate
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowUserDetailsDialog(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approval Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Psychologist
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve'
                ? 'Provide any feedback for approving this psychologist.'
                : 'Please provide a reason for rejecting this psychologist application.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="Enter feedback or rejection reason..."
              className="min-h-[100px]"
              value={approvalFeedback}
              onChange={e => setApprovalFeedback(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFeedbackDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
              onClick={() => {
                if (selectedUser) {
                  handlePsychologistApproval(
                    selectedUser._id,
                    approvalAction!,
                    approvalFeedback
                  );
                }
              }}
            >
              {approvalAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
