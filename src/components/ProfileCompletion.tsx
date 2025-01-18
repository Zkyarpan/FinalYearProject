'use client';

import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from './ui/textarea';
import Loader from '@/components/common/Loader';
import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import SpinnerLoader from '@/components/SpinnerLoader';
import { useUserStore } from '@/store/userStore';

const ProfileCompletion = () => {
  const router = useRouter();
  const { updateProfile } = useUserStore();
  interface FormData {
    firstName: string;
    lastName: string;
    age: string;
    gender: string;
    phone: string;
    address: string;
    emergencyContact: string;
    emergencyPhone: string;
    therapyHistory: string;
    preferredCommunication: string;
    briefBio: string;
    struggles: string[];
    image: string | File | null;
  }
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    therapyHistory: 'no',
    preferredCommunication: 'video',
    briefBio: '',
    struggles: [],
    image: null,
  });

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    age?: string;
    phone?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    briefBio?: string;
    struggles?: string;
  }>({});

  const struggleOptions = [
    'Anxiety',
    'Depression',
    'Stress',
    'Sleep Issues',
    'Relationships',
    'Work-Life Balance',
    'Trauma',
    'Other',
  ];

  const handleInputChange = e => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      setFormData(prev => ({
        ...prev,
        image: file,
      }));
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleStruggleToggle = struggle => {
    setFormData(prev => ({
      ...prev,
      struggles: prev.struggles.includes(struggle)
        ? prev.struggles.filter(s => s !== struggle)
        : [...prev.struggles, struggle],
    }));
  };

  const validateForm = () => {
    const newErrors: Partial<typeof errors> = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.age || parseInt(formData.age) < 18)
      newErrors.age = 'Must be 18 or older';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.emergencyContact)
      newErrors.emergencyContact = 'Emergency contact is required';
    if (!formData.emergencyPhone)
      newErrors.emergencyPhone = 'Emergency contact phone is required';
    if (formData.briefBio.length < 20)
      newErrors.briefBio = 'Provide a more detailed bio about 20 characters';
    if (formData.struggles.length === 0)
      newErrors.struggles = 'Please select at least one option';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setIsRedirecting(true);

      try {
        const formDataObj = new FormData();

        Object.entries(formData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (key === 'struggles' && Array.isArray(value)) {
              formDataObj.append(key, value.join(','));
            } else if (key === 'image' && value instanceof File) {
              formDataObj.append(key, value);
            } else {
              formDataObj.append(key, value.toString());
            }
          }
        });

        const response = await fetch('/api/user', {
          method: 'POST',
          body: formDataObj,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to complete profile');
        }

        updateProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          profileImage: data.Result?.profileImage || null,
        });

        toast.success('Profile completed successfully!');
        setTimeout(() => {
          router.push('/account');
        }, 500);
      } catch (error) {
        console.error('Error submitting profile:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to complete profile'
        );
        setIsRedirecting(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <>
      {isRedirecting && <SpinnerLoader isLoading={isRedirecting} />}
      <Card className="w-full max-w-4xl mx-auto rounded-2xl dark:bg-[#171717]">
        <CardHeader>
          <CardTitle className="text-xl text-center">
            Welcome to Mentality
          </CardTitle>
          <p className="text-sm text-center">
            First things first, tell us a bit about yourself!
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500 relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-background flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-image"
                  />
                  <label
                    htmlFor="profile-image"
                    className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity"
                  >
                    <span className="sr-only">Upload Profile Picture</span>
                  </label>
                </div>
                <label
                  htmlFor="image-upload"
                  className="absolute bottom-10 right-2 bg-blue-500 text-white p-1 rounded-full cursor-pointer"
                  style={{ transform: 'translate(50%, 50%)' }}
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <p className="text-center mt-2 text-sm text-gray-700 dark:text-gray-300">
                  Upload Photo
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name *
                </label>
                <Input
                  id="firstName"
                  type="text"
                  className="w-full h-8 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">
                  Last Name *
                </label>
                <Input
                  id="lastName"
                  type="text"
                  className="w-full h-8 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs">{errors.lastName}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="age" className="text-sm font-medium">
                  Age *
                </label>
                <Input
                  id="age"
                  type="number"
                  className="w-full h-8 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30"
                  value={formData.age}
                  onChange={handleInputChange}
                />
                {errors.age && (
                  <p className="text-red-500 text-xs">{errors.age}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="gender" className="text-sm font-medium">
                  Gender
                </label>
                <Select
                  value={formData.gender}
                  onValueChange={value =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger
                    className="w-full h-8 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30"
                  >
                    <SelectValue
                      placeholder="Select Gender"
                      className="text-foreground"
                    />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-input">
                    <SelectItem
                      value="male"
                      className="text-foreground hover:bg-muted"
                    >
                      Male
                    </SelectItem>
                    <SelectItem
                      value="female"
                      className="text-foreground hover:bg-muted"
                    >
                      Female
                    </SelectItem>
                    <SelectItem
                      value="other"
                      className="text-foreground hover:bg-muted"
                    >
                      Other
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  Address
                </label>
                <Input
                  id="address"
                  className="w-full h-8 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30"
                  value={formData.address}
                  onChange={handleInputChange}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number *
                </label>
                <Input
                  id="phone"
                  type="tel"
                  className="w-full h-8 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs">{errors.phone}</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium dark:border-foreground/30">
                Have you been in therapy before?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative flex items-center h-9 px-4 rounded-lg dark:bg-input cursor-pointer hover:bg-muted transition-colors group border dark:border-foreground/30 ">
                  <Input
                    type="radio"
                    name="therapyHistory"
                    value="yes"
                    checked={formData.therapyHistory === 'yes'}
                    onChange={e => {
                      setFormData({
                        ...formData,
                        therapyHistory: e.target.value,
                      });
                    }}
                    className="peer sr-only"
                  />
                  <div className="w-4 h-4 border-2 rounded-full border-gray-500 group-hover:border-blue-500 peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all">
                    <div className="w-full h-full rounded-full scale-0 peer-checked:scale-[0.4] bg-white transition-transform" />
                  </div>
                  <span className="ml-3 text-sm font-medium">Yes</span>
                </label>
                <label className="relative flex items-center h-9 px-4 rounded-lg dark:bg-input cursor-pointer hover:bg-muted transition-colors group border dark:border-foreground/30">
                  <Input
                    type="radio"
                    name="therapyHistory"
                    value="no"
                    checked={formData.therapyHistory === 'no'}
                    onChange={e => {
                      setFormData({
                        ...formData,
                        therapyHistory: e.target.value,
                      });
                    }}
                    className="peer sr-only"
                  />
                  <div className="w-4 h-4 border-2 rounded-full border-gray-500  group-hover:border-blue-500 peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all">
                    <div className="w-full h-full rounded-full scale-0 peer-checked:scale-[0.4] bg-white transition-transform" />
                  </div>
                  <span className="ml-3 text-sm font-medium">No</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="emergencyContact"
                  className="text-sm font-medium"
                >
                  Emergency Contact Name *
                </label>
                <Input
                  id="emergencyContact"
                  type="text"
                  className="w-full h-8 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                />
                {errors.emergencyContact && (
                  <p className="text-red-500 text-xs">
                    {errors.emergencyContact}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="emergencyPhone" className="text-sm font-medium">
                  Emergency Contact Phone *
                </label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  className="w-full h-8 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                />
                {errors.emergencyPhone && (
                  <p className="text-red-500 text-xs">
                    {errors.emergencyPhone}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="preferredCommunication"
                className="text-sm font-medium"
              >
                Preferred Mode of Communication
              </label>
              <Select
                value={formData.preferredCommunication}
                onValueChange={value =>
                  setFormData({
                    ...formData,
                    preferredCommunication: value,
                  })
                }
              >
                <SelectTrigger
                  className="w-full h-10 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30"
                >
                  <SelectValue
                    placeholder="Select Communication Mode "
                    children={
                      formData.preferredCommunication
                        ? formData.preferredCommunication
                            .charAt(0)
                            .toUpperCase() +
                          formData.preferredCommunication
                            .slice(1)
                            .replace(/-/g, ' ')
                        : ''
                    }
                  />
                </SelectTrigger>
                <SelectContent className="dark:bg-input">
                  <SelectItem value="video">Video Call</SelectItem>
                  <SelectItem value="audio">Audio Call</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ">
                What areas are you looking to work on? *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {struggleOptions.map(struggle => (
                  <label
                    key={struggle}
                    className={`text-xs flex items-center p-2 rounded-lg cursor-pointer transition-colors
              dark:bg-input border border-border
              ${
                formData.struggles.includes(struggle)
                  ? 'dark:bg-input bg-primary/20 text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.struggles.includes(struggle)}
                      onChange={() => handleStruggleToggle(struggle)}
                      className="mr-2 accent-primary"
                    />
                    <span className="text-foreground">{struggle}</span>
                  </label>
                ))}
              </div>
              {errors.struggles && (
                <p className="text-destructive text-xs">{errors.struggles}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="briefBio" className="text-sm font-medium">
                Tell us a bit about yourself and what brings you here *
              </label>
              <Textarea
                id="briefBio"
                className="w-full h-10 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30"
                rows={4}
                value={formData.briefBio}
                onChange={handleInputChange}
                placeholder="Share as much as you feel comfortable with..."
              />
              {errors.briefBio && (
                <p className="text-red-500 text-xs">{errors.briefBio}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                className={`w-full mt-5 font-semibold shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2 rounded-lg ${
                  isLoading ? 'cursor-not-allowed opacity-75' : ''
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader />
                ) : (
                  <>
                    Create Profile{' '}
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default ProfileCompletion;
