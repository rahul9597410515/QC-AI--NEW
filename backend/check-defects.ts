import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDefects() {
    const count = await prisma.defectEvent.count();
    console.log('Defect count:', count);
    await prisma.$disconnect();
}

checkDefects();
