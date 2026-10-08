// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export const roundsOfHashing = 12;

// initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  const passwordDemo = await bcrypt.hash('pass123word456', roundsOfHashing);
  const passwordSystemUser = await bcrypt.hash(
    'pass456word321!',
    roundsOfHashing,
  );
  const apiKeySystem = 'demoApiKeyChangeMe!';

  const demoUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      password: passwordDemo,
    },
    create: {
      email: 'user@example.com',
      name: 'DemoUser',
      password: passwordDemo,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {
      password: passwordDemo,
    },
    create: {
      email: 'user2@example.com',
      name: 'DemoUser2',
      password: passwordDemo,
    },
  });

  const systemUser = await prisma.user.upsert({
    where: { email: 'system.user@local.local' },
    update: {
      password: passwordSystemUser,
    },
    create: {
      email: 'system.user@local.local',
      name: 'SystemUser',
      password: passwordSystemUser,
      isSystemUser: true,
    },
  });

  const car = await prisma.car.upsert({
    where: { licencePlate: 'DEMO123' },
    update: {
      ownerId: demoUser.id,
    },
    create: {
      licencePlate: 'DEMO123',
      model: 'Demo Model',
    },
  });

  await prisma.apiKey.upsert({
    where: { id: 1 },
    update: {
      key: apiKeySystem,
      userId: systemUser.id,
    },
    create: {
      name: 'systemApiKey',
      key: apiKeySystem,
      userId: systemUser.id,
      isValid: true,
    },
  });

  console.log({ car });
}

// execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
