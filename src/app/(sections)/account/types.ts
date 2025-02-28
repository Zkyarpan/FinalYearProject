export interface Profile {
    id: string;
    firstName: string;
    lastName: string;
    image: string;
    address: string;
    phone: string;
    age: number;
    gender: string;
    emergencyContact: string;
    emergencyPhone: string;
    therapyHistory: string;
    preferredCommunication: string;
    struggles: string[];
    briefBio: string;
    profileCompleted: boolean;
    createdAt: string;
    updatedAt: string;
  }