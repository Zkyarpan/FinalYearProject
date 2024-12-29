import VerifyEmail from "@/app/forms/verifyEmailForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email",
};

const Signup = () => {
  return (
    <main className="">
      <VerifyEmail />
    </main>
  );
};

export default Signup;
