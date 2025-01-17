'use client';

import React, { useEffect, useState } from 'react';
import Phone from '@/icons/Call';
import Video from '@/icons/Video';
import Emergency from '@/icons/Emergency';
import Upload from '@/icons/Upload';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  image: string | File | null;
  address: string;
  phone: string;
  age: number;
  gender: string;
  emergencyContact: string;
  emergencyPhone: string;
  therapyHistory: string;
  preferredCommunication: string;
  struggles: string[];
  briefBio: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const struggleOptions = [
  'Anxiety',
  'Depression',
  'Relationships',
  'Self-Esteem',
  'Stress',
  'Trauma',
  'Work',
  'Other',
];

const EditProfile = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Profile>({
    firstName: '',
    lastName: '',
    age: 0,
    gender: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    therapyHistory: '',
    preferredCommunication: '',
    briefBio: '',
    struggles: [],
    image: null,
    id: '',
    createdAt: '',
    updatedAt: '',
    profileCompleted: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();

        if (data.IsSuccess && data.Result?.profile) {
          const profile = data.Result.profile;
          setFormData(prev => ({
            ...prev,
            ...profile,
            image: null,
          }));
          setImagePreview(profile.image || '');
        } else {
          throw new Error(data.ErrorMessage[0] || 'Profile data not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'struggles') {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (value instanceof File) {
          formDataToSend.append(key, value, value.name);
        } else {
          formDataToSend.append(key, value.toString());
        }
      }
    });

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast.success('Profile updated successfully');
      router.push('/profile');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Header */}
          <div className="border dark:border-[#333333] rounded-xl shadow-sm p-6 text-card-foreground">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Video />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="image-upload"
                  className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full cursor-pointer transform translate-x-1/4 translate-y-1/4"
                >
                  <Upload />
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="text-center sm:text-left flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    required
                    className="block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
                  />
                  <input
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    required
                    className="block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <input
                    type="number"
                    placeholder="Age"
                    value={formData.age}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        age: parseInt(e.target.value),
                      }))
                    }
                    required
                    className="block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
                  />
                  <Select
                    value={formData.gender}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, gender: value }))
                    }
                  >
                    <SelectTrigger
                      className="w-full h-8 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30"
                    >
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-input">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="border dark:border-[#333333] rounded-xl shadow-sm p-6 text-card-foreground">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Phone />
                Contact Information
              </h2>
              <div className="space-y-4">
                <input
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, phone: e.target.value }))
                  }
                  required
                  className="block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
                />
                <input
                  placeholder="Address"
                  value={formData.address}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, address: e.target.value }))
                  }
                  className="block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border dark:border-[#333333] rounded-xl shadow-sm p-6 text-card-foreground">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Emergency />
                Emergency Contact
              </h2>
              <div className="space-y-4">
                <input
                  placeholder="Emergency Contact Name"
                  value={formData.emergencyContact}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      emergencyContact: e.target.value,
                    }))
                  }
                  required
                  className="block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
                />
                <input
                  placeholder="Emergency Contact Phone"
                  value={formData.emergencyPhone}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      emergencyPhone: e.target.value,
                    }))
                  }
                  required
                  className="block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
                />
              </div>
            </div>

            {/* Therapy Preferences */}
            <div className="border dark:border-[#333333] rounded-xl shadow-sm p-6 text-card-foreground">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Video />
                Therapy Preferences
              </h2>
              <div className="space-y-4">
                <Select
                  value={formData.preferredCommunication}
                  onValueChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      preferredCommunication: value,
                    }))
                  }
                >
                  <SelectTrigger
                    className="w-full h-8 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30"
                  >
                    <SelectValue placeholder="Preferred Communication" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-input">
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="audio">Audio Call</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Previous Therapy Experience
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="therapyHistory"
                        value="yes"
                        checked={formData.therapyHistory === 'yes'}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            therapyHistory: e.target.value,
                          }))
                        }
                        className="text-primary cursor-pointer"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="therapyHistory"
                        value="no"
                        checked={formData.therapyHistory === 'no'}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            therapyHistory: e.target.value,
                          }))
                        }
                        className="text-primary cursor-pointer"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="border dark:border-[#333333] rounded-xl shadow-sm p-6 text-card-foreground">
              <h2 className="text-lg font-semibold mb-4">About Me</h2>
              <textarea
                placeholder="Tell us about yourself..."
                value={formData.briefBio}
                onChange={e =>
                  setFormData(prev => ({ ...prev, briefBio: e.target.value }))
                }
                rows={4}
                required
                className="block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
              />
            </div>
          </div>

          {/* Areas of Focus */}
          <div className="border dark:border-[#333333] rounded-xl shadow-sm p-6 text-card-foreground">
            <h2 className="text-lg font-semibold mb-4">Areas of Focus</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {struggleOptions.map(struggle => (
                <label
                  key={struggle}
                  className={`inline-flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    formData.struggles.includes(struggle)
                      ? 'block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input'
                      : 'block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.struggles.includes(struggle)}
                    onChange={() => {
                      setFormData(prev => ({
                        ...prev,
                        struggles: prev.struggles.includes(struggle)
                          ? prev.struggles.filter(s => s !== struggle)
                          : [...prev.struggles, struggle],
                      }));
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{struggle}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary text-primary-foreground py-2 px-4 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
