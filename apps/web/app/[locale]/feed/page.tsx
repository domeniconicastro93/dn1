import { FeedPage } from '@/components/feed/FeedPage';
import { generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Feed - Strike Gaming Cloud',
    description:
      'Discover trending gaming clips, reels, and live streams. Your personalized feed of epic gaming moments.',
    pathname: '/feed',
  });
}

export default function FeedRoute() {
  return <FeedPage />;
}

