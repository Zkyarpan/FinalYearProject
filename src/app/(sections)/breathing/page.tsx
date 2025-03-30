'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Info, Heart, Brain, Wind, Moon, Zap } from 'lucide-react';
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('exercise');
  const exerciseRef = useRef<HTMLDivElement>(null);

  const scrollToExercise = () => {
    setActiveTab('exercise');
    if (exerciseRef.current) {
      exerciseRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="pb-20">
      {/* Hero section */}
      <div className="relative">
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
                className="bg-white text-blue-600 hover:bg-white/90"
                size="lg"
                onClick={scrollToExercise}
              >
                Start Breathing
              </Button>
              <Button
                variant="outline"
                className="border-white hover:bg-white/10 text-white"
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
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">
            Benefits of Regular Breathing Practice
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-gray-500 dark:text-gray-400">
            Just a few minutes of focused breathing can have profound effects on
            your physical and mental wellbeing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mb-4">
                <Brain size={24} />
              </div>
              <CardTitle className="text-xl">Mental Clarity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400">
                Improves focus, concentration, and cognitive function by
                increasing oxygen to the brain.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 mb-4">
                <Heart size={24} />
              </div>
              <CardTitle className="text-xl">Stress Reduction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400">
                Activates the parasympathetic nervous system, lowering cortisol
                levels and reducing anxiety.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 mb-4">
                <Moon size={24} />
              </div>
              <CardTitle className="text-xl">Better Sleep</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400">
                Calms the mind and relaxes the body, helping you fall asleep
                faster and improve sleep quality.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 mb-4">
                <Zap size={24} />
              </div>
              <CardTitle className="text-xl">Energy Boost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400">
                Certain breathing techniques can increase alertness and provide
                a natural energy lift without caffeine.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main content */}
      <div
        ref={exerciseRef}
        className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col md:flex-row justify-between mb-8 items-start gap-4">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Wind className="h-7 w-7 text-blue-500" /> Breathing Exercise
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
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
                <Card className="border-0 shadow-md sticky top-8">
                  <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                    <CardTitle className="flex items-center text-xl">
                      <Info className="h-5 w-5 mr-2" /> Quick Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      <li className="flex gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
                          1
                        </div>
                        <span>Find a comfortable, quiet position</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
                          2
                        </div>
                        <span>Breathe through your nose when possible</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
                          3
                        </div>
                        <span>Focus on your breath, not distractions</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
                          4
                        </div>
                        <span>Use diaphragmatic (belly) breathing</span>
                      </li>
                      <li className="flex gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
                          5
                        </div>
                        <span>
                          Try multiple techniques to find what works for you
                        </span>
                      </li>
                    </ul>

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium mb-2">Did you know?</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
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
            <>
              {/* Learn section */}
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>Understanding Breathing Techniques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p>
                      Controlled breathing exercises have been practiced for
                      thousands of years in various forms, from yoga pranayama
                      to meditation. Modern science now confirms what
                      practitioners have known for centuries: conscious
                      breathing has profound effects on our physical and mental
                      health.
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
                          <p className="mb-3">
                            Deep, slow breathing increases oxygen exchange,
                            lowers blood pressure, slows heart rate, and
                            releases endorphins - your body's natural
                            painkillers and mood elevators.
                          </p>
                          <p>
                            Research shows that regular breathing exercises can
                            reduce cortisol levels (the stress hormone) and
                            increase activity in brain regions associated with
                            attention, awareness, and positive emotions.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="techniques" className="border-b">
                        <AccordionTrigger>
                          Breathing Techniques Explained
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-1">
                                Box Breathing (4-4-4-4)
                              </h4>
                              <p className="text-sm">
                                A technique used by Navy SEALs to stay calm
                                under pressure. Inhale for 4 seconds, hold for 4
                                seconds, exhale for 4 seconds, hold for 4
                                seconds, and repeat. This balanced pattern helps
                                regulate the autonomic nervous system.
                              </p>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-1">
                                Relaxing Breath (4-6)
                              </h4>
                              <p className="text-sm">
                                Also known as "longer exhale breathing." Inhale
                                for 4 seconds, then exhale for 6 seconds. The
                                longer exhale activates the parasympathetic
                                nervous system more strongly, promoting deeper
                                relaxation.
                              </p>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-1">
                                Energizing Breath (2-2)
                              </h4>
                              <p className="text-sm">
                                Faster breathing with equal inhale and exhale.
                                This technique increases oxygen circulation and
                                can help boost energy and alertness without the
                                crash associated with caffeine.
                              </p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="tips" className="border-b">
                        <AccordionTrigger>
                          Tips for Better Results
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="list-disc pl-5 space-y-2">
                            <li>
                              Practice consistently - even 5 minutes daily is
                              better than an hour once a week
                            </li>
                            <li>
                              Find a quiet, comfortable place where you won't be
                              disturbed
                            </li>
                            <li>
                              Sit with good posture to allow full expansion of
                              your lungs
                            </li>
                            <li>
                              Breathe through your nose when possible (it
                              filters, warms and humidifies air)
                            </li>
                            <li>
                              Focus on diaphragmatic breathing - your belly
                              should expand on inhale
                            </li>
                            <li>
                              Start with shorter sessions and gradually increase
                              duration
                            </li>
                            <li>
                              Try different techniques to find what works best
                              for you
                            </li>
                            <li>
                              Be patient - benefits build over time with
                              consistent practice
                            </li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="when" className="border-b">
                        <AccordionTrigger>When to Practice</AccordionTrigger>
                        <AccordionContent>
                          <p className="mb-3">
                            <strong>Morning:</strong> Start your day with
                            breathing exercises to increase alertness and set a
                            positive tone for the day.
                          </p>
                          <p className="mb-3">
                            <strong>During stress:</strong> Practice breathing
                            exercises during stressful situations or when you
                            feel anxiety rising.
                          </p>
                          <p className="mb-3">
                            <strong>Before important events:</strong> Use box
                            breathing before presentations, interviews, or any
                            high-pressure situation.
                          </p>
                          <p className="mb-3">
                            <strong>Afternoon slump:</strong> Try energizing
                            breath instead of reaching for coffee.
                          </p>
                          <p>
                            <strong>Before sleep:</strong> Use relaxing breath
                            to calm your mind and prepare for restful sleep.
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="mt-6 flex justify-center">
                      <Button
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white border-0"
                        size="lg"
                        onClick={scrollToExercise}
                      >
                        Start Practicing Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Resources sidebar */}
              <div>
                <Card className="border-0 shadow-md sticky top-8">
                  <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                    <CardTitle className="flex items-center text-xl">
                      Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                      Learn more about breathing techniques with these
                      recommended resources:
                    </p>

                    <div className="space-y-4">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-1">Books</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Breath: The New Science of a Lost Art</li>
                          <li>• The Wim Hof Method</li>
                          <li>• The Oxygen Advantage</li>
                        </ul>
                      </div>

                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-1">Apps</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Calm</li>
                          <li>• Headspace</li>
                          <li>• Breathwrk</li>
                        </ul>
                      </div>

                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-1">Research</h4>
                        <p className="text-sm">
                          Journal of Neurophysiology: "Controlled breathing
                          decreases stress response"
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={scrollToExercise}
                      >
                        Try the Exercise
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
