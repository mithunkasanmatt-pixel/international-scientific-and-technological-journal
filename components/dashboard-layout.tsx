'use client';

import React, { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useLocale } from '@/hooks/use-locale';
import { ThemeToggle } from './theme-toggle';
import Image from 'next/image';
import { LanguageSwitcher } from './language-switcher';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  History,
  Settings,
  UserCheck,
  PlusCircle,
  LogOut,
  Menu,
  X,
  Bell,
  LayoutGrid,
  CheckSquare,
  CloudUpload,
  UserPlus,
  BarChart2,
  ClipboardCheck,
} from 'lucide-react';
import { Role } from '@prisma/client';
import { NotificationDropdown } from './notification-dropdown';

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ComponentType<any>;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = session?.user?.role as Role;
  const userName = session?.user?.name || '';
  const userEmail = session?.user?.email || '';

  // Generate links based on Role
  const getNavItems = (userRole: Role): NavItem[] => {
    switch (userRole) {
      case Role.CHIEF_EDITOR:
        return [
          { labelKey: 'dashboards.chiefEditor.overview', href: '/chief-editor', icon: LayoutGrid },
          { labelKey: 'dashboards.chiefEditor.allSubmissions', href: '/chief-editor/papers', icon: FileText },
          { labelKey: 'dashboards.chiefEditor.assignReviewers', href: '/chief-editor/assign-reviewers', icon: UserCheck },
          { labelKey: 'dashboards.chiefEditor.decisions', href: '/chief-editor/decisions', icon: CheckSquare },
          { labelKey: 'dashboards.chiefEditor.publishManagement', href: '/chief-editor/publish', icon: CloudUpload },
          { labelKey: 'dashboards.chiefEditor.reviewers', href: '/chief-editor/reviewers-list', icon: Users },
          { labelKey: 'dashboards.chiefEditor.associateEditors', href: '/chief-editor/associate-editors', icon: Users },
          { labelKey: 'dashboards.chiefEditor.guestEditors', href: '/chief-editor/guest-editors', icon: Users },
          { labelKey: 'dashboards.chiefEditor.pendingReviewers', href: '/chief-editor/reviewers', icon: UserPlus },
          { labelKey: 'dashboards.chiefEditor.settings', href: '/chief-editor/settings', icon: Settings },
        ];
      case Role.EDITOR:
        return [
          { labelKey: 'common.dashboard', href: '/editor', icon: LayoutDashboard },
          { labelKey: 'dashboards.editor.myPapers', href: '/editor/papers', icon: FileText },
        ];
      case Role.GUEST_EDITOR:
        return [
          { labelKey: 'common.dashboard', href: '/guest-editor', icon: LayoutDashboard },
          { labelKey: 'dashboards.editor.myPapers', href: '/guest-editor/papers', icon: FileText },
        ];
      case Role.REVIEWER:
        return [
          { labelKey: 'common.dashboard', href: '/reviewer', icon: LayoutDashboard },
          { labelKey: 'dashboards.reviewer.myReviews', href: '/reviewer/reviews', icon: FileText },
        ];
      case Role.AUTHOR:
        return [
          { labelKey: 'common.dashboard', href: '/author', icon: LayoutDashboard },
          { labelKey: 'submission.newSubmission', href: '/author/submit', icon: PlusCircle },
        ];
      default:
        return [];
    }
  };

  // Dedicated admin menu items to split into groups
  const adminMainItems: NavItem[] = [
    { labelKey: 'dashboards.admin.dashboard', href: '/admin', icon: LayoutGrid },
    { labelKey: 'dashboards.admin.userManagement', href: '/admin/users', icon: Users },
    { labelKey: 'dashboards.admin.submissionTracking', href: '/admin/submissions-tracking', icon: BarChart2 },
    { labelKey: 'dashboards.admin.submissionManagement', href: '/admin/submissions-management', icon: FileText },
    { labelKey: 'dashboards.admin.reviewManagement', href: '/admin/reviews-management', icon: ClipboardCheck },
    { labelKey: 'dashboards.admin.settings', href: '/admin/settings', icon: Settings },
  ];

  const adminEditorialItems: NavItem[] = [
    { labelKey: 'dashboards.admin.registerEditor', href: '/admin/register-editor', icon: UserPlus },
    { labelKey: 'dashboards.admin.registerReviewer', href: '/admin/register-reviewer', icon: UserPlus },
  ];

  const navItems = role ? getNavItems(role) : [];

  const handleLogout = () => {
    const callbackUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? '/'
      : 'https://international-scientific-and-techno.vercel.app/';
    signOut({ callbackUrl });
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between p-4 bg-card">
      <div>
        {/* Brand Menu Title */}
        {role === Role.CHIEF_EDITOR && (
          <div className="px-3 py-3 mb-4">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase font-sans">
              CHIEF EDITOR MENU
            </span>
          </div>
        )}

        {role !== Role.CHIEF_EDITOR && role !== Role.ADMIN && (
          <div className="flex items-center gap-2 px-2 py-4 mb-6">
            <Image
              src="/logo.png"
              alt="IST Logo"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
            <span className="font-bold text-lg text-foreground tracking-tight">
              {t('common.appName')}
            </span>
          </div>
        )}

        {/* User Card - hidden for Chief Editor and Admin */}
        {role !== Role.CHIEF_EDITOR && role !== Role.ADMIN && (
          <div className="p-3 mb-6 bg-secondary/50 rounded-xl">
            <p className="font-semibold text-sm truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate mb-2">{userEmail}</p>
            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-primary/10 text-primary rounded-full">
              {role ? t(`roles.${role}`) : ''}
            </span>
          </div>
        )}

        {/* Nav lists */}
        {role === Role.ADMIN ? (
          <div className="space-y-6">
            {/* Admin Menu Group */}
            <div>
              <div className="px-3 py-2 mb-2">
                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase font-sans">
                  ADMIN MENU
                </span>
              </div>
              <nav className="space-y-1">
                {adminMainItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>{t(item.labelKey)}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Editorial Management Group */}
            <div>
              <div className="px-3 py-2 mb-2">
                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase font-sans">
                  EDITORIAL MANAGEMENT
                </span>
              </div>
              <nav className="space-y-1">
                {adminEditorialItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>{t(item.labelKey)}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        ) : (
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all cursor-pointer w-full text-start"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span>{t('common.logout')}</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="h-16 border-b border-border bg-card/85 backdrop-blur-xs flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1 rounded-md text-muted-foreground hover:bg-secondary cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="IST Logo"
              width={24}
              height={24}
              className="h-6 w-6 object-contain shrink-0"
            />
            <span className="font-mono font-bold text-lg text-primary tracking-tight uppercase">
              {role === Role.CHIEF_EDITOR 
                ? 'IST EDITOR PORTAL' 
                : role === Role.ADMIN 
                ? 'IST ADMIN PORTAL' 
                : 'IST JOURNAL PORTAL'}
            </span>
          </Link>
        </div>

        {/* Quick switches, Notification Bell, User Avatar */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          {role && (
            <>
              {/* Notification Dropdown */}
              <NotificationDropdown />
              
              {/* User Circular Avatar */}
              <div 
                className="h-9 w-9 text-white font-bold flex items-center justify-center bg-primary rounded-full shrink-0 border border-primary/20 cursor-pointer shadow-xs animate-in fade-in" 
                title={`${userName} (${userEmail})`}
              >
                {role === Role.CHIEF_EDITOR ? 'C' : role === Role.ADMIN ? 'S' : userName.charAt(0).toUpperCase()}
              </div>
            </>
          )}
          
          <ThemeToggle />
        </div>
      </header>

      {/* Main Panel Content Container */}
      <div className="flex flex-1 min-h-[calc(100vh-64px)]">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0 border-r border-border bg-card sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer (Backdrop + Content) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />
          {/* Menu */}
          <div className="relative w-64 max-w-sm bg-card z-10 flex flex-col h-full animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-secondary cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}
    </div>
  );
}
