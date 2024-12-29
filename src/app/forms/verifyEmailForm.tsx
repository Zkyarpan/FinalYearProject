"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

const VerifyEmail = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email"); // Email passed from the signup page

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code) {
      toast.error("Please enter the verification code.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Verification failed.");
        setIsLoading(false);
        return;
      }

      toast.success("Email verified successfully!");
      router.push("/dashboard"); // Redirect to dashboard or another page
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[380px] rounded-2xl border px-6 py-10 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-foreground mb-2">
            Verify your email
          </h1>
          <p className="text-sm text-muted-foreground">
            A verification code was sent to{" "}
            <span className="font-semibold">{email}</span>. If you don&apos;t see it, check your spam folder.
          </p>
        </div>

        <form onSubmit={handleVerify}>
          <div className="flex flex-col gap-1 mb-4">
            <label htmlFor="code" className="text-sm font-medium text-foreground">
              Verification Code
            </label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter verification code"
              className="h-10 focus-visible:ring-transparent shadow-sm hover:shadow transition-shadow"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-10 flex items-center justify-center gap-2 font-semibold text-sm rounded-2xl"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : (
              <>
                Verify and Continue
                <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;
