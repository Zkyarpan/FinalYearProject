'use client';

import SupportSection from '@/components/SupportSection';
import FAQSection from '@/components/FAQSection';
import MentalHealthSection from '@/components/MentalHealthCarousel';
import ExploreLibrary from '@/components/ExploreLibrary';
import Marquee from '@/components/Marquee';
import Companies from '@/components/Companies';
import HeroSection from '@/components/HeroSection';

export default function Home() {
  return (
    <div>
      <main className="container w-full mx-auto px-4 pt-16">
        {' '}
        <HeroSection />
        <div className="mx-auto w-20 border-2 box-content border-gray-200 mb-10"></div>
        <SupportSection />
        <div className="mx-auto w-20 border-2 box-content border-gray-200 mb-10"></div>
        <MentalHealthSection />
        <div className="mx-auto w-20 border-2 box-content border-gray-200 mb-10"></div>
        <ExploreLibrary />
        <div className="mx-auto w-20 border-2 box-content border-gray-200 mb-10"></div>
        <Marquee />
        <div className="mx-auto w-20 border-2 box-content border-gray-200 mb-10"></div>
        <Companies />
        <div className="mx-auto w-20 border-2 box-content border-gray-200 mb-10"></div>
        <FAQSection />
        <div className="mx-auto w-20 border-2 box-content border-gray-200 mb-10"></div>
      </main>
    </div>
  );
}
