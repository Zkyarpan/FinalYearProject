'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useUserStore } from '@/store/userStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, User } from 'lucide-react';

interface Psychologist {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhotoUrl: string;
  specializations: string[];
  country: string;
  city: string;
  licenseType: string;
  yearsOfExperience: number;
}

export default function PsychologistsList({
  onSelectPsychologist,
  selectedPsychologistId,
}: {
  onSelectPsychologist: (id: string) => void;
  selectedPsychologistId: string | null;
}) {
  const { onlineUsers } = useSocket();
  const { user } = useUserStore();
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch all psychologists
  useEffect(() => {
    const fetchPsychologists = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/psychologist/profile');
        if (response.ok) {
          const data = await response.json();

          // Handle the psychologist/profile API format
          if (data.IsSuccess && data.Result && data.Result.psychologists) {
            // Transform the data to match what our component expects
            const formattedPsychologists = data.Result.psychologists.map(
              psych => ({
                _id: psych.id, // Convert id to _id
                firstName: psych.firstName || '',
                lastName: psych.lastName || '',
                email: psych.email || '',
                profilePhotoUrl: psych.profilePhoto || '', // Convert profilePhoto to profilePhotoUrl
                specializations: psych.specializations || [],
                // Include other fields as needed
                country: psych.country || '',
                city: psych.city || '',
                licenseType: psych.licenseType || '',
                yearsOfExperience: psych.yearsOfExperience || 0,
              })
            );
            setPsychologists(formattedPsychologists);
          } else {
            console.error('Unexpected API response format:', data);
            setPsychologists([]);
          }
        }
      } catch (error) {
        console.error('Error fetching psychologists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPsychologists();
  }, []);

  // Filter psychologists based on search query
  const filteredPsychologists = psychologists.filter(psych => {
    const fullName = `${psych.firstName || ''} ${
      psych.lastName || ''
    }`.toLowerCase();
    const specializations = (psych.specializations || [])
      .join(' ')
      .toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    return (
      fullName.includes(searchLower) || specializations.includes(searchLower)
    );
  });

  // Check if a psychologist is online
  const isOnline = psychologistId => {
    return onlineUsers.some(user => user.userId === psychologistId);
  };

  // Get initials for avatar
  const getInitials = psych => {
    if (psych.firstName && psych.lastName) {
      return `${psych.firstName[0]}${psych.lastName[0]}`;
    }
    if (psych.firstName) {
      return psych.firstName[0];
    }
    return psych.email[0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search psychologists..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredPsychologists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="font-medium">No psychologists found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search criteria
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {filteredPsychologists.map(psychologist => {
              const online = isOnline(psychologist._id);
              const isSelected = selectedPsychologistId === psychologist._id;

              return (
                <li
                  key={psychologist._id}
                  className={`hover:bg-accent/50 cursor-pointer ${
                    isSelected ? 'bg-accent' : ''
                  }`}
                  onClick={() => onSelectPsychologist(psychologist._id)}
                >
                  <div className="flex items-start p-3 gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={psychologist.profilePhotoUrl}
                          alt={psychologist.firstName}
                        />
                        <AvatarFallback>
                          {getInitials(psychologist)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                          online ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm truncate">
                          Dr. {psychologist.firstName} {psychologist.lastName}
                        </h4>
                        <Badge
                          variant={online ? 'default' : 'secondary'}
                          className={`text-xs ${
                            online ? 'bg-green-500 hover:bg-green-600' : ''
                          }`}
                        >
                          {online ? 'Online' : 'Offline'}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground truncate">
                        {psychologist.specializations
                          ?.slice(0, 2)
                          ?.join(', ') || 'Clinical Psychologist'}
                      </p>

                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={e => {
                          e.stopPropagation(); // Prevent parent onClick from firing
                          onSelectPsychologist(psychologist._id);
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
