
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const email = 'domenico.nica@gmail.com';
    const steamId64 = '76561198155371511';

    console.log(`Updating user ${email} with SteamID ${steamId64}...`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error('User not found!');
            return;
        }

        const updated = await prisma.user.update({
            where: { email },
            data: { steamId64 },
        });

        console.log('User updated successfully:', updated);
    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
