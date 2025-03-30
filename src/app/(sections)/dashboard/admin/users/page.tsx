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

export default function UsersManagement(): JSX.Element {
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
    } catch (error) {
      console.error(`Error updating user status:`, error);
      toast.error(`Failed to update user status. Please try again.`);
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
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Users Management</h1>
          <p className="text-sm text-muted-foreground">
            Total users: {totalUsers} | Showing page {currentPage} of {totalPages}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchUsers(currentPage, searchTerm, roleFilter, statusFilter)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <User className="h-4 w-4 mr-2" />
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
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select
                value={roleFilter}
                onValueChange={(value) => {
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
                onValueChange={(value) => {
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
              <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
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
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={getUserAvatar(user)} alt={getUserName(user)} />
                              <AvatarFallback>{getInitials(user)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{getUserName(user)}</p>
                              {user.role === 'psychologist' && user.psychologistData && (
                                <Badge 
                                  variant={
                                    user.psychologistData.approvalStatus === 'approved' 
                                      ? 'default' 
                                      : user.psychologistData.approvalStatus === 'rejected'
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
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => viewUserDetails(user)}>
                                <User className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => resetPassword(user._id)}>
                                <Lock className="h-4 w-4 mr-2" /> Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.isActive ? (
                                <DropdownMenuItem onClick={() => handleStatusChange(user._id, false)} className="text-red-600">
                                  <Ban className="h-4 w-4 mr-2" /> Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleStatusChange(user._id, true)} className="text-green-600">
                                  <Unlock className="h-4 w-4 mr-2" /> Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => confirmDeleteUser(user)} className="text-red-600">
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
                          <p className="text-muted-foreground">No users found</p>
                          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
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
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
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
                        onClick={(e) => {
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
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
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
            <div className="flex flex-col items-center py-4">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={getUserAvatar(selectedUser)} alt={getUserName(selectedUser)} />
                <AvatarFallback className="text-lg">{getInitials(selectedUser)}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{getUserName(selectedUser)}</h2>
              <p className="text-sm text-muted-foreground mb-1">{selectedUser.email}</p>
              <div className="flex gap-2 mb-4">
                <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                  {selectedUser.role}
                </Badge>
                <Badge variant={selectedUser.isActive ? "default" : "destructive"}>
                  {selectedUser.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="w-full border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined Date:</span>
                  <span>
                    {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verified:</span>
                  <span>{selectedUser.isVerified ? "Yes" : "No"}</span>
                </div>
                {selectedUser.role === 'psychologist' && selectedUser.psychologistData && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approval Status:</span>
                    <span className="capitalize">{selectedUser.psychologistData.approvalStatus}</span>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button 
                variant={selectedUser.isActive ? "destructive" : "default"} 
                onClick={() => handleStatusChange(selectedUser._id, !selectedUser.isActive)}
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
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
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
                Are you sure you want to delete user {selectedUser.email}? This action cannot be undone.
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
    </div>
  );
}