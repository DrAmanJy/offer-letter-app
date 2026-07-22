import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const correlationId = crypto.randomUUID();
  req.headers.set('x-correlation-id', correlationId);

  // Add Security Headers
  const headers = new Headers();
  headers.set('x-correlation-id', correlationId);
  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Origin Validation for POST/PUT/PATCH/DELETE
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    if (origin && host && !origin.includes(host)) {
      return new NextResponse('Invalid Origin', { status: 403, headers });
    }
  }

  // Paths that bypass authentication
  const isPublicApi = pathname.startsWith('/api/v1/auth/login') || 
                      pathname.startsWith('/api/v1/auth/refresh') ||
                      pathname.startsWith('/api/v1/public');
  const isLoginPage = pathname === '/login';
  
  if (isPublicApi || isLoginPage) {
    const response = NextResponse.next({ request: { headers: req.headers } });
    headers.forEach((value, key) => response.headers.set(key, value));
    return response;
  }

  // Protect /dashboard and /api/v1
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/v1')) {
    const token = req.cookies.get('accessToken')?.value;

    if (!token) {
      if (pathname.startsWith('/api/v1')) {
        return new NextResponse('Unauthorized', { status: 401, headers });
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || '');
      await jwtVerify(token, secret, { algorithms: ['HS256'] });
    } catch (err) {
      if (pathname.startsWith('/api/v1')) {
        return new NextResponse('Unauthorized', { status: 401, headers });
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  const response = NextResponse.next({ request: { headers: req.headers } });
  headers.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
