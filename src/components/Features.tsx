import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/SectionHeader";

export function Features() {
  return (
    <div className="flex flex-col gap-20">
      <ProfileSection />
      <ProjectsSection />
      <ScrollSection />
      <JobsSection />
      <FaqSection />
    </div>
  );
}

function ProfileSection() {
  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <SectionHeader
          title="Profile"
          description="Your most meaningful work profile!"
          link="/signup"
          linkText="Create Profile"
        />
        <p className="text-gray-700 font-normal text-base">
          Proof of work is the only thing that works. Everything else is a cheap
          signal. Your Peerlist profile lets you showcase that in clean &
          beautiful way.
        </p>
      </div>
    </section>
  );
}

function ProjectsSection() {
  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <SectionHeader
          title="Projects"
          description="Working on a side project?"
          link="/projects"
          linkText="View Projects"
        />
        <p className="text-gray-700 font-normal text-base">
          Launch your side-projects and get feedback from the community.
          Showcase your work and connect with potential users.
        </p>
      </div>
    </section>
  );
}

function ScrollSection() {
  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <SectionHeader
          title="Scroll"
          description="Share your work!"
          link="/scroll"
          linkText="Go to Scroll"
        />
        <p className="text-gray-700 font-normal text-base">
          This is not your typical content feed. It's a place to show what you
          are working on, share feedback, ask questions, give answers, share
          opportunities, and more!
        </p>
      </div>
    </section>
  );
}

function JobsSection() {
  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <SectionHeader
          title="Jobs"
          description="Looking for a job?"
          link="/jobs"
          linkText="View Jobs"
        />
        <p className="text-gray-700 font-normal text-base">
          Find exciting job opportunities, from fast-growing early-stage
          startups to the unicorns you know & love.
        </p>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="flex flex-col gap-6">
      <h3 className="text-gray-1k font-semibold text-lg">
        Very frequently asked questions
      </h3>
      <div className="flex flex-col gap-6">
        <FaqItem
          question="How is Peerlist different from LinkedIn?"
          answer="Peerlist is a community for all tech professionals, especially designers and developers. The platform is built with tech professionals in mind, offering a comprehensive profile to showcase your work across the internet—whether it's side projects, open-source contributions, design work, or more."
        />
        <FaqItem
          question="What is a Peerlist profile & why do I need one?"
          answer="Your work might be spread across GitHub, Dribbble, Medium, and other platforms. Peerlist brings everything together into one profile with seamless integrations. You can also highlight your verified work experience, education, and bootcamp credentials in the Resume section."
        />
        <FaqItem
          question="I joined Peerlist, what's next?"
          answer="Share what you're working on, your learnings, and your side projects. You can collaborate with other tech professionals by giving feedback, offering help, or even trying out their side projects."
        />
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-gray-1k font-semibold text-base">{question}</p>
      <p className="text-gray-700 font-normal text-sm">{answer}</p>
    </div>
  );
}
