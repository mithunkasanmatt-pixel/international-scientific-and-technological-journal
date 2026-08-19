import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // RBAC: Verify if the user's role matches their dashboard folder path
    if (pathname.startsWith('/admin') && token?.role !== Role.ADMIN) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    if (pathname.startsWith('/chief-editor') && token?.role !== Role.CHIEF_EDITOR) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    if (pathname.startsWith('/editor') && token?.role !== Role.EDITOR) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    if (pathname.startsWith('/guest-editor') && token?.role !== Role.GUEST_EDITOR) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    if (pathname.startsWith('/reviewer') && token?.role !== Role.REVIEWER) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    if (pathname.startsWith('/author') && token?.role !== Role.AUTHOR) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Match all roles' dashboards for protection
export const config = {
  matcher: [
    '/admin/:path*',
    '/chief-editor/:path*',
    '/editor/:path*',
    '/guest-editor/:path*',
    '/reviewer/:path*',
    '/author/:path*',
  ],
};
