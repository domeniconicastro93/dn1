import { CreatorProfilePage } from '@/components/creator/CreatorProfilePage';
import { generateSEOMetadata, generatePersonStructuredData } from '@/lib/seo';

interface PageProps {
  params: Promise<{ handle: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  // TODO: Fetch actual creator data
  return generateSEOMetadata({
    title: `@${handle} - Strike Gaming Cloud`,
    description: `View ${handle}'s profile, clips, and live streams on Strike.`,
    pathname: `/creator/${handle}`,
  });
}

export default async function CreatorProfileRoute({ params }: PageProps) {
  const { handle } = await params;
  return <CreatorProfilePage handle={handle} />;
}

