import { ClipsPage } from '@/components/clips/ClipsPage';
import { generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Clips & Reels - Strike Gaming Cloud',
    description:
      'Watch epic gaming moments, highlights, and TikTok-style reels from the Strike community.',
    pathname: '/clips',
  });
}

export default function ClipsRoute() {
  return <ClipsPage />;
}

