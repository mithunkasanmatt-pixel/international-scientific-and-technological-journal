'use client';

import React, { useState } from 'react';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { submitReview } from '@/actions/review';
import { formatDate } from '@/utils/date';
import { FileText, Download, Calendar, ClipboardList, CheckSquare, FileEdit } from 'lucide-react';
import { ReviewStatus } from '@prisma/client';

interface ReviewerTaskListProps {
  reviews: any[];
}

export function ReviewerTaskList({ reviews }: ReviewerTaskListProps) {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [selectedReview, setSelectedReview] = useState<any | null>(null);

  // Review form states
  const [comments, setComments] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [recommendation, setRecommendation] = useState<string>('ACCEPT');
  const [annotatedFile, setAnnotatedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pendingReviews = reviews.filter((r) => r.status === ReviewStatus.PENDING);
  const completedReviews = reviews.filter((r) => r.status === ReviewStatus.COMPLETED);

  const displayedReviews = activeTab === 'pending' ? pendingReviews : completedReviews;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments || !mistakes || !recommendation) {
      toast.error('Please fill out all comments and select a recommendation.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('reviewId', selectedReview.id);
      formData.append('comments', comments);
      formData.append('mistakes', mistakes);
      formData.append('recommendation', recommendation);
      if (annotatedFile) {
        formData.append('annotatedFile', annotatedFile);
      }

      const res = await submitReview(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Peer review report submitted successfully!');
        setSelectedReview(null);
        setComments('');
        setMistakes('');
        // Reload page to refresh lists
        window.location.reload();
      }
    } catch (err) {
      toast.error('An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Review list */}
      <div className="lg:col-span-2 space-y-6">
        {/* Toggle tabs */}
        <div className="flex gap-2 bg-secondary p-1 rounded-lg">
          <button
            onClick={() => {
              setActiveTab('pending');
              setSelectedReview(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>{t('dashboards.reviewer.pending')} ({pendingReviews.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('completed');
              setSelectedReview(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'completed'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span>{t('dashboards.reviewer.completed')} ({completedReviews.length})</span>
          </button>
        </div>

        {displayedReviews.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="flex flex-col items-center justify-center space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{t('common.noData')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayedReviews.map((review) => (
              <Card
                key={review.id}
                onClick={() => {
                  setSelectedReview(review);
                  setComments(review.comments || '');
                  setMistakes(review.mistakes || '');
                  setRecommendation(review.recommendation || 'ACCEPT');
                }}
                className={`hover:border-primary transition-all cursor-pointer ${
                  selectedReview?.id === review.id ? 'border-primary ring-1 ring-primary/20' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-mono font-bold text-primary">
                      {review.submission.paperId}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <h3 className="font-bold text-base line-clamp-2">{review.submission.title}</h3>
                  <div className="flex gap-4 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                    <div>
                      <strong>Domain:</strong> {review.submission.primaryDomain}
                    </div>
                    {review.status === ReviewStatus.COMPLETED && (
                      <div>
                        <strong>Recommendation:</strong>{' '}
                        <span className="font-bold text-primary">
                          {t(`workflow.reviewerRecommendation.${review.recommendation}`)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel / Form */}
      <div className="lg:col-span-1">
        {selectedReview ? (
          <Card className="sticky top-24 shadow-md border-border" glass>
            <CardContent className="p-6 space-y-6">
              <div>
                <span className="text-xs font-mono font-bold text-primary">
                  {selectedReview.submission.paperId}
                </span>
                <h3 className="font-bold text-base mt-1">{selectedReview.submission.title}</h3>
                <div className="bg-secondary/40 p-3 rounded-lg mt-3 text-xs space-y-2">
                  <p>
                    <strong>Abstract:</strong> {selectedReview.submission.abstract}
                  </p>
                  <p>
                    <strong>Paper Type:</strong>{' '}
                    {selectedReview.submission.paperType === 'RESEARCH_PAPER'
                      ? t('submission.researchPaper')
                      : t('submission.reviewPaper')}
                  </p>
                </div>
              </div>

              {/* Downloads */}
              <div className="space-y-2 border-t border-border pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Manuscript Download
                </h4>
                <a
                  href={selectedReview.submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-primary hover:underline font-semibold"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Article PDF</span>
                </a>
              </div>

              {/* Form or report details */}
              {selectedReview.status === ReviewStatus.PENDING ? (
                <form onSubmit={handleSubmit} className="border-t border-border pt-4 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <FileEdit className="h-4 w-4" />
                    <span>{t('workflow.submitReview')}</span>
                  </h4>

                  <div className="space-y-1.5">
                    <Label htmlFor="recommendation" className="text-xs">
                      {t('workflow.recommendation')}
                    </Label>
                    <Select
                      id="recommendation"
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value)}
                      disabled={submitting}
                      className="text-xs"
                    >
                      <option value="ACCEPT">{t('workflow.reviewerRecommendation.ACCEPT')}</option>
                      <option value="MINOR_REVISION">
                        {t('workflow.reviewerRecommendation.MINOR_REVISION')}
                      </option>
                      <option value="MAJOR_REVISION">
                        {t('workflow.reviewerRecommendation.MAJOR_REVISION')}
                      </option>
                      <option value="REJECT">{t('workflow.reviewerRecommendation.REJECT')}</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="comments" className="text-xs">
                      {t('workflow.commentsToAuthor')} *
                    </Label>
                    <Textarea
                      id="comments"
                      placeholder="Write your general review comments..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      required
                      disabled={submitting}
                      className="text-xs min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mistakes" className="text-xs">
                      {t('workflow.mistakesList')} *
                    </Label>
                    <Textarea
                      id="mistakes"
                      placeholder="List specific mistakes, typos, or logic corrections line by line..."
                      value={mistakes}
                      onChange={(e) => setMistakes(e.target.value)}
                      required
                      disabled={submitting}
                      className="text-xs min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="annotated" className="text-xs">
                      {t('workflow.uploadReviewFile')}
                    </Label>
                    <Input
                      id="annotated"
                      type="file"
                      onChange={(e) => setAnnotatedFile(e.target.files?.[0] || null)}
                      disabled={submitting}
                      className="text-xs"
                    />
                  </div>

                  <Button type="submit" className="w-full text-xs" disabled={submitting}>
                    {submitting ? t('common.loading') : t('common.submit')}
                  </Button>
                </form>
              ) : (
                <div className="border-t border-border pt-4 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Your Review Report
                  </h4>
                  <div className="space-y-2 text-xs">
                    <p>
                      <strong>Recommendation:</strong>{' '}
                      <span className="font-bold text-primary">
                        {t(`workflow.reviewerRecommendation.${selectedReview.recommendation}`)}
                      </span>
                    </p>
                    <div className="bg-secondary/20 p-2.5 rounded-md">
                      <p className="font-bold text-muted-foreground mb-1">Comments:</p>
                      <p className="whitespace-pre-wrap">{selectedReview.comments}</p>
                    </div>
                    <div className="bg-secondary/20 p-2.5 rounded-md">
                      <p className="font-bold text-muted-foreground mb-1">Mistakes / Corrections:</p>
                      <p className="whitespace-pre-wrap">{selectedReview.mistakes}</p>
                    </div>
                    {selectedReview.fileUrl && (
                      <p>
                        <strong>Annotated File:</strong>{' '}
                        <a
                          href={selectedReview.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Download annotated file
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="hidden lg:block border-dashed border-border text-center py-20 bg-card/20">
            <CardContent className="flex flex-col items-center justify-center space-y-3">
              <ClipboardList className="h-10 w-10 text-muted-foreground animate-pulse" />
              <p className="text-xs text-muted-foreground">Select a task card to evaluate the paper and write reviews.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
