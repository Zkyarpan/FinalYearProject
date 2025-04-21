import { describe, it, expect, beforeEach } from '@jest/globals';

interface Appointment {
  id: string;
  patientEmail: string;
  psychologistName: string;
  time: string;
}

let notifications: string[] = [];

function sendConfirmation(appointment: Appointment): string {
  const message = `✅ Confirmation: Appointment with ${appointment.psychologistName} on ${appointment.time} has been booked.`;
  notifications.push(message);
  return message;
}

describe('📩 Appointment Confirmation Notification', () => {
  beforeEach(() => {
    notifications = [];
  });

  it('✅ should send confirmation message after booking', () => {
    const message = sendConfirmation({
      id: 'appt-123',
      patientEmail: 'user@example.com',
      psychologistName: 'Dr. Arpan Karki',
      time: '2025-04-28T10:00',
    });

    expect(notifications.length).toBe(1);
    expect(message).toContain('Appointment with Dr. Arpan Karki');
  });

  it('✅ should store multiple confirmation messages', () => {
    sendConfirmation({
      id: 'appt-001',
      patientEmail: 'a@a.com',
      psychologistName: 'Dr. Sneha Sharma',
      time: '2025-04-29T14:00',
    });

    sendConfirmation({
      id: 'appt-002',
      patientEmail: 'b@b.com',
      psychologistName: 'Dr. Arpan Karki',
      time: '2025-04-30T16:00',
    });

    expect(notifications.length).toBe(2);
  });
});
