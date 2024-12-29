import Footer from "@/components/Footer";
import HeroSection from "../components/MainComponent";
import FAQSection from "@/components/FAQSection";
// import ContentLibrary from "@/components/ContentLibrary";

export default function Home() {
  return (
    <div>
      <main className="container w-full mx-auto px-4 pt-16">
        {" "}
        {/* Add padding to avoid overlap with fixed navbar */}
        <HeroSection />
        {/* <ContentLibrary /> */}
        <div className="mx-auto w-20 border-2 box-content border-gray-200 mb-10"></div>
        <FAQSection />
        <div className="mx-auto w-20 border-2 box-content border-gray-200 mb-10"></div>
      </main>
    </div>
  );
}
