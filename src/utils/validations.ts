import { AppointmentData } from '@/types/types';
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const isValidPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return /^\d{10}$/.test(cleanPhone);
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};


export function validateAppointmentData(data: AppointmentData) {
  const errors: string[] = [];

  if (!data.psychologistId) {
    errors.push('Psychologist ID is required');
  }

  if (!data.start || !data.end) {
    errors.push('Start and end times are required');
  }

  if (!data.paymentIntentId) {
    errors.push('Payment intent ID is required');
  }

  if (
    !data.sessionFormat ||
    !['video', 'in-person'].includes(data.sessionFormat)
  ) {
    errors.push('Valid session format is required');
  }

  if (!data.patientName?.trim()) {
    errors.push('Patient name is required');
  }

  if (!data.email?.trim()) {
    errors.push('Email is required');
  }

  if (!data.phone?.trim()) {
    errors.push('Phone number is required');
  }

  if (!data.reasonForVisit?.trim()) {
    errors.push('Reason for visit is required');
  }

  // Validate dates
  try {
    const startDate = new Date(data.start);
    const endDate = new Date(data.end);

    if (startDate >= endDate) {
      errors.push('Start time must be before end time');
    }

    if (startDate < new Date()) {
      errors.push('Cannot book appointments in the past');
    }
  } catch (error) {
    errors.push('Invalid date format');
  }

  return {
    isValid: errors.length === 0,
    error: errors.join(', '),
  };
}
