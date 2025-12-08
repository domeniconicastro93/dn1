/**
 * Dynamic OG Image API Route
 * 
 * Generates dynamic Open Graph images using @vercel/og
 * 
 * Example: /api/og-image?type=game&title=GTA%206&image=...
 */

import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'default';
    const title = searchParams.get('title') || 'Strike Gaming Cloud';
    const subtitle = searchParams.get('subtitle') || '';
    const image = searchParams.get('image');
    const game = searchParams.get('game');
    const creator = searchParams.get('creator');
    const views = searchParams.get('views');
    const likes = searchParams.get('likes');

    // In production, use @vercel/og:
    // import { ImageResponse } from '@vercel/og';
    // 
    // return new ImageResponse(
    //   (
    //     <div
    //       style={{
    //         height: '100%',
    //         width: '100%',
    //         display: 'flex',
    //         flexDirection: 'column',
    //         alignItems: 'center',
    //         justifyContent: 'center',
    //         backgroundColor: '#080427',
    //         backgroundImage: image ? `url(${image})` : undefined,
    //         backgroundSize: 'cover',
    //         backgroundPosition: 'center',
    //       }}
    //     >
    //       <div
    //         style={{
    //           display: 'flex',
    //           flexDirection: 'column',
    //           alignItems: 'center',
    //           justifyContent: 'center',
    //           padding: '80px',
    //           backgroundColor: 'rgba(8, 4, 39, 0.9)',
    //           borderRadius: '20px',
    //         }}
    //       >
    //         <h1
    //           style={{
    //             fontSize: '72px',
    //             fontWeight: 'bold',
    //             color: '#FFFFFF',
    //             marginBottom: '20px',
    //             textAlign: 'center',
    //           }}
    //         >
    //           {title}
    //         </h1>
    //         {subtitle && (
    //           <p
    //             style={{
    //               fontSize: '32px',
    //               color: '#A0A0A0',
    //               marginBottom: '20px',
    //             }}
    //           >
    //             {subtitle}
    //           </p>
    //         )}
    //         {(views || likes) && (
    //           <div
    //             style={{
    //               display: 'flex',
    //               gap: '40px',
    //               marginTop: '20px',
    //             }}
    //           >
    //             {views && (
    //               <span style={{ fontSize: '24px', color: '#FFFFFF' }}>
    //                 👁️ {views}
    //               </span>
    //             )}
    //             {likes && (
    //               <span style={{ fontSize: '24px', color: '#FFFFFF' }}>
    //                 ❤️ {likes}
    //               </span>
    //             )}
    //           </div>
    //         )}
    //       </div>
    //     </div>
    //   ),
    //   {
    //     width: 1200,
    //     height: 630,
    //   }
    // );

    // For Phase 7, return a placeholder response
    // In production, this would generate the actual image
    return new Response('OG Image generation not yet implemented', {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error('[OG-IMAGE] Error generating OG image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}

