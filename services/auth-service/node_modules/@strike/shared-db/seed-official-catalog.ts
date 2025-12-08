import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GAMES = [
    { "title": "Cyberpunk 2077", "steamAppId": "1091500", "genre": ["RPG"], "publisher": "CD Projekt Red" },
    { "title": "The Witcher 3: Wild Hunt", "steamAppId": "292030", "genre": ["RPG"], "publisher": "CD Projekt Red" },
    { "title": "Red Dead Redemption 2", "steamAppId": "1174180", "genre": ["Action"], "publisher": "Rockstar Games" },
    { "title": "Grand Theft Auto V", "steamAppId": "271590", "genre": ["Action"], "publisher": "Rockstar Games" },
    { "title": "Elden Ring", "steamAppId": "1245620", "genre": ["RPG"], "publisher": "Bandai Namco" },
    { "title": "Dark Souls III", "steamAppId": "374320", "genre": ["RPG"], "publisher": "Bandai Namco" },
    { "title": "Sekiro: Shadows Die Twice", "steamAppId": "814380", "genre": ["Action"], "publisher": "Activision" },
    { "title": "Hogwarts Legacy", "steamAppId": "990080", "genre": ["RPG"], "publisher": "WB Games" },
    { "title": "Assassin’s Creed Valhalla", "steamAppId": "2208920", "genre": ["Action"], "publisher": "Ubisoft" },
    { "title": "Assassin’s Creed Odyssey", "steamAppId": "812140", "genre": ["Action"], "publisher": "Ubisoft" },
    { "title": "Far Cry 5", "steamAppId": "552520", "genre": ["FPS"], "publisher": "Ubisoft" },
    { "title": "Far Cry 6", "steamAppId": "2369390", "genre": ["FPS"], "publisher": "Ubisoft" },
    { "title": "Rainbow Six Siege", "steamAppId": "359550", "genre": ["FPS"], "publisher": "Ubisoft" },
    { "title": "Battlefield 1", "steamAppId": "1238840", "genre": ["FPS"], "publisher": "EA" },
    { "title": "Battlefield V", "steamAppId": "1238810", "genre": ["FPS"], "publisher": "EA" },
    { "title": "Star Wars Jedi: Fallen Order", "steamAppId": "1172380", "genre": ["Action"], "publisher": "EA" },
    { "title": "Star Wars Jedi: Survivor", "steamAppId": "1774580", "genre": ["Action"], "publisher": "EA" },
    { "title": "FIFA 23", "steamAppId": "1811260", "genre": ["Sports"], "publisher": "EA" },
    { "title": "F1 23", "steamAppId": "2108330", "genre": ["Racing"], "publisher": "EA" },
    { "title": "NBA 2K24", "steamAppId": "2338770", "genre": ["Sports"], "publisher": "2K" },
    { "title": "Mortal Kombat 11", "steamAppId": "976310", "genre": ["Fighting"], "publisher": "WB Games" },
    { "title": "Street Fighter 6", "steamAppId": "1364780", "genre": ["Fighting"], "publisher": "Capcom" },
    { "title": "Resident Evil Village", "steamAppId": "1196590", "genre": ["Horror"], "publisher": "Capcom" },
    { "title": "Resident Evil 4 Remake", "steamAppId": "2050650", "genre": ["Horror"], "publisher": "Capcom" },
    { "title": "Monster Hunter World", "steamAppId": "582010", "genre": ["Action"], "publisher": "Capcom" },
    { "title": "Monster Hunter Rise", "steamAppId": "1446780", "genre": ["Action"], "publisher": "Capcom" },
    { "title": "Dying Light 2", "steamAppId": "534380", "genre": ["Action"], "publisher": "Techland" },
    { "title": "Dying Light", "steamAppId": "239140", "genre": ["Action"], "publisher": "Techland" },
    { "title": "No Man’s Sky", "steamAppId": "275850", "genre": ["Adventure"], "publisher": "Hello Games" },
    { "title": "Baldur’s Gate 3", "steamAppId": "1086940", "genre": ["RPG"], "publisher": "Larian Studios" },
    { "title": "Path of Exile", "steamAppId": "238960", "genre": ["RPG"], "publisher": "Grinding Gear Games" },
    { "title": "Diablo IV", "steamAppId": "2344520", "genre": ["RPG"], "publisher": "Blizzard" },
    { "title": "Call of Duty: Modern Warfare II", "steamAppId": "1938090", "genre": ["FPS"], "publisher": "Activision" },
    { "title": "Call of Duty: Modern Warfare III", "steamAppId": "2519060", "genre": ["FPS"], "publisher": "Activision" },
    { "title": "Forza Horizon 5", "steamAppId": "1551360", "genre": ["Racing"], "publisher": "Xbox Game Studios" },
    { "title": "The Crew Motorfest", "steamAppId": "2536700", "genre": ["Racing"], "publisher": "Ubisoft" },
    { "title": "Assetto Corsa", "steamAppId": "244210", "genre": ["Racing"], "publisher": "Kunos Simulazioni" },
    { "title": "Assetto Corsa Competizione", "steamAppId": "805550", "genre": ["Racing"], "publisher": "Kunos Simulazioni" },
    { "title": "ARK: Survival Evolved", "steamAppId": "346110", "genre": ["Survival"], "publisher": "Wildcard" },
    { "title": "Rust", "steamAppId": "252490", "genre": ["Survival"], "publisher": "Facepunch" },
    { "title": "DayZ", "steamAppId": "221100", "genre": ["Survival"], "publisher": "Bohemia Interactive" },
    { "title": "PUBG", "steamAppId": "578080", "genre": ["Battle Royale"], "publisher": "Krafton" },
    { "title": "Apex Legends", "steamAppId": "1172470", "genre": ["Battle Royale"], "publisher": "EA" },
    { "title": "Counter-Strike 2", "steamAppId": "730", "genre": ["FPS"], "publisher": "Valve" },
    { "title": "Dota 2", "steamAppId": "570", "genre": ["MOBA"], "publisher": "Valve" },
    { "title": "Destiny 2", "steamAppId": "1085660", "genre": ["FPS"], "publisher": "Bungie" },
    { "title": "Warframe", "steamAppId": "230410", "genre": ["Action"], "publisher": "Digital Extremes" },
    { "title": "Capcom Arcade Stadium", "steamAppId": "1515950", "genre": ["Arcade"], "publisher": "CAPCOM" }
];

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function main() {
    console.log('Clearing existing games...');
    await prisma.game.deleteMany({});

    console.log('Seeding official catalog...');
    for (const game of GAMES) {
        const slug = slugify(game.title);
        const thumbnailUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/header.jpg`;
        const coverImageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/library_600x900.jpg`;

        await prisma.game.create({
            data: {
                title: game.title,
                slug,
                description: `${game.title} by ${game.publisher}`,
                thumbnailUrl,
                coverImageUrl,
                steamAppId: game.steamAppId,
                genre: game.genre,
                publisher: game.publisher,
                developer: game.publisher, // Approximation
                releaseDate: new Date(),
                rating: 4.5,
            },
        });
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
