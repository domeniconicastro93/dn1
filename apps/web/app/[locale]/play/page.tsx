import { PlayPage } from '@/components/play/PlayPage';
import { generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Play - Strike Gaming Cloud',
    description: 'Play your favorite games instantly in the cloud. No downloads required.',
    pathname: '/play',
    noindex: true, // Play page should not be indexed
  });
}

export default function PlayRoute() {
  return <PlayPage />;
}

