import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface SectionHeaderProps {
  title: string;
  description: string;
  link: string;
  linkText: string;
}

export function SectionHeader({ title, description, link, linkText }: SectionHeaderProps) {
  return (
    <div className="flex gap-2 items-start sm:items-center">
      <div className="flex flex-col flex-1 sm:flex-grow gap-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 items-center">
            <p className="text-gray-1k font-normal text-base">{title}</p>
          </div>
        </div>
        <h3 className="text-gray-1k font-semibold text-xl">{description}</h3>
      </div>
      <Button asChild>
        <Link href={link}>{linkText}</Link>
      </Button>
    </div>
  );
}