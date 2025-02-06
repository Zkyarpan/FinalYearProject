'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return {
    value: `${String(hour).padStart(2, '0')}:00`,
    label: `${displayHour}:00 ${ampm}`,
  };
});

const appointments = [
  {
    id: '1',
    date: '2025-02-10',
    startTime: '10:00 AM',
    psychologist: { firstName: 'Alice', lastName: 'Smith' },
    duration: 60,
    status: 'confirmed',
  },
  {
    id: '2',
    date: '2025-02-12',
    startTime: '2:30 PM',
    psychologist: { firstName: 'John', lastName: 'Doe' },
    duration: 45,
    status: 'pending',
  },
  {
    id: '3',
    date: '2025-02-15',
    startTime: '4:00 PM',
    psychologist: { firstName: 'Emma', lastName: 'Johnson' },
    duration: 30,
    status: 'canceled',
  },
];

export default function DashboardPage() {
  const [availability, setAvailability] = useState({
    monday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    tuesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    wednesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    thursday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    friday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    saturday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    sunday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  });

  const handleToggleDay = day => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const handleTimeChange = (day, type, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: value },
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-6 p-6">
      {/* Appointments Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Appointments</CardTitle>
          <CardDescription>
            View and manage your scheduled appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Psychologist</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map(appointment => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    {format(new Date(appointment.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{appointment.startTime}</TableCell>
                  <TableCell>
                    Dr. {appointment.psychologist.firstName}{' '}
                    {appointment.psychologist.lastName}
                  </TableCell>
                  <TableCell>{appointment.duration} minutes</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        appointment.status === 'confirmed'
                          ? 'default'
                          : appointment.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {appointment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Availability Section */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
          <CardDescription>
            Set your available hours for appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar />
          <div className="space-y-4 mt-4">
            {Object.entries(availability).map(
              ([day, { enabled, startTime, endTime }]) => (
                <div key={day} className="flex items-center gap-6">
                  <div className="w-28 flex items-center gap-2">
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => handleToggleDay(day)}
                    />
                    <span className="capitalize">{day}</span>
                  </div>
                  <Select
                    value={startTime}
                    onValueChange={value =>
                      handleTimeChange(day, 'startTime', value)
                    }
                    disabled={!enabled}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>to</span>
                  <Select
                    value={endTime}
                    onValueChange={value =>
                      handleTimeChange(day, 'endTime', value)
                    }
                    disabled={!enabled}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
