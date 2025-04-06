'use client';

import { useState, useRef } from 'react';
import { Info, Heart, Brain, Wind, Moon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import BreathingExercise from '@/components/breathing/BreathingExercise';

export default function BreathingPage() {
  const [activeTab, setActiveTab] = useState('exercise');
  const exerciseRef = useRef<HTMLDivElement>(null);

  const scrollToExercise = () => {
    setActiveTab('exercise');
    if (exerciseRef.current) {
      exerciseRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="relative bg-card rounded-md">
        <div className="absolute inset-0 bg-[url('/breathing-pattern.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-4">
              Breathing Exercises
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Simple breathing techniques to reduce stress, increase focus, and
              enhance your well-being.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                className="bg-primary hover:bg-primary/90 text-white border-0"
                size="lg"
                onClick={scrollToExercise}
              >
                Start Breathing
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setActiveTab('learn')}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits section */}
      <div className="mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">
            Benefits of Regular Breathing Practice
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Just a few minutes of focused breathing can have profound effects on
            your physical and mental wellbeing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mb-4">
                <Brain size={24} />
              </div>
              <CardTitle className="text-xl">Mental Clarity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Improves focus, concentration, and cognitive function by
                increasing oxygen to the brain.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 mb-4">
                <Heart size={24} />
              </div>
              <CardTitle className="text-xl">Stress Reduction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Activates the parasympathetic nervous system, lowering cortisol
                levels and reducing anxiety.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 mb-4">
                <Moon size={24} />
              </div>
              <CardTitle className="text-xl">Better Sleep</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Calms the mind and relaxes the body, helping you fall asleep
                faster and improve sleep quality.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 mb-4">
                <Zap size={24} />
              </div>
              <CardTitle className="text-xl">Energy Boost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Certain breathing techniques can increase alertness and provide
                a natural energy lift without caffeine.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main content */}
      <div ref={exerciseRef} className="mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between mb-8 items-start gap-4">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Wind className="h-7 w-7 text-blue-500" /> Breathing Exercise
            </h2>
            <p className="text-muted-foreground mt-2">
              Select a technique below and follow the guided exercise.
            </p>
          </div>

          <div className="flex gap-2 self-start">
            <Button
              variant={activeTab === 'exercise' ? 'default' : 'outline'}
              onClick={() => setActiveTab('exercise')}
            >
              Practice
            </Button>
            <Button
              variant={activeTab === 'learn' ? 'default' : 'outline'}
              onClick={() => setActiveTab('learn')}
            >
              Learn
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {activeTab === 'exercise' ? (
            <>
              {/* Main Breathing Exercise Component */}
              <div className="lg:col-span-2">
                <BreathingExercise />
              </div>

              {/* Tips Sidebar */}
              <div>
                <Card className="border-border shadow-sm sticky top-8">
                  <CardHeader className="bg-primary/10">
                    <CardTitle className="flex items-center text-xl">
                      <Info className="h-5 w-5 mr-2" /> Quick Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      <li className="flex gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          1
                        </div>
                        <span>Find a comfortable, quiet position</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          2
                        </div>
                        <span>Breathe through your nose when possible</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          3
                        </div>
                        <span>Focus on your breath, not distractions</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          4
                        </div>
                        <span>Use diaphragmatic (belly) breathing</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          5
                        </div>
                        <span>
                          Try multiple techniques to find what works for you
                        </span>
                      </li>
                    </ul>

                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Did you know?</p>
                      <p className="text-sm text-muted-foreground">
                        Practicing breathing exercises for just 5 minutes daily
                        can significantly reduce stress levels and improve your
                        overall wellbeing.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            // Content for the Learn tab
            <div className="lg:col-span-3">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Understanding Breathing Techniques</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Controlled breathing exercises have been practiced for
                    thousands of years in various forms, from yoga pranayama to
                    meditation. Modern science now confirms what practitioners
                    have known for centuries: conscious breathing has profound
                    effects on our physical and mental health.
                  </p>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="science" className="border-b">
                      <AccordionTrigger>
                        The Science of Breathing
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-3">
                          When you practice controlled breathing, you activate
                          your parasympathetic nervous system (the "rest and
                          digest" response), which counteracts the sympathetic
                          response ("fight or flight") triggered by stress.
                        </p>
                        <p>
                          Deep, slow breathing increases oxygen exchange, lowers
                          blood pressure, slows heart rate, and releases
                          endorphins - your body's natural painkillers and mood
                          elevators.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    {/* More accordion items would go here */}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
