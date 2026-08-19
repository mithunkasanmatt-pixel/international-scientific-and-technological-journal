'use client';

import React, { useState } from 'react';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { resubmitPaperRevision, editPaper } from '@/actions/submission';
import { formatDate } from '@/utils/date';
import { countries } from '@/utils/countries';
import {
  FileText,
  Calendar,
  Layers,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileDown,
} from 'lucide-react';
import { SubmissionStatus } from '@prisma/client';

interface AuthorPapersListProps {
  papers: any[];
}

export function AuthorPapersList({ papers }: AuthorPapersListProps) {
  const { t, locale } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  
  // Revision form states
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [responseLetterFile, setResponseLetterFile] = useState<File | null>(null);
  const [revisionComments, setRevisionComments] = useState('');
  const [uploading, setUploading] = useState(false);

  // Edit form states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAbstract, setEditAbstract] = useState('');
  const [editPaperType, setEditPaperType] = useState<'RESEARCH_PAPER' | 'REVIEW_PAPER'>('RESEARCH_PAPER');
  const [editKeywords, setEditKeywords] = useState('');
  const [editPrimaryDomain, setEditPrimaryDomain] = useState('');
  const [editSecondaryDomain, setEditSecondaryDomain] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editJournalReference, setEditJournalReference] = useState('');

  const filteredPapers = papers.filter((paper) => {
    const matchesSearch =
      paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.paperId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || paper.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary">{t('statuses.DRAFT')}</Badge>;
      case 'SUBMITTED':
        return <Badge variant="info">{t('statuses.SUBMITTED')}</Badge>;
      case 'ASSIGNED':
        return <Badge variant="info">{t('statuses.ASSIGNED')}</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning" className="pulse-subtle">Pending Review</Badge>;
      case 'REVIEWS_COMPLETED':
        return <Badge variant="success" className="pulse-subtle">Reviews Completed</Badge>;
      case 'REVISION_REQUIRED':
        return <Badge variant="warning">{t('statuses.REVISION_REQUIRED')}</Badge>;
      case 'RESUBMITTED':
        return <Badge variant="info">{t('statuses.RESUBMITTED')}</Badge>;
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

  interface TimelineStep {
    key: string;
    label: string;
    completed: boolean;
    active?: boolean;
    error?: boolean;
  }

  const getTimelineSteps = (currentStatus: SubmissionStatus): TimelineStep[] => {
    const steps = [
      { key: 'SUBMITTED', label: t('statuses.SUBMITTED') },
      { key: 'ASSIGNED', label: t('statuses.ASSIGNED') },
      { key: 'UNDER_REVIEW', label: 'Pending Review' },
      { key: 'REVIEWS_COMPLETED', label: 'Reviews Completed' },
      { key: 'ACCEPTED', label: t('statuses.ACCEPTED') },
      { key: 'PUBLISHED', label: t('statuses.PUBLISHED') },
    ];

    if (currentStatus === 'REJECTED') {
      return [
        { key: 'SUBMITTED', label: t('statuses.SUBMITTED'), completed: true, active: false, error: false },
        { key: 'REJECTED', label: t('statuses.REJECTED'), completed: true, active: true, error: true },
      ];
    }

    let activeIndex = 0;
    if (currentStatus === 'SUBMITTED') activeIndex = 0;
    else if (currentStatus === 'ASSIGNED') activeIndex = 1;
    else if (currentStatus === 'UNDER_REVIEW') activeIndex = 2;
    else if (currentStatus === 'REVIEWS_COMPLETED' || currentStatus === 'REVISION_REQUIRED' || currentStatus === 'RESUBMITTED') activeIndex = 3;
    else if (currentStatus === 'ACCEPTED') activeIndex = 4;
    else if (currentStatus === 'PUBLISHED') activeIndex = 5;

    return steps.map((step, idx) => ({
      ...step,
      completed: idx <= activeIndex,
      active: idx === activeIndex,
      error: false,
    }));
  };

  const handleRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manuscriptFile || !responseLetterFile) {
      toast.error('Please upload both your revised manuscript and your response letter.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('submissionId', selectedPaper.id);
      formData.append('manuscript', manuscriptFile);
      formData.append('responseLetter', responseLetterFile);
      formData.append('comments', revisionComments);

      const res = await resubmitPaperRevision(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Revision resubmitted successfully!');
        setManuscriptFile(null);
        setResponseLetterFile(null);
        setRevisionComments('');
        window.location.reload();
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setUploading(false);
    }
  };

  const openEditDialog = () => {
    if (!selectedPaper) return;
    setEditTitle(selectedPaper.title || '');
    setEditAbstract(selectedPaper.abstract || '');
    setEditPaperType(selectedPaper.paperType || 'RESEARCH_PAPER');
    setEditKeywords(selectedPaper.keywords || '');
    setEditPrimaryDomain(selectedPaper.primaryDomain || '');
    setEditSecondaryDomain(selectedPaper.secondaryDomain || '');
    setEditCountry(selectedPaper.country || '');
    setEditJournalReference(selectedPaper.journalReference || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || !editAbstract || !editKeywords || !editPrimaryDomain || !editCountry) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('submissionId', selectedPaper.id);
      formData.append('title', editTitle);
      formData.append('abstract', editAbstract);
      formData.append('paperType', editPaperType);
      formData.append('keywords', editKeywords);
      formData.append('primaryDomain', editPrimaryDomain);
      formData.append('secondaryDomain', editSecondaryDomain);
      formData.append('country', editCountry);
      formData.append('journalReference', editJournalReference);

      const res = await editPaper(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Manuscript updated successfully!');
        setIsEditOpen(false);
        window.location.reload();
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Paper List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border">
          <Input
            placeholder="Search papers by Title or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <span className="text-xs text-muted-foreground">{t('common.status')}:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background text-xs border border-border rounded-lg p-2 focus:ring-primary focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Pending Review</option>
              <option value="REVIEWS_COMPLETED">Reviews Completed</option>
              <option value="REVISION_REQUIRED">Revision Required</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="PUBLISHED">Published</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {filteredPapers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="flex flex-col items-center justify-center space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{t('common.noData')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPapers.map((paper) => (
              <Card
                key={paper.id}
                onClick={() => {
                  setSelectedPaper(paper);
                  setManuscriptFile(null);
                  setResponseLetterFile(null);
                  setRevisionComments('');
                }}
                className={`hover:border-primary transition-all cursor-pointer ${
                  selectedPaper?.id === paper.id ? 'border-primary ring-1 ring-primary/20' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-mono font-bold text-primary">{paper.paperId}</span>
                    {getStatusBadge(paper.status)}
                  </div>
                  <h3 className="font-bold text-base line-clamp-2 text-foreground hover:text-primary transition-colors">
                    {paper.title}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(paper.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      <span className="truncate">{paper.primaryDomain}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{paper.country}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Selected Paper Details / Workflow Timeline */}
      <div className="lg:col-span-1">
        {selectedPaper ? (
          <Card className="sticky top-24 border-border shadow-md" glass>
            <CardContent className="p-6 space-y-6">
              <div>
                <span className="text-xs font-mono font-bold text-primary">{selectedPaper.paperId}</span>
                <h3 className="font-bold text-lg mt-1">{selectedPaper.title}</h3>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                  <strong>Abstract:</strong> {selectedPaper.abstract}
                </p>
              </div>

              {/* PDF Downloads */}
              <div className="space-y-2 border-t border-border pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Files</h4>
                <div className="flex flex-col gap-2">
                  <a
                    href={selectedPaper.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline font-semibold"
                  >
                    <FileDown className="h-4 w-4 shrink-0" />
                    <span>Download Original Manuscript</span>
                  </a>
                  {selectedPaper.responseLetterUrl && (
                    <a
                      href={selectedPaper.responseLetterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-primary hover:underline font-semibold"
                    >
                      <FileDown className="h-4 w-4 shrink-0" />
                      <span>Download Response Letter</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Edit Actions */}
              <div className="space-y-2 border-t border-border pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</h4>
                {(() => {
                  const isAssigned = selectedPaper.editorId !== null || selectedPaper.guestEditorId !== null || (selectedPaper.status !== 'SUBMITTED' && selectedPaper.status !== 'DRAFT');
                  if (isAssigned) {
                    return (
                      <Button
                        disabled
                        className="w-full text-xs font-semibold bg-secondary text-muted-foreground cursor-not-allowed"
                        size="sm"
                      >
                        Edit Manuscript (Disabled - Assigned)
                      </Button>
                    );
                  }
                  return (
                    <Button
                      onClick={openEditDialog}
                      className="w-full text-xs font-semibold bg-primary hover:bg-primary/95 text-white"
                      size="sm"
                    >
                      Edit Manuscript
                    </Button>
                  );
                })()}
              </div>

              {/* Stepper Timeline */}
              <div className="border-t border-border pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  {t('workflow.timeline')}
                </h4>
                <div className="space-y-4">
                  {getTimelineSteps(selectedPaper.status).map((step, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                            step.completed
                              ? step.error
                                ? 'bg-destructive text-destructive-foreground'
                                : 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-muted-foreground border border-border'
                          }`}
                        >
                          {step.completed && !step.error ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                        </div>
                        {idx < getTimelineSteps(selectedPaper.status).length - 1 && (
                          <div
                            className={`w-0.5 h-10 ${
                              step.completed ? 'bg-primary' : 'bg-border'
                            }`}
                          />
                        )}
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-xs font-bold ${step.active ? 'text-primary' : 'text-foreground'}`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revision Upload Form */}
              {selectedPaper.status === 'REVISION_REQUIRED' && (
                <div className="border-t border-border pt-4 space-y-4 bg-amber-500/5 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      {t('dashboards.author.uploadRevision')}
                    </h4>
                  </div>
                  <form onSubmit={handleRevisionSubmit} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="revManuscript" className="text-xs">
                        Revised Manuscript (PDF/Word)
                      </Label>
                      <Input
                        id="revManuscript"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setManuscriptFile(e.target.files?.[0] || null)}
                        required
                        disabled={uploading}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="responseLetter" className="text-xs">
                        Response Letter (PDF/Word)
                      </Label>
                      <Input
                        id="responseLetter"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setResponseLetterFile(e.target.files?.[0] || null)}
                        required
                        disabled={uploading}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="comments" className="text-xs">
                        Author Response Comments
                      </Label>
                      <Textarea
                        id="comments"
                        placeholder="Explain adjustments made according to reviewer feedback..."
                        value={revisionComments}
                        onChange={(e) => setRevisionComments(e.target.value)}
                        disabled={uploading}
                        className="text-xs min-h-[60px]"
                      />
                    </div>
                    <Button type="submit" size="sm" className="w-full text-xs" disabled={uploading}>
                      {uploading ? t('common.loading') : t('common.submit')}
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="hidden lg:block border-dashed border-border text-center py-20 bg-card/20">
            <CardContent className="flex flex-col items-center justify-center space-y-3">
              <Clock className="h-10 w-10 text-muted-foreground animate-pulse" />
              <p className="text-xs text-muted-foreground">Select a paper to track workflow timeline and download documents.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Manuscript Metadata"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              disabled={uploading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-paperType">Paper Type *</Label>
              <Select
                id="edit-paperType"
                value={editPaperType}
                onChange={(e) => setEditPaperType(e.target.value as any)}
                disabled={uploading}
              >
                <option value="RESEARCH_PAPER">Research Paper</option>
                <option value="REVIEW_PAPER">Review Paper</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-journalRef">Target Journal</Label>
              <Select
                id="edit-journalRef"
                value={editJournalReference}
                onChange={(e) => setEditJournalReference(e.target.value)}
                disabled={uploading}
              >
                <option value="">-- Choose Target Journal --</option>
                <option value="IEEE_TRANSACTIONS">IEEE Transactions on Intelligent Systems</option>
                <option value="SPRINGER_NATURE">Springer Journal of Applied Bioinformatics</option>
                <option value="ELSEVIER_AI">Elsevier Artificial Intelligence Review</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-abstract">Abstract *</Label>
            <Textarea
              id="edit-abstract"
              value={editAbstract}
              onChange={(e) => setEditAbstract(e.target.value)}
              required
              disabled={uploading}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-primaryDomain">Primary Domain *</Label>
              <Select
                id="edit-primaryDomain"
                value={editPrimaryDomain}
                onChange={(e) => setEditPrimaryDomain(e.target.value)}
                required
                disabled={uploading}
              >
                <option value="">-- Choose Primary Domain --</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Machine Learning">Machine Learning</option>
                <option value="Computer Vision">Computer Vision</option>
                <option value="Natural Language Processing">Natural Language Processing</option>
                <option value="Data Science & Big Data">Data Science & Big Data</option>
                <option value="Bioinformatics & Computational Biology">Bioinformatics & Computational Biology</option>
                <option value="Cybersecurity & Cryptography">Cybersecurity & Cryptography</option>
                <option value="Cloud Computing & Distributed Systems">Cloud Computing & Distributed Systems</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Computer Networks & Communications">Computer Networks & Communications</option>
                <option value="Human-Computer Interaction">Human-Computer Interaction</option>
                <option value="Internet of Things (IoT)">Internet of Things (IoT)</option>
                <option value="Robotics & Automation">Robotics & Automation</option>
                <option value="Image & Signal Processing">Image & Signal Processing</option>
                <option value="Theoretical Computer Science">Theoretical Computer Science</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-secondaryDomain">Secondary Domain</Label>
              <Select
                id="edit-secondaryDomain"
                value={editSecondaryDomain}
                onChange={(e) => setEditSecondaryDomain(e.target.value)}
                disabled={uploading}
              >
                <option value="">-- Choose Secondary Domain (Optional) --</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Machine Learning">Machine Learning</option>
                <option value="Computer Vision">Computer Vision</option>
                <option value="Natural Language Processing">Natural Language Processing</option>
                <option value="Data Science & Big Data">Data Science & Big Data</option>
                <option value="Bioinformatics & Computational Biology">Bioinformatics & Computational Biology</option>
                <option value="Cybersecurity & Cryptography">Cybersecurity & Cryptography</option>
                <option value="Cloud Computing & Distributed Systems">Cloud Computing & Distributed Systems</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Computer Networks & Communications">Computer Networks & Communications</option>
                <option value="Human-Computer Interaction">Human-Computer Interaction</option>
                <option value="Internet of Things (IoT)">Internet of Things (IoT)</option>
                <option value="Robotics & Automation">Robotics & Automation</option>
                <option value="Image & Signal Processing">Image & Signal Processing</option>
                <option value="Theoretical Computer Science">Theoretical Computer Science</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-keywords">Keywords *</Label>
              <Select
                id="edit-keywords"
                value={editKeywords}
                onChange={(e) => setEditKeywords(e.target.value)}
                required
                disabled={uploading}
              >
                <option value="">-- Select Predefined Keywords --</option>
                <option value="AI, Deep Learning, Neural Networks">AI, Deep Learning, Neural Networks</option>
                <option value="Machine Learning, Algorithms, Optimization">Machine Learning, Algorithms, Optimization</option>
                <option value="Computer Vision, Image Processing, Object Detection">Computer Vision, Image Processing, Object Detection</option>
                <option value="NLP, Text Mining, Transformers">NLP, Text Mining, Transformers</option>
                <option value="Data Science, Big Data, Predictive Analytics">Data Science, Big Data, Predictive Analytics</option>
                <option value="Bioinformatics, Genomics, Sequence Analysis">Bioinformatics, Genomics, Sequence Analysis</option>
                <option value="Cybersecurity, Cryptography, Network Security">Cybersecurity, Cryptography, Network Security</option>
                <option value="Cloud Computing, Edge Computing, Virtualization">Cloud Computing, Edge Computing, Virtualization</option>
                <option value="Software Engineering, Agile, DevOps">Software Engineering, Agile, DevOps</option>
                <option value="IoT, Smart Grid, Sensor Networks">IoT, Smart Grid, Sensor Networks</option>
                <option value="Robotics, Path Planning, Autonomous Systems">Robotics, Path Planning, Autonomous Systems</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-country">Country *</Label>
              <Select
                id="edit-country"
                value={editCountry}
                onChange={(e) => setEditCountry(e.target.value)}
                required
                disabled={uploading}
              >
                <option value="">-- Choose Country / Region --</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full mt-2" disabled={uploading}>
            {uploading ? t('common.loading') : 'Save Changes'}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
