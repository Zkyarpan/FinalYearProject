'use client';

import SignupForm from '@/app/forms/SignupForm';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  User,
} from 'lucide-react';

const SignUpPage = () => {
  return (
    <main className="py-8 pt-14 -mt-10">
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center px-4 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl main-font font-bold text-foreground mb-3">
            Choose Your Account Type
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            Select the account type that best suits your needs. Whether you're a
            client seeking help or a professional offering services, we've got
            you covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="w-full max-w-md mx-auto border rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold main-font">
                  Client Account
                </h3>
              </div>
              <p className="text-muted-foreground mb-6 text-sm">
                Create a personal account to connect with mental health
                professionals and access support.
              </p>
              <SignupForm />
            </CardContent>
          </div>

          <div className="w-full max-w-md mx-auto border rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold main-font">
                  Professional Account
                </h3>
              </div>
              <p className="text-muted-foreground mb-6 text-sm">
                Join as a licensed professional to expand your practice and help
                clients effectively.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Build a detailed professional profile</span>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Manage appointments with ease</span>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Connect with potential clients</span>
                </div>
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span>Communicate securely and effectively</span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span>Protect client data with robust security</span>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href="/psychologist"
                  className="flex items-center justify-center w-full font-semibold text-center rounded-2xl bg-primary text-white py-2 h-9 hover:shadow-lg transition-shadow"
                >
                  Register as Professional
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            By signing up, you agree to our{' '}
            <Link
              href="/terms"
              className="underline text-primary dark:text-white hover:text-primary/80 dark:hover:text-gray-300 transition-colors font-semibold "
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="underline text-primary dark:text-white hover:text-primary/80 dark:hover:text-gray-300 transition-colors font-semibold "
            >
              Privacy Policy
            </Link>
            .
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Already have an account?{' '}
            <Link
              href="/login"
              className="underline text-primary dark:text-white hover:text-primary/80 dark:hover:text-gray-300 transition-colors font-semibold "
            >
              Log in here
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
};

export default SignUpPage;
