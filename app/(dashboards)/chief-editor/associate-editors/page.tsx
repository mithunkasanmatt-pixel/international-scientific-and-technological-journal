import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default async function EditorsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.CHIEF_EDITOR) {
    redirect('/login');
  }

  // Get active editors (Role.EDITOR)
  const editors = await prisma.user.findMany({
    where: {
      role: Role.EDITOR,
      isActive: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-primary">
          Editors Board
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          List of active registered editors managing manuscript review cycles.
        </p>
      </div>

      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="bg-card px-6 py-4 border-b border-border">
          <CardTitle className="text-base font-bold text-foreground tracking-tight uppercase">
            Active Editors ({editors.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {editors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm font-medium flex flex-col items-center justify-center gap-2">
              <Users className="h-10 w-10 text-muted-foreground/60" />
              <span>No editors registered yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border">
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Name</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Email</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Registered Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {editors.map((ed) => (
                    <tr key={ed.id} className="hover:bg-primary/5 transition-all">
                      <td className="p-4 font-bold text-foreground text-sm">{ed.name}</td>
                      <td className="p-4 text-muted-foreground text-sm font-semibold">{ed.email}</td>
                      <td className="p-4 text-muted-foreground text-sm font-medium">
                        {new Date(ed.createdAt).toLocaleDateString()}
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
