'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { submitPaper } from '@/actions/submission';
import { Plus, Trash2, Star, FileUp, Sparkles } from 'lucide-react';
import { countries } from '@/utils/countries';

interface CoAuthor {
  name: string;
  email: string;
  orcid: string;
  isCorresponding: boolean;
}

export function PaperSubmitForm() {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [paperType, setPaperType] = useState<'RESEARCH_PAPER' | 'REVIEW_PAPER'>('RESEARCH_PAPER');
  const [keywords, setKeywords] = useState('');
  const [primaryDomain, setPrimaryDomain] = useState('');
  const [secondaryDomain, setSecondaryDomain] = useState('');
  const [country, setCountry] = useState('');
  const [agreement, setAgreement] = useState(false);

  // Upload Files
  const [manuscript, setManuscript] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState<File | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<File | null>(null);

  // Co-authors list
  const [authors, setAuthors] = useState<CoAuthor[]>([
    { name: '', email: '', orcid: '', isCorresponding: true },
  ]);

  const handleAddAuthor = () => {
    setAuthors([...authors, { name: '', email: '', orcid: '', isCorresponding: false }]);
  };

  const handleRemoveAuthor = (index: number) => {
    if (authors.length === 1) return;
    const list = [...authors];
    const wasCorresponding = list[index].isCorresponding;
    list.splice(index, 1);
    
    // If we deleted the corresponding author, mark the first remaining author as corresponding
    if (wasCorresponding && list.length > 0) {
      list[0].isCorresponding = true;
    }
    setAuthors(list);
  };

  const handleAuthorChange = (index: number, field: keyof CoAuthor, value: any) => {
    const list = [...authors];
    list[index] = { ...list[index], [field]: value };
    setAuthors(list);
  };

  const handleSetCorresponding = (index: number) => {
    const list = authors.map((auth, idx) => ({
      ...auth,
      isCorresponding: idx === index,
    }));
    setAuthors(list);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !abstract || !keywords || !primaryDomain || !country) {
      toast.error('Please fill in all mandatory text fields.');
      return;
    }

    if (!manuscript) {
      toast.error('Please upload your main manuscript file.');
      return;
    }

    if (!agreement) {
      toast.error('You must agree to the ethical guidelines and publishing terms.');
      return;
    }

    // Validate co-authors
    const emptyAuthor = authors.some((auth) => !auth.name || !auth.email);
    if (emptyAuthor) {
      toast.error('All added authors must have a name and email.');
      return;
    }

    const correspondingAuthor = authors.find((auth) => auth.isCorresponding);
    if (!correspondingAuthor || !correspondingAuthor.email) {
      toast.error('Please select a corresponding author with a valid email.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('abstract', abstract);
      formData.append('paperType', paperType);
      formData.append('keywords', keywords);
      formData.append('primaryDomain', primaryDomain);
      formData.append('secondaryDomain', secondaryDomain);
      formData.append('country', country);
      formData.append('journalReference', '');
      formData.append('agreement', String(agreement));

      formData.append('manuscript', manuscript);
      if (coverLetter) formData.append('coverLetter', coverLetter);
      if (supportingFiles) formData.append('supportingFiles', supportingFiles);

      formData.append('authors', JSON.stringify(authors));

      const res = await submitPaper(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Manuscript submitted successfully! ID: ${res.paperId}`);
        router.push('/author');
      }
    } catch (err) {
      toast.error('An unexpected error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Metadata */}
        <div className="lg:col-span-2 space-y-6">
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Manuscript Metadata</span>
              </CardTitle>
              <CardDescription>
                Provide general details about your research paper or review paper.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('submission.title')} *</Label>
                <Input
                  id="title"
                  placeholder="Enter full paper title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paperType">{t('submission.paperType')} *</Label>
                  <Select
                    id="paperType"
                    value={paperType}
                    onChange={(e) => setPaperType(e.target.value as any)}
                    disabled={loading}
                  >
                    <option value="RESEARCH_PAPER">{t('submission.researchPaper')}</option>
                    <option value="REVIEW_PAPER">{t('submission.reviewPaper')}</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="abstract">{t('submission.abstract')} *</Label>
                <Textarea
                  id="abstract"
                  placeholder="Paste your abstract here (maximum 500 words)..."
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  required
                  disabled={loading}
                  className="min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryDomain">{t('submission.primaryDomain')} *</Label>
                  <Select
                    id="primaryDomain"
                    value={primaryDomain}
                    onChange={(e) => setPrimaryDomain(e.target.value)}
                    required
                    disabled={loading}
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
                <div className="space-y-2">
                  <Label htmlFor="secondaryDomain">{t('submission.secondaryDomain')}</Label>
                  <Select
                    id="secondaryDomain"
                    value={secondaryDomain}
                    onChange={(e) => setSecondaryDomain(e.target.value)}
                    disabled={loading}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="keywords">{t('submission.keywords')} *</Label>
                  <Select
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    required
                    disabled={loading}
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
                <div className="space-y-2">
                  <Label htmlFor="country">{t('submission.country')} *</Label>
                  <Select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    disabled={loading}
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
            </CardContent>
          </Card>

          {/* Author Details */}
          <Card glass>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('submission.coAuthors')}</CardTitle>
                <CardDescription>
                  Click the star icon (<Star className="h-3 w-3 inline text-amber-500 fill-amber-400" />) to mark the corresponding author.
                </CardDescription>
              </div>
              <Button type="button" size="sm" onClick={handleAddAuthor} disabled={loading}>
                <Plus className="h-4 w-4 mr-1" />
                <span>{t('submission.addAuthor')}</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {authors.map((auth, index) => (
                <div key={index} className="p-4 bg-secondary/30 border border-border rounded-xl space-y-4 relative">
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetCorresponding(index)}
                      className="p-1.5 rounded-md hover:bg-secondary transition-all cursor-pointer"
                      title={auth.isCorresponding ? 'Corresponding Author Selected' : 'Make Corresponding Author'}
                    >
                      <Star
                        className={`h-4.5 w-4.5 ${
                          auth.isCorresponding
                            ? 'text-amber-500 fill-amber-400'
                            : 'text-muted-foreground hover:text-amber-500'
                        }`}
                      />
                    </button>
                    {authors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAuthor(index)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-all cursor-pointer"
                        title="Remove Author"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 pr-10">
                    <div className="space-y-1.5">
                      <Label htmlFor={`authName-${index}`}>{t('submission.authorName')} *</Label>
                      <Input
                        id={`authName-${index}`}
                        placeholder="John Doe"
                        value={auth.name}
                        onChange={(e) => handleAuthorChange(index, 'name', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`authEmail-${index}`}>{t('submission.authorEmail')} *</Label>
                      <Input
                        id={`authEmail-${index}`}
                        type="email"
                        placeholder="john@example.com"
                        value={auth.email}
                        onChange={(e) => handleAuthorChange(index, 'email', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`authOrcid-${index}`}>{t('submission.orcid')}</Label>
                      <Input
                        id={`authOrcid-${index}`}
                        placeholder="0000-0002-1825-0097"
                        value={auth.orcid}
                        onChange={(e) => handleAuthorChange(index, 'orcid', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* File Uploads & Confirmation */}
        <div className="lg:col-span-1 space-y-6">
          <Card glass>
            <CardHeader>
              <CardTitle>Files Submission</CardTitle>
              <CardDescription>Upload manuscript and supporting papers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Manuscript */}
              <div className="space-y-2">
                <Label htmlFor="manuscript" className="font-bold flex items-center gap-1.5">
                  <FileUp className="h-4 w-4 text-primary" />
                  <span>{t('submission.fileUpload')} *</span>
                </Label>
                <div className="border border-dashed border-border p-4 rounded-lg text-center hover:bg-secondary/30 transition-all">
                  <input
                    id="manuscript"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setManuscript(e.target.files?.[0] || null)}
                    required
                    disabled={loading}
                    className="text-xs cursor-pointer w-full"
                  />
                </div>
                {manuscript && (
                  <p className="text-[10px] text-primary truncate font-semibold">Selected: {manuscript.name}</p>
                )}
              </div>

              {/* Cover Letter */}
              <div className="space-y-2">
                <Label htmlFor="coverLetter" className="font-bold flex items-center gap-1.5">
                  <FileUp className="h-4 w-4 text-muted-foreground" />
                  <span>{t('submission.coverLetter')}</span>
                </Label>
                <div className="border border-dashed border-border p-4 rounded-lg text-center hover:bg-secondary/30 transition-all">
                  <input
                    id="coverLetter"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setCoverLetter(e.target.files?.[0] || null)}
                    disabled={loading}
                    className="text-xs cursor-pointer w-full"
                  />
                </div>
                {coverLetter && (
                  <p className="text-[10px] text-primary truncate font-semibold">Selected: {coverLetter.name}</p>
                )}
              </div>

              {/* Supporting Files */}
              <div className="space-y-2">
                <Label htmlFor="supportingFiles" className="font-bold flex items-center gap-1.5">
                  <FileUp className="h-4 w-4 text-muted-foreground" />
                  <span>{t('submission.supportingFiles')}</span>
                </Label>
                <div className="border border-dashed border-border p-4 rounded-lg text-center hover:bg-secondary/30 transition-all">
                  <input
                    id="supportingFiles"
                    type="file"
                    onChange={(e) => setSupportingFiles(e.target.files?.[0] || null)}
                    disabled={loading}
                    className="text-xs cursor-pointer w-full"
                  />
                </div>
                {supportingFiles && (
                  <p className="text-[10px] text-primary truncate font-semibold">Selected: {supportingFiles.name}</p>
                )}
              </div>

              {/* Guidelines Agreement */}
              <div className="flex items-start gap-3 border-t border-border pt-4">
                <input
                  id="agree"
                  type="checkbox"
                  checked={agreement}
                  onChange={(e) => setAgreement(e.target.checked)}
                  required
                  disabled={loading}
                  className="h-4 w-4 rounded-sm border-input mt-1 cursor-pointer"
                />
                <Label htmlFor="agree" className="text-xs leading-relaxed text-muted-foreground select-none cursor-pointer">
                  {t('submission.agreement')}
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : t('submission.newSubmission')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
