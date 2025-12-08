import { prisma } from '@strike/shared-db';

async function main() {
    const email = 'domenico.ncsnicastro@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        // Check if another user has this SteamID
        const conflict = await prisma.user.findFirst({
            where: { steamId64: '76561198763654695', id: { not: user.id } }
        });

        if (conflict) {
            console.log('Conflict found! User ID:', conflict.id);
            // Clear the conflict
            await prisma.user.update({
                where: { id: conflict.id },
                data: { steamId64: null }
            });
            console.log('Conflict cleared.');
        }

        console.log('Updating SteamID...');
        await prisma.user.update({
            where: { id: user.id },
            data: { steamId64: '76561198763654695' }
        });
        console.log('Updated.');
    }
}

main();
