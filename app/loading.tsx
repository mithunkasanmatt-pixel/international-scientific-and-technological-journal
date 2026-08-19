'use client';

import React from 'react';
import { BookLoader } from '@/components/book-loader';

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="p-8 bg-card/60 glass rounded-2xl border border-border/50 shadow-2xl flex items-center justify-center">
        <BookLoader />
      </div>
    </div>
  );
}
