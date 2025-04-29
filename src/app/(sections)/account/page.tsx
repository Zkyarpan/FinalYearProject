import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ProfileClient } from './client';
import { Profile } from './types';
import AccountPageSkeleton from '@/components/AccountPageSkeleton';
import { baseUrl } from '@/constants';

async function getProfile(): Promise<Profile> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      redirect('/login');
    }

    const response = await fetch(`${baseUrl}/api/profile`, {
      headers: {
        Cookie: `accessToken=${accessToken}`,
      },
      cache: 'no-store',
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const data = await response.json();

    if (!data.IsSuccess) {
      throw new Error(data.ErrorMessage[0] || 'Failed to fetch profile');
    }

    // Handle case where profile doesn't exist but user is authenticated
    if (!data.Result.profile.profileCompleted) {
      return {
        id: '',
        firstName: data.Result.profile.firstName || '',
        lastName: data.Result.profile.lastName || '',
        image: data.Result.profile.image || '',
        address: '',
        phone: '',
        age: 0,
        gender: '',
        emergencyContact: '',
        emergencyPhone: '',
        therapyHistory: '',
        preferredCommunication: '',
        struggles: [],
        briefBio: '',
        profileCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return data.Result.profile;
  } catch (error) {
    console.error('Profile fetch error:', error);
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    throw new Error('Failed to fetch profile');
  }
}

export default async function AccountPage() {
  try {
    const profile = await getProfile();

    if (!profile.profileCompleted) {
      return <AccountPageSkeleton />;
    }

    return <ProfileClient profile={profile} />;
  } catch (error) {
    throw error;
  }
}
