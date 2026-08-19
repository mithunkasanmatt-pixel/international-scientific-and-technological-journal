import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash password
  const hashedPassword = await bcrypt.hash('Matt@4321admin', 10);

  // Clear existing submissions, authors, and review records to start fresh
  await prisma.review.deleteMany();
  await prisma.submissionAuthor.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.reviewerProfile.deleteMany();
  await prisma.submission.deleteMany();
  
  // Clear any existing users with emails we are going to seed
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'admin@mattengg.com',
          'editor@mattengg.com'
        ]
      }
    }
  });

  // Seed Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@mattengg.com',
      name: 'System Admin',
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`Admin user seeded: ${admin.email}`);

  // Seed Chief Editor
  const chiefEditor = await prisma.user.create({
    data: {
      email: 'editor@mattengg.com',
      name: 'Chief Editor',
      password: hashedPassword,
      role: Role.CHIEF_EDITOR,
      isActive: true,
    },
  });
  console.log(`Chief Editor user seeded: ${chiefEditor.email}`);



  // Initialize ID Sequence for paper submissions
  const sequence = await prisma.idSequence.upsert({
    where: { name: 'submission' },
    update: { currentVal: 110 },
    create: {
      name: 'submission',
      currentVal: 110,
    },
  });
  console.log(`Paper ID sequence initialized at: ${sequence.currentVal}`);

  console.log('Seeding complete successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
