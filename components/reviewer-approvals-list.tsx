'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { handleReviewerRegistration } from '@/actions/chief';
import { toast } from 'sonner';

interface ReviewerApprovalsListProps {
  pendingReviewers: any[];
}

export function ReviewerApprovalsList({ pendingReviewers }: ReviewerApprovalsListProps) {
  const [submitting, setSubmitting] = useState<string | null>(null);

  const handleAction = async (profileId: string, action: 'APPROVE' | 'REJECT') => {
    setSubmitting(profileId);
    try {
      const formData = new FormData();
      formData.append('profileId', profileId);
      formData.append('action', action);

      const res = await handleReviewerRegistration(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Reviewer application ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
        window.location.reload();
      }
    } catch (err) {
      toast.error('An error occurred.');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Card className="border-border shadow-xs overflow-hidden">
      <CardHeader className="bg-card px-6 py-4 border-b border-border">
        <CardTitle className="text-base font-bold text-foreground tracking-tight uppercase">
          Pending Applications ({pendingReviewers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {pendingReviewers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm font-medium">
            No pending reviewer registration requests.
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
                  <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pendingReviewers.map((profile) => (
                  <tr key={profile.id} className="hover:bg-primary/5 transition-all">
                    <td className="p-4 font-semibold text-foreground text-sm">{profile.user.name}</td>
                    <td className="p-4 text-muted-foreground text-sm font-medium">{profile.user.email}</td>
                    <td className="p-4 text-muted-foreground text-sm font-medium">{profile.institution}</td>
                    <td className="p-4 text-muted-foreground text-sm font-mono truncate max-w-[200px]" title={profile.domains}>
                      {profile.domains}
                    </td>
                    <td className="p-4 flex justify-end gap-2 text-right">
                      <Button
                        onClick={() => handleAction(profile.id, 'APPROVE')}
                        size="sm"
                        disabled={submitting !== null}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-3 text-xs font-bold"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        <span>Approve</span>
                      </Button>
                      <Button
                        onClick={() => handleAction(profile.id, 'REJECT')}
                        size="sm"
                        variant="destructive"
                        disabled={submitting !== null}
                        className="h-8 px-3 text-xs font-bold"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        <span>Reject</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
