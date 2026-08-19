import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';

export default async function ReviewsManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.ADMIN) {
    redirect('/login');
  }

  // Get active review reports
  const reviews = await prisma.review.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      submission: true,
      reviewer: true,
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-primary">
          Review Management
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Monitor peer-review progress, audit comments, and review submitted academic evaluations.
        </p>
      </div>

      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="bg-card px-6 py-4 border-b border-border">
          <CardTitle className="text-base font-bold text-foreground tracking-tight uppercase flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary shrink-0" />
            <span>Peer Review Reports ({reviews.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm font-medium">
              No review reports found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border">
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Paper ID</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Reviewer</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Recommendation</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Completed At</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {reviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-primary/5 transition-all">
                      <td className="p-4 font-mono font-bold text-foreground text-sm">{rev.submission.paperId}</td>
                      <td className="p-4 text-muted-foreground text-sm font-semibold">{rev.reviewer.name}</td>
                      <td className="p-4 text-muted-foreground text-sm font-bold uppercase tracking-wider">
                        {rev.recommendation || 'N/A'}
                      </td>
                      <td className="p-4 text-muted-foreground text-sm font-medium">
                        {rev.status === 'COMPLETED' ? new Date(rev.updatedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-4 text-sm font-semibold">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          rev.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {rev.status === 'COMPLETED' ? 'SUBMITTED' : 'PENDING'}
                        </span>
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
