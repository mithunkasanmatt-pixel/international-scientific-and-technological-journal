import { prisma } from '@/lib/prisma';

export async function getNextPaperId(): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    // Lock and update the sequence counter for submissions
    const sequence = await tx.idSequence.update({
      where: { name: 'submission' },
      data: { currentVal: { increment: 1 } },
    });

    // Format value with leading zeroes, e.g., IST000111
    const valString = String(sequence.currentVal).padStart(6, '0');
    return `IST${valString}`;
  });
}
