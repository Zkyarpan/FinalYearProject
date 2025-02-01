'use client';

import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import Loader from '@/components/common/Loader';
import { ArrowRight } from 'lucide-react';
import StyledCountrySelect from './CountrySelect';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from './ui/select';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import Clock from '@/icons/Clock';
import VerificationDialog from './VerificationDialog';

const PsychologistRegister = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const [countries, setCountries] = useState<
    { label: string; value: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const specializations = [
    { value: 'anxiety_depression', label: 'Anxiety & Depression' },
    { value: 'trauma_ptsd', label: 'Trauma & PTSD' },
    { value: 'relationships', label: 'Relationship Issues' },
    { value: 'stress', label: 'Stress Management' },
    { value: 'family_therapy', label: 'Family Therapy' },
    { value: 'child_psychology', label: 'Child Psychology' },
    { value: 'addiction', label: 'Addiction' },
    { value: 'grief', label: 'Grief Counseling' },
    { value: 'eating_disorders', label: 'Eating Disorders' },
    { value: 'ocd', label: 'OCD' },
    { value: 'bipolar', label: 'Bipolar Disorder' },
    { value: 'career', label: 'Career Counseling' },
  ];

  interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    country: string;
    streetAddress: string;
    city: string;
    about: string;
    profilePhoto: File | null;
    certificateOrLicense: File | null;
    profilePhotoPreview: string;
    certificateOrLicensePreview: string;
    licenseType: string;
    licenseNumber: string;
    yearsOfExperience: string;
    education: {
      degree: string;
      university: string;
      graduationYear: string;
    }[];
    languages: string[];
    specializations: string[];
    sessionDuration: string;
    sessionFee: string;
    sessionFormats: string[];
    acceptsInsurance: boolean;
    insuranceProviders: string[];
    acceptingNewClients: boolean;
    ageGroups: string[];
    availability: {
      [key: string]: {
        available: boolean;
        startTime: string;
        endTime: string;
      };
    };
  }

  const [formData, setFormData] = useState<FormData>({
    // Basic Information
    firstName: '',
    lastName: '',
    email: '',
    password: '',

    // Location Details
    country: '',
    streetAddress: '',
    city: '',

    // Profile & Documentation
    about: '',
    profilePhoto: null,
    certificateOrLicense: null,
    profilePhotoPreview: '',
    certificateOrLicensePreview: '',

    // Professional Qualifications
    licenseType: '',
    licenseNumber: '',
    yearsOfExperience: '',
    education: [
      {
        degree: '',
        university: '',
        graduationYear: '',
      },
    ],
    languages: [],
    specializations: [],

    // Session Details
    sessionDuration: '50', // default to standard therapy hour
    sessionFee: '',
    sessionFormats: [] as string[], // ['in-person', 'video', 'phone']

    // Insurance
    acceptsInsurance: false,
    insuranceProviders: [],

    // Practice Details
    acceptingNewClients: true,
    ageGroups: [] as string[], // ['children', 'teenagers', 'adults', 'seniors']

    // Availability
    availability: {
      monday: { available: false, startTime: '', endTime: '' },
      tuesday: { available: false, startTime: '', endTime: '' },
      wednesday: { available: false, startTime: '', endTime: '' },
      thursday: { available: false, startTime: '', endTime: '' },
      friday: { available: false, startTime: '', endTime: '' },
      saturday: { available: false, startTime: '', endTime: '' },
      sunday: { available: false, startTime: '', endTime: '' },
    },
  });

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const fetchCountries = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('https://restcountries.com/v3.1/all', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (isMounted) {
          const countryOptions = data
            .sort((a: any, b: any) =>
              a.name.common.localeCompare(b.name.common)
            )
            .map((country: any) => ({
              label: country.name.common,
              value: country.cca2,
            }));

          setCountries(countryOptions);
          setIsLoading(false);
          retryCount = 0;
        }
      } catch (error) {
        console.error('Error fetching countries:', error);

        if (isMounted) {
          setError('Failed to load countries. Retrying...');
          retryCount++;

          if (retryCount < MAX_RETRIES) {
            setTimeout(fetchCountries, 3000);
          } else {
            setError(
              'Failed to load countries. Please refresh the page or try again later.'
            );
            setIsLoading(false);
          }
        }
      }
    };

    fetchCountries();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: { target: { name: any; files: any } }) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      const previewURL = URL.createObjectURL(file);
      setFormData({
        ...formData,
        [name]: file,
        [`${name}Preview`]: previewURL,
      });
    }
  };

  const handleArrayInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string
  ) => {
    const values = e.target.value
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '');

    setFormData(prev => ({
      ...prev,
      [field]: values,
    }));
  };

  const handleEducationChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'degree' | 'university' | 'graduationYear',
    index: number = 0
  ) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      ),
    }));
  };
  const handleSpecializationSelect = (value: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(value)
        ? prev.specializations.filter(s => s !== value)
        : [...prev.specializations, value],
    }));
  };

  const [availability, setAvailability] = useState({
    monday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    tuesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    wednesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    thursday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    friday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    saturday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    sunday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  });

  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const handleToggleDay = day => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const handleTimeChange = (day, type, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: value,
      },
    }));
  };

  useEffect(() => {
    return () => {
      if (formData.profilePhotoPreview) {
        URL.revokeObjectURL(formData.profilePhotoPreview);
      }
    };
  }, [formData.profilePhotoPreview]);

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);

    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'country',
      'streetAddress',
      'city',
      'about',
      'password',
    ];

    const professionalRequiredFields = [
      'licenseNumber',
      'licenseType',
      'yearsOfExperience',
      'sessionDuration',
      'sessionFee',
    ];

    const allRequiredFields = [
      ...requiredFields,
      ...professionalRequiredFields,
    ];

    const missingFields = allRequiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      toast.error(`Please fill in ${missingFields.join(', ')} fields`);
      setIsLoading(false);
      return;
    }

    // Validation checks
    if (formData.specializations.length === 0) {
      toast.error('Please select at least one specialization');
      setIsLoading(false);
      return;
    }

    if (formData.sessionFormats.length === 0) {
      toast.error('Please select at least one session format');
      setIsLoading(false);
      return;
    }

    if (formData.languages.length === 0) {
      toast.error('Please select at least one language');
      setIsLoading(false);
      return;
    }

    if (!formData.profilePhoto || !formData.certificateOrLicense) {
      toast.error(
        `${!formData.profilePhoto ? 'Profile photo' : 'Certificate or license'} is required.`
      );
      setIsLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (key.endsWith('Preview')) return;

      if (
        Array.isArray(formData[key]) ||
        (typeof formData[key] === 'object' && !(formData[key] instanceof File))
      ) {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else if (formData[key] instanceof File) {
        formDataToSend.append(key, formData[key]);
      } else {
        formDataToSend.append(key, formData[key]?.toString() || '');
      }
    });

    try {
      const response = await fetch('/api/psychologist', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.ErrorMessage?.[0]?.message || 'Registration failed'
        );
      }

      if (data.StatusCode === 200 && data.Result?.token) {
        // Store the verification token
        localStorage.setItem('verificationToken', data.Result.token);

        // Show verification dialog
        setVerificationEmail(formData.email);
        setShowVerificationDialog(true);

        toast.success(
          data.Result.message ||
            'Please verify your email to complete registration.'
        );
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <form onSubmit={handleSubmit}>
          <div className="space-y-12">
            <div className="border-b border-[hsl(var(--border))] pb-12">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl main-font font-bold text-[hsl(var(--foreground))]">
                  Personal Information
                </h2>
              </div>
              <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))] border-l-4 border-[hsl(var(--primary))] pl-4">
                Provide accurate details for verification purposes.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    First Name
                  </label>
                  <div className="mt-2">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      autoComplete="given-name"
                      className="block w-full rounded-md dark:bg-input px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    Last Name
                  </label>
                  <div className="mt-2">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      autoComplete="family-name"
                      className="block w-full rounded-md dark:bg-input px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    Email Address
                  </label>
                  <div className="mt-2">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      className="block w-full rounded-md dark:bg-input px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3 relative">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    Password
                  </label>
                  <div className="mt-2 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      className="block w-full rounded-md dark:bg-input px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-0 h-8 w-8 text-foreground/50 hover:text-foreground/70 hover:bg-transparent focus:bg-transparent active:bg-transparent transition-none"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3 7c3.6 7.8 14.4 7.8 18 0m-3.22 3.982L21 15.4m-9-2.55v4.35m-5.78-6.218L3 15.4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3 12.85c3.6-7.8 14.4-7.8 18 0m-9 4.2a2.4 2.4 0 110-4.801 2.4 2.4 0 010 4.801z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          ></path>
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>

                {countries && countries.length > 0 && (
                  <StyledCountrySelect
                    formData={formData}
                    handleChange={handleChange}
                    countries={countries}
                  />
                )}

                <div className="col-span-3">
                  <label
                    htmlFor="streetAddress"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    Street Address
                  </label>
                  <div className="mt-2">
                    <input
                      id="streetAddress"
                      name="streetAddress"
                      type="text"
                      value={formData.streetAddress}
                      onChange={handleChange}
                      autoComplete="street-address"
                      className="block w-full rounded-md dark:bg-input px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    City
                  </label>
                  <div className="mt-2">
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleChange}
                      autoComplete="address-level2"
                      className="block w-full rounded-md dark:bg-input px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                    />
                  </div>
                </div>

                <Card className="col-span-full bg-card border">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Label htmlFor="degree">Education</Label>
                      <input
                        id="degree"
                        name="degree"
                        placeholder="Degree (e.g., Ph.D. in Psychology)"
                        value={formData.education[0]?.degree || ''}
                        onChange={e => handleEducationChange(e, 'degree', 0)}
                        className="block w-full rounded-md dark:bg-input px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                      />
                      <input
                        id="university"
                        name="university"
                        placeholder="University"
                        value={formData.education[0]?.university || ''}
                        onChange={e =>
                          handleEducationChange(e, 'university', 0)
                        }
                        className="block w-full rounded-md dark:bg-input px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                      />
                      <input
                        id="graduationYear"
                        name="graduationYear"
                        placeholder="Graduation Year"
                        value={formData.education[0]?.graduationYear || ''}
                        onChange={e =>
                          handleEducationChange(e, 'graduationYear', 0)
                        }
                        className="block w-full rounded-md dark:bg-input px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="border-b border-[hsl(var(--border))] pb-12">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl main-font font-bold text-[hsl(var(--foreground))] mt-10">
                  Build Your Professional Identity
                </h2>
              </div>
              <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))] border-l-4 border-[hsl(var(--primary))] pl-4">
                Share your credentials and professional details to help us
                verify your expertise and establish trust with potential
                clients.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="col-span-full">
                  <label
                    htmlFor="profilePhoto"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    Profile Photo
                  </label>
                  <div className="mt-2 flex items-center gap-x-3">
                    {formData.profilePhotoPreview ? (
                      <img
                        src={formData.profilePhotoPreview}
                        alt="Profile Preview"
                        className="w-16 h-16 rounded-full object-cover "
                      />
                    ) : (
                      <UserCircleIcon
                        aria-hidden="true"
                        className="w-16 h-16 text-[hsl(var(--muted-foreground))]"
                      />
                    )}
                    <input
                      type="file"
                      id="profilePhoto"
                      name="profilePhoto"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="profilePhoto"
                      className="rounded-md bg-[hsl(var(--card))] px-2.5 py-1.5 text-sm font-semibold text-[hsl(var(--foreground))] shadow-sm ring-1 ring-inset ring-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] cursor-pointer"
                    >
                      {formData.profilePhotoPreview ? 'Change' : 'Upload'} Photo
                    </label>
                  </div>
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                    Upload a professional profile photo to help clients
                    recognize you.
                  </p>
                </div>

                <div className="col-span-full">
                  <label
                    htmlFor="about"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    About
                  </label>
                  <div className="mt-2">
                    <textarea
                      id="about"
                      name="about"
                      rows={3}
                      value={formData.about}
                      onChange={handleChange}
                      className="block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
                    />
                  </div>
                  <p className="mt-3 text-xs italic text-[hsl(var(--muted-foreground))]">
                    Write a few sentences about your qualifications and
                    experience.
                  </p>
                </div>

                <div className="col-span-full">
                  <label
                    htmlFor="certificateOrLicense"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    Certificate or License
                  </label>
                  <div className="mt-2 flex justify-center rounded-lg border border-dashed border-[hsl(var(--border))] px-6 py-10 dark:bg-input">
                    <div className="text-center">
                      {formData.certificateOrLicensePreview ? (
                        <img
                          src={formData.certificateOrLicensePreview}
                          alt="Certificate Preview"
                          className="mx-auto w-32 h-32 object-contain"
                        />
                      ) : (
                        <PhotoIcon
                          aria-hidden="true"
                          className="mx-auto w-12 h-12 text-[hsl(var(--muted-foreground))]"
                        />
                      )}
                      <input
                        type="file"
                        id="certificateOrLicense"
                        name="certificateOrLicense"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="certificateOrLicense"
                        className="mt-4 inline-block rounded-md px-4 py-2 text-sm font-semibold focus-within:outline-none focus-within:ring-2 focus-within:ring-[hsl(var(--primary))] focus-within:ring-offset-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] cursor-pointer"
                      >
                        {formData.certificateOrLicensePreview
                          ? 'Change File'
                          : 'Upload File'}
                      </label>
                      <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-b border-[hsl(var(--border))] pb-12">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl main-font font-bold text-[hsl(var(--foreground))]">
                  Professional Qualifications
                </h2>
              </div>
              <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))] border-l-4 border-[hsl(var(--primary))] pl-4">
                Share your professional credentials and expertise.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label
                    htmlFor="licenseType"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    License Type
                  </label>
                  <Select
                    value={formData.licenseType}
                    onValueChange={value =>
                      handleChange({ target: { name: 'licenseType', value } })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select license type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinical_psychologist">
                        Clinical Psychologist
                      </SelectItem>
                      <SelectItem value="counseling_psychologist">
                        Counseling Psychologist
                      </SelectItem>
                      <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                      <SelectItem value="mental_health_counselor">
                        Mental Health Counselor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-3 space-y-2">
                  <Label htmlFor="specialization">
                    Areas of Specialization
                  </Label>

                  <Select
                    onValueChange={value => handleSpecializationSelect(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      {specializations.map(spec => (
                        <SelectItem key={spec.value} value={spec.value}>
                          {spec.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="licenseNumber"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    License Number
                  </label>
                  <div className="mt-2">
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="block w-full"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="yearsOfExperience"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    Years of Experience
                  </label>
                  <div className="mt-2">
                    <Input
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      type="number"
                      min="0"
                      value={formData.yearsOfExperience}
                      onChange={handleChange}
                      className="block w-full"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label
                    htmlFor="languages"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    Languages Spoken
                  </label>
                  <div className="mt-2">
                    <Input
                      id="languages"
                      name="languages"
                      value={formData.languages.join(', ')}
                      onChange={e => handleArrayInput(e, 'languages')}
                      placeholder="Enter languages (comma-separated)"
                      className="block w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-[hsl(var(--border))] pb-12">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl main-font font-bold text-[hsl(var(--foreground))]">
                  Session Information
                </h2>
              </div>
              <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))] border-l-4 border-[hsl(var(--primary))] pl-4">
                Define your session preferences and availability.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label
                    htmlFor="sessionDuration"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    Session Duration
                  </label>
                  <Select
                    value={formData.sessionDuration.toString()}
                    onValueChange={value =>
                      handleChange({
                        target: {
                          name: 'sessionDuration',
                          value: parseInt(value),
                        },
                      })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="50">50 minutes</SelectItem>
                      <SelectItem value="80">80 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="sessionFee"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    Session Fee (USD)
                  </label>
                  <div className="mt-2">
                    <Input
                      id="sessionFee"
                      name="sessionFee"
                      type="number"
                      min="0"
                      value={formData.sessionFee}
                      onChange={handleChange}
                      className="block w-full"
                    />
                  </div>
                </div>

                <div className="sm:col-span-full">
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))]">
                    Session Formats
                  </label>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {['in-person', 'video', 'phone'].map(format => (
                      <div key={format} className="flex items-center space-x-2">
                        <Checkbox
                          id={format}
                          checked={formData.sessionFormats.includes(format)}
                          onCheckedChange={checked => {
                            const newFormats = checked
                              ? [...formData.sessionFormats, format]
                              : formData.sessionFormats.filter(
                                  f => f !== format
                                );
                            handleChange({
                              target: {
                                name: 'sessionFormats',
                                value: newFormats,
                              },
                            });
                          }}
                        />
                        <label
                          htmlFor={format}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {format.charAt(0).toUpperCase() + format.slice(1)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-[hsl(var(--border))] pb-12">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl main-font font-bold text-[hsl(var(--foreground))]">
                  Practice Details
                </h2>
              </div>
              <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))] border-l-4 border-[hsl(var(--primary))] pl-4">
                Specify your practice preferences and client focus.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="acceptingNewClients"
                    checked={formData.acceptingNewClients}
                    onCheckedChange={checked =>
                      handleChange({
                        target: { name: 'acceptingNewClients', value: checked },
                      })
                    }
                  />
                  <label
                    htmlFor="acceptingNewClients"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Currently Accepting New Clients
                  </label>
                </div>

                <div className="sm:col-span-full">
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-4">
                    Age Groups
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {['children', 'teenagers', 'adults', 'seniors'].map(
                      ageGroup => (
                        <div
                          key={ageGroup}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={ageGroup}
                            checked={formData.ageGroups.includes(ageGroup)}
                            onCheckedChange={checked => {
                              const newAgeGroups = checked
                                ? [...formData.ageGroups, ageGroup]
                                : formData.ageGroups.filter(
                                    g => g !== ageGroup
                                  );
                              handleChange({
                                target: {
                                  name: 'ageGroups',
                                  value: newAgeGroups,
                                },
                              });
                            }}
                          />
                          <label
                            htmlFor={ageGroup}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {ageGroup.charAt(0).toUpperCase() +
                              ageGroup.slice(1)}
                          </label>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 border-b pb-12">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl main-font font-bold text-[hsl(var(--foreground))]">
                  Insurance Information
                </h2>
              </div>
              <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))] border-l-4 border-[hsl(var(--primary))] pl-4">
                Specify your Insurance Providers.
              </p>
              <div className="flex items-center space-x-2">
                <Switch
                  id="acceptsInsurance"
                  checked={formData.acceptsInsurance}
                  onCheckedChange={checked =>
                    handleChange({
                      target: { name: 'acceptsInsurance', value: checked },
                    })
                  }
                />
                <Label htmlFor="acceptsInsurance">Accept Insurance</Label>
              </div>

              {formData.acceptsInsurance && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="insuranceProviders">
                    Insurance Providers
                  </Label>
                  <Textarea
                    id="insuranceProviders"
                    placeholder="Enter insurance providers (comma-separated)"
                    value={formData.insuranceProviders.join(', ')}
                    onChange={e => handleArrayInput(e, 'insuranceProviders')}
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </div>

            <div className="w-full max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Clock />
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl main-font font-bold text-[hsl(var(--foreground))]">
                    Weekly Availability
                  </h2>
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(availability).map(
                  ([day, { enabled, startTime, endTime }]) => (
                    <div key={day} className="flex items-center gap-6">
                      <div className="flex items-center gap-2 w-40">
                        <Switch
                          checked={enabled}
                          onCheckedChange={() => handleToggleDay(day)}
                          className="data-[state=checked]:bg-blue-600"
                        />
                        <Label className="capitalize font-medium">{day}</Label>
                      </div>

                      {enabled && (
                        <div className="flex items-center gap-4">
                          <Select
                            value={startTime}
                            onValueChange={value =>
                              handleTimeChange(day, 'startTime', value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Start time" />
                            </SelectTrigger>
                            <SelectContent className="h-48">
                              {timeSlots.map(time => (
                                <SelectItem key={`start-${time}`} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <span className="text-sm text-gray-500">to</span>

                          <Select
                            value={endTime}
                            onValueChange={value =>
                              handleTimeChange(day, 'endTime', value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="End time" />
                            </SelectTrigger>
                            <SelectContent className="h-48">
                              {timeSlots.map(time => (
                                <SelectItem key={`end-${time}`} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )
                )}

                <div className="mt-6 flex items-center justify-end gap-x-6 pb-10">
                  <Link
                    href={`/signup`}
                    className="rounded-md bg-[hsl(var(--secondary))] px-3 py-2 text-sm font-semibold text-[hsl(var(--secondary-foreground))] shadow-sm hover:bg-[hsl(var(--secondary))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--secondary))] dark:bg-input"
                  >
                    Go Back
                  </Link>

                  <Button
                    type="submit"
                    className={`rounded-md bg-[hsl(var(--primary))] px-3 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-sm hover:bg-[hsl(var(--primary))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--primary))] flex items-center justify-center gap-2 ${
                      isLoading ? 'cursor-not-allowed opacity-75' : ''
                    }`}
                    disabled={isLoading}
                  >
                    <div className="flex items-center justify-center relative min-w-[150px]">
                      {isLoading ? (
                        <Loader />
                      ) : (
                        <>
                          Complete Verification{' '}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
        <VerificationDialog
          isOpen={showVerificationDialog}
          onClose={() => setShowVerificationDialog(false)}
          email={verificationEmail}
          onVerificationComplete={() => {
            setShowVerificationDialog(false);
            toast.success('Registration completed successfully!');
            router.push('/psychologist/dashboard');
          }}
          isLoading={isLoading}
        />
      </div>
    </>
  );
};
export default PsychologistRegister;
