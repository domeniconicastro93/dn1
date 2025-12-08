
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching all users...');
    const users = await prisma.user.findMany();
    console.log(JSON.stringify(users, null, 2));
}

main();
