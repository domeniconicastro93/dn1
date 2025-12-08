import 'dotenv/config';
import { prisma } from '@strike/shared-db';

async function main() {
    console.log('--- Checking Users and Steam IDs ---');
    const users = await prisma.user.findMany();

    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
