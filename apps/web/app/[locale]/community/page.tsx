import { CommunityPage } from '@/components/community/CommunityPage';
import { generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Community - Strike Gaming Cloud',
    description: 'Join gaming hubs, channels, and events. Connect with fellow gamers.',
    pathname: '/community',
  });
}

export default function CommunityRoute() {
  return <CommunityPage />;
}

