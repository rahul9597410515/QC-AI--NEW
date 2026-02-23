import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        const users = await prisma.user.findMany({ select: { email: true, passwordHash: true } });
        console.log('Users:', users);
    } catch (err) {
        console.error('Prisma Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
