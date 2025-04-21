import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const EditArticleForm = dynamic(
  () => import('../../../../forms/EditArticleForm'),
  {
    ssr: true,
    loading: () => (
      <div className="flex items-center justify-center min-h-[70vh]">
        <p className="animate-pulse text-center">Loading editor&hellip;</p>
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: 'Edit Article',
  description: 'Update your mental‑health article',
};

interface PageProps {
  params: { id: string };
}

export default function EditArticlePage({ params }: PageProps) {
  return <EditArticleForm articleId={params.id} />;
}
