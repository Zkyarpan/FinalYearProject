"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const VerifyEmail = () => {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Verification failed.");
        return;
      }
      toast.success("Verified successfully!");
      localStorage.removeItem("email");
      router.push("/dashboard");
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const storedEmail = localStorage.getItem("email");
    if (!storedEmail) {
      toast.error("Email not found. Please sign up again.");
      router.push("/signup");
      return;
    }
    setIsResending(true);
    try {
      const response = await fetch("/api/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Failed to resend code.");
        return;
      }
      toast.success("Verification code resent!");
      setResendCooldown(60);
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const storedEmail = localStorage.getItem("email") || "unknown";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[380px] rounded-2xl border px-6 py-10 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-foreground mb-2">
            Verify your email
          </h1>
          <p className="text-sm text-muted-foreground">
            A verification code was sent to{" "}
            <span className="font-semibold">{storedEmail}</span>. If you don&apos;t
            see it, check your spam folder.
          </p>
        </div>

        <form onSubmit={handleVerify}>
          <div className="flex flex-col gap-1 mb-4">
            <label htmlFor="code" className="text-sm font-medium text-foreground">
              Verification Code
            </label>
                 <Input
              id="code"
              type="email"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-8 outline-none focus-visible:ring-transparent shadow-sm hover:shadow transition-shadow"
              autoComplete="username"
              required
            />
          </div>
          <div className="mt-4 text-right">
          <button
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="text-sm text-primary font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 dark:text-foreground"
          >
            {isResending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              `Resend code in ${resendCooldown}s`
            ) : (
              "Resend code"
            )}
          </button>
        </div>

          <Button
            type="submit"
            className="w-full h-10 flex items-center justify-center gap-2 font-semibold text-sm rounded-2xl mt-5"
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