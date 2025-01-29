'use client';

import Image from 'next/image';
import { AuroraText } from '@/components/ui/aurora-text';

const HeroSection = () => {
  return (
    <div className="relative min-h-[80vh] -mt-10 mb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="md:text-4xl lg:text-6xl xl:text-6xl text-balance text-5xl font-semibold leading-none tracking-tighter sm:text-6xl">
              All you need for <AuroraText>balance.</AuroraText>
            </h1>

            <p className="text-lg">
              Find balance and inner peace with guided mindfulness,
              stress-relief exercises, personalized support, and mental wellness
              resources tailored just for you.
            </p>
            <button className="text-sm font-medium px-4 py-2 rounded-full bg-purple-600 text-white">
              Get Started
            </button>
          </div>

          <div className="relative">
            <div className="relative z-10">
              <Image
                src="https://images.ctfassets.net/v3n26e09qg2r/7wyNlboD4Aox8ZleHVENkA/e53dc971bdddb412b3376de1c47f29cb/hero-img-transformed_reduced_compressed_-_3.webp"
                alt="Meditation App Interface"
                width={592}
                height={713}
                className="w-full h-auto"
                priority
              />
            </div>

            <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-orange-500 rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute bottom-[-20px] left-[-20px] w-40 h-40 bg-purple-500 rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute top-1/2 left-[-10px] w-20 h-20 bg-blue-500 rounded-full opacity-20 blur-xl"></div>

            <div className="absolute top-10 right-10 animate-bounce">
              <div className="w-8 h-8 bg-yellow-400 rounded-full"></div>
            </div>
            <div className="absolute bottom-20 left-10 animate-pulse">
              <div className="w-12 h-12 bg-pink-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
