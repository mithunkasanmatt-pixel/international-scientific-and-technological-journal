import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileCheck, FileWarning } from 'lucide-react';

export default async function DecisionsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.CHIEF_EDITOR) {
    redirect('/login');
  }

  // Get timeline events that record final decisions (ACCEPTED, REJECTED, REVISION_REQUIRED)
  const decisions = await prisma.timelineEvent.findMany({
    where: {
      status: {
        in: ['ACCEPTED', 'REJECTED', 'REVISION_REQUIRED', 'PUBLISHED'],
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      submission: true,
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-primary">
          Editorial Decisions Log
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Review historical acceptances, rejections, and publishing approvals issued across all manuscripts.
        </p>
      </div>

      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="bg-card px-6 py-4 border-b border-border">
          <CardTitle className="text-base font-bold text-foreground tracking-tight uppercase">
            Logged Editorial Decisions ({decisions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {decisions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm font-medium flex flex-col items-center justify-center gap-2">
              <FileWarning className="h-10 w-10 text-muted-foreground/60" />
              <span>No editorial decisions have been logged yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border">
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Date</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Paper ID</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Manuscript Title</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Decision</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {decisions.map((dec) => (
                    <tr key={dec.id} className="hover:bg-primary/5 transition-all">
                      <td className="p-4 text-muted-foreground text-sm font-medium shrink-0">
                        {new Date(dec.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-mono font-bold text-foreground text-sm">
                        {dec.submission.paperId}
                      </td>
                      <td className="p-4 font-bold text-foreground text-sm truncate max-w-[200px]" title={dec.submission.title}>
                        {dec.submission.title}
                      </td>
                      <td className="p-4 text-sm font-semibold">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          dec.status === 'ACCEPTED' || dec.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : dec.status === 'REJECTED'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {dec.status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm font-medium max-w-[300px] truncate" title={dec.comments || ''}>
                        {dec.comments}
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
