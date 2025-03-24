import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const EditArticleForm = dynamic(
  () => import('../../../../forms/EditArticleForm'),
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
  title: 'Edit Article',
  description: 'Update your mental health article',
};

export default function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  return <EditArticleForm articleId={params.id} />;
}
