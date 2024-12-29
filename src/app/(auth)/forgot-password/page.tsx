"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password reset logic here
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-[380px] rounded-2xl border border-gray-200 px-6 py-10">
          <div className="mb-6 text-center">
            <h1 className="text-lg font-semibold text-foreground mb-2">
              Forgot Password
            </h1>
            <p className="text-xs text-muted-foreground">
              We will send an email with verification code. If you don&apos;t
              see it, please check your spam folder.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-foreground"
              >
                Email
              </label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@youremail.com"
                className="h-8 bg-background hover:border-gray-300 focus-visible:ring-0 focus-visible:border-gray-300"
              />
            </div>

            <Button
              type="submit"
              className="mt-6 h-8 w-auto  items-center group font-semibold"
            >
              Next
              <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        </div>
      </div>
      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">Remember password? </span>
        <Link
          href="/login"
          className="text-foreground hover:underline font-medium"
        >
          Log In
        </Link>
      </div>
    </>
  );
}
