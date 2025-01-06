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

const PsychologistRegister = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countries, setCountries] = useState<
    { label: string; value: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    streetAddress: '',
    city: '',
    stateOrProvince: '',
    postalCode: '',
    about: '',
    profilePhotoUrl: null,
    certificateOrLicense: null,
    profilePhotoPreview: '',
    certificateOrLicensePreview: '',
    password: '',
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

  useEffect(() => {
    return () => {
      if (formData.profilePhotoPreview) {
        URL.revokeObjectURL(formData.profilePhotoPreview);
      }
    };
  }, [formData.profilePhotoPreview]);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsLoading(true);

    const requiredFields = [
      'username',
      'firstName',
      'lastName',
      'email',
      'country',
      'streetAddress',
      'city',
      'stateOrProvince',
      'postalCode',
      'about',
      'password',
    ];
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      toast.error(`Please fill in all fields.`);
      setIsLoading(false);
      return;
    }
    if (!formData.profilePhotoPreview || !formData.certificateOrLicense) {
      toast.error(
        `${!formData.profilePhotoPreview ? 'Profile photo' : 'Certificate or license'} is required.`
      );
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (key.endsWith('Preview')) return;
      formDataToSend.append(key, formData[key]);
    });

    try {
      const response = await fetch('/api/psychologist', {
        method: 'POST',
        body: formDataToSend,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.ErrorMessage?.[0]?.message || 'An unexpected error occurred.'
        );
      }
      toast.success(data.message || 'Account created successfully');
      router.push('/psychologist/dashboard');
    } catch (error) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-12 pt-14">
        <div className="border-b border-[hsl(var(--border))] pb-12">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl main-font font-bold text-[hsl(var(--foreground))] mt-10">
              Build Your Professional Identity
            </h2>
          </div>
          <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))] border-l-4 border-[hsl(var(--primary))] pl-4">
            Share your credentials and professional details to help us verify
            your expertise and establish trust with potential clients.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-[hsl(var(--foreground))] dark:text-[hsl(var(--card-foreground))]"
              >
                Username
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md  pl-3 outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] outline-none focus-visible:ring-transparent sm:text-sm">
                  <div className="shrink-0 select-none text-base text-[hsl(var(--muted-foreground))] sm:text-sm">
                    mentality.com/
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="janesmith"
                    value={formData.username}
                    onChange={handleChange}
                    className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-[hsl(var(--foreground))]  dark:bg-transparent placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                  />
                </div>
              </div>
            </div>

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
                    className="w-16 h-16 rounded-full object-cover"
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
                Upload a professional profile photo to help clients recognize
                you.
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
                  className="block w-full rounded-md dark:bg-transparent px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                />
              </div>
              <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                Write a few sentences about your qualifications and experience.
              </p>
            </div>

            <div className="col-span-full">
              <label
                htmlFor="certificateOrLicense"
                className="block text-sm font-medium text-[hsl(var(--foreground))]"
              >
                Certificate or License
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-[hsl(var(--border))] px-6 py-10">
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
                  className="block w-full rounded-md dark:bg-transparent px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
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
                  className="block w-full rounded-md dark:bg-transparent px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
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
                  className="block w-full rounded-md dark:bg-transparent px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
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
                  className="block w-full rounded-md dark:bg-transparent px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-0 h-8 w-8 text-foreground hover:text-foreground/70 hover:bg-transparent focus:bg-transparent active:bg-transparent transition-none"
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

            <StyledCountrySelect
              formData={formData}
              handleChange={handleChange}
              countries={countries}
            />

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
                  className="block w-full rounded-md dark:bg-transparent px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
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
                  className="block w-full rounded-md dark:bg-transparent px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="stateOrProvince"
                className="block text-sm font-medium text-[hsl(var(--foreground))]"
              >
                State / Province
              </label>
              <div className="mt-2">
                <input
                  id="stateOrProvince"
                  name="stateOrProvince"
                  type="text"
                  value={formData.stateOrProvince}
                  onChange={handleChange}
                  autoComplete="address-level1"
                  className="block w-full rounded-md dark:bg-transparent px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="postalCode"
                className="block text-sm font-medium text-[hsl(var(--foreground))]"
              >
                ZIP / Postal Code
              </label>
              <div className="mt-2">
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={handleChange}
                  autoComplete="postal-code"
                  className="block w-full rounded-md dark:bg-transparent px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-x-6 pb-10">
          <Link
            href={`/signup`}
            className="rounded-md bg-[hsl(var(--secondary))] px-3 py-2 text-sm font-semibold text-[hsl(var(--secondary-foreground))] shadow-sm hover:bg-[hsl(var(--secondary))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--secondary))]"
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
                  Complete Verification <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </div>
          </Button>
        </div>
      </div>
    </form>
  );
};
export default PsychologistRegister;
