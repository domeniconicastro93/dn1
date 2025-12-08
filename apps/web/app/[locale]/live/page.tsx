import { LivePage } from '@/components/live/LivePage';
import { generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Live Streams - Strike Gaming Cloud',
    description: 'Watch live gaming streams from top creators. Join the action in real-time.',
    pathname: '/live',
  });
}

export default function LiveRoute() {
  return <LivePage />;
}

