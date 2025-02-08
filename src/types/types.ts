export interface SendVerificationEmailParams {
  email: string;
  verifyCode: string;
}

export interface VerificationEmailResponse {
  success: boolean;
  message: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'canceled'
  | 'no-show';

// export interface Appointment {
//   id: string | number;
//   title: string;
//   patientName: string;
//   notes?: string;
//   start: string;
//   end: string;
//   status: AppointmentStatus;
//   extendedProps?: {
//     psychologistId?: string;
//     psychologistName?: string;
//     type?: 'appointment' | 'availability';
//     status?: AppointmentStatus;
//   };
// }

export interface Appointment {
  id: string;

  date: string;

  startTime: string;

  endTime: string;

  status: AppointmentStatus;

  type: 'online' | 'in-person';

  notes?: string;
}

export interface Psychologist {
  id: string;
  name: string;
  specialization?: string;
  availability?: {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
  }[];
}

export interface AppointmentFormData {
  title: string;
  patientName: string;
  notes: string;
  start: string;
  end: string;
  status: AppointmentStatus;
}
