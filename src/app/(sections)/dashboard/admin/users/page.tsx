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
  Plus,
  Edit,
  Shield,
  UserCog,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { DEFAULT_AVATAR } from '@/constants';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Form validation schema for adding a new user
const userFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'psychologist', 'admin']),
  firstName: z.string().min(2, 'First name is required').optional(),
  lastName: z.string().min(2, 'Last name is required').optional(),
  isActive: z.boolean(),
  sendWelcomeEmail: z.boolean(),
});

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
  firstName?: string;
  lastName?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  profilePhotoUrl?: string;
}

interface User {
  _id: string;
  email: string;
  role: 'user' | 'admin' | 'psychologist';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  profileData?: UserProfile | null;
  psychologistData?: PsychologistData | null;
  profile?: any;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  profileImage?: string | null;
  psychologistImage?: string | null;
  image?: string | null;
}

export default function UsersManagement(): React.ReactElement {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState<boolean>(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('account');

  type FormValues = z.infer<typeof userFormSchema>;

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'user',
      firstName: '',
      lastName: '',
      isActive: true,
      sendWelcomeEmail: true,
    },
  });

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
        role: role === 'all' ? '' : role,
        status: status === 'all' ? '' : status,
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

      if (data.IsSuccess) {
        setUsers(data.Result.users || []);
        setTotalPages(data.Result.totalPages || 1);
        setTotalUsers(data.Result.totalUsers || 0);
      } else {
        throw new Error(
          data.ErrorMessage?.[0]?.message || 'Failed to fetch users'
        );
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

  const handleDeleteUser = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user (${response.status})`);
      }

      toast.success('User deleted successfully');
      fetchUsers(currentPage, searchTerm, roleFilter, statusFilter);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user. Please try again.');
    }
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

      toast.success(
        `User ${isActive ? 'activated' : 'deactivated'} successfully`
      );

      // Update the user in the list
      setUsers(
        users.map(user => (user._id === id ? { ...user, isActive } : user))
      );

      // Also update selected user if in detail view
      if (selectedUser && selectedUser._id === id) {
        setSelectedUser({ ...selectedUser, isActive });
      }
    } catch (error) {
      console.error(`Error updating user status:`, error);
      toast.error(`Failed to update user status. Please try again.`);
    }
  };

  const handleAddUser = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.ErrorMessage?.[0]?.message || 'Failed to create user'
        );
      }

      const result = await response.json();
      toast.success('User created successfully');
      setShowAddUserDialog(false);
      form.reset();
      fetchUsers(currentPage, searchTerm, roleFilter, statusFilter);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create user'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const confirmDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
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

      toast.success('Password reset email sent successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password. Please try again.');
    }
  };

  // Helper function to get user's name safely
  const getUserName = (user: User): string => {
    // Check for displayName first
    if (user.displayName) return user.displayName;

    // Check for direct firstName/lastName properties
    if (user.firstName && user.lastName)
      return `${user.firstName} ${user.lastName}`;

    // Check profile data
    if (user.profileData?.firstName && user.profileData?.lastName) {
      return `${user.profileData.firstName} ${user.profileData.lastName}`;
    }

    // Check psychologist data
    if (user.psychologistData?.firstName && user.psychologistData?.lastName) {
      return `${user.psychologistData.firstName} ${user.psychologistData.lastName}`;
    }

    if (user.psychologistData?.fullName) return user.psychologistData.fullName;

    // Check for profile
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }

    // Fall back to email (username)
    return user.email.split('@')[0];
  };

  // Helper function to get user's avatar safely
  const getUserAvatar = (user: User): string => {
    return (
      user.profileImage ||
      user.image ||
      user.psychologistImage ||
      user.psychologistData?.profilePhotoUrl ||
      user.profileData?.image ||
      DEFAULT_AVATAR
    );
  };

  // Get initials for avatar fallback
  const getInitials = (user: User): string => {
    const name = getUserName(user);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper to get badge color for role
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'psychologist':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Users Management</h1>
          <p className="text-sm text-muted-foreground">
            Total users: {totalUsers} | Showing page {currentPage} of{' '}
            {totalPages}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              fetchUsers(currentPage, searchTerm, roleFilter, statusFilter)
            }
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAddUserDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
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
                placeholder="Search by email or name..."
                className="pl-8"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select
                value={roleFilter}
                onValueChange={value => {
                  setRoleFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="psychologist">Psychologists</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>

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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading users...
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map(user => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={getUserAvatar(user)}
                                alt={getUserName(user)}
                              />
                              <AvatarFallback>
                                {getInitials(user)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{getUserName(user)}</p>
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
                                    className="text-xs mt-1"
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
                        <TableCell>
                          {user.isActive ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                            >
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                            >
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
                              <DropdownMenuSeparator />
                              {user.isActive ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(user._id, false)
                                  }
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Ban className="h-4 w-4 mr-2" /> Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(user._id, true)
                                  }
                                  className="text-green-600 dark:text-green-400"
                                >
                                  <Unlock className="h-4 w-4 mr-2" /> Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => confirmDeleteUser(user)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <X className="h-4 w-4 mr-2" /> Delete User
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
                          <User className="h-8 w-8 text-muted-foreground/60 mb-2" />
                          <p className="text-muted-foreground">
                            No users found
                          </p>
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

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>

            <Tabs
              defaultValue="account"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>

              {/* User Details Dialog - Account Tab Update */}
              <TabsContent value="account" className="space-y-4 py-4">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage
                      src={getUserAvatar(selectedUser)}
                      alt={getUserName(selectedUser)}
                    />
                    <AvatarFallback className="text-lg">
                      {getInitials(selectedUser)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">
                    {getUserName(selectedUser)}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedUser.email}
                  </p>
                  <div className="flex gap-2 mb-4">
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
                              ? 'outline'
                              : selectedUser.psychologistData.approvalStatus ===
                                  'rejected'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {selectedUser.psychologistData.approvalStatus}
                        </Badge>
                      )}
                  </div>
                </div>
                <div className="w-full border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined Date:</span>
                    <span>
                      {new Date(selectedUser.createdAt).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified:</span>
                    <span>{selectedUser.isVerified ? 'Yes' : 'No'}</span>
                  </div>
                  {selectedUser.role === 'psychologist' &&
                    selectedUser.psychologistData && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Approval Status:
                        </span>
                        <span className="capitalize">
                          {selectedUser.psychologistData.approvalStatus}
                        </span>
                      </div>
                    )}
                </div>
              </TabsContent>

              <TabsContent value="profile" className="space-y-4 py-4">
                {selectedUser.profileData ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>
                        {selectedUser.profileData.firstName}{' '}
                        {selectedUser.profileData.lastName}
                      </span>
                    </div>
                    {selectedUser.profileData.age && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age:</span>
                        <span>{selectedUser.profileData.age}</span>
                      </div>
                    )}
                    {selectedUser.profileData.gender && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="capitalize">
                          {selectedUser.profileData.gender}
                        </span>
                      </div>
                    )}
                    {selectedUser.profileData.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{selectedUser.profileData.phone}</span>
                      </div>
                    )}
                    {selectedUser.profileData.briefBio && (
                      <div className="pt-2">
                        <p className="text-muted-foreground mb-1">Bio:</p>
                        <p className="text-sm">
                          {selectedUser.profileData.briefBio}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No profile information available
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between">
              <Button
                variant={selectedUser.isActive ? 'destructive' : 'default'}
                onClick={() =>
                  handleStatusChange(selectedUser._id, !selectedUser.isActive)
                }
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
                onClick={() => setShowDetailsDialog(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {selectedUser && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete user {selectedUser.email}? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteUser(selectedUser._id)}
              >
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. Users will receive a welcome email with
              their login details if the send welcome email option is selected.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddUser)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4" />
                            <span>User</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="psychologist">
                          <div className="flex items-center">
                            <UserCog className="mr-2 h-4 w-4" />
                            <span>Psychologist</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active Account</FormLabel>
                      <FormDescription>
                        User can log in immediately if activated
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sendWelcomeEmail"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Send Welcome Email</FormLabel>
                      <FormDescription>
                        Send login details to the user
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setShowAddUserDialog(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
