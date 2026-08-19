'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Eye, Download, Star, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface Article {
  title: string;
  authors: string;
  journal: string;
  doi: string;
  views?: number;
  downloads?: number;
  citations?: number;
}

interface LandingArticleTabsProps {
  tabsLabels: {
    latest: string;
    inPress: string;
    topCited: string;
    mostDownloaded: string;
    mostPopular: string;
  };
  openCallText: string;
}

export function LandingArticleTabs({ tabsLabels, openCallText }: LandingArticleTabsProps) {
  const [activeTab, setActiveTab] = useState<'latest' | 'inPress' | 'topCited' | 'mostDownloaded' | 'mostPopular'>('latest');

  const articlesData: Record<string, Article[]> = {
    latest: [
      {
        title: 'Machine Learning Approaches in Modern Agricultural Science',
        authors: 'Dr. Elena Rostova, Prof. Kenji Takahashi',
        journal: 'IST Online Journal - Vol 4, Issue 7',
        doi: '10.5281/ist.2025.109',
        citations: 2,
      },
      {
        title: 'Security Auditing Protocols for Blockchain Smart Contracts',
        authors: 'Sarah Jenkins, Dr. Marcus Vance',
        journal: 'IST Online Journal - Vol 4, Issue 7',
        doi: '10.5281/ist.2025.108',
        citations: 1,
      },
      {
        title: 'Advanced Materials for High-Performance Lithium-Sulfur Batteries',
        authors: 'Prof. Li Wei, Dr. Carlos Mendez',
        journal: 'IST Online Journal - Vol 4, Issue 7',
        doi: '10.5281/ist.2025.107',
        citations: 4,
      }
    ],
    inPress: [
      {
        title: 'An Empirical Study on Green Energy Integration in Smart Urban Grids',
        authors: 'Dr. Emily Watson, Lars Nielsen',
        journal: 'IST Online Journal - In Press',
        doi: '10.5281/ist.2025.120',
      },
      {
        title: 'Automated Clinical Diagnostic Pipelines using Deep Convolutional Networks',
        authors: 'Dr. Amit Patel, Dr. Sofia Bianchi',
        journal: 'IST Online Journal - In Press',
        doi: '10.5281/ist.2025.121',
      }
    ],
    topCited: [
      {
        title: 'Robust Cybersecurity Frameworks for Industrial Internet of Things (IIoT)',
        authors: 'Dr. Robert Chen, Prof. Alice Henderson',
        journal: 'IST Online Journal - Vol 2, Issue 3',
        doi: '10.5281/ist.2023.045',
        citations: 320,
      },
      {
        title: 'Natural Language Processing Models in Healthcare: A Comprehensive Survey',
        authors: 'Dr. George Miller, Sarah Jenkins',
        journal: 'IST Online Journal - Vol 2, Issue 4',
        doi: '10.5281/ist.2023.056',
        citations: 274,
      }
    ],
    mostDownloaded: [
      {
        title: 'Design Principles of High-Throughput Distributed Ledgers',
        authors: 'Prof. Satoshi Tanaka, Lars Nielsen',
        journal: 'IST Online Journal - Vol 3, Issue 11',
        doi: '10.5281/ist.2024.089',
        downloads: 1450,
      },
      {
        title: 'Quantum Key Distribution Protocols over Optical Fiber Networks',
        authors: 'Dr. Evelyn Carter, Prof. David Jenkins',
        journal: 'IST Online Journal - Vol 3, Issue 12',
        doi: '10.5281/ist.2024.098',
        downloads: 1210,
      }
    ],
    mostPopular: [
      {
        title: 'Ethics and Regulations in Generative AI: Global Perspectives',
        authors: 'Dr. Marcus Vance, Prof. Elena Rostova',
        journal: 'IST Online Journal - Vol 4, Issue 2',
        doi: '10.5281/ist.2025.012',
        views: 4520,
      },
      {
        title: 'Edge Computing Architectures for Next-Generation Wireless Communication',
        authors: 'Dr. Carlos Mendez, Dr. Robert Chen',
        journal: 'IST Online Journal - Vol 3, Issue 9',
        doi: '10.5281/ist.2024.072',
        views: 3980,
      }
    ]
  };

  const tabs = [
    { id: 'latest' as const, label: tabsLabels.latest },
    { id: 'inPress' as const, label: tabsLabels.inPress },
    { id: 'topCited' as const, label: tabsLabels.topCited },
    { id: 'mostDownloaded' as const, label: tabsLabels.mostDownloaded },
    { id: 'mostPopular' as const, label: tabsLabels.mostPopular },
  ];

  return (
    <div className="space-y-8">
      {/* Tabs navigation */}
      <div className="border-b border-border">
        <nav className="flex flex-wrap gap-2 sm:gap-6 -mb-px">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative py-3 px-1 sm:px-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer focus:outline-hidden"
              >
                <span className={isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="articles-active-line"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content panel */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-4"
          >
            {articlesData[activeTab].map((article, idx) => (
              <div
                key={idx}
                className="p-5 bg-card border border-border/80 rounded-xl hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <h4 className="font-bold text-sm sm:text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                      {article.title}
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {article.authors}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/80">
                    <span>{article.journal}</span>
                    <span>•</span>
                    <span className="font-mono">DOI: {article.doi}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg border border-border/30">
                  {article.citations !== undefined && (
                    <div className="flex items-center gap-1.5" title="Citations">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{article.citations} Citations</span>
                    </div>
                  )}
                  {article.downloads !== undefined && (
                    <div className="flex items-center gap-1.5" title="Downloads">
                      <Download className="h-3.5 w-3.5 text-primary" />
                      <span>{article.downloads} Downloads</span>
                    </div>
                  )}
                  {article.views !== undefined && (
                    <div className="flex items-center gap-1.5" title="Views">
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      <span>{article.views} Views</span>
                    </div>
                  )}
                  <a
                    href={`https://doi.org/${article.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary font-semibold hover:underline"
                  >
                    <span>PDF</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Browse Open Call for Papers Box */}
        {activeTab === 'latest' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="border-2 border-primary/50 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-primary transition-all bg-card"
          >
            <a href="/login" className="flex flex-col sm:flex-row items-center cursor-pointer group">
              <div className="relative w-full sm:w-1/3 h-48 sm:h-36 shrink-0">
                <Image
                  src="/telescope_stars.jpg"
                  alt="Browse Open Call"
                  fill
                  sizes="(max-w-768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-black text-primary group-hover:underline flex items-center justify-center sm:justify-start gap-2">
                  <span>{openCallText}</span>
                  <ExternalLink className="h-5 w-5 shrink-0" />
                </h3>
              </div>
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}
