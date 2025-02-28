'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Error: {error instanceof Error ? error.message : 'Something went wrong'}
    </div>
  );
}
