// app/(sections)/blogs/edit/[slug]/page.tsx
import { Suspense } from 'react';
import BlogEditPage from '@/components/BlogEditPage';
import { Loader2 } from 'lucide-react';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function Page({ params }: PageProps) {
  // Use the resolved params
  const slug = params.slug;
  console.log('Blog edit page slug:', slug);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <BlogEditPage slug={slug} />
    </Suspense>
  );
}
