import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Default admin user
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@qcai.dev' },
        update: {},
        create: { email: 'admin@qcai.dev', passwordHash: hash, role: 'admin' },
    });
    console.log('  ✓ Admin user: admin@qcai.dev / admin123');

    // Seed some initial alerts
    const alertCount = await prisma.alert.count();
    if (alertCount === 0) {
        await prisma.alert.createMany({
            data: [
                { severity: 'warning', message: 'Line B defect rate exceeded 4%', source: 'Line B' },
                { severity: 'critical', message: 'Temperature sensor spike on Camera 3', source: 'Sensor' },
                { severity: 'info', message: 'Line C scheduled maintenance in 2 hours', source: 'System' },
            ],
        });
        console.log('  ✓ Seeded 3 sample alerts');
    } else {
        console.log('  ✓ Alerts already seeded, skipping');
    }

    // Seed system configs
    const environments = ['Automotive', 'Electronics', 'Textile', 'Pharma'];
    const defaultThresholds = {
        temperature: { warnMax: 90, critMax: 100 },
        vibration: { warnMax: 6, critMax: 8 },
        pressure: { warnMax: 7, critMax: 9 },
        humidity: { warnMax: 70, critMax: 85 },
        speed: { warnMax: 160, critMax: 180 },
        current: { warnMax: 40, critMax: 45 },
    };
    for (const env of environments) {
        await prisma.systemConfig.upsert({
            where: { environment: env },
            update: {},
            create: { environment: env, thresholds: JSON.stringify(defaultThresholds) },
        });
    }
    console.log('  ✓ Seeded system configs for all environments');

    console.log('\n✅ Database seeded successfully!');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
