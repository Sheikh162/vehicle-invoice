import { clerkClient, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/* Middleware to protect routes and handle redirects based on auth status.
*/

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/uploadthing(.*)' // If you add uploadthing later, uncomment this
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth()

  // 1. Protect all non-public routes
  // If user is NOT signed in and tries to access a protected page, force sign-in
  if (!userId && !isPublicRoute(req)) {
    return redirectToSignIn()
  }

  // 2. Logic for Signed-In Users
  if (userId) {
    // Fetch user details to check roles (only if needed for Admin routes)
    // We wrap this in a try/catch or simple check to avoid overhead on every request if not needed,
    // but sticking to your reference pattern for consistency:
    
    // Check if we are on a route that requires specific handling
    const isRoot = req.nextUrl.pathname === '/';
    const isTryingAdmin = isAdminRoute(req);

    if (isRoot || isTryingAdmin) {
        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        const role = user.publicMetadata?.role

        // 🚫 Block non-admins from /admin routes -> Send to /dashboard
        if (isTryingAdmin && role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }

        // ✅ Redirect Admins from root `/` -> `/admin` (Optional, based on your preference)
        if (isRoot && role === 'admin') {
            return NextResponse.redirect(new URL('/admin', req.url))
        }

        // ✅ Redirect Normal Users from root `/` -> `/dashboard`
        if (isRoot && role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }
    }
  }

  // Allow request to proceed
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API and app routes
    '/(api|trpc)(.*)',
  ],
}