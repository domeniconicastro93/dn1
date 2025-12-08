import { WebRTCPlayer } from '@/components/player/WebRTCPlayer';
import { generateSEOMetadata } from '@/lib/seo';

interface PageProps {
    params: Promise<{ sessionId: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { sessionId } = await params;

    return generateSEOMetadata({
        title: 'Play - Strike Gaming Cloud',
        description: 'Play your game instantly in the cloud with Strike.',
        pathname: `/play/${sessionId}`,
        ogType: 'website',
    });
}

export default async function PlayPage({ params }: PageProps) {
    const { sessionId } = await params;

    return (
        <div className="min-h-screen bg-black">
            <WebRTCPlayer sessionId={sessionId} />
        </div>
    );
}
