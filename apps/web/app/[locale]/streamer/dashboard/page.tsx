import { generateSEOMetadata } from '@/lib/seo';
import { StreamerDashboard } from '@/components/streamer/StreamerDashboard';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Streamer Dashboard - Strike Gaming Cloud',
    description: 'Manage your live streams, view stats, and interact with your audience.',
    pathname: '/streamer/dashboard',
  });
}

export default function StreamerDashboardRoute() {
  return <StreamerDashboard />;
}

