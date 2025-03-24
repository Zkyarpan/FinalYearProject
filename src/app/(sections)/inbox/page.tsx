import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import InboxClient from '@/components/inbox/InboxClient';

export default function InboxPage() {
  return (
    <Suspense fallback={<InboxLoading />}>
      <InboxClient />
    </Suspense>
  );
}

function InboxLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Loading conversations...</p>
      </div>
    </div>
  );
}
