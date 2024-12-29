import PsychologistRegister from "@/components/PsychologistRegister";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register to Mentallity",
};

const psychologists = () => {
  return (
    <div className="container items-center justify-center mx-auto">
      <PsychologistRegister />
    </div>
  );
};

export default psychologists;
