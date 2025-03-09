export interface Psychologist {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhotoUrl: string;
  image?: string;
  specializations: string[];
  country: string;
  city: string;
  licenseType: string;
  yearsOfExperience: number;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
}

export interface Message {
  _id: string;
  content: string;
  conversation: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  receiverId: string;
  senderId: string;
  sender?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    image?: string;
    role?: string;
  };
  updatedAt: string;
  messageType?: string; // Add this property
  metadata?: any; // Consider adding this for call data
}

export interface Conversation {
  _id: string;
  user: any;
  psychologist: any;
  lastMessage?: any;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}
