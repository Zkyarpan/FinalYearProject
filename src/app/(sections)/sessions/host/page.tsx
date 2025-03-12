'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function HostSessionRoute() {
  const router = useRouter();
  const { appointmentId } = useParams();

  useEffect(() => {
    // Redirect to the main session route
    router.replace(`/sessions/${appointmentId}`);
  }, [appointmentId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to session...</p>
    </div>
  );
}
