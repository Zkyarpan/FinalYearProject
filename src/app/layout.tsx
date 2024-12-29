import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import FooterWrapper from "@/components/FooterWrapper";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import { Providers } from "./Providers";
import SpinnerLoader from "@/components/Loader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["100", "400", "500", "600", "700", "900"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    template: "%s",
    default: "Mentality",
  },
  description: "Mental health and support platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${instrumentSerif.variable} antialiased`}
      >
        <Providers>
          <NextTopLoader
            color="#0466c8"
            initialPosition={0.08}
            crawlSpeed={200}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #2299DD,0 0 5px #2299DD"
            zIndex={1600}
            showAtBottom={false}
          />
          <Toaster position="bottom-right" richColors />
          <SpinnerLoader>
            <Navbar />
            {children}
            <FooterWrapper />
          </SpinnerLoader>
        </Providers>
      </body>
    </html>
  );
}
