import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default async function PublishManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.CHIEF_EDITOR) {
    redirect('/login');
  }

  // Get papers that are ACCEPTED or PUBLISHED
  const papers = await prisma.submission.findMany({
    where: {
      status: {
        in: ['ACCEPTED', 'PUBLISHED'],
      },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      submitter: true,
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-primary">
          Publish Management
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Manage and monitor final publishing outputs, volumes, and open access releases for accepted manuscripts.
        </p>
      </div>

      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="bg-card px-6 py-4 border-b border-border">
          <CardTitle className="text-base font-bold text-foreground tracking-tight uppercase">
            Accepted & Published Manuscripts ({papers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {papers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm font-medium flex flex-col items-center justify-center gap-2">
              <BookOpen className="h-10 w-10 text-muted-foreground/60" />
              <span>No accepted or published papers found.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border">
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Paper ID</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Title</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Submitting Author</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Country</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {papers.map((paper) => (
                    <tr key={paper.id} className="hover:bg-primary/5 transition-all">
                      <td className="p-4 font-mono font-bold text-foreground text-sm">{paper.paperId}</td>
                      <td className="p-4 font-bold text-foreground text-sm truncate max-w-[250px]" title={paper.title}>
                        {paper.title}
                      </td>
                      <td className="p-4 text-muted-foreground text-sm font-semibold">{paper.submitter.name}</td>
                      <td className="p-4 text-muted-foreground text-sm font-medium">{paper.country}</td>
                      <td className="p-4 text-sm font-semibold">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          paper.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {paper.status}
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
