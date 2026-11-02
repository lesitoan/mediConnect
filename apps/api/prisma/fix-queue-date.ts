import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { clinicDate, clinicDateString } from '../src/common/utils/clinic-date';

function previousDate(value: string): string {
  const date = clinicDate(value);
  date.setUTCDate(date.getUTCDate() - 1);
  return clinicDateString(date);
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const schema = new URL(connectionString).searchParams.get('schema') || 'public';
  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString, connectionTimeoutMillis: 5000 },
      { schema },
    ),
  });
  const isDryRun = process.argv.includes('--dry-run');
  await prisma.$connect();
  try {
    const sessions = await prisma.careSession.findMany({
      where: { queueDate: { not: null }, checkedInAt: { not: null } },
      select: { id: true, specialtyId: true, queueDate: true, createdAt: true },
    });
    const candidates = sessions.filter(({ queueDate, createdAt }) => {
      if (!queueDate) return false;
      const clinicCreatedDate = clinicDateString(createdAt);
      return clinicDateString(queueDate) === previousDate(clinicCreatedDate);
    });
    const candidateIds = new Set(candidates.map(({ id }) => id));
    const conflicts = await prisma.careSession.findMany({
      where: {
        id: { notIn: [...candidateIds] },
        queueDate: { in: candidates.map(({ createdAt }) => clinicDate(clinicDateString(createdAt))) },
      },
      select: { id: true, specialtyId: true, queueDate: true },
    });
    const conflictKeys = new Set(
      conflicts.map(({ specialtyId, queueDate }) =>
        `${specialtyId}:${queueDate ? clinicDateString(queueDate) : ''}`,
      ),
    );
    const conflict = candidates.find(
      ({ specialtyId, createdAt }) =>
        conflictKeys.has(
          `${specialtyId}:${clinicDateString(clinicDate(clinicDateString(createdAt)))}`,
        ),
    );
    if (conflict)
      throw new Error(
        `Unique collision at specialty/date ${conflict.specialtyId}/${clinicDateString(clinicDate(clinicDateString(conflict.createdAt)))}`,
      );
    console.log(`${isDryRun ? 'DRY RUN' : 'READY'}: ${candidates.length} CareSession rows`);
    if (!isDryRun) {
      await prisma.$transaction(
        candidates.map(({ id, createdAt }) =>
          prisma.careSession.update({
            where: { id },
            data: { queueDate: clinicDate(clinicDateString(createdAt)) },
          }),
        ),
      );
      console.log('Queue dates updated.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Queue date fix failed.');
  process.exitCode = 1;
});
