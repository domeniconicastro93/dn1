import { prisma } from '@strike/shared-db';
import 'dotenv/config';

async function main() {
    try {
        const email = 'domenico.ncsnicastro@gmail.com';
        const targetSteamId = '76561198763654695';

        console.log(`Ensuring user ${email} has SteamID ${targetSteamId}...`);

        const users = await prisma.user.findMany();
        const user = users.find(u => u.email === email);

        if (!user) {
            console.error('User not found in list!');
            return;
        }

        console.log('User found:', user.id);

        if (user.steamId64 !== targetSteamId) {
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
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
