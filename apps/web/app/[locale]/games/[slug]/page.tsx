import { GameDetailPage } from '@/components/games/GameDetailPage';
import { generateSEOMetadata, generateVideoGameStructuredData } from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  // TODO: Fetch actual game data
  const gameName = slug.replace(/-/g, ' ');

  return generateSEOMetadata({
    title: `${gameName} - Strike Gaming Cloud`,
    description: `Play ${gameName} instantly in the cloud. No downloads, no waiting.`,
    pathname: `/games/${slug}`,
    ogType: 'article',
  });
}

export default async function GameDetailRoute({ params }: PageProps) {
  const { slug } = await params;
  return <GameDetailPage slug={slug} />;
}

