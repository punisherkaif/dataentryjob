import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Fallback if env vars aren't configured yet (allows initial render without crash)
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isPublicRoute =
    pathname === '/login' ||
    pathname === '/forgot-password' ||
    pathname === '/account-status' ||
    pathname === '/register' ||
    pathname.startsWith('/api/public')

  const isAdminRoute = pathname.startsWith('/admin')
  const isUserRoute = pathname.startsWith('/user')

  // 1. Unauthenticated users trying to access protected routes
  if (!authUser) {
    if (isAdminRoute || isUserRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // 2. Fetch user details from `public.users` table
  const { data: userData } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', authUser.id)
    .single() as { data: { role: 'ADMIN' | 'USER'; status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' } | null }

  const userRole = userData?.role || 'USER'
  const userStatus = userData?.status || 'PENDING'

  // 3. Non-ACTIVE users (PENDING, REJECTED, SUSPENDED)
  if (userStatus !== 'ACTIVE') {
    if (pathname !== '/account-status' && !pathname.startsWith('/api')) {
      const url = request.nextUrl.clone()
      url.pathname = '/account-status'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // 4. Authenticated & ACTIVE users visiting login / public auth pages
  if (pathname === '/login' || pathname === '/forgot-password') {
    const url = request.nextUrl.clone()
    url.pathname = userRole === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'
    return NextResponse.redirect(url)
  }

  // 5. Role-based Access Control
  // USER role trying to access /admin/* -> redirect to worker dashboard
  if (isAdminRoute && userRole !== 'ADMIN') {
    const url = request.nextUrl.clone()
    url.pathname = '/user/dashboard'
    return NextResponse.redirect(url)
  }

  // Root redirect
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = userRole === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
