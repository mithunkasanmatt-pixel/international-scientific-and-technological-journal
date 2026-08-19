'use client';

import React, { useState } from 'react';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  assignEditorToPaper, 
  handleReviewerRegistration, 
  makeFinalDecision,
  addStaffUser 
} from '@/actions/chief';
import { assignReviewerToPaper } from '@/actions/editor';
import { Role, SubmissionStatus, ReviewerStatus } from '@prisma/client';
import {
  FileText,
  User,
  Users,
  Download,
  ShieldAlert,
  Forward,
  UserCheck,
  CheckCircle,
  XCircle,
  PlusCircle,
  FileCheck,
  ClipboardList,
  UserMinus,
  Settings,
  Plus,
  ExternalLink,
  ClipboardCheck,
} from 'lucide-react';

interface ChiefPapersListProps {
  papers: any[];
  editors: any[];
  reviewers: any[]; // All active reviewers
  pendingReviewers: any[]; // Unapproved reviewer profiles
  chiefUserId: string;
}

export function ChiefPapersList({
  papers,
  editors,
  reviewers,
  pendingReviewers,
  chiefUserId,
}: ChiefPapersListProps) {
  const { t } = useLocale();
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);

  // Dialog triggers for workflow
  const [isAssignEditorOpen, setIsAssignEditorOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isDirectReviewerOpen, setIsDirectReviewerOpen] = useState(false);
  const [isPaperDetailsOpen, setIsPaperDetailsOpen] = useState(false);

  // Dialog triggers for adding users
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [addUserRole, setAddUserRole] = useState<'GUEST_EDITOR' | 'EDITOR' | 'REVIEWER' | null>(null);

  // Form selections for workflow
  const [selectedEditorId, setSelectedEditorId] = useState('');
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [finalDecision, setFinalDecision] = useState<SubmissionStatus>('ACCEPTED');
  const [decisionComments, setDecisionComments] = useState('');

  // Form inputs for adding users
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserInstitution, setNewUserInstitution] = useState('');
  const [newUserDomains, setNewUserDomains] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Stats calculation
  const totalSubmissionsCount = papers.length;
  const unassignedCount = papers.filter((p) => !p.editorId).length;
  const pendingDecisionCount = papers.filter((p) => p.status === 'UNDER_REVIEW').length;
  const acceptedCount = papers.filter((p) => p.status === 'ACCEPTED' || p.status === 'PUBLISHED').length;

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="info">New Submission</Badge>;
      case 'ASSIGNED':
        return <Badge variant="info">Assigned to Editor</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning" className="pulse-subtle">Under Review</Badge>;
      case 'REVISION_REQUIRED':
        return <Badge variant="warning">Revision Requested</Badge>;
      case 'RESUBMITTED':
        return <Badge variant="info">Revised Manuscript</Badge>;
      case 'ACCEPTED':
        return <Badge variant="success">Accepted</Badge>;
      case 'PUBLISHED':
        return <Badge variant="success">Published</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaperTypeLabel = (type: string) => {
    return type === 'RESEARCH_PAPER' ? 'Research Paper' : 'Review Paper';
  };

  // Workflow Handlers
  const handleAssignEditorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditorId) {
      toast.error('Please select an editor.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('submissionId', selectedPaper.id);
      formData.append('editorId', selectedEditorId);

      const res = await assignEditorToPaper(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Editor assigned successfully!');
        setIsAssignEditorOpen(false);
        setSelectedEditorId('');
        setIsPaperDetailsOpen(false);
        window.location.reload();
      }
    } catch (err) {
      toast.error('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectReviewerSubmit = async (e: React.FormEvent) => {
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
        toast.success('Reviewer assigned directly by Chief Editor!');
        setIsDirectReviewerOpen(false);
        setSelectedReviewerId('');
        setIsPaperDetailsOpen(false);
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
    if (!decisionComments) {
      toast.error('Please enter editorial comments.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('submissionId', selectedPaper.id);
      formData.append('decision', finalDecision);
      formData.append('comments', decisionComments);

      const res = await makeFinalDecision(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Final decision: ${finalDecision} applied successfully!`);
        setIsDecisionOpen(false);
        setDecisionComments('');
        setIsPaperDetailsOpen(false);
        window.location.reload();
      }
    } catch (err) {
      toast.error('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Add Staff User Handler
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword || !addUserRole) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', newUserName);
      formData.append('email', newUserEmail);
      formData.append('password', newUserPassword);
      formData.append('role', addUserRole);
      
      if (addUserRole === 'REVIEWER') {
        formData.append('institution', newUserInstitution);
        formData.append('domains', newUserDomains);
      }

      const res = await addStaffUser(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`${addUserRole.replace('_', ' ')} added successfully!`);
        setIsAddUserOpen(false);
        // Clear fields
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserInstitution('');
        setNewUserDomains('');
        window.location.reload();
      }
    } catch (err) {
      toast.error('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddUserDialog = (role: 'GUEST_EDITOR' | 'EDITOR' | 'REVIEWER') => {
    setAddUserRole(role);
    setIsAddUserOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Action Buttons Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-black text-primary font-sans leading-none">
          Chief Editor Dashboard
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => openAddUserDialog('GUEST_EDITOR')}
            className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2 rounded-md transition-all shadow-xs cursor-pointer uppercase shrink-0"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Add Guest Editor</span>
          </Button>
          <Button
            onClick={() => openAddUserDialog('EDITOR')}
            className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2 rounded-md transition-all shadow-xs cursor-pointer uppercase shrink-0"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Add Editor</span>
          </Button>
          <Button
            onClick={() => openAddUserDialog('REVIEWER')}
            className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2 rounded-md transition-all shadow-xs cursor-pointer uppercase shrink-0"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Add Reviewer</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1: Total Submissions */}
        <div className="bg-card border border-border/80 rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Submissions
            </p>
            <p className="text-3xl font-black text-primary">
              {totalSubmissionsCount}
            </p>
          </div>
          <div className="h-10 w-10 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Stat 2: Unassigned */}
        <div className="bg-card border border-border/80 rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Unassigned
            </p>
            <p className="text-3xl font-black text-primary">
              {unassignedCount}
            </p>
          </div>
          <div className="h-10 w-10 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-center">
            <UserMinus className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Stat 3: Pending Decision */}
        <div className="bg-card border border-border/80 rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Pending Decision
            </p>
            <p className="text-3xl font-black text-primary">
              {pendingDecisionCount}
            </p>
          </div>
          <div className="h-10 w-10 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Stat 4: Accepted */}
        <div className="bg-card border border-border/80 rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Accepted
            </p>
            <p className="text-3xl font-black text-primary">
              {acceptedCount}
            </p>
          </div>
          <div className="h-10 w-10 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Submissions Table Card */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="bg-card px-6 py-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base font-bold text-foreground tracking-tight font-sans uppercase">
              Manage Submissions
            </CardTitle>
            <span className="text-xs text-muted-foreground font-semibold bg-secondary/50 px-2.5 py-1 rounded-md border border-border/50">
              💡 Click a row to open Manuscript Management
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {papers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm font-medium">
              No submissions found in system.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border">
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Paper ID</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Type</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Title</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Abstract</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Country</th>
                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Author</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {papers.map((paper) => (
                    <tr
                      key={paper.id}
                      onClick={() => {
                        setSelectedPaper(paper);
                        setIsPaperDetailsOpen(true);
                      }}
                      className="hover:bg-primary/5 transition-all cursor-pointer border-b border-border"
                    >
                      <td className="p-4 font-mono font-bold text-foreground text-sm">
                        {paper.paperId}
                      </td>
                      <td className="p-4 text-muted-foreground font-medium">
                        {getPaperTypeLabel(paper.paperType)}
                      </td>
                      <td className="p-4 font-bold text-foreground max-w-[200px] truncate" title={paper.title}>
                        {paper.title}
                      </td>
                      <td className="p-4 text-muted-foreground max-w-[250px] truncate" title={paper.abstract}>
                        {paper.abstract}
                      </td>
                      <td className="p-4 text-muted-foreground font-medium">
                        {paper.country}
                      </td>
                      <td className="p-4 text-muted-foreground font-semibold">
                        {paper.submitter.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Add User */}
      <Dialog
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title={`Add New ${addUserRole ? addUserRole.replace('_', ' ') : ''}`}
      >
        <form onSubmit={handleAddStaffSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-name">Full Name</Label>
            <Input
              id="add-name"
              type="text"
              placeholder="Enter name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-email">Email Address</Label>
            <Input
              id="add-email"
              type="email"
              placeholder="name@example.com"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-password">Password</Label>
            <Input
              id="add-password"
              type="password"
              placeholder="Enter temporary password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
            />
          </div>

          {addUserRole === 'REVIEWER' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="add-inst">Institution / University</Label>
                <Input
                  id="add-inst"
                  type="text"
                  placeholder="e.g. University of Tripoli"
                  value={newUserInstitution}
                  onChange={(e) => setNewUserInstitution(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-domains">Expertise Domains (Comma-separated)</Label>
                <Input
                  id="add-domains"
                  type="text"
                  placeholder="e.g. Quantum Computing, ML, VLSI"
                  value={newUserDomains}
                  onChange={(e) => setNewUserDomains(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full mt-2" disabled={submitting}>
            {submitting ? t('common.loading') : `Create ${addUserRole ? addUserRole.replace('_', ' ') : ''}`}
          </Button>
        </form>
      </Dialog>

      {/* Dialog: Clicked Row Details & Workflow actions */}
      <Dialog
        isOpen={isPaperDetailsOpen}
        onClose={() => setIsPaperDetailsOpen(false)}
        title="Manuscript Management"
      >
        {selectedPaper && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                  {selectedPaper.paperId}
                </span>
                {getStatusBadge(selectedPaper.status)}
              </div>
              <h3 className="font-bold text-lg text-foreground tracking-tight leading-snug">
                {selectedPaper.title}
              </h3>
              <div className="bg-secondary/40 p-4 rounded-xl text-xs sm:text-sm space-y-2.5 border border-border/40">
                <p>
                  <strong>Abstract:</strong> {selectedPaper.abstract}
                </p>
                <p>
                  <strong>Domains:</strong> {selectedPaper.primaryDomain}
                </p>
                <p>
                  <strong>Country:</strong> {selectedPaper.country}
                </p>
                <p>
                  <strong>Submitter Author:</strong> {selectedPaper.submitter.name} ({selectedPaper.submitter.email})
                </p>
                <p>
                  <strong>Assigned Editor:</strong>{' '}
                  <span className="font-semibold text-primary">
                    {selectedPaper.editor ? selectedPaper.editor.name : selectedPaper.guestEditor ? `${selectedPaper.guestEditor.name} (Guest)` : 'Unassigned'}
                  </span>
                </p>
              </div>
            </div>

            {/* Downloads */}
            <div className="space-y-2 border-t border-border pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Manuscript Document</h4>
              <a
                href={selectedPaper.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-primary hover:underline font-semibold"
              >
                <Download className="h-4 w-4" />
                <span>Download Manuscript PDF</span>
              </a>
            </div>

            {/* Reports Received */}
            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Review Reports
              </h4>
              {selectedPaper.reviews.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No review reports submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedPaper.reviews.map((rev: any) => (
                    <div key={rev.id} className="p-3 bg-secondary/20 border border-border/30 rounded-lg text-xs space-y-1.5">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-foreground">{rev.reviewer.name}</span>
                        <span className="text-primary uppercase">{rev.recommendation.replace('_', ' ')}</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{rev.comments}</p>
                      {rev.mistakes && (
                        <p className="text-destructive font-medium">Corrections: {rev.mistakes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Workflow Action Buttons */}
            <div className="border-t border-border pt-4 grid grid-cols-1 gap-2.5">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setIsAssignEditorOpen(true)}
                  className="w-full text-xs font-semibold"
                  size="sm"
                >
                  <Forward className="h-4 w-4 mr-1" />
                  <span>Assign Editor</span>
                </Button>

                <Button
                  onClick={() => setIsDecisionOpen(true)}
                  variant="outline"
                  className="w-full text-xs border-primary/20 text-primary hover:bg-primary/5 font-semibold"
                  size="sm"
                >
                  <FileCheck className="h-4 w-4 mr-1" />
                  <span>Take Final Decision</span>
                </Button>
              </div>

              {/* Direct Reviewer Assignment: Chief Editor can assign reviewers directly */}
              {selectedPaper.status !== 'ACCEPTED' && selectedPaper.status !== 'REJECTED' && selectedPaper.status !== 'PUBLISHED' && (
                <Button
                  onClick={() => setIsDirectReviewerOpen(true)}
                  variant="secondary"
                  className="w-full text-xs font-semibold"
                  size="sm"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  <span>Assign Reviewer Directly</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog: Assign Editor Sub-dialog */}
      <Dialog
        isOpen={isAssignEditorOpen}
        onClose={() => setIsAssignEditorOpen(false)}
        title="Assign Editor to Manuscript"
      >
        <form onSubmit={handleAssignEditorSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="editor-select">Select Editor (Awaiting board members)</Label>
            <Select
              id="editor-select"
              value={selectedEditorId}
              onChange={(e) => setSelectedEditorId(e.target.value)}
              required
            >
              <option value="">-- Choose Editor --</option>
              {editors.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.name} ({ed.role === 'CHIEF_EDITOR' ? 'Chief Editor - Self' : 'Editor'})
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t('common.loading') : 'Assign Editor'}
          </Button>
        </form>
      </Dialog>

      {/* Dialog: Direct Reviewer Sub-dialog */}
      <Dialog
        isOpen={isDirectReviewerOpen}
        onClose={() => setIsDirectReviewerOpen(false)}
        title="Assign Reviewer Directly"
      >
        <form onSubmit={handleDirectReviewerSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reviewer-select">Select Reviewer</Label>
            <Select
              id="reviewer-select"
              value={selectedReviewerId}
              onChange={(e) => setSelectedReviewerId(e.target.value)}
              required
            >
              <option value="">-- Choose Reviewer --</option>
              {reviewers.map((rev) => (
                <option key={rev.id} value={rev.id}>
                  {rev.name} ({rev.reviewerProfile?.domains})
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t('common.loading') : 'Assign Reviewer'}
          </Button>
        </form>
      </Dialog>

      {/* Dialog: Take Final Decision Sub-dialog */}
      <Dialog
        isOpen={isDecisionOpen}
        onClose={() => setIsDecisionOpen(false)}
        title="Chief Editor Final Publishing Decision"
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="decision-select">Final Decision Status</Label>
            <Select
              id="decision-select"
              value={finalDecision}
              onChange={(e) => setFinalDecision(e.target.value as any)}
            >
              <option value="ACCEPTED">Accepted</option>
              <option value="PUBLISHED">Published</option>
              <option value="REVISION_REQUIRED">Revision Required</option>
              <option value="REJECTED">Rejected</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="decision-comments">Editorial Decision Comments (Sent to Author)</Label>
            <Textarea
              id="decision-comments"
              placeholder="Provide detailed editorial reasons and publishing feedback..."
              value={decisionComments}
              onChange={(e) => setDecisionComments(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t('common.loading') : 'Finalize Decision'}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
