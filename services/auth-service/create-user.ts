
import 'dotenv/config';
import { prisma } from '@strike/shared-db';
import bcrypt from 'bcryptjs';

async function main() {
    const email = 'domenico.nica@gmail.com';
    const password = 'Nosmoking93!!';
    const passwordHash = await bcrypt.hash(password, 10);

    console.log(`Creating user ${email}...`);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash,
        },
        create: {
            email,
            passwordHash,
            locale: 'en',
            marketingConsent: true,
            displayName: 'Domenico',
        },
    });

    console.log('User created/updated:', user.id);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
