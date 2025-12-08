import { GamesPage } from '@/components/games/GamesPage';
import { generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return generateSEOMetadata({
    title: 'Games - Strike Gaming Cloud',
    description:
      'Browse our library of 2000+ games. Play instantly in the cloud, no downloads required.',
    pathname: '/games',
  });
}

export default function GamesRoute() {
  return <GamesPage />;
}

