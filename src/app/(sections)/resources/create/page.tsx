import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const ResourceCreateForm = dynamic(
  () => import('@/components/ResourceCreateForm'),
  {
    ssr: true,
    loading: () => (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-pulse text-center">
          <p>Loading editor...</p>
        </div>
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: 'Create New Resource | Mental Health Platform',
  description:
    'Share your mental health resources and help others on their journey to wellbeing',
};

export default function CreateResourcePage() {
  return <ResourceCreateForm />;
}
