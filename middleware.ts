import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Se a rota for o webhook, deixa passar direto sem verificar login
  if (request.nextUrl.pathname.startsWith('/api/whatsapp/webhook')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  // Conecta o Supabase com as regras novas de cookies do Next.js
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // Verifica o crachá do utilizador (getUser é a forma mais segura no novo pacote)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Se NÃO estiver logado e tentar aceder a qualquer página que não seja o /login -> Chuta para o /login
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se JÁ estiver logado e tentar aceder à tela de /login -> Chuta de volta para o Dashboard (/)
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

// Protege todas as rotas do CRM, ignorando apenas ficheiros estáticos (imagens, ícones)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}