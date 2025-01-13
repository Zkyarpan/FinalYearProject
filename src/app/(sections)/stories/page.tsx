import React from 'react';

const page = () => {
  return (
    <div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 h-full">
          <div
            className="rounded-2xl border border-border p-6 h-full dark:border-[#333333]"
            style={{
              background:
                'linear-gradient(215deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--background) / 0) 49.92%)',
            }}
          >
            <h2 className="text-2xl text-center mb-4 text-foreground">
              Your Journey to Better Mental Health Starts Here
            </h2>
            <p className="text-sm text-center mb-2 text-muted-foreground">
              Feeling overwhelmed, anxious, or just need someone to talk to? Our
              professional psychologists are here to provide the support you
              need.
            </p>
            <p className="text-sm text-center mb-6 text-muted-foreground">
              Connect with licensed therapists, join supportive communities, and
              access personalized mental wellness resources - all in one place.
            </p>
            <div className="flex flex-col items-center gap-2">
              <button className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-ring transition-colors w-full">
                Start Your Wellness Journey
              </button>
              <p className="text-xs text-center italic text-muted-foreground">
                Take the first step towards better mental health today
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 h-full">
            <div
              className="rounded-2xl border border-border p-6 h-full dark:border-[#333333]"
              style={{
                background:
                  'linear-gradient(215deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--background) / 0) 49.92%)',
              }}
            >
              <h2 className="text-2xl text-center mb-4 text-foreground">
                Your Journey to Better Mental Health Starts Here
              </h2>
              <p className="text-sm text-center mb-2 text-muted-foreground">
                Feeling overwhelmed, anxious, or just need someone to talk to?
                Our professional psychologists are here to provide the support
                you need.
              </p>
              <p className="text-sm text-center mb-6 text-muted-foreground">
                Connect with licensed therapists, join supportive communities,
                and access personalized mental wellness resources - all in one
                place.
              </p>
              <div className="flex flex-col items-center gap-2">
                <button className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-ring transition-colors w-full">
                  Start Your Wellness Journey
                </button>
                <p className="text-xs text-center italic text-muted-foreground">
                  Take the first step towards better mental health today
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
