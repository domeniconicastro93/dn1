import { prisma } from '@strike/shared-db';

async function main() {
    const email = 'domenico.ncsnicastro@gmail.com';
    const targetSteamId = '76561198763654695';

    console.log(`Ensuring user ${email} has SteamID ${targetSteamId}...`);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error('User not found!');
        return;
    }

    if (user.steamId64 !== targetSteamId) {
        // Check for conflict
        const conflict = await prisma.user.findFirst({
            where: { steamId64: targetSteamId, id: { not: user.id } }
        });

        if (conflict) {
            console.log(`Conflict found with user ${conflict.id}. Clearing...`);
            await prisma.user.update({
                where: { id: conflict.id },
                data: { steamId64: null }
            });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { steamId64: targetSteamId }
        });
        console.log('User updated successfully.');
    } else {
        console.log('User already has correct SteamID.');
    }
}

main();
