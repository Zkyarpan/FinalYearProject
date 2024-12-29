import StoriesSection from "@/components/StoriesSection";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stories",
};

const Stories = () => {
  return (
    <div className="container flex items-center justify-center">
      <StoriesSection />
    </div>
  );
};

export default Stories;
