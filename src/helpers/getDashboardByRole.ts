export const getDashboardByRole = (role: string): string => {
  switch (role.toLowerCase()) {
    case 'admin':
      return '/dashboard/admin';
    case 'psychologist':
      return '/dashboard/psychologist';
    default:
      return '/dashboard';
  }
};