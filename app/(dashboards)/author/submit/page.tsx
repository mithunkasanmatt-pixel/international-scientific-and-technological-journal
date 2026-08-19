import React from 'react';
import { PaperSubmitForm } from '@/components/paper-submit-form';

export default function SubmitPaperPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
          Submit New Manuscript
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Complete the form below to submit your manuscript to our editorial board.
        </p>
      </div>
      <PaperSubmitForm />
    </div>
  );
}
