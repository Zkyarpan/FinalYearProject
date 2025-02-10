export interface AppointmentData {
  psychologistId: string;
  start: string;
  end: string;
  stripePaymentIntentId?: string;
  paymentIntentId?: string;
  sessionFormat: string;
  patientName: string;
  email: string;
  phone: string;
  reasonForVisit: string;
  notes?: string;
  insuranceProvider?: string;
}

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

export const validateAppointmentData = (
  data: Partial<AppointmentData>
): ValidationResult => {
  const requiredFields = [
    'psychologistId',
    'start',
    'end',
    'sessionFormat',
    'patientName',
    'email',
    'phone',
    'reasonForVisit',
  ];

  // Check for payment intent ID (either old or new field name)
  if (!data.stripePaymentIntentId && !data.paymentIntentId) {
    return {
      isValid: false,
      error: 'Payment information is required',
    };
  }

  // Check for missing required fields
  const missingFields = requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
    };
  }

  // Validate email format
  if (!isValidEmail(data.email!)) {
    return {
      isValid: false,
      error: 'Invalid email format',
    };
  }

  // Validate phone number format
  if (!isValidPhone(data.phone!)) {
    return {
      isValid: false,
      error: 'Invalid phone number format. Must be 10 digits',
    };
  }

  // Validate session format
  const validFormats = ['video', 'in-person'];
  if (!validFormats.includes(data.sessionFormat!)) {
    return {
      isValid: false,
      error: 'Invalid session format. Must be either "video" or "in-person"',
    };
  }

  // Validate dates
  const startDate = new Date(data.start!);
  const endDate = new Date(data.end!);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date format',
    };
  }

  if (endDate <= startDate) {
    return {
      isValid: false,
      error: 'End time must be after start time',
    };
  }

  return { isValid: true };
};
