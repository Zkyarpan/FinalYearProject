import SignupForm from "@/components/SignUpPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Mentality",
};

const Signup = () => {
  return (
    <main className="">
      <SignupForm />
    </main>
  );
};

export default Signup;
