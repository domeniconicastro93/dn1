import { prisma } from '@strike/shared-db';

async function main() {
    const email = 'domenico.ncsnicastro@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('User exists:', !!user);
    if (user) {
        console.log('User ID:', user.id);
        // Update SteamID if needed
        if (user.steamId64 !== '76561198763654695') {
            console.log('Updating SteamID...');
            await prisma.user.update({
                where: { id: user.id },
                data: { steamId64: '76561198763654695' }
            });
            console.log('Updated.');
        }
    }
}

main();
