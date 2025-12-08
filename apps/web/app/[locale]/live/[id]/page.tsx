import { LiveViewerPage } from '@/components/live/LiveViewerPage';
import { generateSEOMetadata, generateBroadcastEventStructuredData } from '@/lib/seo';

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  // TODO: Fetch actual stream data
  return generateSEOMetadata({
    title: 'Live Stream - Strike Gaming Cloud',
    description: 'Watch this live gaming stream on Strike.',
    pathname: `/live/${id}`,
    ogType: 'website',
  });
}

export default async function LiveViewerRoute({ params }: PageProps) {
  const { id } = await params;
  return <LiveViewerPage streamId={id} />;
}

