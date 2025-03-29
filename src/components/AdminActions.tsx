'use client';

import { useState } from 'react';
import { LogOut, Settings, BarChart, Shield } from 'lucide-react';
import ThemeSwitch from './ThemeSwitch';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface AdminActionsProps {
  email: string;
  router: any;
  logout: () => void;
}

const AdminActions = ({ email, router, logout }: AdminActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        logout();
        toast.success('Logged out successfully!');
        localStorage.clear();
        sessionStorage.clear();

        setTimeout(() => {
          router.push('/login');
        }, 300);
      } else {
        throw new Error('Failed to log out');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <ThemeSwitch />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-sm font-medium px-3 bg-muted/50 hover:bg-muted"
          >
            <span className="hidden md:inline">
              {email || 'admin@mentality.com'}
            </span>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs font-medium text-muted-foreground">
              Admin
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-52" align="end">
          <DropdownMenuGroup className="p-1">
            <DropdownMenuItem
              className="px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              onClick={() => router.push('/dashboard/admin/reports')}
            >
              <BarChart className="h-4 w-4" />
              <span className="group-hover:translate-x-1 transition-transform duration-200">
                Reports
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              onClick={() => router.push('/dashboard/admin/settings')}
            >
              <Settings className="h-4 w-4" />
              <span className="group-hover:translate-x-1 transition-transform duration-200">
                System Settings
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              onClick={() => router.push('/dashboard/admin/security')}
            >
              <Shield className="h-4 w-4" />
              <span className="group-hover:translate-x-1 transition-transform duration-200">
                Security
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="px-3 py-2 text-sm rounded-lg text-red-500 flex items-center gap-2 cursor-pointer"
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AdminActions;
