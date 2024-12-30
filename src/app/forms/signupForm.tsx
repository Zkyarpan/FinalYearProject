"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";

const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const SignupForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = signupSchema.safeParse({ email, password });

    if (!result.success) {
      result.error.errors.forEach((err) => {
        toast.error(err.message);
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.ErrorMessage?.[0]?.message || "An unexpected error occurred.";
        toast.error(errorMessage);
        return;
      }

      toast.success("Signup successful!");
      localStorage.setItem("email", email);
      router.push("/verify");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[380px] mx-auto">
      <div className="">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="email"
              className="text-sm font-semibold text-gray-900 dark:text-gray-100"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 focus-visible:ring-transparent shadow-sm hover:shadow transition-shadow"
              autoComplete="username"
              placeholder="you@youremail.com"
              required
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="password"
              className="text-sm font-semibold text-gray-900 dark:text-gray-100"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-8 focus-visible:ring-transparent shadow-sm hover:shadow transition-shadow"
                autoComplete="current-password"
                placeholder="At least 8 characters"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-8 w-8 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-transparent focus:bg-transparent active:bg-transparent"
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

          <Button
            type="submit"
            className={`w-full mt-2 font-semibold text-1xl rounded-2xl shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2 ${
              isLoading ? "cursor-not-allowed opacity-75" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader />
            ) : (
              <>
                Create Profile <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
