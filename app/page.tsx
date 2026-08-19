import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslationServer } from '@/utils/locale';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LandingNavbar } from '@/components/landing-navbar';
import { LandingContributeTabs } from '@/components/landing-contribute-tabs';
import { LandingArticleTabs } from '@/components/landing-article-tabs';
import { 
  ChevronDown, 
  CheckSquare, 
  FileEdit, 
  Clock, 
  DollarSign, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

export default async function HomePage() {
  const { t, locale } = await getTranslationServer();
  const session = await getServerSession(authOptions);
  const user = session?.user;

  // Route determining helper
  const getDashboardUrl = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'CHIEF_EDITOR':
        return '/chief-editor';
      case 'EDITOR':
        return '/editor';
      case 'GUEST_EDITOR':
        return '/guest-editor';
      case 'REVIEWER':
        return '/reviewer';
      case 'AUTHOR':
        return '/author';
      default:
        return '/';
    }
  };

  const isRtl = locale === 'ar';

  const contributeTabs = [
    { id: 'contribute', label: t('landing.contributeCard.contribute'), content: t('landing.contributeCard.desc') },
    { id: 'why', label: t('landing.contributeCard.whyContribute'), content: t('landing.contributeCard.whyDesc') },
    { id: 'guidelines', label: t('landing.contributeCard.submissionGuidelines'), content: t('landing.contributeCard.guidelinesDesc') },
    { id: 'join', label: t('landing.contributeCard.joinUs'), content: t('landing.contributeCard.joinDesc') },
  ];

  const articleTabsLabels = {
    latest: t('landing.articlesSection.latestPublished'),
    inPress: t('landing.articlesSection.articleInPress'),
    topCited: t('landing.articlesSection.topCited'),
    mostDownloaded: t('landing.articlesSection.mostDownloaded'),
    mostPopular: t('landing.articlesSection.mostPopular'),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* 1. Header (Navbar) */}
      <LandingNavbar initialUser={user} />

      {/* 2. Hero Section (Banner) */}
      <section className="bg-primary text-primary-foreground py-12 sm:py-16 md:py-20 px-6 sm:px-12 w-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
        {/* Tablet Mockup */}
        <div className="relative w-[280px] h-[340px] sm:w-[320px] sm:h-[390px] shadow-2xl rounded-lg overflow-hidden shrink-0 border border-white/10 hover:scale-[1.01] transition-transform duration-300">
          <Image
            src="/tablet_mockup.jpg"
            alt="IST Journal Digital Mockup"
            fill
            sizes="(max-w-768px) 100vw, 320px"
            className="object-cover"
            priority
          />
        </div>

        {/* Hero details */}
        <div className="flex flex-col items-start max-w-xl space-y-4 text-left">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="IST Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain shrink-0"
            />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-mono font-black tracking-tight text-white">
              {t('landing.hero.journalTitle')}
            </h1>
          </div>
          
          <h2 className="text-sm sm:text-base md:text-lg font-bold tracking-wider text-white/90 uppercase leading-snug">
            {t('landing.hero.subTitle')}
          </h2>
          
          <p className="text-sm md:text-base font-semibold text-lime-300 font-mono tracking-wide">
            {t('landing.hero.issn')}
          </p>

          <div className="pt-2">
            <Link
              href={user ? getDashboardUrl(user.role) : "/login"}
              className="bg-white hover:bg-neutral-100 text-primary font-black text-sm md:text-base h-11 px-6 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <span>{t('landing.hero.submitPaper')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Sub-Header (Quick navigation) */}
      <section className="w-full bg-secondary/30 border-b border-border py-4 px-4 sm:px-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-semibold text-foreground/80 shadow-xs">
        <div className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors group">
          <span>{t('landing.subHeader.articlesIssues')}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors group">
          <span>{t('landing.subHeader.author')}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors group">
          <span>{t('landing.subHeader.publish')}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <Link
          href={user ? getDashboardUrl(user.role) : "/login"}
          className="hover:text-primary transition-colors"
        >
          {t('landing.subHeader.submitYourPaper')}
        </Link>
      </section>

      {/* 4. Description Card (Tabs block) */}
      <section className="max-w-4xl mx-auto my-12 px-4 w-full">
        <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-primary text-center tracking-tight">
            {t('landing.contributeCard.title')}
          </h2>
          <LandingContributeTabs tabs={contributeTabs} />
        </div>
      </section>

      {/* 5. Key Dates Section */}
      <section className="max-w-7xl mx-auto my-16 px-4 sm:px-8 w-full space-y-8">
        <h2 className="text-2xl sm:text-3xl font-black text-primary text-center tracking-tight">
          {t('landing.keyDates.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 bg-card border border-border/80 rounded-xl shadow-xs hover:shadow-md hover:border-primary/50 transition-all text-center space-y-4 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
              <CheckSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-foreground">
              {t('landing.keyDates.card1Title')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Issue Last Date: <strong className="text-foreground">29th of this current Month.</strong> Submit your papers anytime, No Deadline. Publish Paper within 1 to 2 days.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-card border border-border/80 rounded-xl shadow-xs hover:shadow-md hover:border-primary/50 transition-all text-center space-y-4 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
              <FileEdit className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-foreground">
              {t('landing.keyDates.card2Title')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Review Results (Acceptance/Rejection) Notification within <strong className="text-foreground">01-02 Days.</strong>
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-card border border-border/80 rounded-xl shadow-xs hover:shadow-md hover:border-primary/50 transition-all text-center space-y-4 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-foreground">
              {t('landing.keyDates.card3Title')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Paper Publish Within <strong className="text-foreground">01-02 Days</strong> After Submitting all Required Documents.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Info Cards (Publication Charges, Frequency, Metrics) */}
      <section className="max-w-7xl mx-auto my-12 px-4 sm:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 4 */}
          <div className="p-6 bg-card border border-border/80 rounded-xl shadow-xs hover:shadow-md hover:border-primary/50 transition-all text-center space-y-4 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-foreground">
              {t('landing.infoCards.chargesTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Low Publication Charge <strong className="text-foreground">₹1500 INR</strong> for Indian authors & <strong className="text-foreground">$55 USD</strong> for International authors per single paper publication.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 bg-card border border-border/80 rounded-xl shadow-xs hover:shadow-md hover:border-primary/50 transition-all text-center space-y-4 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
              <RefreshCw className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-foreground">
              {t('landing.infoCards.frequencyTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Monthly, Open Access Research Journal, Peer-Reviewed, Refereed, Multidisciplinary, Multilanguage Journals (12 issues Annually).
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 bg-card border border-border/80 rounded-xl shadow-xs hover:shadow-md hover:border-primary/50 transition-all text-center space-y-4 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-foreground">
              {t('landing.infoCards.metricsTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              International Peer-reviewed, Refereed Journals, and Open Access Journal | Scholarly Open access journals, Multidisciplinary, Indexing in all major databases.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Editor-in-Chief Section */}
      <section id="about" className="bg-muted/30 border-y border-border py-12 px-4 sm:px-8 w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Section heading left */}
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground flex flex-wrap items-center gap-2">
              <span>{t('landing.editorSection.title')}</span>
              <span className="text-muted-foreground font-normal">|</span>
              <Link href="/login" className="text-primary hover:underline text-sm font-semibold flex items-center gap-0.5">
                <span>{t('landing.editorSection.viewBoard')}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </h3>
          </div>

          {/* Profile right */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-card p-5 border border-border/70 rounded-xl shadow-xs">
            {/* Avatar */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border border-border shadow-inner shrink-0">
              <Image
                src="/prof_avatar.jpg"
                alt="Prof. Dr. Ahmed Al-Mansouri"
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            {/* Profile info */}
            <div className="text-center sm:text-left space-y-1.5">
              <h4 className="font-black text-base sm:text-lg text-foreground">
                {t('landing.editorSection.name')}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                {t('landing.editorSection.faculty')}
              </p>
              <div className="pt-1 flex justify-center sm:justify-start">
                <a
                  href="https://scholar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs font-bold flex items-center gap-1"
                >
                  <span>{t('landing.editorSection.profileLink')}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Articles Section */}
      <section className="max-w-7xl mx-auto my-16 px-4 sm:px-8 w-full space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black text-primary">
          {t('landing.articlesSection.title')}
        </h2>
        <LandingArticleTabs
          tabsLabels={articleTabsLabels}
          openCallText={t('landing.articlesSection.openCall')}
        />
      </section>

      {/* 9. Footer */}
      <footer className="bg-[#033010] text-neutral-100 py-16 px-4 sm:px-8 w-full mt-auto">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Columns grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Col 1 */}
            <div className="space-y-4">
              <h4 className="text-emerald-400 font-bold uppercase text-xs tracking-wider">
                {t('landing.footer.col1Title')}
              </h4>
              <div className="space-y-2 text-xs sm:text-sm text-neutral-300 font-medium">
                <a href="/login" className="block hover:text-white transition-colors">
                  {t('landing.footer.col1Link1')}
                </a>
                <Link href="/login" className="block hover:text-white transition-colors">
                  {t('landing.footer.col1Link2')}
                </Link>
                <a href="#about" className="block hover:text-white transition-colors">
                  {t('landing.footer.col1Link3')}
                </a>
                <a href="#about" className="block hover:text-white transition-colors">
                  {t('landing.footer.col1Link4')}
                </a>
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-4">
              <h4 className="text-emerald-400 font-bold uppercase text-xs tracking-wider">
                {t('landing.footer.col2Title')}
              </h4>
              <div className="space-y-2 text-xs sm:text-sm text-neutral-300 font-medium">
                <a href="#about" className="block hover:text-white transition-colors">
                  {t('landing.footer.col2Link1')}
                </a>
                <Link href="/login" className="block hover:text-white transition-colors">
                  {t('landing.footer.col2Link2')}
                </Link>
                <a href="#about" className="block hover:text-white transition-colors">
                  {t('landing.footer.col2Link3')}
                </a>
                <a href="#about" className="block hover:text-white transition-colors">
                  {t('landing.footer.col2Link4')}
                </a>
              </div>
            </div>

            {/* Col 3 */}
            <div className="space-y-4">
              <h4 className="text-emerald-400 font-bold uppercase text-xs tracking-wider">
                {t('landing.footer.col3Title')}
              </h4>
              <div className="space-y-2 text-xs sm:text-sm text-neutral-300 font-medium">
                <Link href="/login" className="block hover:text-white transition-colors">
                  {t('landing.footer.col3Link1')}
                </Link>
                <Link href="/login" className="block hover:text-white transition-colors">
                  {t('landing.footer.col3Link2')}
                </Link>
                <Link href="/login" className="block hover:text-white transition-colors">
                  {t('landing.footer.col3Link3')}
                </Link>
                <a href="#conferences" className="block hover:text-white transition-colors">
                  {t('landing.footer.col3Link4')}
                </a>
              </div>
            </div>

            {/* Col 4 */}
            <div className="space-y-4">
              <h4 className="text-emerald-400 font-bold uppercase text-xs tracking-wider">
                {t('landing.footer.col4Title')}
              </h4>
              <div className="space-y-2 text-xs sm:text-sm text-neutral-300 font-medium">
                <a href="#about" className="block hover:text-white transition-colors">
                  {t('landing.footer.col4Link1')}
                </a>
                <a href="#contact" className="block hover:text-white transition-colors">
                  {t('landing.footer.col4Link2')}
                </a>
                <a href="#about" className="block hover:text-white transition-colors">
                  {t('landing.footer.col4Link3')}
                </a>
                <Link href="/login" className="block hover:text-white transition-colors">
                  {t('landing.footer.col4Link4')}
                </Link>
              </div>
            </div>
          </div>

          {/* Separator line */}
          <div className="border-t border-emerald-950 w-full" />

          {/* Bottom attribution */}
          <div className="space-y-3">
            <p className="text-center text-xs sm:text-sm text-neutral-300">
              {t('landing.footer.publishedBy')}
            </p>
            <p className="text-center text-xs sm:text-sm font-mono font-bold text-lime-400">
              {t('landing.hero.issn')}
            </p>
            <p className="text-center text-xs text-neutral-400">
              {t('landing.footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
