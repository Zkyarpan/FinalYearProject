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
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import SpinnerLoader from '@/components/SpinnerLoader';
import { useUserStore } from '@/store/userStore';
import { Progress } from '@/components/ui/progress';
import { DEFAULT_AVATAR } from '@/constants';

interface ProfileCompletionProps {
  onComplete?: () => void;
}

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

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({
  onComplete,
}) => {
  const router = useRouter();
  const { updateProfile } = useUserStore();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(DEFAULT_AVATAR);
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
    preferredCommunication: '',
    briefBio: '',
    struggles: [],
    image: null,
  });

  const [errors, setErrors] = useState<{
    [key in keyof FormData]?: string;
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));
    if (errors[id as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [id]: undefined,
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImageLoading(true);

      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (JPEG, PNG, or WebP)');
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
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to process image. Please try again.');
      setImagePreview(DEFAULT_AVATAR);
    } finally {
      setIsImageLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview !== DEFAULT_AVATAR) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleStruggleToggle = (struggle: string) => {
    setFormData(prev => ({
      ...prev,
      struggles: prev.struggles.includes(struggle)
        ? prev.struggles.filter(s => s !== struggle)
        : [...prev.struggles, struggle],
    }));
    if (errors.struggles) {
      setErrors(prev => ({
        ...prev,
        struggles: undefined,
      }));
    }
  };

  const validateCurrentStep = () => {
    const newErrors: { [key in keyof FormData]?: string } = {};

    switch (currentStep) {
      case 1:
        if (!formData.firstName.trim())
          newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim())
          newErrors.lastName = 'Last name is required';
        if (!formData.age) newErrors.age = 'Age is required';
        if (formData.age && parseInt(formData.age) < 18)
          newErrors.age = 'Must be 18 or older';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        break;

      case 2:
        if (!formData.phone.trim())
          newErrors.phone = 'Phone number is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.emergencyContact.trim())
          newErrors.emergencyContact = 'Emergency contact is required';
        if (!formData.emergencyPhone.trim())
          newErrors.emergencyPhone = 'Emergency contact phone is required';
        if (
          formData.phone &&
          !/^\+?[\d\s-]{10,}$/.test(formData.phone.trim())
        ) {
          newErrors.phone = 'Please enter a valid phone number';
        }
        if (
          formData.emergencyPhone &&
          !/^\+?[\d\s-]{10,}$/.test(formData.emergencyPhone.trim())
        ) {
          newErrors.emergencyPhone =
            'Please enter a valid emergency contact phone number';
        }
        break;

      case 3:
        if (!formData.preferredCommunication)
          newErrors.preferredCommunication =
            'Please select preferred communication mode';
        if (formData.struggles.length === 0)
          newErrors.struggles = 'Please select at least one area to work on';
        break;

      case 4:
        if (!formData.briefBio.trim()) newErrors.briefBio = 'Bio is required';
        if (formData.briefBio.trim().length < 20)
          newErrors.briefBio = 'Bio must be at least 20 characters';
        break;
    }

    return newErrors;
  };

  const handleNext = () => {
    const newErrors = validateCurrentStep();
    if (Object.keys(newErrors).length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      setErrors(newErrors);
      toast.error('Please fill in all required fields correctly');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validateCurrentStep();

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setIsRedirecting(true);

      try {
        const formDataObj = new FormData();

        Object.entries(formData).forEach(([key, value]) => {
          if (key === 'struggles' && Array.isArray(value)) {
            formDataObj.append(key, value.join(','));
          } else if (key === 'image') {
            if (value instanceof File) {
              formDataObj.append(key, value);
            }
          } else if (value !== null && value !== undefined) {
            formDataObj.append(key, value.toString());
          }
        });

        const response = await fetch('/api/user', {
          method: 'POST',
          body: formDataObj,
        });

        const data = await response.json();

        if (!data.IsSuccess) {
          const errorMessage =
            data.ErrorMessage?.[0]?.message || 'Failed to complete profile';
          toast.error(errorMessage);
          return;
        }

        updateProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          profileImage: data.Result?.image || DEFAULT_AVATAR,
        });

        toast.success('Profile completed successfully!');
        if (onComplete) {
          onComplete();
        }
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
      toast.error('Please fill in all required fields correctly');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500 relative group">
                  {isImageLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <Loader />
                    </div>
                  ) : (
                    <>
                      <img
                        src={imagePreview}
                        alt="Profile Preview"
                        className="w-full h-full object-cover transition-opacity duration-200"
                        onError={() => {
                          setImagePreview(DEFAULT_AVATAR);
                          setFormData(prev => ({ ...prev, image: null }));
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <p className="text-white text-xs">Change Photo</p>
                      </div>
                    </>
                  )}
                </div>
                <label
                  htmlFor="profile-image"
                  className="absolute bottom-10 right-2 bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full cursor-pointer shadow-lg transition-transform duration-200 hover:scale-110"
                  style={{ transform: 'translate(50%, 50%)' }}
                >
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    id="profile-image"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isImageLoading}
                  />
                </label>
                <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {formData.image ? 'Change Photo' : 'Upload Photo'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name *
                </label>
                <input
                  id="firstName"
                  type="text"
                  className={`block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input ${
                    errors.firstName ? 'border-red-500' : ''
                  }`}
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
                <input
                  id="lastName"
                  type="text"
                  className={`block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input ${
                    errors.lastName ? 'border-red-500' : ''
                  }`}
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
                <input
                  id="age"
                  type="number"
                  className={`block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input ${
                    errors.age ? 'border-red-500' : ''
                  }`}
                  value={formData.age}
                  onChange={handleInputChange}
                />
                {errors.age && (
                  <p className="text-red-500 text-xs">{errors.age}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="gender" className="text-sm font-medium">
                  Gender *
                </label>
                <Select
                  value={formData.gender}
                  onValueChange={value => {
                    setFormData({ ...formData, gender: value });
                    if (errors.gender) {
                      setErrors(prev => ({ ...prev, gender: undefined }));
                    }
                  }}
                >
                  <SelectTrigger
                    className={`w-full h-8 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30 ${
          errors.gender ? 'border-red-500' : ''
        }`}
                  >
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-input">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-red-500 text-xs">{errors.gender}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={`block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input ${
                    errors.phone ? 'border-red-500' : ''
                  }`}
                  value={formData.phone}
                  onChange={handleInputChange}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs">{errors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Address *
                </label>
                <input
                  id="address"
                  className={`block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input ${
                    errors.address ? 'border-red-500' : ''
                  }`}
                  value={formData.address}
                  onChange={handleInputChange}
                />
                {errors.address && (
                  <p className="text-red-500 text-xs">{errors.address}</p>
                )}
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
                <input
                  id="emergencyContact"
                  type="text"
                  className={`block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input ${
                    errors.emergencyContact ? 'border-red-500' : ''
                  }`}
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
                <input
                  id="emergencyPhone"
                  type="tel"
                  className={`block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input ${
                    errors.emergencyPhone ? 'border-red-500' : ''
                  }`}
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Have you been in therapy before? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative flex items-center h-9 px-4 rounded-lg dark:bg-input cursor-pointer hover:bg-muted transition-colors group border dark:border-foreground/30">
                  <input
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
                    className="peer sr-only "
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
                  <div className="w-4 h-4 border-2 rounded-full border-gray-500 group-hover:border-blue-500 peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all">
                    <div className="w-full h-full rounded-full scale-0 peer-checked:scale-[0.4] bg-white transition-transform" />
                  </div>
                  <span className="ml-3 text-sm font-medium">No</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="preferredCommunication"
                className="text-sm font-medium"
              >
                Preferred Mode of Communication *
              </label>
              <Select
                value={formData.preferredCommunication}
                onValueChange={value => {
                  setFormData({ ...formData, preferredCommunication: value });
                  if (errors.preferredCommunication) {
                    setErrors(prev => ({
                      ...prev,
                      preferredCommunication: undefined,
                    }));
                  }
                }}
              >
                <SelectTrigger
                  className={`w-full h-8 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30 ${
          errors.preferredCommunication ? 'border-red-500' : ''
        }`}
                >
                  <SelectValue placeholder="Select Communication Mode" />
                </SelectTrigger>
                <SelectContent className="dark:bg-input">
                  <SelectItem value="video">Video Call</SelectItem>
                  <SelectItem value="audio">Audio Call</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                </SelectContent>
              </Select>
              {errors.preferredCommunication && (
                <p className="text-red-500 text-xs">
                  {errors.preferredCommunication}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                What areas are you looking to work on? *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {struggleOptions.map(struggle => (
                  <label
                    key={struggle}
                    className={`text-xs flex items-center p-2 rounded-lg cursor-pointer transition-colors
                      dark:bg-input border ${
                        errors.struggles ? 'border-red-500' : 'border-border'
                      }
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
                <p className="text-red-500 text-xs">{errors.struggles}</p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="briefBio" className="text-sm font-medium">
                Tell us a bit about yourself and what brings you here *
              </label>
              <Textarea
                id="briefBio"
                className={`w-full h-40 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30 ${
          errors.briefBio ? 'border-red-500' : ''
        }`}
                rows={6}
                value={formData.briefBio}
                onChange={handleInputChange}
                placeholder="Share as much as you feel comfortable with..."
              />
              {errors.briefBio && (
                <p className="text-red-500 text-xs">{errors.briefBio}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {isRedirecting && <SpinnerLoader isLoading={isRedirecting} />}
      <div className="w-full bg-[#171717] rounded-2xl overflow-hidden">
        <div className="p-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold main-font">
              Welcome to Mentality
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentStep === 1 && "Let's start with your basic information"}
              {currentStep === 2 && "Now, let's get your contact details"}
              {currentStep === 3 && 'Tell us about your therapy preferences'}
              {currentStep === 4 && 'Finally, share a bit about yourself'}
            </p>
            <div className="mt-4">
              <Progress
                value={(currentStep / totalSteps) * 100}
                className="h-2"
              />
              <p className="text-sm text-center mt-2 text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {renderStepContent()}

              <div className="flex justify-between mt-8">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleBack}
                    className="flex items-center gap-2 dark:bg-input border"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                )}
                <div className="flex-1" />
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className={`flex items-center gap-2 ${
                      isLoading ? 'cursor-not-allowed opacity-75' : ''
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader />
                    ) : (
                      <>
                        Complete Profile
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileCompletion;
