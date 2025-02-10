'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, ListTodo } from 'lucide-react';

const AvailabilitySettingsSkeleton = () => {
  const weekDays = Array.from({ length: 7 });
  const timeSlots = Array.from({ length: 15 });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 mb-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-16" />
              ))}
            </div>
            <Skeleton className="h-8 w-48" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue="calendar">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="calendar" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar View
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <ListTodo className="h-4 w-4" />
                  List View
                </TabsTrigger>
              </TabsList>
              <Skeleton className="h-6 w-44" />
            </div>

            <TabsContent value="calendar">
              <div className="h-[700px] mt-4">
                <div className="grid grid-cols-8 gap-2 mb-4">
                  <div className="col-span-1">
                    <Skeleton className="h-8 w-16" />
                  </div>
                  {weekDays.map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>

                <div className="space-y-2">
                  {timeSlots.map((_, i) => (
                    <div key={i} className="grid grid-cols-8 gap-2">
                      <Skeleton className="h-20 w-16" />
                      {weekDays.map((_, j) => (
                        <Skeleton key={j} className="h-20 w-full" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="list">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvailabilitySettingsSkeleton;
