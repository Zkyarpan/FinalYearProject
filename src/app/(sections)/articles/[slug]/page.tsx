import ArticleDetail from '@/components/ArticleDetail';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Article | Mentality',
  description: 'Read our full mental health article',
};

export default function ArticlePage() {
  return <ArticleDetail />;
}
