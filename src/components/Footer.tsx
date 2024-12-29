"use client";

import React from "react";
import Link from "next/link";

const Footer = () => {
  const mainPages = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Resources", href: "/resources" },
    { name: "FAQs", href: "/faqs" },
    { name: "Contact", href: "/contact" },
  ];

  const tools = [
    { name: "Survey Insights", href: "/tools/survey-insights" },
    { name: "Mental Health Tracker", href: "/tools/mental-health-tracker" },
    { name: "Appointment Scheduler", href: "/tools/appointment-scheduler" },
    { name: "Video Consultation", href: "/tools/video-consultation" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/legal/privacy-policy" },
    { name: "Terms and Conditions", href: "/legal/terms-and-conditions" },
    { name: "Code of Conduct", href: "/legal/code-of-conduct" },
    { name: "Help", href: "/help" },
  ];

  return (
    <footer className="pb-20 container items-center justify-center mx-auto">
      <div className="flex flex-col-reverse md:flex-row justify-between gap-6">
        <div className="flex flex-col justify-between">
          <span className="logo-font text-[hsl(var(--foreground))] text-5xl font-extrabold opacity-10 dark:opacity-30 hover:opacity-100 transition-opacity duration-500 ease-in-out md:py-0 py-6 mx-auto md:mx-0">
            Mentality
          </span>
          <div className="flex items-center justify-center md:justify-start gap-6 md:py-0 py-2">
            <p className="text-[hsl(var(--muted-foreground))] font-normal text-xs">
              © {new Date().getFullYear()}
            </p>
            <div className="flex items-center gap-1 capitalize">
              <p className="text-[hsl(var(--muted-foreground))] font-normal text-xs">
                Mentality Inc.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-row justify-between md:justify-end w-full sm:w-auto gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-[hsl(var(--foreground))] font-semibold text-sm">Main Pages</p>
              {mainPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="text-[hsl(var(--foreground-muted))] font-normal text-sm hover:underline transition-[text-decoration-line] duration-150"
                >
                  {page.name}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[hsl(var(--foreground))] font-semibold text-sm">Tools</p>
              {tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="text-[hsl(var(--foreground-muted))] font-normal text-sm hover:underline transition-[text-decoration-line] duration-150"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </div>

          <ul className="flex md:justify-between justify-center gap-4 md:mt-6 mt-10">
            {legalLinks.map((link) => (
              <li key={link.href} className="flex items-center">
                <Link
                  href={link.href}
                  className="text-[hsl(var(--foreground-muted))] font-normal text-xs hover:underline duration-150 transition-[text-decoration-line]"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
