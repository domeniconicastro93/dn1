import { ClipDetailPage } from '@/components/clips/ClipDetailPage';
import { generateSEOMetadata, generateVideoObjectStructuredData } from '@/lib/seo';

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  // TODO: Fetch actual clip data
  return generateSEOMetadata({
    title: 'Gaming Clip - Strike Gaming Cloud',
    description: 'Watch this epic gaming moment from Strike.',
    pathname: `/clips/${id}`,
    ogType: 'website',
  });
}

export default async function ClipDetailRoute({ params }: PageProps) {
  const { id } = await params;
  return <ClipDetailPage clipId={id} />;
}

