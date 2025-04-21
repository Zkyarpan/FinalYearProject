import { describe, it, expect, beforeEach } from '@jest/globals';

interface Appointment {
  patientId: string;
  psychologistId: string;
  time: string;
  status: 'booked' | 'cancelled' | 'completed';
}

let mockAppointments: Appointment[] = [];

function bookAppointment(
  patientId: string,
  psychologistId: string,
  time: string
): string {
  const alreadyBooked = mockAppointments.find(
    a =>
      a.psychologistId === psychologistId &&
      a.time === time &&
      a.status === 'booked'
  );

  if (alreadyBooked) return 'Slot already booked';

  mockAppointments.push({
    patientId,
    psychologistId,
    time,
    status: 'booked',
  });

  return 'Appointment booked successfully';
}

beforeEach(() => {
  mockAppointments = [];
});

describe('📆 Appointment Booking', () => {
  it('✅ should allow a patient to book a free slot with a psychologist', () => {
    const result = bookAppointment('patient1', 'psych1', '2025-04-26T10:00');
    expect(result).toBe('Appointment booked successfully');
    expect(mockAppointments.length).toBe(1);
  });

  it('❌ should reject booking if slot is already booked', () => {
    bookAppointment('patient1', 'psych1', '2025-04-26T10:00'); // first booking
    const result = bookAppointment('patient2', 'psych1', '2025-04-26T10:00'); // duplicate slot
    expect(result).toBe('Slot already booked');
    expect(mockAppointments.length).toBe(1);
  });

  it('✅ should allow booking different time for same psychologist', () => {
    bookAppointment('patient1', 'psych1', '2025-04-26T10:00');
    const result = bookAppointment('patient2', 'psych1', '2025-04-26T11:00');
    expect(result).toBe('Appointment booked successfully');
    expect(mockAppointments.length).toBe(2);
  });
});
