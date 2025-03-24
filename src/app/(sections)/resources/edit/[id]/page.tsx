import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const EditResourceForm = dynamic(
  () => import('@/components/resources/EditResourceForm'),
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
  title: 'Edit Resource',
  description: 'Update your mental health resource',
};

export default function EditResourcePage({
  params,
}: {
  params: { id: string };
}) {
  return <EditResourceForm resourceId={params.id} />;
}
