import { PrismaClient } from '@prisma/client/extension';

export async function cleanDatabase(prisma: PrismaClient) {
  await prisma.booking.deleteMany();
  await prisma.workingHours.deleteMany();
  await prisma.service.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();
}
