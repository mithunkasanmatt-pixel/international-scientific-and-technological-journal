'use client';

import React, { useState } from 'react';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { assignReviewerToPaper, delegateToGuestEditor, makeEditorDecision, assignSelfToPaper } from '@/actions/editor';
import { formatDate } from '@/utils/date';
import {
  FileText,
  User,
  Users,
  Download,
  Calendar,
  AlertCircle,
  FileCheck,
  Forward,
  UserPlus,
} from 'lucide-react';
import { SubmissionStatus } from '@prisma/client';

interface EditorPapersListProps {
  papers: any[];
  reviewers: any[];
  guestEditors: any[];
  isGuestEditor?: boolean;
}

export function EditorPapersList({ papers, reviewers, guestEditors, isGuestEditor = false }: EditorPapersListProps) {
  const { t } = useLocale();
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);

  // Dialog open triggers
  const [isAssignReviewerOpen, setIsAssignReviewerOpen] = useState(false);
  const [isDelegateOpen, setIsDelegateOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);

  // Form selections
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [selectedGuestEditorId, setSelectedGuestEditorId] = useState('');
  
  const [decision, setDecision] = useState<SubmissionStatus>('ACCEPTED');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="info">Awaiting Assignment</Badge>;
      case 'ASSIGNED':
        return <Badge variant="info">Assigned</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning" className="pulse-subtle">Pending Review</Badge>;
      case 'REVIEWS_COMPLETED':
        return <Badge variant="success" className="pulse-subtle">Reviews Completed</Badge>;
      case 'REVISION_REQUIRED':
        return <Badge variant="warning">Revision Required</Badge>;
      case 'RESUBMITTED':
        return <Badge variant="info">Revision Resubmitted</Badge>;
      case 'ACCEPTED':
        return <Badge variant="success">{t('statuses.ACCEPTED')}</Badge>;
      case 'PUBLISHED':
        return <Badge variant="success">{t('statuses.PUBLISHED')}</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">{t('statuses.REJECTED')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleAssignReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewerId) {
      toast.error('Please select a reviewer.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('submissionId', selectedPaper.id);
      formData.append('reviewerId', selectedReviewerId);

      const res = await assignReviewerToPaper(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Reviewer assigned successfully!');
        setIsAssignReviewerOpen(false);
        setSelectedReviewerId('');
        window.location.reload();
      }
    } catch (err) {
      toast.error('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelegate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuestEditorId) {
      toast.error('Please select a Guest Editor.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('submissionId', selectedPaper.id);
      formData.append('guestEditorId', selectedGuestEditorId);

      const res = await delegateToGuestEditor(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Paper delegated to Guest Editor successfully!');
        setIsDelegateOpen(false);
        setSelectedGuestEditorId('');
        window.location.reload();
      }
    } catch (err) {
      toast.error('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments) {
      toast.error('Please enter editorial feedback/justification.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('submissionId', selectedPaper.id);
      formData.append('decision', decision);
      formData.append('comments', comments);

      const res = await makeEditorDecision(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Editorial decision: ${decision} finalized successfully!`);
        setIsDecisionOpen(false);
        setComments('');
        window.location.reload();
      }
    } catch (err) {
      toast.error('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSelf = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('submissionId', selectedPaper.id);

      const res = await assignSelfToPaper(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Paper assigned to yourself successfully!');
        window.location.reload();
      }
    } catch (err) {
      toast.error('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Papers Assigned */}
      <div className="lg:col-span-2 space-y-4">
        {papers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="flex flex-col items-center justify-center space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No papers assigned to you yet.</p>
            </CardContent>
          </Card>
        ) : (
          papers.map((paper) => (
            <Card
              key={paper.id}
              onClick={() => setSelectedPaper(paper)}
              className={`hover:border-primary transition-all cursor-pointer ${
                selectedPaper?.id === paper.id ? 'border-primary ring-1 ring-primary/20' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono font-bold text-primary">{paper.paperId}</span>
                  {getStatusBadge(paper.status)}
                </div>
                <h3 className="font-bold text-base line-clamp-2">{paper.title}</h3>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Submitted: {formatDate(paper.createdAt)}</span>
                  </div>
                  <div>
                    <strong>Authors:</strong> {paper.authors.length} listed
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Side Details / Actions */}
      <div className="lg:col-span-1">
        {selectedPaper ? (
          <Card className="sticky top-24 shadow-md border-border" glass>
            <CardContent className="p-6 space-y-6">
              <div>
                <span className="text-xs font-mono font-bold text-primary">{selectedPaper.paperId}</span>
                <h3 className="font-bold text-base mt-1">{selectedPaper.title}</h3>
                <div className="bg-secondary/40 p-3 rounded-lg mt-3 text-xs space-y-2">
                  <p>
                    <strong>Abstract:</strong> {selectedPaper.abstract}
                  </p>
                  <p>
                    <strong>Domain:</strong> {selectedPaper.primaryDomain}
                  </p>
                  <p>
                    <strong>Country:</strong> {selectedPaper.country}
                  </p>
                  <p>
                    <strong>Assigned To:</strong>{' '}
                    <span className="font-semibold text-primary">
                      {selectedPaper.editor ? selectedPaper.editor.name : selectedPaper.guestEditor ? `${selectedPaper.guestEditor.name} (Guest)` : 'Unassigned'}
                    </span>
                  </p>
                  <p>
                    <strong>Assigned By:</strong>{' '}
                    <span className="font-semibold text-primary">
                      {selectedPaper.assignedBy ? selectedPaper.assignedBy.name : 'Unassigned'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Downloads */}
              <div className="space-y-2 border-t border-border pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Files</h4>
                <div className="flex flex-col gap-2">
                  <a
                    href={selectedPaper.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline font-semibold"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Manuscript PDF</span>
                  </a>
                  {selectedPaper.responseLetterUrl && (
                    <a
                      href={selectedPaper.responseLetterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-primary hover:underline font-semibold"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Response Letter</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Assigned Reviewers list */}
              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Assigned Reviewers
                </h4>
                {selectedPaper.reviews.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No reviewers assigned yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPaper.reviews.map((rev: any) => (
                      <div key={rev.id} className="p-2.5 bg-secondary/30 rounded-lg text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{rev.reviewer.name}</span>
                          <Badge variant={rev.status === 'COMPLETED' ? 'success' : 'warning'}>
                            {rev.status === 'COMPLETED' ? 'Submitted' : 'Pending'}
                          </Badge>
                        </div>
                        {rev.status === 'COMPLETED' && (
                          <div className="bg-card/50 p-2 rounded-md border border-border/50 text-[11px] space-y-1">
                            <p>
                              <strong>Recommendation:</strong>{' '}
                              <span className="text-primary font-semibold">{rev.recommendation}</span>
                            </p>
                            <p>
                              <strong>Comments:</strong> {rev.comments}
                            </p>
                            <p>
                              <strong>Corrections:</strong> {rev.mistakes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="border-t border-border pt-4 space-y-2">
                {/* Assign to Self: only for regular Editor and unassigned papers */}
                {!isGuestEditor && selectedPaper.editorId === null && selectedPaper.guestEditorId === null && (
                  <Button
                    onClick={handleAssignSelf}
                    className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="sm"
                    disabled={submitting}
                  >
                    <User className="h-4 w-4 mr-1.5" />
                    <span>Assign to Self</span>
                  </Button>
                )}

                {/* Assign Reviewer: visible to Guest Editor for assigned papers, and Editor for unassigned/assigned papers */}
                {(isGuestEditor || !isGuestEditor) && (
                  <Button
                    onClick={() => setIsAssignReviewerOpen(true)}
                    className="w-full text-xs font-semibold"
                    size="sm"
                    disabled={submitting}
                  >
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    <span>Assign Reviewer</span>
                  </Button>
                )}

                {/* Delegate to Guest Editor: only for regular Editor */}
                {!isGuestEditor && (
                  <Button
                    onClick={() => setIsDelegateOpen(true)}
                    variant="secondary"
                    className="w-full text-xs font-semibold"
                    size="sm"
                    disabled={submitting}
                  >
                    <Users className="h-4 w-4 mr-1.5" />
                    <span>Delegate to Guest Editor</span>
                  </Button>
                )}

                {/* Submit Final Decision: only if already assigned (either editorId or guestEditorId is set) */}
                {((isGuestEditor && selectedPaper.guestEditorId !== null) || (!isGuestEditor && selectedPaper.editorId !== null)) && (
                  <Button
                    onClick={() => setIsDecisionOpen(true)}
                    variant="outline"
                    className="w-full text-xs font-semibold"
                    size="sm"
                    disabled={submitting}
                  >
                    <FileCheck className="h-4 w-4 mr-1.5" />
                    <span>Submit Final Decision</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="hidden lg:block border-dashed border-border text-center py-20 bg-card/20">
            <CardContent className="flex flex-col items-center justify-center space-y-3">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Select a manuscript card to view reports, assign reviewers, or submit final decision.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog: Assign Reviewer */}
      <Dialog
        isOpen={isAssignReviewerOpen}
        onClose={() => setIsAssignReviewerOpen(false)}
        title="Assign Reviewer to Paper"
      >
        <form onSubmit={handleAssignReviewer} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reviewer">Select Approved Reviewer</Label>
            <Select
              id="reviewer"
              value={selectedReviewerId}
              onChange={(e) => setSelectedReviewerId(e.target.value)}
              required
            >
              <option value="">-- Choose Reviewer --</option>
              {reviewers.map((rev) => (
                <option key={rev.id} value={rev.id}>
                  {rev.name} ({rev.reviewerProfile?.domains || 'No domains'})
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t('common.loading') : 'Assign Reviewer'}
          </Button>
        </form>
      </Dialog>

      {/* Dialog: Delegate to Guest Editor */}
      <Dialog
        isOpen={isDelegateOpen}
        onClose={() => setIsDelegateOpen(false)}
        title="Delegate Paper to Guest Editor"
      >
        <form onSubmit={handleDelegate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guestEditor">Select Guest Editor</Label>
            <Select
              id="guestEditor"
              value={selectedGuestEditorId}
              onChange={(e) => setSelectedGuestEditorId(e.target.value)}
              required
            >
              <option value="">-- Choose Guest Editor --</option>
              {guestEditors.map((ge) => (
                <option key={ge.id} value={ge.id}>
                  {ge.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t('common.loading') : 'Delegate Paper'}
          </Button>
        </form>
      </Dialog>

      {/* Dialog: Submit Final Decision */}
      <Dialog
        isOpen={isDecisionOpen}
        onClose={() => setIsDecisionOpen(false)}
        title="Submit Final Publishing Decision"
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="decision">Editorial Decision</Label>
            <Select
              id="decision"
              value={decision}
              onChange={(e) => setDecision(e.target.value as SubmissionStatus)}
            >
              <option value="ACCEPTED">Accept Manuscript</option>
              <option value="REVISION_REQUIRED">Revision Required</option>
              <option value="REJECTED">Reject Manuscript</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comments">Editorial Feedback / Remarks (Sent to Author)</Label>
            <Textarea
              id="comments"
              placeholder="Explain the reasons behind your final publishing decision..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t('common.loading') : 'Submit Final Decision'}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
