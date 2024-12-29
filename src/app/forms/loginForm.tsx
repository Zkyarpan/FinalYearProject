"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const LoginForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errorMessage = result.error.errors
        .map((err) => err.message)
        .join(", ");
      toast.error(errorMessage);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.ErrorMessage?.[0]?.message || "An unexpected error occurred.";
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      document.cookie = `accessToken=${data.Result.accessToken}; path=/;`;

      if (data.Result.user_data.role === "admin") {
        toast.success("Login successful!");
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[380px] mx-auto">
      <div className="border px-6 py-10 rounded-2xl flex flex-col gap-6 sm:shadow-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="email"
              className="text-sm font-semibold text-foreground"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 outline-none focus-visible:ring-transparent shadow-sm hover:shadow transition-shadow"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="password"
              className="text-sm font-semibold text-foreground"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-8 focus-visible:ring-transparent outline-none shadow-sm hover:shadow transition-shadow"
                autoComplete="current-password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-8 w-8 text-foreground hover:text-foreground/70 hover:bg-transparent focus:bg-transparent active:bg-transparent"
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

          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-xs text-foreground/60  hover:underline hover:text-foreground/80  font-semibold transition-colors"
            >
              Forgot Password?
            </a>
          </div>

          <Button
            type="submit"
            className={`w-full mt-2 font-semibold rounded-2xl shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2 ${
              isLoading ? "cursor-not-allowed opacity-75" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader />
            ) : (
              <>
                Login <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
