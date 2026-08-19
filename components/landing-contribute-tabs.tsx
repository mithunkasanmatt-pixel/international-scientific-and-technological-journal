'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabItem {
  id: string;
  label: string;
  content: string;
}

interface LandingContributeTabsProps {
  tabs: TabItem[];
}

export function LandingContributeTabs({ tabs }: LandingContributeTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const activeContent = tabs.find((t) => t.id === activeTab)?.content || '';

  return (
    <div className="space-y-6">
      {/* Tabs list */}
      <div className="border-b border-border">
        <nav className="flex flex-wrap justify-center -mb-px gap-2 sm:gap-6">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative py-3 px-3 text-xs sm:text-sm font-semibold tracking-wider transition-colors cursor-pointer focus:outline-hidden"
              >
                <span className={isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="contribute-active-line"
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
      <div className="relative min-h-[140px] px-2 sm:px-6 py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="text-foreground text-sm sm:text-base leading-relaxed text-center"
          >
            {activeContent}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
