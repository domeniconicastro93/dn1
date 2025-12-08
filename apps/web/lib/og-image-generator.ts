/**
 * Dynamic OG Image Generator
 * 
 * Generates dynamic Open Graph images for:
 * - Games
 * - Clips/Reels
 * - Creators
 * - Landing Pages
 * 
 * Uses @vercel/og or similar for server-side image generation.
 */

export interface OGImageConfig {
  title: string;
  subtitle?: string;
  image?: string; // Background image URL
  logo?: string; // Logo URL
  type: 'game' | 'clip' | 'creator' | 'landing';
  metadata?: {
    views?: number;
    likes?: number;
    duration?: number;
    game?: string;
    creator?: string;
  };
}

/**
 * Generate OG image URL for a game
 */
export function generateGameOGImageUrl(
  game: {
    name: string;
    image?: string;
    genre?: string[];
  }
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://strike.gg';
  const params = new URLSearchParams({
    type: 'game',
    title: game.name,
    ...(game.image && { image: game.image }),
    ...(game.genre && { genre: game.genre.join(',') }),
  });

  return `${baseUrl}/api/og-image?${params.toString()}`;
}

/**
 * Generate OG image URL for a clip/reel
 */
export function generateClipOGImageUrl(
  clip: {
    title: string;
    thumbnailUrl?: string;
    creator?: string;
    game?: string;
    views?: number;
    likes?: number;
  }
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://strike.gg';
  const params = new URLSearchParams({
    type: 'clip',
    title: clip.title,
    ...(clip.thumbnailUrl && { image: clip.thumbnailUrl }),
    ...(clip.creator && { creator: clip.creator }),
    ...(clip.game && { game: clip.game }),
    ...(clip.views && { views: clip.views.toString() }),
    ...(clip.likes && { likes: clip.likes.toString() }),
  });

  return `${baseUrl}/api/og-image?${params.toString()}`;
}

/**
 * Generate OG image URL for a creator
 */
export function generateCreatorOGImageUrl(
  creator: {
    name: string;
    handle: string;
    avatarUrl?: string;
    followerCount?: number;
  }
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://strike.gg';
  const params = new URLSearchParams({
    type: 'creator',
    title: creator.name,
    subtitle: `@${creator.handle}`,
    ...(creator.avatarUrl && { image: creator.avatarUrl }),
    ...(creator.followerCount && { followers: creator.followerCount.toString() }),
  });

  return `${baseUrl}/api/og-image?${params.toString()}`;
}

/**
 * Generate OG image URL for a landing page
 */
export function generateLandingPageOGImageUrl(
  landingPage: {
    title: string;
    campaign: string;
    game?: string;
  }
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://strike.gg';
  const params = new URLSearchParams({
    type: 'landing',
    title: landingPage.title,
    campaign: landingPage.campaign,
    ...(landingPage.game && { game: landingPage.game }),
  });

  return `${baseUrl}/api/og-image?${params.toString()}`;
}

/**
 * Generate OG image config from data
 */
export function generateOGImageConfig(
  type: OGImageConfig['type'],
  data: Record<string, unknown>
): OGImageConfig {
  const config: OGImageConfig = {
    title: (data.title as string) || 'Strike Gaming Cloud',
    type,
  };

  switch (type) {
    case 'game':
      config.subtitle = (data.genre as string[])?.join(', ') || 'Cloud Gaming';
      config.image = data.image as string;
      config.metadata = {
        game: data.name as string,
      };
      break;

    case 'clip':
      config.subtitle = data.game as string;
      config.image = data.thumbnailUrl as string;
      config.metadata = {
        views: data.views as number,
        likes: data.likes as number,
        creator: data.creator as string,
        game: data.game as string,
      };
      break;

    case 'creator':
      config.subtitle = `@${data.handle as string}`;
      config.image = data.avatarUrl as string;
      config.metadata = {
        views: data.followerCount as number,
      };
      break;

    case 'landing':
      config.subtitle = data.campaign as string;
      config.metadata = {
        game: data.game as string,
      };
      break;
  }

  return config;
}

