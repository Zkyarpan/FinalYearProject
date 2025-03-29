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
  tempId?: string;
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
  receiver?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    image?: string;
    role?: string;
  };
  updatedAt: string;
  messageType?: string;
  metadata?: any;

  // Message status properties
  pending?: boolean;
  failed?: boolean;
  delivered?: boolean;
  deliveredAt?: string;
  error?: string;
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
