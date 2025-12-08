import { prisma } from '@strike/shared-db';

async function main() {
    try {
        const email = 'domenico.ncsnicastro@gmail.com';
        const targetSteamId = '76561198763654695';

        console.log(`Ensuring user ${email} has SteamID ${targetSteamId}...`);

        // Try to find by ID if email fails (maybe email is not unique or something)
        // But I don't know the ID.
        // Let's list all users and filter in memory to see what's wrong.
        const users = await prisma.user.findMany();
        const user = users.find(u => u.email === email);

        if (!user) {
            console.error('User not found in list!');
            return;
        }

        console.log('User found:', user.id);

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
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
