import 'dotenv/config';
import { prisma } from '@strike/shared-db';

async function main() {
    const email = 'nicastropaolini@gmail.com';
    const steamId64 = '76561198763654695';

    console.log(`Updating user ${email} with SteamID ${steamId64}...`);

    // 1. Check for conflict
    const conflict = await prisma.user.findFirst({
        where: { steamId64 },
    });

    if (conflict) {
        console.log(`Conflict found with user ${conflict.email} (${conflict.id}). Clearing...`);
        await prisma.user.update({
            where: { id: conflict.id },
            data: { steamId64: null },
        });
        console.log('Conflict cleared.');
    }

    // 2. Update target user
    const user = await prisma.user.update({
        where: { email },
        data: { steamId64 },
    });

    console.log(`User Updated:`);
    console.log(`- ID: ${user.id}`);
    console.log(`- SteamID: ${user.steamId64}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
