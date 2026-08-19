import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default async function ReviewersListPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.CHIEF_EDITOR) {
    redirect('/login');
  }

  // Get active reviewers
  const reviewers = await prisma.user.findMany({
    where: {
      role: Role.REVIEWER,
      isActive: true,
    },
    orderBy: { name: 'asc' },
    include: {
      reviewerProfile: true,
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-primary">
          Reviewers Board
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          List of active registered peer reviewers and their primary domain expertise.
        </p>
      </div>

      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="bg-card px-6 py-4 border-b border-border">
          <CardTitle className="text-base font-bold text-foreground tracking-tight uppercase">
            Active Reviewers Board ({reviewers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reviewers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm font-medium flex flex-col items-center justify-center gap-2">
              <Users className="h-10 w-10 text-muted-foreground/60" />
              <span>No active reviewers registered yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border">
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Name</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Email</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Institution</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Expertise domains</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {reviewers.map((rev) => (
                    <tr key={rev.id} className="hover:bg-primary/5 transition-all">
                      <td className="p-4 font-bold text-foreground text-sm">{rev.name}</td>
                      <td className="p-4 text-muted-foreground text-sm font-semibold">{rev.email}</td>
                      <td className="p-4 text-muted-foreground text-sm font-medium">{rev.reviewerProfile?.institution || 'N/A'}</td>
                      <td className="p-4 text-muted-foreground text-sm font-mono truncate max-w-[200px]" title={rev.reviewerProfile?.domains || ''}>
                        {rev.reviewerProfile?.domains || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
