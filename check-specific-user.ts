import 'dotenv/config';
import { prisma } from '@strike/shared-db';

async function main() {
    const email = 'nicastropaolini@gmail.com';
    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            steamId64: true,
        },
    });

    if (user) {
        console.log(`User Found:`);
        console.log(`- ID: ${user.id}`);
        console.log(`- SteamID: ${user.steamId64 || 'NONE'}`);
    } else {
        console.log('User not found in DB.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
