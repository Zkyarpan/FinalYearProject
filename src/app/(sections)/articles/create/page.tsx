import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const ArticleCreateForm = dynamic(
  () => import('../../../forms/ArticleCreateForm'),
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
  title: 'Create New Article',
  description: 'Share your insights on mental health',
};

export default function CreateArticlePage() {
  return <ArticleCreateForm />;
}
