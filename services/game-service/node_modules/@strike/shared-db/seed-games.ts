import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding games...');

    const games = [
        {
            slug: 'cyberpunk-2077',
            steamAppId: '1091500',
            title: 'Cyberpunk 2077',
            description: 'Cyberpunk 2077 is an open-world, action-adventure story set in Night City.',
            thumbnailUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2mjs.jpg',
            coverImageUrl: 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc855e.jpg',
            genre: ['RPG', 'Action'],
            rating: 4.5,
            developer: 'CD Projekt Red',
            publisher: 'CD Projekt',
            targetResolution: '4K',
            targetFps: 60,
            bitrateRange: { min: 15000, max: 50000 },
        },
        {
            slug: 'the-witcher-3',
            steamAppId: '292030',
            title: 'The Witcher 3: Wild Hunt',
            description: 'You are Geralt of Rivia, mercenary monster slayer.',
            thumbnailUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg',
            coverImageUrl: 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc611g.jpg',
            genre: ['RPG', 'Adventure'],
            rating: 4.9,
            developer: 'CD Projekt Red',
            publisher: 'CD Projekt',
            targetResolution: '1440p',
            targetFps: 60,
            bitrateRange: { min: 10000, max: 30000 },
        },
        {
            slug: 'fortnite',
            steamAppId: null, // Not on Steam
            title: 'Fortnite',
            description: 'The Battle Royale game.',
            thumbnailUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2ftu.jpg',
            coverImageUrl: 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc855e.jpg',
            genre: ['Shooter', 'Battle Royale'],
            rating: 4.0,
            developer: 'Epic Games',
            publisher: 'Epic Games',
            targetResolution: '1080p',
            targetFps: 120,
            bitrateRange: { min: 8000, max: 25000 },
        }
    ];

    for (const game of games) {
        await prisma.game.upsert({
            where: { slug: game.slug },
            update: {
                steamAppId: game.steamAppId,
                title: game.title,
                description: game.description,
                thumbnailUrl: game.thumbnailUrl,
                coverImageUrl: game.coverImageUrl,
                genre: game.genre,
                rating: game.rating,
                developer: game.developer,
                publisher: game.publisher,
                targetResolution: game.targetResolution,
                targetFps: game.targetFps,
                bitrateRange: game.bitrateRange as any,
            },
            create: {
                slug: game.slug,
                steamAppId: game.steamAppId,
                title: game.title,
                description: game.description,
                thumbnailUrl: game.thumbnailUrl,
                coverImageUrl: game.coverImageUrl,
                genre: game.genre,
                rating: game.rating,
                developer: game.developer,
                publisher: game.publisher,
                targetResolution: game.targetResolution,
                targetFps: game.targetFps,
                bitrateRange: game.bitrateRange as any,
            },
        });
    }

    console.log('Games seeded!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
