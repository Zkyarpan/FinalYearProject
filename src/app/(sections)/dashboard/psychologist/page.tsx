'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/userStore';

export default function PsychologistDashboard() {
  const { user } = useUserStore();
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    weeklyAppointments: 0,
    completedSessions: 0,
  });

  useEffect(() => {
    // Fetch psychologist-specific data here
    const fetchData = async () => {
      try {
        // Fetch upcoming appointments
        const appointmentsResponse = await fetch(
          '/api/psychologist/appointments/upcoming'
        );
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          setUpcomingAppointments(appointmentsData.Result || []);
        }

        // Fetch psychologist stats
        const statsResponse = await fetch('/api/psychologist/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(
            statsData.Result || {
              totalPatients: 0,
              weeklyAppointments: 0,
              completedSessions: 0,
            }
          );
        }
      } catch (error) {
        console.error('Error fetching psychologist data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold  main-font">
        Hello, {user?.firstName || 'Doctor'}! 👋
      </h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              This Week's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedSessions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 border rounded-md"
                >
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No upcoming appointments
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
