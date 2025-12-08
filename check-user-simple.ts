import { prisma } from '@strike/shared-db';

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'domenico.nica@gmail.com' },
    });
    console.log('User:', user);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
