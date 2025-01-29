'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const floatingImages = [
  {
    src: 'https://images.ctfassets.net/v3n26e09qg2r/7LgQ7zE5yihhzCv7O8Y7tS/acedfbf85e4c9274fb039d9743827955/Frame_370079.svg',
    width: 50,
    height: 50,
    className: 'absolute top-5 left-[15%] lg:block',
  },
  {
    src: 'https://images.ctfassets.net/v3n26e09qg2r/3qlhNseKA1PPalC9VWD0N5/110fa32dd9b02ff104a32a0cb29abd9b/Star_1.svg',
    width: 24,
    height: 24,
    className: 'absolute top-0 right-[35%]',
  },
  {
    src: 'https://images.ctfassets.net/v3n26e09qg2r/3Dp0lvdbRnwgVHMJUSRi4f/965460f68159391c0cc183573adc2ffe/Star_2.svg',
    width: 20,
    height: 20,
    className: 'absolute top-16 right-[25%]',
  },
  {
    src: 'https://images.ctfassets.net/v3n26e09qg2r/5I07KGvCgkzdRg3rJk4rGC/c0f43cf2b6d02079f06b35c446c0b0a8/Frame_370079__2_.svg',
    width: 50,
    height: 50,
    className: 'absolute top-24 right-[70%]',
  },
  {
    src: 'https://images.ctfassets.net/v3n26e09qg2r/39KMTXVV6PAELlOvSkUiz3/2faef5ae1b57854fba62dcf75dad901b/Frame_370346.svg',
    width: 55,
    height: 55,
    className: 'absolute top-6 right-[15%]',
  },
  {
    src: 'https://images.ctfassets.net/v3n26e09qg2r/76SbyP15xRQimqjFf78YSg/bb3cc8b3464d8d7a9ef100b1c352d65d/Frame_370079__1_.svg',
    width: 45,
    height: 45,
    className: 'absolute top-24 right-[20%]',
  },
];
const testimonials = [
  {
    quote:
      'Mentality has given me a safe space to express myself without fear of judgment. It’s helped me build healthier coping habits and feel heard.',
    author: 'User on finding a judgment-free space',
  },
  {
    quote:
      'Through Mentality, I’ve learned to navigate my emotions better and seek support when needed. It’s empowering to know I’m not alone in this journey.',
    author: 'User on gaining emotional resilience',
  },
  {
    quote:
      'The expert guidance and resources on Mentality have helped me understand my struggles and take meaningful steps toward self-improvement.',
    author: 'User on receiving professional support',
  },
  {
    quote:
      'The expert guidance and resources on Mentality have helped me understand my struggles and take meaningful steps toward self-improvement.',
    author: 'User on receiving professional support',
  },
];

const FloatingImage = ({
  src,
  width,
  height,
  className,
}: {
  src: string;
  width: number;
  height: number;
  className: string;
}) => {
  const size = {
    width: width,
    height: height,
  };

  return (
    <div
      className={`absolute ${className} transition-all duration-1000 animate-float`}
    >
      <div className="relative" style={size}>
        <Image
          src={src}
          alt=""
          fill
          style={{ objectFit: 'contain' }}
          className="transition-opacity duration-300"
        />
      </div>
    </div>
  );
};

export default function Marquee() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {floatingImages.map((image, index) => (
        <FloatingImage
          key={index}
          src={image.src}
          width={image.width}
          height={image.height}
          className={image.className}
        />
      ))}

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Members are enjoying happier and healthier lives
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-background border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <p className="text-base leading-relaxed mb-3 tracking-wide">
                {testimonial.quote}
              </p>
              <footer className="text-xs italic text-foreground text-end">
                {testimonial.author}
              </footer>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
