
require('dotenv').config();
const { prisma } = require('@strike/shared-db');

const targetAppIds = [
    730, 244210, 269950, 406350, 805550,
    1080110, 1462810, 1515950, 1650010, 3664010
];

async function checkGameIds() {
    console.log('Checking Game steamAppIds...');

    const games = await prisma.game.findMany({
        where: {
            steamAppId: {
                in: targetAppIds.map(String)
            }
        },
        select: {
            title: true,
            steamAppId: true
        }
    });

    console.log(`Found ${games.length} matching games in DB.`);

    games.forEach(g => {
        console.log(`Game: ${g.title} - SteamAppID: ${g.steamAppId}`);
    });

    const foundIds = games.map(g => Number(g.steamAppId));
    const missing = targetAppIds.filter(id => !foundIds.includes(id));

    if (missing.length > 0) {
        console.warn('Missing AppIDs in DB:', missing);
    } else {
        console.log('All target AppIDs found in DB.');
    }
}

checkGameIds()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
