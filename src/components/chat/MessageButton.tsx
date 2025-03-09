'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Loader2 } from 'lucide-react';

interface MessageButtonProps {
  psychologistId: string;
  psychologistName: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
}

export default function MessageButton({
  psychologistId,
  psychologistName,
  variant = 'default',
  size = 'default',
  fullWidth = false,
}: MessageButtonProps) {
  const router = useRouter();
  const { startNewConversation } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);

    try {
      await startNewConversation(psychologistId, message);
      setIsOpen(false);
      setMessage('');
      router.push('/dashboard/messages');
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={fullWidth ? 'w-full' : ''}
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        Message
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {psychologistName}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder={`Send a message to ${psychologistName}...`}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
