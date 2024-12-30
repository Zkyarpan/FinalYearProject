"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


const VerifyEmail = () => {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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

      toast.success("Email verified successfully!");
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
    console.log("Resend triggered for email:", storedEmail);


    if (!storedEmail) {
      toast.error("Email not found. Please sign up again.");
      window.location.href = "/signup"; 
      return;
    }

    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      const response = await fetch("/api/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedEmail }),
      });

    console.log("Resend triggered for email:", storedEmail);

      

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to resend code.");
        return;
      }

      toast.success("Verification code resent!");
      setResendCooldown(60); 
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev === 1) clearInterval(interval);
          return prev - 1;
        });
      }, 1000);
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
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter verification code"
              className="h-10 focus-visible:ring-transparent shadow-sm hover:shadow transition-shadow"
              required
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

        <div className="mt-4 text-center">
          <button
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="text-sm text-primary font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
